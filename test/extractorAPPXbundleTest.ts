/// <reference path="../typings/index.d.ts" />
import { Extract } from "../src/extract";
import { ExtractError } from "../src/extractError";
import { AppxBundleContent }  from "../src/contentAppxBundle";

import * as mocha from 'mocha';
import * as Sinon from 'sinon';
import * as uuid from 'uuid';
import * as util from 'util';
import * as td from 'testdouble';
import * as should from 'should';
import * as fs from 'fs';

describe("#AppxBundleContent", () => {
    describe("#read", () => {
        context('when unzipped AppxBundle has no manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxBundleContent();
                return subject.read("test/assets/calc-payload", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to manifest is incorrect or nonexistant', () => {
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
                const unzipPath = "test/assets/calc-payload";
                const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
                const languageDe = "Calculator2.WindowsPhone_2016.1003.2147.0_language-de.appx";
                const languageZhHans = "Calculator2.WindowsPhone_2016.1003.2147.0_language-zh-hans.appx";
                await subject.read(unzipPath, [manifestPath, languageDe, languageZhHans]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.deviceFamily).eql("Windows");
                should(subject.languages).eql(["de", "zh-hans"]);
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
            });
        });
        context("existing icon", () => {
            const subject = new AppxBundleContent();
            const unzipPath = "test/assets/calc-payload";
            const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
            const iconpath = "Calculator2.WindowsPhone_2016.1003.2147.0_scale-180.appx";

            it("should extract icon and icon name", async () => {
                await subject.read(unzipPath, [manifestPath, iconpath]);
                should(subject.iconName).eql("storelogo.scale-180.png");
                should(subject.iconAppx).eql("Calculator2.WindowsPhone_2016.1003.2147.0_scale-180.appx");
                should(subject.icon).not.eql(undefined);
            });
            it("should extract icon and not interfere with other data collection", async () => {
                await subject.read(unzipPath, [manifestPath, iconpath]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
            });
        });
        context("non-existant icon", () => {
            it("shouldn't extract icon", async () => {
                const subject = new AppxBundleContent();
                const unzipPath = "test/assets/calc-payload";
                const manifestPath = "AppxMetadata/AppxBundleManifest.xml";
                await subject.read(unzipPath, [manifestPath]);
                should(subject.buildVersion).eql("2016.1003.2115.0");
                should(subject.uniqueIdentifier).eql("61908RichardWalters.Calculator");
                should(subject.iconName).eql(undefined);
                should(subject.iconFullPath).eql(undefined);
                should(subject.icon).eql(undefined);
            });
        });
    });
});
