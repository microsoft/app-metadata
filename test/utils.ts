import * as should from 'should';
import { Utils } from '../src/utils';

describe('Utils', () => {
    context('#findFileByPrioritizedPatterns', () => {
        context('when filePaths is null', () => {
            it('should return null', () => {
                const file = Utils.findFileByPrioritizedPatterns(null, []);
                should(file).be.null;
            });
        });

        context('when filePaths is empty array', () => {
            it('should return null', () => {
                const file = Utils.findFileByPrioritizedPatterns([], []);
                should(file).be.null;
            });
        });

        context('when subStrings is null', () => {
            it('should return null', () => {
                const file = Utils.findFileByPrioritizedPatterns(['some-file.txt'], null);
                should(file).be.null;
            });
        });

        context('when subStrings is empty array', () => {
            it('should return null', () => {
                const file = Utils.findFileByPrioritizedPatterns(['some-file.txt'], []);
                should(file).be.null;
            });
        });

        context('when subStrings matches the first file', () => {
            it('should return the first file', () => {
                const file = Utils.findFileByPrioritizedPatterns(['a', 'b', 'c'], [['a']]);
                should(file).be.equal('a');
            });
        });

        context('when subStrings matches last file', () => {
            it('should return the last file', () => {
                const file = Utils.findFileByPrioritizedPatterns(['a', 'b', 'c'], [['c']]);
                should(file).be.equal('c');
            });
        });

        context('when subStrings matches a file', () => {
            it('should return the matched file', () => {
                const file = Utils.findFileByPrioritizedPatterns(['a', 'bc', 'de'], [['c']]);
                should(file).be.equal('bc');
            });
        });

        context('when subStrings includes more then one sub-string', () => {
            it('should return the file that matches all the substrings', () => {
                const file = Utils.findFileByPrioritizedPatterns(['b', 'c', 'bc'], [['c', 'b']]);
                should(file).be.equal('bc');
            });
        });

        context('when subStrings includes more then one sub-string', () => {
            it('should return the file that matches all the substrings', () => {
                const file = Utils.findFileByPrioritizedPatterns(['b', 'c', 'bc'], [['c', 'b']]);
                should(file).be.equal('bc');
            });
        });

        context('when only the last sub-strings matches a file', () => {
            it('should return the file that matches the last substrings', () => {
                const file = Utils.findFileByPrioritizedPatterns(
                    ['cbd', 'c'], 
                    [['c', 'b'], ['e'], ['c','b','d']]);
                should(file).be.equal('cbd');
            });
        });

        context('when files include paths', () => {
            it('should only compare based on file name and ignore the rest of the path', () => {
                const file = Utils.findFileByPrioritizedPatterns(
                    ['d/ba', 'd/eb', 'a/bd'], [['b', 'd']]);
                should(file).be.equal('a/bd');
            });
        });
    });

    context('#findFileBySubStrings', () => {
        context('when filePaths is null', () => {
            it('should return null', () => {
                const file = Utils.findFileBySubStrings(null, []);
                should(file).be.null;
            });
        });

        context('when filePaths is empty array', () => {
            it('should return null', () => {
                const file = Utils.findFileBySubStrings([], []);
                should(file).be.null;
            });
        });

        context('when subStrings is null', () => {
            it('should return null', () => {
                const file = Utils.findFileBySubStrings(['some-file.txt'], null);
                should(file).be.null;
            });
        });

        context('when subStrings is empty array', () => {
            it('should return null', () => {
                const file = Utils.findFileBySubStrings(['some-file.txt'], []);
                should(file).be.null;
            });
        });

        context('when file matches the subStrings', () => {
            it('should return the file', () => {
                const file = Utils.findFileBySubStrings(['a.txt'], ['a', '.txt']);
                should(file).equal('a.txt');
            });
        });

        context('when 2 files matches the subStrings', () => {
            it('should return the first one', () => {
                const file = Utils.findFileBySubStrings(['a.txt', 'ab.txt'], ['a', '.txt']);
                should(file).equal('a.txt');
            });
        });

        context('when there is no match', () => {
            it('should return null', () => {
                const file = Utils.findFileBySubStrings(['a.txt', 'ab.txt'], ['d', '.txt']);
                should(file).be.null;
            });
        });
    });
});