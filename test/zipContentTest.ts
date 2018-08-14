import * as should from 'should';
var copydir = require('copy-dir');
var shortid = require('shortid');
import { ExtractError } from "../src/extractError";
import { ZipContent }  from "../src/zipContent";

describe("ZipContent", () => {
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
            const unzipPath = `test/temp/${shortid.generate()}/UwpApp_1`;
            beforeEach(() => {
                copydir.sync("test/assets/UwpApp_1", unzipPath);
            });
            it("should extract", async () => {
                const subject = new ZipContent();
                await subject.read(unzipPath, ["Sunset-Bike.appx", "Dependencies/Microsoft.VCLibs.x64.14.00.appx"]);
                should(subject.subPackage.displayName).eql("Sunset Bike Racer");
                should(subject.subPackage.executableName).eql("Sunset Racer.exe");
                should(subject.subPackage.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.subPackage.minimumOsVersion).eql("6.3.1");
                should(subject.subPackage.buildVersion).eql("26.1.0.40");
                should(subject.subPackage.version).eql("");
                should(subject.subPackage.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
        context('zip contains appxbundle subpackage', () => {
            const unzipPath = `test/temp/${shortid.generate()}/UwpApp_1`;
            beforeEach(() => {
                copydir.sync("test/assets/UwpApp_1", unzipPath);
            });
            it("should extract", async () => {
                const subject = new ZipContent();
                const packagePath = "UwpApp_1.1.2.0_x86_x64_arm.appxbundle";
                const extraPath = "Dependencies/Microsoft.VCLibs.x64.14.00.appx";
                await subject.read(unzipPath, [packagePath, extraPath]);
            });
        });
        context('zip contains msix subpackage', () => {
            const unzipPath = `test/temp/${shortid.generate()}/UwpApp_1`;
            beforeEach(() => {
                copydir.sync("test/assets/UwpApp_1", unzipPath);
            });
            it("should extract", async () => {
                const subject = new ZipContent();
                await subject.read(unzipPath, ["test_x86.msix", "Dependencies/Microsoft.VCLibs.x64.14.00.appx"]);
                should(subject.subPackage.displayName).eql("TestApp");
                should(subject.subPackage.executableName).eql("TestApp.exe");
                should(subject.subPackage.languages).eql(["en-us"]);
                should(subject.subPackage.minimumOsVersion).eql("10.0.17135.0");
                should(subject.subPackage.buildVersion).eql("1.0.0.0");
                should(subject.subPackage.version).eql("");
                should(subject.subPackage.uniqueIdentifier).eql("72dd8124-f57b-4118-8b47-9900db69752c");
            });
        });
        context('zip contains msixbundle subpackage', () => {
            const unzipPath = `test/temp/${shortid.generate()}/UwpApp_1`;
            beforeEach(() => {
                copydir.sync("test/assets/UwpApp_1", unzipPath);
            });
            it("should extract", async () => {
                const subject = new ZipContent();
                const packagePath = "test.msixbundle";
                const extraPath = "Dependencies/Microsoft.VCLibs.x64.14.00.appx";
                await subject.read(unzipPath, [packagePath, extraPath]);
            });
        });
    });
});