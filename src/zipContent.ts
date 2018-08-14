import { ContentBase } from "./contentBase";
import { AppxContent } from "./appxContent";
import { AppxBundleContent } from "./appxBundleContent";
import { MsixContent } from "./msixContent";
import { MsixBundleContent } from "./msixBundleContent";
import { Constants } from "./constants"; 
import { ExtractError } from "./extractError"; 

declare var require: any;
import * as path from 'path';
import { OperatingSystem } from "./types";

// this class expects the temp directory to have the contents of a .zip, .appxupload, or .msixupload, 
// which would both contain the app itself (.appx/.appxbundle/.msix/.msixbundle) and other metadata inside
export class ZipContent extends ContentBase {
    subPackage: ContentBase; //AppxContent | AppxBundleContent | MsixContent | MsixBundleContent;
    packageRelativePath: string;
    packageType: string;
    public get supportedFiles(): string[] {
        return Constants.UWP_EXTENSIONS;
    }
    public async read(tempDir: string, fileList: any): Promise<void> {
        this.operatingSystem = OperatingSystem.Windows;
        this.packageRelativePath = this.packageSearch(fileList);
        if (!this.packageRelativePath) {
            throw new ExtractError("couldn't find actual app package");
        }
        this.packageType = path.extname(this.packageRelativePath).toLowerCase();
        this.subPackage = this.subPackageFromType(this.packageType);
        const unzipPath = path.join(tempDir, this.packageRelativePath);
        fileList = await this.subPackage.selectiveUnzip(tempDir, unzipPath, this.subPackage.supportedFiles);
        await this.subPackage.read(tempDir, fileList);
        this.updateFromSubPackage(this.subPackage);
    }

    /** 
     * Zip packages are getting package metadata from the inner appx, msix, appxbundle, or msixbundle. 
     * This method will take the output from the inner appx/msix/appxbundle/msixbundle packages and 
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
        // files with .appx, .msix, .appxbundle, or .msixbundle which could throw off the logic, (for example languages)
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
                    let fileExtension = path.extname(file).toLowerCase();
                    let allowedExtensions = [".appx", ".appxbundle", ".msix", ".msixbundle"];
                    let notAllowedExtensions = [".appxupload", ".msixupload"];
                    if (allowedExtensions.indexOf(fileExtension) != -1) {
                        return file;
                    } else if (notAllowedExtensions.indexOf(fileExtension) != -1) {
                        // not sure if people zip these but we shall see
                        throw new ExtractError(`zip includes ${fileExtension}`);
                    }
                }
            }
            if(halt) {
                throw new ExtractError("Expected .appx, .msix, .appxbundle, or .msixbundle to be at the same folder as Add-AppDevPackage.ps1. Add-AppDevPackage.ps1 was found but no .appx, .msix, .appxbundle, or .msixbundle in the same folder.");
            }
        }
    }

    private subPackageFromType(packageType: string) : ContentBase {
        switch(packageType) {
            case ".appx": return new AppxContent();
            case ".appxbundle": return new AppxBundleContent();
            case ".msix": return new MsixContent();
            case ".msixbundle": return new MsixBundleContent();
        }
        throw new ExtractError(`Subpackage has unrecognized type: ${packageType}.  Expecting .appx, .appxbundle, .msix, or .msixbundle`)
    }
}
