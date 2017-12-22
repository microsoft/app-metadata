var glob = require('glob');
var path = require('path');
var through = require('through2')
var fs = require('fs');
var chalk = require('chalk');
var rmdir = require('rmdir');
var Promise = require('bluebird');
var merge = require('merge2');

var gulp = require('gulp');
var ts = require('gulp-typescript');
var sequence = require('gulp-sequence');
var typings = require('gulp-typings');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var sourcemaps = require('gulp-sourcemaps');

var tsProjectClient = ts.createProject('tsconfig.json');
tsProjectClient.config.files = glob.sync('./src/**/*.ts').concat(['./index.ts']);

var tsProjectClientTests = ts.createProject('tsconfig.json');
tsProjectClientTests.config.files = glob.sync('./test/**/*.ts');

var mochaSettings = {
    clearRequireCache: true,
    ignoreLeaks: true,
    timeout: 400000000,
    slow: 200
};

var errorReporter = {
  error: function (error) {
    gutil.log(error.message);
    terminate(error);
  },
  finish: ts.reporter.defaultReporter().finish
};

var terminate = function (err) {
    setTimeout(function () {
        var exitCode = 0;
        if (err) {
            exitCode = -1;
        }
        process.exit(exitCode);
    }, 50);
};

var patchFiles = function () {
    var patch = function (file, encoding, callback) {
        // we'll change our file paths in such a way that the base folder
        // is always the folder in which our file resides
        var full = file.history[0].replace(/\\/g, '/');
        var base = path.dirname(full);
        var basename = path.basename(full);
        // trim the end
        while (base[base.length - 1] == '/') {
            base = base.substring(0, base.length - 1);
        }

        // mess with our file. the result will be the same file just
        // with different file paths
        file.cwd = base;
        file.base = base + '/';
        file.stem = path.basename(full, file.extname);
        file.history = [full];

        // if we have a sourcemap patch that as well
        if (file.sourceMap && file.sourceMap.sources) {
            file.sourceMap.file = basename;
            const source = getRelativePathToTsFile(file);
            file.sourceMap.sources = [source];
        }

        // finally push the file
        this.push(file);
        callback();
    };

    return through.obj(patch);
};

/**
 * Given a vinyl file return a relative path from this file to its source (the equivelent typescipt file).  
 * @param {*} A vinyl file (https://github.com/gulpjs/vinyl). this is the file that is passes in gulp pipes. 
 */
var getRelativePathToTsFile = function (file) {
    const ourDirRelativeToTsConfigFile = "./out"
    const fullPathToOutFolder = path.join(process.cwd(), ourDirRelativeToTsConfigFile);
    let relativePathFromJSFileToProjectFolder = path.relative(file.dirname, process.cwd());
    const pathFromProjectRootToSourceDirName = file.dirname.replace(fullPathToOutFolder, "");
    const relativePathFromJsFileToTsDirName = path.join(relativePathFromJSFileToProjectFolder, pathFromProjectRootToSourceDirName);
    const relativePathFromJsFileToTsFile = path.join(relativePathFromJsFileToTsDirName, file.stem) + ".ts";

    return relativePathFromJsFileToTsFile;
}

var cleanReferencesFromFiles = function () {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-files-clean', 'Streaming not supported'));
            return cb();
        }

        var data = fs.readFileSync(file.path).toString();
        var lines = data.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].match(/^\/\/\/.*$/)) {
                lines.splice(i, 1);
                i--;
            }            
        }
        fs.writeFileSync(file.path, lines.join('\n'));
        cb();
    });
};

gulp.task('core:build:typings', function (cb) {
//    cb();
    return gulp.src("./typings.json")
        .pipe(typings());
});

gulp.task('core:build:clean', function(cb) {
    rmdir(tsProjectClient.config.compilerOptions.outDir, function(error, dirs, files) {
		cb();
	});
});

gulp.task('core:build:copy:client', function() {
    return gulp.src([
                        '**/.npmrc',
                        '**/LICENSE',
                        '**/package.json',
                        '**/README.md',
						'!out/**/*',
                        '!node_modules/**/*'
                    ])
                .pipe(patchFiles())
                .pipe(gulp.dest(function(file) {
                    return tsProjectClient.config.compilerOptions.outDir;
                }));
});

gulp.task('core:build:typescript:client', function () {
    var tsResult = tsProjectClient.src()
        .pipe(sourcemaps.init())
        .pipe(tsProjectClient())

    return merge([
        tsResult.js
            .pipe(patchFiles())
            .pipe(sourcemaps.write({includeContent: false}))
            .pipe(gulp.dest(function (file) {
                return file.cwd;
            })),
        tsResult.dts
            .pipe(patchFiles())
            .pipe(gulp.dest(function (file) {
                return file.cwd;
            }))
    ]);
});

gulp.task('core:build:typescript:client-test', function () {

    var tsResult = tsProjectClientTests.src()
        .pipe(sourcemaps.init())
        .pipe(tsProjectClientTests());

    return tsResult.js
        .pipe(patchFiles())
        .pipe(sourcemaps.write({includeContent: false}))
        .pipe(gulp.dest(function (file) {
            return file.cwd;
        }));
});

gulp.task('core:test:mocha:client-test', function (cb) {
    mochaSettings.reporter = 'spec';

    var clientTestFiles = tsProjectClientTests.config.files.slice();
    for (var i = 0; i < clientTestFiles.length; i++) {
        clientTestFiles[i] = clientTestFiles[i].replace(/.ts$/i, '.js').replace(/^\./i, './out');
    }

    gulp.src(clientTestFiles)
        .pipe(mocha(mochaSettings))
        .once('error', function (err) {
            if (cb) {
                cb(err);
                cb = null;
            }
        })
        .once('end', function () {
            if (cb) {
                cb();
                cb = null;
            }
        });
});

gulp.task('core:build:typescript', sequence('core:build:typescript:client', 'core:build:typescript:client-test', 'core:clean:dts:client' ));

gulp.task('core:test:mocha', sequence('core:test:mocha:client-test'));

gulp.task('core:clean:dts:client', function () {
    var metadata = fs.readFileSync(path.join('.', 'package.json'));
    metadata = JSON.parse(metadata);

    gulp.src([path.join(tsProjectClient.config.compilerOptions.outDir, '**/*.d.ts'), path.join(tsProjectClient.config.compilerOptions.outDir, '**/*.js')])
        .pipe(cleanReferencesFromFiles());
});

gulp.task('build', sequence('core:build:clean', 'core:build:typings', [ 'core:build:copy:client', 'core:build:typescript' ]));

gulp.task('test', function (cb) {
    sequence('core:build:typings', 'core:build:typescript', 'core:test:mocha', function (err) {
        cb(err);
        terminate(err);
    });
});

gulp.task('publish', sequence('build', 'core:publish:azure'));

gulp.task('default', function (cb) {
    gutil.log('');
    gutil.log('  ' + chalk.cyan('gulp build') + '             - builds the tree');
    gutil.log('  ' + chalk.cyan('gulp test') + '              - runs mocha tests and outputs the result in spec form');
    gutil.log('');
    gutil.log('');
    cb();
});
