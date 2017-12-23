export type ProfileType = "adhoc" | "enterprise" | "other";

export interface IProvisioningProfile {
    idName: string;
    name: string;
    teamIdentifier: string;
    profileType: ProfileType;
    expiredAt: Date;
    mobileProvisionFileContent: string;
    UniqueDeviceIdentifierList: string;
    pathName: string;
}

export interface IContent {
    originalFileName: string;
    displayName: string;
    name: string;
    version: string; 
    buildVersion: string;
    uniqueIdentifier: string; 
    minimumOsVersion: string;
    executableName: string;
    deviceFamily: any;
    languages: string[];
    iconFullPath: string;
    iconName: string;
    icon: ArrayBuffer;
    fingerprint: string;
    size: number;
    hasProvisioning: boolean;
}

export interface IIpaContent extends IContent {
    provision: IProvisioningProfile;
    appexProvisioningProfiles: IProvisioningProfile[];
}