/// <reference path="../typings/index.d.ts" />
import { Extract } from "../src/extract";
import { ExtractError } from "../src/extractError";
import { AppxContent }  from "../src/contentAPPX";

import * as mocha from 'mocha';
import * as Sinon from 'sinon';
import * as uuid from 'uuid';
import * as util from 'util';
import * as td from 'testdouble';
import * as should from 'should';
import * as fs from 'fs';

describe("#AppxContent", () => {
    describe("#read", () => {
        context('when unzipped Appx has no manifest', () => {
            it("should throw error", async () => {
                const subject = new AppxContent();
                return subject.read("test/assets/bike-payload", []).should.be.rejectedWith(ExtractError);
            });
        });
        context('when path to manifest is incorrect or nonexistant', () => {
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
            it("should extract params", async () => {
                const subject = new AppxContent();
                const unzipPath = "test/assets/bike-payload";
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
            const unzipPath = "test/assets/bike-payload";
            const manifestPath = "AppxManifest.xml";
            const iconpath = "Assets/StoreLogo.scale-240.png";

            it("should extract icon and icon name", async () => {
                await subject.read(unzipPath, [manifestPath, iconpath]);
                should(subject.iconName).eql("StoreLogo.scale-240.png");
                should(subject.iconFullPath).eql("Assets/StoreLogo.scale-240.png");
                should(subject.icon).not.eql(undefined);
            });
            it("should extract icon and not interfere with other collection", async () => {
                await subject.read(unzipPath, [manifestPath, iconpath]);
                should(subject.displayName).eql("Sunset Bike Racer");
                should(subject.executableName).eql("Sunset Racer.exe");
                should(subject.languages).eql(["en", "de", "fr", "pt", "es"]);
                should(subject.minimumOsVersion).eql("6.3.1");
                should(subject.buildVersion).eql("26.1.0.40");
                should(subject.uniqueIdentifier).eql("7659327F2E2D.SunsetBikeRacer");
            });
        });
        context("non-existant icon", () => {
            it("shouldn't extract icon", async () => {
                const subject = new AppxContent();
                const unzipPath = "test/assets/bike-payload";
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
            it("should continue without icon", async () => {
                const subject = new AppxContent();
                const unzipPath = "test/assets/bike-payload";
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