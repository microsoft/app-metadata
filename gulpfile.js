var glob = require('glob');
var path = require('path');
var chalk = require('chalk');
var rmdir = require('rmdir');

var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var sequence = require('gulp-sequence');
var typings = require('gulp-typings');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var sourcemaps = require('gulp-sourcemaps');

var tsProjectClient = ts.createProject('tsconfig.json');

var mochaSettings = {
    clearRequireCache: true,
    ignoreLeaks: true,
    timeout: 4000,
    slow: 200
};

gulp.task('build:typings', function (cb) {
    return gulp.src("./typings.json")
        .pipe(typings());
});

gulp.task('build:clean', function(cb) {
    return del(
            [
                'src/**/*.js',
                'src/**/*.d.ts',
                'test/**/*.d.ts',
                'test/**/*.js',
                'test/**/index.js',
                'test/temp/**/*'
            ]);
});

gulp.task('publish:clean', (cb) => {
    return rmdir('./out', () => cb());
});

gulp.task('publish:copy', function() {
    return gulp.src(
                    [
                        '.npmrc',
                        'LICENSE',
                        'package.json',
                        'README.md',
                        'index.d.ts',
                        'index.js',
                        'src/**/*.js',
						'!out/**/*',
                        '!node_modules/**/*'
                    ]
                )
                .pipe(gulp.dest((file) => {
                    const dest = file.cwd + '/out' + (file.path.includes('/src') ? '/src' : '');
                    return dest;
                }));
});

gulp.task('publish:build', sequence('publish:clean', 'build:clean', 'build:typings', 'publish:build:typescript'));

gulp.task('publish:build:typescript', () => {
    // building without source maps
    tsProjectClient.config.sourcemaps = false;
    const tsResult = tsProjectClient.src()
        .pipe(tsProjectClient());
    
    return tsResult.js
        .pipe(gulp.dest((file) => file.cwd));
});

gulp.task('build:typescript', () => {
    const tsResult = tsProjectClient.src()
        .pipe(sourcemaps.init())
        .pipe(tsProjectClient());
    
    return tsResult.js
        .pipe(sourcemaps.mapSources((sourcePath, file) => path.basename(sourcePath)))
        .pipe(sourcemaps.write({ includeContent: false }))
        .pipe(gulp.dest('.'));
});

gulp.task('test:cleanup', (cb) => {
    return rmdir('./test/temp', () => cb());
})

gulp.task('test:mocha:run', (cb) => {
    mochaSettings.reporter = 'spec';

    return gulp.src('./test/**/*.js')
        .pipe(mocha(mochaSettings));
});

gulp.task('publish:instructions', (cb) => {
    gutil.log('======================================');
    gutil.log('To finish publishing do the following:');
    gutil.log('1. In package.json, increase the version.');
    gutil.log('2. go to <root>/out');
    gutil.log("3. run 'npm publish'");
    gutil.log('======================================');
    cb();
});

gulp.task('build', sequence('build:clean', 'build:typings', 'build:typescript'));
gulp.task('test', sequence('build', 'test:mocha:run', 'test:cleanup'));
gulp.task('publish', sequence('publish:build', 'publish:copy', 'publish:instructions'));

gulp.task('default', (cb) => {
    gutil.log('');
    gutil.log('  ' + chalk.cyan('gulp build') + '             - builds the tree');
    gutil.log('  ' + chalk.cyan('gulp test') + '              - runs mocha tests and outputs the result in spec form');
    gutil.log('  ' + chalk.cyan('gulp publish') + "           - This operation does not perform a publish. It just moves all the files that needs to published to the folder 'out' after that 'npm publish' need to be called from that folder.");
    gutil.log('');
    gutil.log('');
    cb();
});
