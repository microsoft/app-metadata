/// <reference path="../typings/index.d.ts"/>
import { Extract } from "./extract";
import * as Bluebird from 'bluebird';
import * as fse from 'fs-extra';
import { Logger } from './logger';

const util = require('util');
const fs = require('fs');
global.Promise = <any>Bluebird;

var pathName; 
var skeletonLogging = require('@skeleton/skeleton-logging');
const transports = new skeletonLogging.Transports();
transports.console = { silent: false, level: 'silly', colorize: true, timestamp: true };
skeletonLogging.LoggerBootstrap.configureDefault(transports, "Extractor");
skeletonLogging.LoggerBootstrap.updateWinstonToUseRealConsoleLog();

// this file is used for testing purposes only 

if(process.argv.length > 2) {
  pathName = process.argv[2];
}
Extract.run(pathName)
.then( (p) => {
  Logger.silly(`\nfinished bundle - ${util.inspect(p)}`);
  // TODO demo
  fs.writeFile('logo.png', p.icon, function(err){
      if (err) {
        throw err;
      }
      Logger.silly('File saved.');
  });
})
.catch((err) => {
  Bluebird.resolve();
});





