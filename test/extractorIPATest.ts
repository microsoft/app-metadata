import * as should from 'should';
import { ExtractError } from "../src/extractError";
import { IpaContent }  from "../src/contentIPA";

describe("#IpaContent", () => {
    describe("#read", () => {
        context('when unzipped IPA is missing its plist', () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                return subject.read("test/assets/adhoc-signed-payload", ["Payload 15/Base.Iproj"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to plist is incorrect or non-existent', () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                return subject.read("Payload 15/Base.Iproj", ["Payload 15/Info.plist"]).should.be.rejectedWith(ExtractError);
            });
        });
        context('somehow invalid info.plist', () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                return subject.read("test/assets/adhoc-signed-payload", [")__MACOSX/Info.plist", "Payload 15/Base.Iproj"]).should.be.rejectedWith(ExtractError);
            });
        });
        context("normal plist collection", () => {
            it("should extract params", async () => {
                const subject = new IpaContent();
                const provision = "Payload 15/SoEntitled.app/Watch/WatchIt.app/embedded.mobileprovision";
                const unzipPath = "test/assets/adhoc-signed-payload";
                const plistPath = "Payload 15/Info.plist";
                await subject.read(unzipPath, [plistPath, provision]);
                should(subject.displayName).eql("SoEntitled");
                should(subject.uniqueIdentifier).eql("com.microsoft.SoEntitled");
                should(subject.version).eql("1.0");
                should(subject.buildVersion).eql("1");
                should(subject.executableName).eql("SoEntitled");
                should(subject.minimumOsVersion).eql("10.0");
                should(subject.deviceFamily).eql("iPhone/iPod/iPad");
            });
        });
        context("existing icon", () => {
            it("should extract icon and icon name", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/Bouncyhoops.app/Info.plist";;
                const icon = "Payload/Bouncyhoops.app/AppIcon72x72@2x~ipad.png";
                const provision = "embedded.mobileprovision";
                await subject.read(unzipPath, [plistPath, icon, provision]);
                should(subject.iconName).eql("AppIcon72x72@2x~ipad.png"); 
                should(subject.icon).not.eql(undefined);
            });
        });
        context("non-existent icon", () => {
            it("shouldn't extract icon", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/Bouncyhoops.app/Info.plist";;
                const provision = "embedded.mobileprovision";
                await subject.read(unzipPath, [plistPath, provision]);
                should(subject.iconName).eql(undefined); 
                should(subject.icon).eql(undefined);
            });
        });
        context("embedded.mobileprovision", () => {
            it("should extract provisioning profile", async () => {
                const subject = new IpaContent();
                const provision = "Payload 15/SoEntitled.app/Watch/WatchIt.app/embedded.mobileprovision";
                const unzipPath = "test/assets/adhoc-signed-payload";
                const plistPath = "Payload 15/Info.plist";
                await subject.read(unzipPath, [plistPath, provision]);
                should(subject.provision.teamIdentifier).eql("FYD86LA7RE");
                should(subject.provision.profileType).eql("adhoc");
                should(subject.provision.expiredAt.toString()).eql("Tue Jan 23 2018 17:02:18 GMT-0800 (PST)");
                should(subject.provision.idName).eql("CalabashWildcard");
                should(subject.provision.UniqueDeviceIdentifierList.length).eql(39);
                should(subject.provision.mobileProvisionFileContent);
            });
        });
        context("no provisioning profile", () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/Bouncyhoops.app/Info.plist";;
                const icon = "Payload/Bouncyhoops.app/AppIcon72x72@2x~ipad.png";
                return subject.read(unzipPath, [plistPath, icon]).should.be.rejectedWith(ExtractError);
            });
        });
        context("invalid provisioning profile path", () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/Bouncyhoops.app/Info.plist";;
                const icon = "Payload/Bouncyhoops.app/AppIcon72x72@2x~ipad.png";
                return subject.read(unzipPath, [plistPath, icon]).should.be.rejectedWith(ExtractError);
            });
        });
    });
});