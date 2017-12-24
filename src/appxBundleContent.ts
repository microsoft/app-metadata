import { ContentBase } from "./contentBase";
import { Constants } from "./constants"; 
import { AppxContent } from "./appxContent";
import { ExtractError } from "./extractError"; 

declare var require: any;
import * as path from 'path';
import * as fse from 'fs-extra';

export class AppxBundleContent extends ContentBase {
    appxName: string; // this holds the name of the subPackage
    iconAppx: string; // this holds the name of the zip file within the appx package with our icons
    public get supportedFiles(): string[] {
      return Constants.APPX_FILES;
    }
    public async read(tempDir: string, fileList: any): Promise<void> {
        const manifestPath = this.findFile(fileList, Constants.APPX_BUNDLE_MANIFEST);
        if (!manifestPath) {
            throw new ExtractError("no XML manifest found");
        }
        let fullPath = path.resolve(path.join(tempDir, manifestPath));
        const exists = await fse.pathExists(fullPath);
        if (!exists) {
            throw new ExtractError(`plist wasn't saved on unzip || '${fullPath}' is incorrect`);
        }
        const manifestData = await this.parseXML(tempDir, manifestPath);
        if (!manifestData) {
            throw new ExtractError("manifest XML couldn't be parsed");
        }

        this.CheckManifestForAppx(manifestData, fileList);
        if(this.appxName) {
            await this.readAppx(fileList, tempDir);
        }
        this.mapManifest(manifestData, fileList);
        this.parseLanguages(fileList);
        if(this.iconAppx) {
            await this.parseIcon(tempDir, fileList);
        }
    }
    private parseLanguages(fileList: string[]) {
        // file examples: 
            // Calculator2.WindowsPhone_2016.1003.2147.0_language-fr.appx
            // VLC_WinRT.WindowsPhone_1.8.4.0_language-en.appx
        let languageList: any = [];
        for (const file of fileList) {
            if (file.includes("language")) {
                let fileBase = path.basename(file, ".appx");
                languageList.push(fileBase.substring(fileBase.indexOf("language-") + "language-".length));
            }
        }
        this.languages = languageList;
    }
    public async parseIcon(tempDir: string, fileList: any): Promise<void> {
        if (path.extname(this.iconAppx) === ".png") {
            await this.readIcon(tempDir, this.iconAppx);
            return;
        }
        fileList = await this.selectiveUnzip(tempDir, path.join(tempDir, this.iconAppx), [".png"]);
        for(let fileName of fileList) {
            fileName = fileName.toLowerCase();
            if (path.extname(fileName) === ".png" && !fileName.includes("wide")) {
                if (await this.readIcon(tempDir, fileName)) {
                    return;
                }
            }
        }
    }
    // FINDS THE APPX INSIDE THAT HAS *EVERYTHING* IMPORTANT
    private CheckManifestForAppx(manifestData: any, fileList: string[]) {
        if (manifestData.Bundle.Packages[0].Package) {
            for (const packageItem of manifestData.Bundle.Packages[0].Package) {
                if(packageItem.$.Type === "application") { 
                    this.appxName = packageItem.$.FileName;
                     return;
                }
            }
        }
    }
    private mapManifest(manifestData: any, fileList: string[]) {
        this.deviceFamily = Constants.WINDOWS;
        this.uniqueIdentifier = (manifestData.Bundle.Identity && manifestData.Bundle.Identity[0].$.Name) ? manifestData.Bundle.Identity[0].$.Name : null;
        this.buildVersion = (manifestData.Bundle.Identity && manifestData.Bundle.Identity[0].$.Version) ? manifestData.Bundle.Identity[0].$.Version : null;
        this.minimumOsVersion = (manifestData.Bundle.Prerequisites && manifestData.Bundle.Prerequisites[0].$.OSMinVersion) ? manifestData.Bundle.Prerequisites[0].$.OSMinVersion : null;
        if (!this.minimumOsVersion) {
            this.minimumOsVersion = (manifestData.Bundle.Dependencies && manifestData.Bundle.Dependencies[0].$.TargetDeviceFamily) ? manifestData.Bundle.Dependencies[0].$.TargetDeviceFamily : null;
        }
        let iconScale = 0;
        // find possible languages and icon scales
        if (manifestData.Bundle.Packages[0].Package) {
            for (const packageItem of manifestData.Bundle.Packages[0].Package) { 
                for (const resources of packageItem.Resources) {
                    for (const resourceItem of resources.Resource) {
                        if(resourceItem.$.Scale && (resourceItem.$.Scale > iconScale)) {
                            iconScale = resourceItem.$.Scale;
                        }
                    } 
                }
            }
        }
        // look for actual icon zips in the existing files
        for (const file of fileList) {
            if (!this.iconAppx && file.includes("scale")) {
                this.iconAppx = file;
            }
            if (iconScale > 0 && file.includes(iconScale.toLocaleString())) {
                this.iconAppx = file;
                break;
            } 
        }
    }
    private async readAppx(fileList: string[], tempDir: string) : Promise<AppxContent> {
        let subPackage = new AppxContent();
        let unzipPath = this.findFile(fileList, this.appxName);
        unzipPath = path.join(tempDir, unzipPath);
        fileList = await subPackage.selectiveUnzip(tempDir, unzipPath, subPackage.supportedFiles);
        await subPackage.read(tempDir, fileList);
        return subPackage;
    }
}