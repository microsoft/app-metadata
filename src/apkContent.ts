import { ContentBase } from "./contentBase";
import { Constants } from "./constants"; 
import { ExtractError } from "./extractError"; 
import * as ManifestParser from "node-apk-parser/lib/apkreader/parser/manifest";

import * as fse from 'fs-extra';
import * as path from 'path';
import { OperatingSystem } from "./types";

export class ApkContent extends ContentBase {
    public async read(tempDir: string, fileList: any): Promise<void> {
        this.operatingSystem = OperatingSystem.Android;
        const manifestPath = this.findFile(fileList, Constants.ANDROID_MANIFEST);
        if (!manifestPath) {
            throw new ExtractError(`couldn't find apk manifest`);
        }
        let fullPath = path.resolve(path.join(tempDir, manifestPath));
        const exists = await fse.pathExists(fullPath);
        if (!exists) {
            throw new ExtractError(`manifest wasn't saved on unzip || '${fullPath}' is incorrect`);
        }
        const buffer = await fse.readFile(fullPath);
        const parser = new ManifestParser(buffer);
        const manifestData = parser.parse();
        this.iconFullPath = this.iconSearch(fileList);
        await this.readIcon(tempDir, this.iconFullPath);
        this.mapManifest(manifestData);
    }
    private iconSearch(fileList: string[]) : string {
        let chosenIcon = null;
        for (let filePath of fileList) {
            filePath = filePath.toLowerCase();
            // if there are ever issues with this- search for mipmap in hockeyApp's app_build.rb
            if (filePath.includes("icon") &&
            (filePath.includes("mipmap-xxxhdpi-v4") ||
            filePath.includes("mipmap-xxhdpi-v4") || 
            filePath.includes("mipmap-xhdpi-v4") || 
            filePath.includes("mipmap-hdpi-v4") || 
            filePath.includes("mipmap-mdpi-v4") || 
            filePath.includes("raw"))) {
                chosenIcon = filePath;
            }
        }
        return chosenIcon;
    }
    private mapManifest(manifestData: any) {
        this.uniqueIdentifier =  manifestData.package ? manifestData.package : null; 
        this.version =  manifestData.versionName ? manifestData.versionName : null;
        this.buildVersion =  manifestData.versionCode ? `${manifestData.versionCode}` : null;
        this.minimumOsVersion =  manifestData.usesSdk ? manifestData.usesSdk.minSdkVersion : null;
        this.deviceFamily = Constants.ANDROID;
    }
}