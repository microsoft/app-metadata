import * as should from 'should';
var copydir = require('copy-dir');
var shortid = require('shortid');
import { ExtractError } from "../src/extractError";
import { AppxBundleContent }  from "../src/appxBundleContent";


describe("AppxBundleContent", () => {
    describe("#read", () => {
        context('when unzipped AppxBundle has no manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxBundleContent();
                return subject.read("test/assets/calc-payload", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to manifest is incorrect or non-existent', () => {
            it("should throw error", async () => {
                const subject = new AppxBundleContent();
                return subject.read("test/assets/calc-payload", ["package-payload/META-INF/AppxBundleManifest.xml"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('somehow invalid manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxBundleContent();
                return subject.read("test/assets/calc-payload", ["AppxBundleManifest.xml"]).should.be.rejectedWith(ExtractError);
            });
        });
        context("manifest collection with included languages", () => {
            it("should extract params", async () => {
                const subject = new AppxBundleContent();
                const unzipPath = `test/temp/${shortid.generate()}/calc-payload`;
                copydir.sync("test/assets/calc-payload", unzipPath);
                const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
                const languageDefault = "Calculator2.WindowsPhone_2016.1003.2147.0_ARM.appx";
                const languageDe = "Calculator2.WindowsPhone_2016.1003.2147.0_language-de.appx";
                const languageZhHans = "Calculator2.WindowsPhone_2016.1003.2147.0_language-zh-hans.appx";
                await subject.read(unzipPath, [manifestPath, languageDefault, languageDe, languageZhHans]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.deviceFamily).eql("Windows");
                should(subject.languages).eql(["de", "zh-hans"]);
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
            });
        });
        context("existing icon", () => {
            const subject = new AppxBundleContent();
            const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
            const iconDefault = "Calculator2.WindowsPhone_2016.1003.2147.0_ARM.appx";
            const iconPath = "Calculator2.WindowsPhone_2016.1003.2147.0_scale-180.appx";
            const unzipPath = `test/temp/${shortid.generate()}/calc-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/calc-payload", unzipPath);
            });
            it("should extract icon and icon name", async () => {
                await subject.read(unzipPath, [manifestPath, iconDefault, iconPath]);
                should(subject.iconName).eql("StoreLogo.scale-180.png");                
                should(subject.iconAppx).eql("Calculator2.WindowsPhone_2016.1003.2147.0_scale-180.appx");
                should(subject.icon).not.eql(undefined);
            });
            it("should extract icon and not interfere with other data collection", async () => {
                await subject.read(unzipPath, [manifestPath, iconDefault, iconPath]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
            });
        });
        context("non-existent icon", () => {
            const unzipPath = `test/temp/${shortid.generate()}/calc-payload`;
            beforeEach(() => {
                copydir.sync("test/assets/calc-payload", unzipPath);
            });
            it("shouldn't extract icon", async () => {
                const subject = new AppxBundleContent();
                const defaultAppx = "Calculator2.WindowsPhone_2016.1003.2147.0_ARM.appx";
                const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
                await subject.read(unzipPath, [manifestPath, defaultAppx]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
                should(subject.iconName).eql(undefined);
                should(subject.iconFullPath).eql(undefined);
                should(subject.icon).eql(undefined);
            });
        });
    });
});
