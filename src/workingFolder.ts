import * as bluebird from 'bluebird';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as tmp from 'tmp';
import * as uuid from 'uuid';
import * as rimraf from 'rimraf';

export class WorkingFolder {
    /** original working folder */
    private absolutePath: string;
    /** folder under absolutePath where extracted files will be copied. This folder will be deleted after extraction is completed. */
    public workingFolderPath: string;
    /** folder under absolutePath where output files (icons and provisioning profile) will be saved. This folder will NOT be deleted after extraction is completed. */
    public outFolderPath: string;
    
    public static async create(folderPath?: string): Promise<WorkingFolder> {
        if (!folderPath) {
            folderPath = await bluebird.promisify(tmp.dir)(path);;
        }
        let workingFolder = new WorkingFolder();
        workingFolder.absolutePath = path.resolve(folderPath);
        await fse.ensureDir(workingFolder.absolutePath);
        
        const subFolder = path.join(workingFolder.absolutePath, uuid.v4());
        workingFolder.workingFolderPath = path.join(subFolder, 'temp');
        workingFolder.outFolderPath = path.join(subFolder, 'out');
        await fse.ensureDir(workingFolder.workingFolderPath);
        await fse.ensureDir(workingFolder.outFolderPath);

        return workingFolder;
    }

    public async deleteWorkingFolder() {
        await bluebird.promisify(rimraf)(this.workingFolderPath);
    }
}