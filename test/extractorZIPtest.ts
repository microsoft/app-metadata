/// <reference path="../typings/index.d.ts" />
import { Extract } from "../src/extract";
import { ExtractError } from "../src/extractError";
import { ZipContent }  from "../src/contentZIP";

import * as mocha from 'mocha';
import * as Sinon from 'sinon';
import * as uuid from 'uuid';
import * as util from 'util';
import * as td from 'testdouble';
import * as should from 'should';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

describe("#ZipContent", () => {
    describe("#read", () => {
        context('when zip missing unzipped subpackage', () => {
            it("should throw error", async () => {
                const subject = new ZipContent();
                return subject.read("test/assets/UwpApp_1", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when zip missing unzipped subpackage, but has a different appx in a deeper path', () => {
            it("should throw error", async () => {
                const subject = new ZipContent();
                return subject.read("test/assets/UwpApp_1", ["Add-AppDevPackage.ps1", "Dependencies/Microsoft.VCLibs.x64.14.00.appx"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('when unzipped zip has subpackage with incorrect type', () => {
            it("should throw error", async () => {
                const subject = new ZipContent();
                return subject.read("test/assets/UwpApp_1", ["UwpApp_1.1.2.0_x64.apk"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('zip contains appx subpackage', () => {
            it("should extract", async () => {
                const subject = new ZipContent();
                await subject.read("test/assets/UwpApp_1", ["Sunset-Bike.appx", "Dependencies/Microsoft.VCLibs.x64.14.00.appx"]);
                should(subject.subPackage.displayName).eql("Sunset Bike Racer");
                should(subject.subPackage.executableName).eql("Sunset Racer.exe");
                should(subject.subPackage.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.subPackage.minimumOsVersion).eql("6.3.1");
                should(subject.subPackage.buildVersion).eql("26.1.0.40");
                should(subject.subPackage.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
                rimraf("test/assets/UwpApp_1/" + 'AppxManifest.xml', () => {});
                rimraf("test/assets/UwpApp_1/" + 'Assets', () => {});
            });
        });
        context('zip contains appxbundle subpackage', () => {
            it("should extract", async () => {
                const subject = new ZipContent();
                const unzipPath = "test/assets/UwpApp_1/";
                const packagePath = "UwpApp_1.1.2.0_x86_x64_arm.appxbundle";
                const extraPath = "Dependencies/Microsoft.VCLibs.x64.14.00.appx";
                await subject.read(unzipPath, [packagePath, extraPath]);
                rimraf(unzipPath + 'Assets', () => {});
            });
        });
    });
});