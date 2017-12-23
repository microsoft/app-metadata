import { ContentBase } from "./contentBase";
import { Constants } from "./constants";
import { ExtractError } from "./extractError";

import * as fse from 'fs-extra';
import * as path from 'path';

export class AppxContent extends ContentBase {
    public get supportedFiles(): string[] {
      return Constants.APPX_FILES;
    }
    public async read(tempDir: string, fileList: string[]): Promise<any> {
        const manifestData = await this.parseManifest(tempDir, fileList); 
        if(!manifestData) {
            throw new ExtractError("manifest XML couldn't be parsed");
        }
        await this.mapManifest(tempDir, manifestData);
        await this.parseIcon(tempDir, fileList);
        return this;
    }
    private async parseManifest(tempDir: string, fileList: any): Promise<any> {
        let manifestPath = this.findFile(fileList, Constants.APPX_MANIFEST);
        if (!manifestPath) {
            throw new ExtractError("cannot find the xml manifest");
        }
        const exists = await fse.pathExists(path.resolve(path.join(tempDir, manifestPath)));
        if (!exists) {
            throw new ExtractError('manifest in filelist, but not on disk');
        }
        const manifestData = await this.parseXML(tempDir, manifestPath);
        return manifestData;
    }
    private async mapManifest(tempDir: string, manifestData: any) {
        if(!manifestData || !manifestData.Package) {
            throw new ExtractError("empty manifest");
        }
        this.deviceFamily = Constants.WINDOWS;
        if (manifestData.Package.Properties && manifestData.Package.Properties[0]) {
            this.displayName = manifestData.Package.Properties[0].DisplayName ? manifestData.Package.Properties[0].DisplayName[0] : null;
            this.iconFullPath =  manifestData.Package.Properties[0].Logo ? manifestData.Package.Properties[0].Logo[0] : null;
        }
        if (manifestData.Package.Identity && manifestData.Package.Identity[0]) {
            this.uniqueIdentifier  = (manifestData.Package.Identity[0].$ && manifestData.Package.Identity[0].$.Name) ? manifestData.Package.Identity[0].$.Name : null;
            this.buildVersion = (manifestData.Package.Identity[0].$ && manifestData.Package.Identity[0].$.Version) ? manifestData.Package.Identity[0].$.Version : null;
        }
        if(manifestData.Package.Prerequisites && manifestData.Package.Prerequisites[0]) {
            this.minimumOsVersion = manifestData.Package.Prerequisites[0].OSMinVersion ? manifestData.Package.Prerequisites[0].OSMinVersion[0] : null;
        } else if(manifestData.Package.Dependencies && manifestData.Package.Dependencies[0]) {
            this.minimumOsVersion = manifestData.Package.Dependencies[0].TargetDeviceFamily && manifestData.Package.Dependencies[0].TargetDeviceFamily[0].$.MinVersion ? manifestData.Package.Dependencies[0].TargetDeviceFamily[0].$.MinVersion : null;
        }
        if(manifestData.Package.Applications && manifestData.Package.Applications[0] && manifestData.Package.Applications[0].Application && manifestData.Package.Applications[0].Application[0] && manifestData.Package.Applications[0].Application[0].$) {
            this.executableName =  manifestData.Package.Applications[0].Application[0].$.Executable ? manifestData.Package.Applications[0].Application[0].$.Executable : null;
        }
        this.languages = [];
        if (manifestData.Package.Resources && manifestData.Package.Resources[0] && manifestData.Package.Resources[0].Resource) {
            for (const resource of manifestData.Package.Resources[0].Resource) {
                if(resource.$.Language) {
                    this.languages.push(resource.$.Language.toLowerCase());
                }
            }
        }
    }
    private async parseIcon(tempDir: string, fileList: string[]) {
        if (this.iconFullPath) {
            // normalize wasn't working with icon path for sone reason, had to use replace
            this.iconFullPath = path.normalize(this.iconFullPath.replace("\\", "/"));
            let success = await this.readIcon(tempDir, this.iconFullPath);
          // return if you find the icon as listed in the manifest. Ex: "StoreLogo.png"
            if (success) {
                return;
            }
            // otherwise the icon name might also include scale, Ex: "StoreLogo.scale-240.png"
            // so look for icons that include the manifest icon name as a subset
            const basename = path.basename(this.iconFullPath, '.png').toLowerCase();
            this.iconFullPath = null;
            let max = 0;
            for (let icon of fileList) {
              // look through potential manifest icons for the one with the best scale 
                if (icon.toLowerCase().includes(basename)) {
                    const curr = icon.match(/[0-9]+/);
                    if(!curr) {
                        break;
                    }
                    const int = parseInt(curr[0], 10);
                    if (int && int >= max) {
                        max = int; 
                        this.iconFullPath = icon; 
                    }
                }
            }
        }
        // if there is still no icon name after looking for a scaled icon, return
        if (!this.iconFullPath) {
            return;
        }
        await this.readIcon(tempDir, this.iconFullPath);
    } 
}