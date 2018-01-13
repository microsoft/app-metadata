export declare class Extract {
    public static run(filePath: string): Promise<IPackageMetadata>;
}

export declare class ExtractError extends Error {
    constructor(message: string);
}

export type ProfileType = "adhoc" | "enterprise" | "other";

export interface IProvisioningProfile {
    idName: string;
    name: string;
    teamIdentifier: string;
    profileType: ProfileType;
    expiredAt: Date;
    mobileProvisionFileContent: string;
    UniqueDeviceIdentifierList: string[];
    absolutePath: string;
}

export interface IPackageMetadata {
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

export interface IIPAMetadata extends IPackageMetadata {
    /** The IPA's provisioning profile. */
    provision: IProvisioningProfile;
    
    /** Provisioning profiles for application extensions  */
    appexProvisioningProfiles: IProvisioningProfile[];
    
    /** Full path to the binary file in the IPA */
    executableFullPath: string;
}