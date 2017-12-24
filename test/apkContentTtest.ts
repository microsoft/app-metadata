import * as should from 'should';
import { ApkContent }  from "../src/apkContent";
import { ExtractError } from "../src/extractError";

describe("ApkContent", () => {
    describe("#read", () => {
        context('when unzipped Apk is missing its manifest', () => {
            it("should throw error", async () => {
                const subject = new ApkContent();
                return subject.read("test/assets/package-payload", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to manifest is incorrect or non-existent', () => {
            it("should throw error", async () => {
                const subject = new ApkContent();
                return subject.read("test/assets/package-payload", ["META-INF/AndroidManifest.xml"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('somehow invalid manifest', () => {
            it("should throw error", async () => {
                const subject = new ApkContent();
                return subject.read("test/assets/package-payload", ["res/AndroidManifest.xml"]).should.be.rejectedWith(Error);
            });
        });
        context("normal manifest collection", () => {
            it("should extract params", async () => {
                const subject = new ApkContent();
                const unzipPath = "test/assets/package-payload";
                const manifestPath = "AndroidManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.uniqueIdentifier).eql("com.hockeyapp.hockeydevapp");
                should(subject.version).eql("1.1.0");
                should(subject.buildVersion).eql(5);
                should(subject.minimumOsVersion).eql(15);
                should(subject.deviceFamily).eql("Android");
            });
        });
        context("existing icon", () => {
            it("should extract icon and icon name", async () => {
                const subject = new ApkContent();
                const unzipPath = "test/assets/package-payload";
                const manifestPath = "AndroidManifest.xml";
                const iconPath = "res/mipmap-hdpi-v4/app_icon.png";
                await subject.read(unzipPath, [manifestPath, iconPath]);
                should(subject.iconName).eql("app_icon.png"); 
                should(subject.icon).not.eql(undefined);
            });
        });
        context("non-existent icon", () => {
            it("shouldn't extract icon", async () => {
                const subject = new ApkContent();
                const unzipPath = "test/assets/package-payload";
                const manifestPath = "AndroidManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.iconName).eql(undefined); 
                should(subject.icon).eql(undefined);
                should(subject.uniqueIdentifier).eql("com.hockeyapp.hockeydevapp");
                should(subject.version).eql("1.1.0");
                should(subject.buildVersion).eql(5);
                should(subject.minimumOsVersion).eql(15);
                should(subject.deviceFamily).eql("Android");
            });
        });
        context("icon exists but wasn't unzipped", () => {
            it("should continue without icon", async () => {
                const subject = new ApkContent();
                const unzipPath = "test/assets/package-payload";
                const manifestPath = "AndroidManifest.xml";
                const iconPath = "res/mipmap-mdpi-v4/app_icon.png";
                await subject.read(unzipPath, [manifestPath, iconPath]);
                should(subject.iconName).eql(undefined); 
                should(subject.icon).eql(undefined);
                should(subject.uniqueIdentifier).eql("com.hockeyapp.hockeydevapp");
                should(subject.version).eql("1.1.0");
                should(subject.buildVersion).eql(5);
                should(subject.minimumOsVersion).eql(15);
                should(subject.deviceFamily).eql("Android");
            });
        });
    });
});