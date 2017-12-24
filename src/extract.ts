import { Constants } from "./constants";
import { ExtractError } from "./extractError";
import { IpaContent } from "./contentIPA";
import { ApkContent } from "./contentAPK";
import { AppxContent } from "./contentAPPX";
import { ZipContent } from "./contentZIP";
import { AppxBundleContent } from "./contentAPPXBundle";

import * as fse from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';
import { ContentBase } from "./contentBase";
import { IContent } from './types';

export class Extract {
    public static async run(filePath: string): Promise<IContent> {
        const file = await File.create(filePath); 
        
        let appPackage: ContentBase;
        try {
            switch (file.ext.toLowerCase()) {
                case Constants.IPA: appPackage = new IpaContent(); break;
                case Constants.APK: appPackage = new ApkContent(); break;
                case Constants.APPX: appPackage = new AppxContent(); break;
                case Constants.APPXBUNDLE: appPackage = new AppxBundleContent(); break;
                case Constants.APPXUPLOAD: appPackage = new ZipContent(); break;
                case Constants.ZIP: appPackage = new ZipContent(); break;
                case Constants.DMG: throw new ExtractError(`${file.ext} is currently unsupported`);
                default:
                    throw new ExtractError(`unhandled bundle type '${file.ext}'`);
            }
            await appPackage.extract(file.absolutePath);
            return appPackage;
        } catch (err) {
            Logger.error(err.message);
            throw err;
        }
    }
}

/** Represents a path the file to extract. Also to validation for file existence. */
class File {
    public ext: string;
    public absolutePath: string;
    public static async create(filePath: string): Promise<File> {
        if (!filePath) {
            throw new ExtractError('no defined filePath');
        }
        let file = new File();
        file.absolutePath = path.resolve(filePath);
        const exists = await fse.pathExists(file.absolutePath);
        if (!exists) {
            throw new ExtractError(`${file.absolutePath}' doesn't exist`);
        }
        file.ext = path.extname(filePath).replace(".", "");
        Logger.silly(`extension type: '${file.ext}`);
        return file;
    }
}