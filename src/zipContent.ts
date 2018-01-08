import { ContentBase } from "./contentBase";
import { AppxContent } from "./appxContent";
import { AppxBundleContent } from "./appxBundleContent";
import { Constants } from "./constants"; 
import { ExtractError } from "./extractError"; 

declare var require: any;
import * as path from 'path';

// this class expects the temp directory to have the contents of a .zip or .appxupload, 
// which would both contain the app itself (.appx/.appxbundle) and other metadata inside
export class ZipContent extends ContentBase {
    subPackage: ContentBase; //AppxContent | AppxBundleContent; 
    packageRelativePath: string;
    packageType: string;
    public get supportedFiles(): string[] {
        return Constants.UWP_EXTENSIONS;
    }
    public async read(tempDir: string, fileList: any): Promise<void> {
        this.packageRelativePath = this.packageSearch(fileList);
        if (!this.packageRelativePath) {
            throw new ExtractError("couldn't find actual app package");
        }
        this.packageType = path.extname(this.packageRelativePath).toLowerCase();
        this.subPackage = this.packageType === ".appx" ? new AppxContent() : new AppxBundleContent();
        const unzipPath = path.join(tempDir, this.packageRelativePath);
        fileList = await this.subPackage.selectiveUnzip(tempDir, unzipPath, this.subPackage.supportedFiles);
        await this.subPackage.read(tempDir, fileList);
        this.updateFromSubPackage(this.subPackage);
    }

    /** 
     * Zip packages are getting package metadata from the inner appxbundle or appx. 
     * This method will take the output from the inner appxbudle/appx packages and 
     * save it in this class.
     */
    private updateFromSubPackage(subPackage: ContentBase) {
        this.buildVersion = subPackage.buildVersion;
        this.version = "";
        this.deviceFamily = subPackage.deviceFamily;
        this.uniqueIdentifier = subPackage.uniqueIdentifier;
        this.minimumOsVersion = subPackage.minimumOsVersion;
        this.executableName = subPackage.executableName;
        this.deviceFamily = subPackage.deviceFamily;
        this.languages = subPackage.languages;
        this.iconFullPath = subPackage.iconFullPath;
        this.iconName = subPackage.iconName;
        this.icon = subPackage.icon;
        this.fingerprint = subPackage.fingerprint;
        this.size = subPackage.size;
        this.hasProvisioning = false;
    }

    private packageSearch(fileList: string[]) : string {
        // the directory depth of the packages changes depending on which type of package was unzipped.
        // since you can't know before going in, searching by level is required since there can be other
        // files with .appx or .appxbundle which could throw off the logic, (for example languages)
        let halt = false;
        for (let depth = 1; depth <= 2; depth++) {
            for (const file of fileList) {
                const filePath =  file.split(path.sep);
                if (filePath.length <= depth) {
                    if(path.basename(file) === "Add-AppDevPackage.ps1") {
                        // stop after searching this depth because if this file exists here
                        // and you can't find the app package at the same depth then something is wrong
                        halt = true; 
                    }
                    if(path.extname(file).toLowerCase() === ".appx") {
                        return file;
                    } else if (path.extname(file).toLowerCase() === ".appxbundle") {
                        return file;
                    } else if (path.extname(file).toLowerCase() === ".appxupload") {
                        // not sure if people zip these but we shall see
                        throw new ExtractError("zip includes .appxUpload");
                    }
                }
            }
            if(halt) {
                throw new ExtractError("Expected .appx or .appxbundle to be at the same folder as Add-AppDevPackage.ps1. Add-AppDevPackage.ps1 was found but no .appx or .appxbundle in the same folder.");
            }
        }
    }
}
