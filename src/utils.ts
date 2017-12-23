import { isEmpty } from 'lodash';
import * as path from 'path';

export class Utils {
    /**
     * Finds a file that contains sub-strings in its file name (the path itself is ignored). This method can get a list of sub-strings. File will be returned on first match.
     * @param filePaths A list of files.
     * @param prioritizedSubStrings prioritized array of sub-strings. For example: [['.png, 'love''], ['.png'], ['.gif']] 
     */
    public static findFileByPrioritizedPatterns(filePaths, prioritizedSubStrings): string {
        if (isEmpty(prioritizedSubStrings) || isEmpty(filePaths)) {
            return null;
        }

        let file = null;
        for (const patterns of prioritizedSubStrings) {
            file = Utils.findFileBySubStrings(filePaths, patterns);
            if (file) {
                break;
            }
        }

        return file;
    }

    /** 
     * finds the first file that contains all 'subStrings' or null if no such file.
    */
    public static findFileBySubStrings(filePaths: string[], subStrings: string[]): string {
        if (isEmpty(filePaths) || isEmpty(subStrings)) {
            return null;
        }

        // find file name that contains all subStrings
        for (const relativePath of filePaths) {
            // is file name contains all subStrings
            let matched = true;
            for (const subString of subStrings) {
                // is file contains subString
                const fileName = path.basename(relativePath);
                if (fileName.toLowerCase().includes(subString) === false) {
                    matched = false;
                    break;
                }
            }
            // If file name contains all subStrings, return it.
            if (matched) {
                return relativePath;
            }
        }

        return null;
    }
}