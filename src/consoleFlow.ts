/**
 * A console app to test extraction. 
 * pre-requisite: 
 * ```
 * npm install
 * gulp build
 * ```
 * usage (from project's root): node ./out/src/consoleFlow.js <package's path>
 */ 

import * as Bluebird from 'bluebird';
import * as util from 'util';
import * as fs from 'fs-extra';
global.Promise = <any>Bluebird;

import { Extract } from "./extract";
import { Logger, LoggerBootstrap } from './logger';

class Program {
  packagePath: string;

  constructor() {
    LoggerBootstrap.updateWinstonToUseRealConsoleLog();
  }

  public processArgs() {
    if(process.argv.length !== 3) {
      Logger.info("Error: missing argument");
      Logger.info("usage (run from project's root): node ./out/src/consoleFlow.js <package's path>");
    } 

    this.packagePath = process.argv[2];
  }

  public async run() {
    if (!this.packagePath) {
      return;
    }

    try {
      const content = await Extract.run(this.packagePath);
      Logger.info('Finished Extraction.');
      Logger.info(`package information: ${util.inspect(content)}`);

      if (content.icon) {
        Logger.info('Saving icon to logo.png');
        await fs.writeFile('logo.png', content.icon);
        Logger.info('File saved.');
      }
    } catch (err) {
      Logger.error('Extraction Failed.');
      Logger.error(`${util.inspect(err)}`);
      return;
    }
  }
}

const program = new Program();
program.processArgs();
program.run()
  .then(() => {
    process.exit();
  });