import * as fse from 'fs-extra';
import * as path from 'path';
import * as plist from 'simple-plist';
import * as bluebird from 'bluebird';
import { ContentBase } from "./contentBase";
import { Constants } from "./constants";
import { ExtractError } from "./extractError";
import { IIPAMetadata, IProvisioningProfile } from './types';
import { endsWith } from 'lodash';
import { Utils } from './utils';

export type ProfileType = "adhoc" | "enterprise" | "other";

export class ProvisioningProfile implements IProvisioningProfile {
    idName: string;
    name: string;
    teamIdentifier: string;
    profileType: ProfileType;
    expiredAt: Date;
    mobileProvisionFileContent: string;
    UniqueDeviceIdentifierList: string[];
    absolutePath: string;
}

export class IpaContent extends ContentBase implements IIPAMetadata {
    provision: ProvisioningProfile;
    appexProvisioningProfiles: ProvisioningProfile[];
    executableFullPath: string;

    public get supportedFiles(): string[] {
        return Constants.IOS_FILES;
    }
    public async read(tempDir: string, fileList: any): Promise<void> {
        this.provision = new ProvisioningProfile();
        const plistData = await this.parsePlist(fileList, tempDir);
        this.iconFullPath = await this.parseIcon(fileList, tempDir, plistData);
        this.mapPlist(plistData, this.iconFullPath);
        this.parseLanguages(fileList);
        const provisionData = await this.parseProvision(this.provision, Constants.PROVISIONING, tempDir, fileList);
        this.mapProvision(this.provision, provisionData);
        await this.parseAppex(fileList, tempDir);
        await this.extractExecutable();
    }

    /** Extract the executable from the IPA and persist it. */
    private async extractExecutable(): Promise<void> {
        if (!this.executableName) {
            throw new ExtractError(`Couldn't extract executable name from IPA.`);
        }
        
        const shouldExtractFile = (filePathInIPA) => {
            const isOk = endsWith(filePathInIPA, `app/${this.executableName}`);
            return isOk;
        }
        const extractedFiles = await this.selectiveUnzip(this.workingFolder.workingFolderPath, this.packageAbsolutePath, null, shouldExtractFile);
        if (!extractedFiles || extractedFiles.length === 0) {
            throw new ExtractError(`Failed to find executable ${extractedFiles}`);
        }
        if (extractedFiles.length > 1) {
            throw new ExtractError(`Found more then one executable: ${extractedFiles.join(',')}`);
        }
        
        this.executableFullPath = path.join(this.workingFolder.workingFolderPath, extractedFiles[0]);

        this.persistFile(this, 'executableFullPath');
    }

    /** A best effort to get the best resolution image. */
    private iconSearch(fileList: string[]): string {
        const pngFiles = fileList.filter(value => value && endsWith(value.toLowerCase(), '.png'));
        if (pngFiles.length === 0) {
            return null;
        }
        return Utils.findFileByPrioritizedPatterns(pngFiles, [
            ['ipad', '@3x'],
            ['@3x'],
            ['ipad', '@2x'],
            ['@2x'],
            ['icon'],
            ['default']
        ]);
    }
    private parseLanguages(fileList: string[]) {
        let languageList: any = [];
        for (const file of fileList) {
            if (file.includes(".lproj") && !file.includes(".lproj/")) {
                if (file.includes(".lproj.meta")) {
                    if (!languageList.includes(path.basename(file, ".lproj.meta"))) {
                        languageList.push(path.basename(file, ".lproj.meta"));
                    }
                } else { // ".lproj"
                    if (!languageList.includes(path.basename(file, ".lproj"))) {
                        languageList.push(path.basename(file, ".lproj"));
                    }
                }
            }
        }
        if (languageList.includes("._Base")) {
            languageList.pop("._Base");
        }
        this.languages = languageList;
    }
    private async parsePlist(fileList: string[], tempDir: string): Promise<string> {
        let plistPath = this.findFile(fileList, Constants.INFO_PLIST);
        if (!plistPath) {
            throw new ExtractError("couldn't find correct Info.plist in directory");
        }
        let fullPath = path.resolve(path.join(tempDir, plistPath));
        const exists = await fse.pathExists(fullPath);
        if (!exists) {
            throw new ExtractError(`plist wasn't saved on unzip || '${fullPath}' is incorrect`);
        }
        const plistRead = bluebird.promisify(plist.readFile);
        return plistRead(fullPath);
    }
    private async parseIcon(fileList: string[], tempDir: string, plistData: any): Promise<string> {
        if (!plistData) {
            throw new ExtractError("non-existent plist data");
        }
        let chosenIcon = null;
        if (plistData.CFBundleIconFiles) {
            chosenIcon = this.iconSearch(plistData.CFBundleIconFiles);
        }
        if (!chosenIcon) {
            chosenIcon = this.iconSearch(fileList);
        }
        chosenIcon = this.findFile(fileList, chosenIcon);
        // find the filePath for a good icon listed in the manifest
        const exists = await this.readIcon(tempDir, chosenIcon);
        if (exists) {
            return path.join(tempDir, chosenIcon);
        }
        return null;
    }
    private mapPlist(plistData: any, iconPath: string) {
        this.displayName = plistData.CFBundleDisplayName ? plistData.CFBundleDisplayName : plistData.CFBundleName;
        this.uniqueIdentifier = plistData.CFBundleIdentifier ? plistData.CFBundleIdentifier : null;
        this.version = plistData.CFBundleShortVersionString ? plistData.CFBundleShortVersionString : null;
        this.buildVersion = plistData.CFBundleVersion ? plistData.CFBundleVersion : null;
        this.executableName = plistData.CFBundleExecutable;
        this.minimumOsVersion = plistData.MinimumOSVersion || plistData.LSMinimumSystemVersion;
        if (plistData.UIDeviceFamily) {
            if (plistData.UIDeviceFamily.length === 1) {
                let deviceValue = plistData.UIDeviceFamily[0];
                if (deviceValue === 1) {
                    this.deviceFamily = "iPhone/iPod";
                } else if (deviceValue === 2) {
                    this.deviceFamily = "iPad";
                }
            } else if (plistData.UIDeviceFamily.length === 2) {
                this.deviceFamily = "iPhone/iPod/iPad";
            }
        }
    }
    private async parseProvision(provision: ProvisioningProfile, provisionName: string, tempDir: string, fileList: any): Promise<any> {
        // look for the file if called with only filename, 
        // otherwise assume that you're given the entire path
        let provisionPath = null;
        if (provisionName.split(path.sep).length <= 1) {
            provisionPath = this.findFile(fileList, provisionName);
            if (!provisionPath) {
                throw new ExtractError("cannot find the provisioning profile");
            }
        } else {
            provisionPath = provisionName;
        }
        let absolutePath = path.resolve(path.join(tempDir, provisionPath));
        const exists = await fse.pathExists(absolutePath);
        if (!exists) {
            throw new ExtractError('provisioning file in filelist, but not on disk');
        }
        const data = await fse.readFile(absolutePath, "utf8");
        provision.absolutePath = absolutePath;
        await this.persistFile(provision, 'absolutePath');
        provision.mobileProvisionFileContent = data;
        const start = data.indexOf(Constants.PROVISION_START);
        const end = data.indexOf(Constants.PROVISION_END) + Constants.PROVISION_END.length;
        const goodData = data.substring(start, end);
        const provisionData = plist.parse(goodData);
        return provisionData;
    }
    private mapProvision(provision: ProvisioningProfile, provisionData: any) {
        if (!provisionData) {
            throw new ExtractError("no provisioning data");
        }
        this.hasProvisioning = true;
        provision.teamIdentifier = (provisionData.Entitlements && provisionData.Entitlements["com.apple.developer.team-identifier"]) ? provisionData.Entitlements["com.apple.developer.team-identifier"] : null;
        if (provisionData.ProvisionedDevices) {
            provision.profileType = "adhoc";
        } else if (provisionData.ProvisionsAllDevices) {
            provision.profileType = "enterprise";
        } else {
            provision.profileType = "other";
        }
        provision.expiredAt = provisionData.expired_at ? provisionData.expired_at : null;
        if (!provision.expiredAt) {
            provision.expiredAt = provisionData.ExpirationDate ? provisionData.ExpirationDate : null;
        }
        provision.idName = provisionData.AppIDName ? provisionData.AppIDName : null;
        provision.name = provisionData.Name ? provisionData.Name : null;
        provision.UniqueDeviceIdentifierList = provisionData.ProvisionedDevices ? provisionData.ProvisionedDevices : null;
    }
    private async parseAppex(fileList: string[], tempDir: string) {
        let bundleProvision = this.findFile(fileList, Constants.PROVISIONING);
        this.appexProvisioningProfiles = [];
        for (let file of fileList) {
            // go through and collect all additional provisioning profiles that aren't the basic one
            const pathSplit = file.split(path.sep);
            if (pathSplit[pathSplit.length - 1] === "embedded.mobileprovision" && file !== bundleProvision) {
                let appexProvision = new ProvisioningProfile();
                let appexData = await this.parseProvision(appexProvision, file, tempDir, fileList);
                this.mapProvision(appexProvision, appexData);
                this.appexProvisioningProfiles.push(appexProvision);
            }
        }
    }
    return;
}
