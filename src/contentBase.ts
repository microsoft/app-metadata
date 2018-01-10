import { Constants } from "./constants"; 
import { ExtractError } from "./extractError";
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as bluebird from 'bluebird';
import * as yauzl from 'yauzl';
import * as tmp from 'tmp';
import * as md5 from 'md5-file';
import { Logger } from './logger';
import { IPackageMetadata } from './types';
import { WorkingFolder } from "./workingFolder";

export abstract class ContentBase implements IPackageMetadata {
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
    size: number;
    hasProvisioning: boolean; 
    protected workingFolder: WorkingFolder;

    public async extract(packageAbsolutePath, workingFolder: WorkingFolder) {
        this.workingFolder = workingFolder;
        
        // unzip only files that has valuable data.  
        let fileList = await this.selectiveUnzip(
            workingFolder.workingFolderPath, 
            packageAbsolutePath, 
            this.supportedFiles);
        
        // extract metadata from the unzipped files. 
        await this.read(workingFolder.workingFolderPath, fileList);

        // read common properties 
        this.fingerprint = md5.sync(packageAbsolutePath);
        this.originalFileName = path.basename(packageAbsolutePath);
        this.size = fs.statSync(packageAbsolutePath).size;

        // persist icon (move from the temp folder)
        await this.persistFile(this, 'iconFullPath');

        // delete temp folder
        await workingFolder.deleteWorkingFolder();
    } 

    /**
     * By default all extracted files are deleted. Files that needs to be returned should be persisted.  
     * This method will read the file path from obj[propertyName], copy the file to this.workingFolder.outFolderPath
     * and save the new path in obj[propertyName].
     */
    protected async persistFile(obj: Object, propertyName: string) {
        if (propertyName && obj[propertyName]) {
            let source = obj[propertyName];
            let fileExist = await fse.pathExists(source);
            if (!fileExist) {
                source = path.join(this.workingFolder.workingFolderPath, source); 
                fileExist = await fse.pathExists(source);
            }
            if (fileExist) {
                const fileName = path.basename(source);
                const newFilePath = path.join(this.workingFolder.outFolderPath, fileName); 
                await fse.copy(source, newFilePath);
                obj[propertyName] = newFilePath;
            }
        }
       
    }

    public abstract read(tempDir: string, fileList: any): Promise<void>;

    public get supportedFiles(): string[] {
      return Constants.GENERAL_FILES;
    }
    protected findFile(fileList: string[], searchFile: string): string {
        if(!searchFile) {
            return null;
        }
        searchFile = searchFile.toLowerCase();
        let foundPath = null;
        for(const filePath of fileList) {
            if(filePath.toLowerCase() === searchFile) {
                return filePath;
            }
            const pathSplit = filePath.split(path.sep);
            for(const pathSegment of pathSplit) {
                if(pathSegment.toLowerCase() === searchFile && (searchFile !== Constants.INFO_PLIST || searchFile === Constants.PROVISIONING)) {
                    foundPath = this.selectShortestPath(foundPath, filePath);
                }
                // Info.plist and embedded.mobileprovisions is a special case since there are multiple instances in different files
                if(pathSegment.toLowerCase() === searchFile && (searchFile === Constants.INFO_PLIST || searchFile === Constants.PROVISIONING) && pathSplit.length <= 3) {
                    foundPath = this.selectShortestPath(foundPath, filePath);
                }
            }
        }
        return foundPath;
    }

    /**
     * This method determines which path (shortest one) should be selected based on its file path depth length. 
     * For example:
     *  pathA: a/b/c.txt
     *  pathB: a/c.txt
     *  will return pathB since it has the shortest path to c.txt
     */
    private selectShortestPath(pathA: string, pathB: string): string {
        if(!pathA) {
            return pathB;
        }
        const pathASplit   = pathA.split(path.sep);
        const pathBSplit = pathB.split(path.sep);
        if (pathASplit.length > pathBSplit.length) {
            return pathB;
        } else {
            return pathA;
        }
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
                    let validName = this.validateAndDecodeFilename(fileList, entry);
                    var valuable = searchStrings.some(file => validName.toLowerCase().includes(file));
                    if (valuable && !validName.endsWith(path.sep)) {
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
            this.icon = await fse.readFile(fullPath) as any;
            this.iconName = path.basename(iconName);
            return true;
        }
        Logger.silly(`found iconPath:'${iconName}' doesn't exist or wasn't unzipped`);
        return null;
    }
    // The zip extractor tool (yauzl) throws if the file path includes \, 
    // however in windows this is a common scenario, so before validating the file name, 
    // we replace \ with path.sep" to stop fileName validation from failing
     private validateAndDecodeFilename(fileList: string[], entry: any) : string {
        let validName = entry.fileName.toString().split('\\').join(path.sep);
        validName = decodeURI(validName);
        const errorMessage = yauzl.validateFileName(validName);
        if (errorMessage != null) {
            throw new ExtractError("unzip filename validation failed");
        }
        fileList.push(validName);
        return validName;
    }
}