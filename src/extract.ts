import { Constants } from "./constants";
import { ExtractError } from "./extractError";
import { IpaContent } from "./contentIPA";
import { ApkContent } from "./contentAPK";
import { AppxContent } from "./contentAPPX";
import { ZipContent } from "./contentZIP";
import { AppxBundleContent } from "./contentAPPXBundle";

import { Logger } from './logger';

import * as bluebird from 'bluebird';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as md5 from 'md5-file';
import * as tmp from 'tmp';
import { ContentBase } from "./contentBase";
import { IContent } from './types';

export class Extract {
    public static async run(filePath: string): Promise<IContent> {
        if (!filePath) {
            throw new ExtractError('no defined filePath');
        }
        const fullPath = path.resolve(filePath);
        const exists = await fse.pathExists(fullPath);
        if (!exists) {
            throw new ExtractError(`${fullPath}' doesn't exist`);
        }
        const extension = path.extname(filePath).replace(".", "");
        Logger.silly(`extension type: '${extension}`);
        let fileList;
        let appPackage: ContentBase;
        try {
            switch (extension.toLowerCase()) {
                case Constants.IPA: appPackage = new IpaContent(); break;
                case Constants.APK: appPackage = new ApkContent(); break;
                case Constants.APPX: appPackage = new AppxContent(); break;
                case Constants.APPXBUNDLE: appPackage = new AppxBundleContent(); break;
                case Constants.APPXUPLOAD: appPackage = new ZipContent(); break;
                case Constants.ZIP: appPackage = new ZipContent(); break;
                case Constants.DMG: throw new ExtractError(`${extension} is currently unsupported`);
                default:
                    throw new ExtractError(`unhandled bundle type '${extension}'`);
            }
            let tempDir = await this.createFolder();
            fileList = await appPackage.selectiveUnzip(tempDir, filePath, appPackage.supportedFiles);
            Logger.silly("tempDir " + tempDir);
            let result = await appPackage.read(tempDir, fileList);

            result.fingerprint = md5.sync(filePath);
            result.originalFileName = path.basename(filePath);
            result.size = fs.statSync(fullPath).size;
            rimraf(tempDir, () => { Logger.silly('done'); });
            return result;
        } catch (err) {
            Logger.error(err.message);
            throw err;
        }
    }
    private static async createFolder(): Promise<string> {
        const tmpDirAsync = bluebird.promisify(tmp.dir);
        return tmpDirAsync(path);
    }
}