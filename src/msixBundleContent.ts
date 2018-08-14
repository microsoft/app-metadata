import { ContentBase } from "./contentBase";
import { Constants } from "./constants"; 
import { MsixContent } from "./msixContent";
import { ExtractError } from "./extractError"; 

declare var require: any;
import * as path from 'path';
import * as fse from 'fs-extra';
import { OperatingSystem } from "./types";

export class MsixBundleContent extends ContentBase {
    msixName: string; // this holds the name of the subPackage
    iconMsix: string; // this holds the name of the zip file within the msix package with our icons
    public get supportedFiles(): string[] {
      return Constants.MSIX_FILES;
    }
    public async read(tempDir: string, fileList: any): Promise<void> {
        this.operatingSystem = OperatingSystem.Windows;
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
        
        this.msixName = this.getMsixNameFromManifest(manifestData, fileList);
        if (!this.msixName) {
            throw new ExtractError(`cannot find the msix name in the manifest.`);            
        }
        const msix = await this.readMsix(fileList, tempDir);
        if (!msix) {
            throw new ExtractError(`cannot find the msix '${this.msixName}' in the package.`); 
        }
        this.mapManifest(manifestData, fileList, msix);
        this.parseLanguages(fileList);
        if(this.iconMsix) {
            await this.parseIcon(tempDir, fileList);
        }
    }
    private parseLanguages(fileList: string[]) {
        // file examples: 
            // Calculator2.WindowsPhone_2016.1003.2147.0_language-fr.msix
            // VLC_WinRT.WindowsPhone_1.8.4.0_language-en.msix
        let languageList: any = [];
        for (const file of fileList) {
            if (file.includes("language")) {
                let fileBase = path.basename(file, ".msix");
                languageList.push(fileBase.substring(fileBase.indexOf("language-") + "language-".length));
            }
        }
        this.languages = languageList;
    }
    public async parseIcon(tempDir: string, fileList: any): Promise<void> {
        if (path.extname(this.iconMsix) === ".png") {
            await this.readIcon(tempDir, this.iconMsix);
            return;
        }
        fileList = await this.selectiveUnzip(tempDir, path.join(tempDir, this.iconMsix), [".png"]);
        for(let fileName of fileList) {
            if (path.extname(fileName).toLowerCase() === ".png" && !fileName.toLowerCase().includes("wide")) {
                if (await this.readIcon(tempDir, fileName)) {                    
                    return;
                }
            }
        }
    }

    private getMsixNameFromManifest(manifestData: any, fileList: string[]): string {
        if (manifestData.Bundle.Packages[0].Package) {
            for (const packageItem of manifestData.Bundle.Packages[0].Package) {
                if(packageItem.$.Type === "application") { 
                    return packageItem.$.FileName;
                }
            }
        } 
        return null;
    }
    private mapManifest(manifestData: any, fileList: string[], msixContent: MsixContent) {
        this.deviceFamily = Constants.WINDOWS;
        this.uniqueIdentifier = msixContent.uniqueIdentifier;
        this.buildVersion = msixContent.buildVersion;
        this.version = "";
        this.minimumOsVersion = msixContent.minimumOsVersion;
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
            if (!this.iconMsix && file.includes("scale")) {
                this.iconMsix = file;
            }
            if (iconScale > 0 && file.includes(iconScale.toLocaleString())) {
                this.iconMsix = file;
                break;
            } 
        }
    }
    private async readMsix(fileList: string[], tempDir: string) : Promise<MsixContent> {
        let subPackage = new MsixContent();
        let unzipPath = this.findFile(fileList, this.msixName);
        unzipPath = path.join(tempDir, unzipPath);
        fileList = await subPackage.selectiveUnzip(tempDir, unzipPath, subPackage.supportedFiles);
        await subPackage.read(tempDir, fileList);
        return subPackage;
    }
}