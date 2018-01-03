import { Constants } from "./constants";
import { ExtractError } from "./extractError";
import { IpaContent } from "./ipaContent";
import { ApkContent } from "./apkContent";
import { AppxContent } from "./appxContent";
import { ZipContent } from "./zipContent";
import { AppxBundleContent } from "./appxBundleContent";

import * as fse from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';
import { ContentBase } from "./contentBase";
import { IPackageMetadata } from './types';
import { WorkingFolder } from "./workingFolder";

export class Extract {
    /**
     * Extract metadata and icons from iOS, Android and UWP packages.
     * @param filePath the path to the file to extract. The type of the file is determine based on the extension (IPA, APK, APPX, APPXBUNDLE, ZIP).
     * @param workingFolder The content of the packages will be extracted to this folder. After extraction this folder will hold the icons and other none temporarily files. If no folder is supplied the machine's temp folder (using tmp NPM) is used.
     */
    public static async run(filePath: string, workingFolder?: string): Promise<IPackageMetadata> {
        const file = await File.create(filePath);
        const folder = await WorkingFolder.create(workingFolder);

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
            await appPackage.extract(file.absolutePath, folder);
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

