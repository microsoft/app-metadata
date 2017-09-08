/// <reference path='../../typings/index.d.ts' />

import path = require('path');

var winston = require('winston');
const winstonCommon = require('winston/lib/winston/common');
import fsExtra = require('fs-extra');
import _ = require('lodash');
var colorizer = require('./colorizer');

export interface LoggerInstance {
    error(message: string, ...metadata: any[]): void;
    warn(message: string, ...metadata: any[]): void;
    info(message: string, ...metadata: any[]): void;
    verbose(message: string, ...metadata: any[]): void;
    debug(message: string, ...metadata: any[]): void;
    silly(message: string, ...metadata: any[]): void;
}

export class Levels {
    error: number = 0;
    warn: number = 1;
    info: number = 2;
    verbose: number = 3;
    debug: number = 4;
    silly: number = 5;
}

export class Transports {
    public console: {
        silent: boolean,
        level: string,
        timestamp: boolean,
        colorize: boolean
    };

    public file: {
        silent: boolean,
        level: string,
        timestamp: boolean,
        filepath: string,
        // max file size in bytes
        maxsize: number,
        maxFiles: number
    };
}

export class LoggerFactory {
    private static instance: LoggerInstance; // winston instance
    private static defaultLevels = new Levels();
    public static levels: Levels;

    public static createInstance(levels: Levels = LoggerFactory.defaultLevels): LoggerInstance {
        return <LoggerInstance>new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    timestamp: true
                })
            ],
            levels: levels || LoggerFactory.defaultLevels
        });
    }

    public static getDefaultInstance(): LoggerInstance {
        if (!this.instance) {
            this.instance = this.createInstance(this.levels || this.defaultLevels);
        }

        return this.instance;
    }
}

export class LoggerBootstrap {
    public static silentDefault = false;
    public static loggingLevelDefault = 'info';
    public static includeTimestampDefault = true;
    public static colorizeDefault = false;
    public static maxFileSizeDefault = 2 * 1024 * 1024;
    public static maxFilesDefault = 20;

    private static consoleTransportConfigDefault = {
        silent: LoggerBootstrap.silentDefault,
        level: LoggerBootstrap.loggingLevelDefault,
        timestamp: LoggerBootstrap.includeTimestampDefault,
        colorize: LoggerBootstrap.colorizeDefault,
    };

    private static fileTransportConfigDefault = {
        silent: LoggerBootstrap.silentDefault,
        level: LoggerBootstrap.loggingLevelDefault,
        timestamp: LoggerBootstrap.includeTimestampDefault,
        maxsize: LoggerBootstrap.maxFileSizeDefault,
        maxFiles: LoggerBootstrap.maxFilesDefault
    };

    // obsolete
    public static configure(transports: Transports, serviceName?: string) {
        LoggerBootstrap.configureInstance(LoggerFactory.getDefaultInstance(), transports, serviceName);
    }

    public static configureDefault(transports: Transports, serviceName?: string) {
        LoggerBootstrap.configureInstance(LoggerFactory.getDefaultInstance(), transports, serviceName);
    }

    public static configureInstance(instance: LoggerInstance, transports: Transports, serviceName?: string) {
        var enabledTransports = [];

        if (transports.console) {

            let transportConfig: any = _.merge(this.consoleTransportConfigDefault, transports.console);
            transportConfig.formatter = function (options) {
                // Return string will be passed to logger.
                let timestamp = options.timestamp ? new Date().toISOString() : '';

                let output = serviceName ? `[${serviceName}]` + ' ' : '';
                output += options.colorize ? `[${colorizer.colorize(options.level)}] ` : `[${options.level}] `;
                output += timestamp ? `[${timestamp}]` + ' ' : '';
                output += options.message;
                output += !_.isEmpty(options.meta) ? ' ' + JSON.stringify(options.meta) : '';

                return output;
            };

            let consoleTransport = new (winston.transports.Console)(transportConfig);
            enabledTransports.push(consoleTransport);
        }

        if (transports.file) {
            // create the logging folder, if it doesn't exist
            // winston will fail, if the destination folder for the file transport doesn't exist
            let logPath = path.parse(transports.file.filepath);
            fsExtra.ensureDirSync(logPath.dir);

            let transportConfig: any = _.merge(this.fileTransportConfigDefault, transports.file);
            // winston expects the log file path to be in the filename property instead of filepath
            transportConfig.filename = transportConfig.filepath;

            let fileTransport = new (winston.transports.File)(transportConfig);
            enabledTransports.push(fileTransport);
        }

        if (enabledTransports.length > 0 && (<any>instance).configure && (<any>instance).levels != null) {
            // replaces all transports at once. If there are existing transports already, they are replaced
            (<any>instance).configure({
                transports: enabledTransports,
                // provide the levels here again, as calling configure without them overrides levels back to default.. :(
                levels: (<any>instance).levels
            });
        }
    }

    // Override winston library to use real console.log instead of process.stdout.write, otherwise logs aren't shown in VSCode debugger. See https://github.com/Microsoft/vscode/issues/19750#issuecomment-281691480.
    public static updateWinstonToUseRealConsoleLog() {
        winston.transports.Console.prototype.log = function (level, message, meta, callback) {
            const output = winstonCommon.log((<any>Object).assign({}, this, {
                level,
                message,
                meta,
            }));

            console[level in console ? level : 'log'](output);

            setImmediate(callback, null, true);
        };
    }
}

export var Logger: LoggerInstance = LoggerFactory.getDefaultInstance();
