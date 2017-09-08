import { Constants } from "./constants"; 
import { ExtractError } from "./extractError";

declare var require: any;

import * as fse from 'fs-extra';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as bluebird from 'bluebird';
import * as yauzl from 'yauzl';
import { Logger } from './logger';

export class ContentBase {
    originalFileName: string;
    displayName: string;
    name: string;
    version: string; 
    buildVersion: string;
    uniqueIdentifier: string; 
    minimumOsVersion: string;
    executableName: string;
    deviceFamily: any;
    languages: string[];
    iconFullPath: string;
    iconName: string;
    icon: ArrayBuffer;
    fingerprint: string;
    size: string;
    hasProvisioning: boolean; 

    public get supportedFiles(): string[] {
      return Constants.GENERAL_FILES;
    }
    protected findFile(fileList: string[], searchFile: string): string {
        if(!searchFile) {
            return null;
        }
        searchFile = searchFile.toLowerCase();
        for(const filePath of fileList) {
            if(filePath.toLowerCase() === searchFile) {
                return filePath;
            }
            const pathSplit =  filePath.split(path.sep);
            for(const pathSegment of pathSplit) {
                if(pathSegment.toLowerCase() === searchFile && (searchFile !== Constants.INFO_PLIST || searchFile === Constants.PROVISIONING)) {
                    return filePath;
                }
                // Info.plist and embedded.mobileprovisions is a special case since there are multiple instances in different files
                if(pathSegment.toLowerCase() === searchFile && (searchFile === Constants.INFO_PLIST || searchFile === Constants.PROVISIONING) && pathSplit.length <= 3) {
                    return filePath;
                }
            }
        }
        return null;
    }
    public async selectiveUnzip(tempDir: string, filePath: string, searchStrings: Array<string>): Promise<Array<string>> {
        let fileList = [tempDir];
        return new Promise<Array<string>>((resolve, reject) => {
            // decode strings is set to false, specifically so that if the path seperators are different,
            // they can be flipped manually here before validating their formatting 
            yauzl.open(filePath, { lazyEntries: true, decodeStrings: false }, (err, zipfile) => {
                if (err) {
                    return reject(err);
                }
                zipfile.readEntry();
                zipfile.on("entry", (entry) => {
                    // fix path direction if there are any issues before validating
                    const validName = this.validateFilename(fileList, entry);
                    var valuable = searchStrings.some(file => validName.toLowerCase().includes(file));
                    if (valuable) {
                        entry.fileName = validName;
                        zipfile.openReadStream(entry, async (err, readStream) => {
                            if (err) {
                                return reject(err);
                            }
                            readStream.on("end", () => {
                                zipfile.readEntry();
                            });
                            const buildPath = path.join(tempDir, entry.fileName);
                            await fse.ensureFile(buildPath);
                            await fse.open(buildPath, 'w+');
                            var wstream = fse.createWriteStream(buildPath);
                            readStream.pipe(wstream);
                        });
                    } else {
                        zipfile.readEntry();
                    }
                });
                zipfile.on("end", () => {
                    Logger.silly(`Finished extracting to '${tempDir}'`);
                    return resolve(fileList);
                });
            });
        });
    }
    protected async parseXML(tempDir: string, manifestPath: string): Promise<any> {
        try {
            let data = await fse.readFile(path.join(tempDir, manifestPath), "utf8");
            const parser = new xml2js.Parser();
            const parserStringAsync = bluebird.promisify(parser.parseString);
            return parserStringAsync(data);
        } catch (err) {
            throw new ExtractError('appx xml manifest parsing failed');
        }
    }
    protected async readIcon(tempDir: string, iconName: string): Promise<Boolean> {
        if (!iconName || path.extname(iconName) !== ".png") {
            Logger.error(`found iconPath:'${iconName}' either blank or bad formatting`);
            return false;
        }
        const fullPath = path.join(tempDir, iconName);
        const exists = await fse.pathExists(fullPath);
        if (exists) {
            this.icon = await fse.readFile(fullPath);
            this.iconName = path.basename(iconName);
            return true;
        }
        Logger.silly(`found iconPath:'${iconName}' doesn't exist or wasn't unzipped`);
        return null;
    }
    // The zip extractor tool (yauzl) throws if the file path includes \, 
    // however in windows this is a common scenario, so before validating the file name, 
    // we replace \ with path.sep" to stop fileName validation from failing
     private validateFilename(fileList: string[], entry: any) : string {
        let validName = entry.fileName.toString().split('\\').join(path.sep);
        const errorMessage = yauzl.validateFileName(validName);
        if (errorMessage != null) {
            throw new ExtractError("unzip filename validation failed");
        }
        fileList.push(validName);
        return validName;
    }
}