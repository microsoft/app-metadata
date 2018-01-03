export class Constants {
    public static APK = "apk";
    public static IPA = "ipa";
    public static APPX = "appx";
    public static APPXBUNDLE = "appxbundle";
    public static APPXUPLOAD = "appxupload";
    public static ZIP = "zip";
    public static DMG = "dmg";
    public static PROVISION_START = "<?xml version";
    public static PROVISION_END = "</plist>";
    public static INFO_PLIST = "info.plist";
    public static ANDROID = "Android";
    public static WINDOWS = "Windows";
    public static ANDROID_MANIFEST = "AndroidManifest.xml";
    public static APPX_MANIFEST = "AppxManifest.xml";
    public static APPX_BUNDLE_MANIFEST ="AppxBundleManifest.xml";
    public static ITUNES_PLIST = "iTunesMetadata.plist";
    public static PROVISIONING = "embedded.mobileprovision";
    public static IOS_FILES = ["icon", "logo", Constants.INFO_PLIST, "2x", "3x", "provision", "embedded", Constants.ITUNES_PLIST.toLowerCase(), "default"];
    public static GENERAL_FILES = ["icon", "logo", "manifest", ".png"];
    public static APPX_FILES = ["icon", "logo", "manifest", ".appx", ".png"];
    public static UWP_EXTENSIONS = [".zip", ".appx", ".appxbundle", ".appxupload"];
}
