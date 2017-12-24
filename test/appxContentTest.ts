import * as should from 'should';
var copydir = require('copy-dir');
var shortid = require('shortid');
import { ExtractError } from "../src/extractError";
import { AppxContent }  from "../src/appxContent";

describe("AppxContent", () => {
    describe("#read", () => {
        context('when unzipped Appx has no manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxContent();
                return subject.read("test/assets/bike-payload", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to manifest is incorrect or non-existent', () => {
            it("should throw error", async () => {
                const subject = new AppxContent();
                return subject.read("test/assets/bike-payload", ["assets/AppxManifest.xml"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('somehow invalid manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxContent();
                return subject.read("test/assets/bike-payload", ["fake-assets/AppxManifest.xml"]).should.be.rejectedWith(ExtractError);
            });
        });
        context("normal manifest collection", () => {
            const unzipPath = `test/temp/${shortid.generate()}/bike-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/bike-payload", unzipPath);
            });
            it("should extract params", async () => {
                const subject = new AppxContent();
                const manifestPath = "AppxManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.displayName).eql("Sunset Bike Racer");
                should(subject.executableName).eql("Sunset Racer.exe");
                should(subject.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.minimumOsVersion).eql("6.3.1");
                should(subject.buildVersion).eql("26.1.0.40");
                should(subject.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
        context("existing icon", () => {
            const subject = new AppxContent();
            const manifestPath = "AppxManifest.xml";
            const iconPath = "Assets/StoreLogo.scale-240.png";
            const unzipPath = `test/temp/${shortid.generate()}/bike-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/bike-payload", unzipPath);
            });

            it("should extract icon and icon name", async () => {
                await subject.read(unzipPath, [manifestPath, iconPath]);
                should(subject.iconName).eql("StoreLogo.scale-240.png");
                should(subject.iconFullPath).eql("Assets/StoreLogo.scale-240.png");
                should(subject.icon).not.eql(undefined);
            });
            it("should extract icon and not interfere with other collection", async () => {
                await subject.read(unzipPath, [manifestPath, iconPath]);
                should(subject.displayName).eql("Sunset Bike Racer");
                should(subject.executableName).eql("Sunset Racer.exe");
                should(subject.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.minimumOsVersion).eql("6.3.1");
                should(subject.buildVersion).eql("26.1.0.40");
                should(subject.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
        context("non-existent icon", () => {
            const unzipPath = `test/temp/${shortid.generate()}/bike-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/bike-payload", unzipPath);
            });
            it("shouldn't extract icon", async () => {
                const subject = new AppxContent();
                const manifestPath = "AppxManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.displayName).eql("Sunset Bike Racer");
                should(subject.executableName).eql("Sunset Racer.exe");
                should(subject.iconName).eql(undefined);
                should(subject.iconFullPath).eql(null);
                should(subject.icon).eql(undefined);
                should(subject.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.minimumOsVersion).eql("6.3.1");
                should(subject.buildVersion).eql("26.1.0.40");
                should(subject.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
        context("icon in manifest but without real or scaled versions", () => {
            const unzipPath = `test/temp/${shortid.generate()}/bike-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/bike-payload", unzipPath);
            });
            it("should continue without icon", async () => {
                const subject = new AppxContent();
                const manifestPath = "AppxManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.iconName).eql(undefined); 
                should(subject.icon).eql(undefined);
                should(subject.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.minimumOsVersion).eql("6.3.1");
                should(subject.buildVersion).eql("26.1.0.40");
                should(subject.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
    });
});