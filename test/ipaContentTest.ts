import * as should from 'should';
import { ExtractError } from "../src/extractError";
import { IpaContent }  from "../src/ipaContent";
import { WorkingFolder } from '../src/workingFolder';
import * as fse from 'fs-extra';

describe("IpaContent", () => {
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
                await subject.extract('test/assets/smileToUnlock-adhoc-signed.ipa', await WorkingFolder.create());
                should(subject.displayName).eql('SmileToUnlockExample');
                should(subject.uniqueIdentifier).eql('izikl.SmileToUnlock');
                should(subject.version).eql("1.0");
                should(subject.buildVersion).eql("1");
                should(subject.executableName).eql("SmileToUnlockExample");
                should(fse.existsSync(subject.executableFullPath)).be.true;
                should(subject.minimumOsVersion).eql("11.1");
                should(subject.deviceFamily).eql("iPhone/iPod/iPad");
            });
        });
        context("existing icon", () => {
            it("should extract icon and icon name", async () => {
                const subject = new IpaContent();
                await subject.extract('test/assets/smileToUnlock-adhoc-signed.ipa', await WorkingFolder.create());
                should(subject.iconName).eql("AppIcon76x76@2x~ipad.png"); 
                should(subject.icon).not.eql(undefined);
            });
        });
        context("non-existent icon", () => {
            it("shouldn't extract icon", async () => {
                const subject = new IpaContent();
                await subject.extract('test/assets/smileToUnlock-adhoc-signed-no-icon.ipa', await WorkingFolder.create());
                should(subject.iconName).eql(undefined); 
                should(subject.icon).eql(undefined);
            });
        });
        context("embedded.mobileprovision", () => {
            it("should extract provisioning profile", async () => {
                const subject = new IpaContent();
                await subject.extract('test/assets/smileToUnlock-adhoc-signed.ipa', await WorkingFolder.create());
                should(subject.provision.teamIdentifier).eql("L47QS6HV2U");
                should(subject.provision.profileType).eql("adhoc");
                should(subject.provision.expiredAt).eql(new Date('2018-11-28T23:46:08.000Z'));
                should(subject.provision.idName).eql("izikl-SmileToUnlock");
                should(subject.provision.UniqueDeviceIdentifierList.length).eql(1);
                should(subject.provision.mobileProvisionFileContent).not.empty;
            });
        });
        context("no provisioning profile", () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/bouncyhoops.app/Info.plist";;
                const icon = "Payload/bouncyhoops.app/AppIcon72x72@2x~ipad.png";
                return subject.read(unzipPath, [plistPath, icon])
                    .should.be.rejectedWith(ExtractError, /cannot find the provisioning profile/g);
            });
        });
        context("invalid provisioning profile path", () => {
            it("should throw error", async () => {
                const subject = new IpaContent();
                const unzipPath = "test/assets/basketball-payload";
                const plistPath = "Payload/bouncyhoops.app/Info.plist";;
                const icon = "Payload/bouncyhoops.app/AppIcon72x72@2x~ipad.png";
                return subject.read(unzipPath, [plistPath, icon]).should.be.rejectedWith(ExtractError);
            });
        });
    });
});