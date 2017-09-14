# Description

This library helps you retrieve the most frequently extracted metadata and icons within iOS, Android and UWP applications.

## Usage 


#### import
```
import { Extract } from 'app-metadata';
```
 
#### usage
```
let results = await Extract.run(pathName);
```
> This library relies on the standard set of file extensions to determine the type of package it is analyzing.

## Results 
The library will return the information most relevant for the supported platforms. For a better understanding of the details retrieved refer to the tables below.

### iOS
```
Supported extension: .ipa
```
| Property        | Description           |
| ------------- |:--------------|
| icon      |  |
| iconName      |       |
| languages | Array of language strings compiled from .lproj files      |
| hasProvisioning | Should always be true since IPA will contain a provisioning profile      |
| appex_provisioning_profiles | Array of all other provisioning profiles included in the metadata      |

- ##### from Plist (info.plist):

| Property        | Description           |
| ------------- |:--------------|
| displayName |CFBundleDisplayName (The user-visible name of the bundle) or CFBundleName (short bundle name)  |
| CFBundleDisplayName      |CFBundleIdentifier (reverse DNS that identifies a project by concatenating the company identifier with the product name)       |
| uniqueIdentifier | CFBundleShortVersionString (The release-version-number string for the bundle)|
| version | Should always be true since IPA will contain a provisioning profile      |
| buildVersion | CFBundleVersion (The build-version-number string for the bundle) |
| executableName | CFBundleExecutable (Name of the bundle’s executable file) |
| minimumOsVersion | MinimumOSVersion or LSMinimumSystemVersion |
| deviceFamily | UIdeviceFamily  |

- ##### from Provisioning Profile (embedded.mobileprovision):

| Property        | Description           |
| ------------- |:--------------|
| pathName      | Path of the provisioning profile from inside of the IPA  |
| mobileProvisionFileContent      |Provisioning profile content       |
| teamIdentifier      |Entitlements["com.apple.developer.team-identifier"]  |
| profileType      | If data.ProvisionedDevices exists, "adhoc". Otherwise "enterprise"       |
| expiredAt      | expired_at or ExpirationDate  |
| idName      | AppIDName       |
| name      | Name |
| UniqueDeviceIdentifierList      |  ProvisionedDevices      |
| deviceFamily      | Platform |


### Android
```
Supported extension: .apk
```

- ##### from Manifest:

| Property        | Description           |
| ------------- |:--------------|
| icon      |  |
| iconName      |       |
| uniqueIdentifier      |package   |
| version      | versionName       |
| buildVersion      |versionCode  |
| minimumOsVersion      | usesSdk.minSdkVersion      |
| deviceFamily      | "android"  |

### UWP 
```
Supported extensions: .appx, appxupload or .zip
```

##### from Manifest:

| Property        | Description           |
| ------------- |:--------------|
| deviceFamily      |Constants.WINDOWS  |
| displayName      | Package.Properties.DisplayName      |
| iconFullPath      | Package.Properties.Logo |
| uniqueIdentifier      | Package.Identity.Name       |
| buildVersion      |Package.Identity.Version  |
| minimumOsVersion      |Package.Prerequisites.OSMinVersion or Package.Dependencies.TargetDeviceFamily.MinVersion       |
| executableName      |Package.Applications.Application.Executable   |
| languages      | Built from Package.Resources.Resource.Language       |


### UWP Bundles
```
Supported extensions: .appxbundle, appxupload or .zip
```

> For .appxbundle app packages, the manifest is checked for the correct name of the appx subpackage. If it is found, the metadata is parsed directly from there, otherwise we scavenge for as much as we can get from the appxbundle manifest and metadata

| Property        | Description           |
| ------------- |:--------------|
| icon      |  |
| iconName      |       |
| iconAppx      | Name of the zipped file within the package that contains icons |
| languages      |Built from .appx language files. Example- VLC_WinRT.WindowsPhone_1.8.4.0_language-en.appx  |

##### from Manifest:

| Property        | Description           |
| ------------- |:--------------|
| deviceFamily      |windows  |
| uniqueIdentifier      |Bundle.Identity.Name       |
| buildVersion      |Bundle.Identity.Version  |
| minimumOsVersion      | Bundle.Prerequisites.OSMinVersion or Bundle.Dependencies.TargetDeviceFamily      |

The assumption for zip and appxUpload is that the unziped folders will have the appx or appxbundle which we will then process as we do normally

## Prerequisites ##

- Install [node](https://nodejs.org/) version [7.6.0](https://nodejs.org/dist/v0.12.7/x64/)

- Install project dependencies (based on `<REPO ROOT>/package.json`)
	```
    npm install
	```
- Install [typescript](http://www.typescriptlang.org/) via [npm](https://www.npmjs.com/package/npm) (`npm` will be installed with `node`)
	```
	npm install -g typescript@2.3.4
	```
- Install [gulp](https://www.npmjs.com/package/gulp) via [npm](https://www.npmjs.com/package/npm)
	```
	npm install -g gulp@3.9
	```
- Upgrade [npm](https://www.npmjs.com/package/npm) to version `3.3.x`
	```
	npm install -g npm@5
	```
- Install the IDE
	- [Visual Studio Code](https://code.visualstudio.com/)
	
## Contributing ##

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

- Ensure that it builds
	- Via `gulp`
		```
		cd <REPO ROOT>
		gulp build
		```	
- Ensure that tests pass
	- Via `gulp`
		```
		cd <REPO ROOT>
		gulp test
		```

## Developing on OS X ##

- Visual Studio Code

	- Point `Visual Studio Code` to the repo root
	- Install project dependencies 
		- via `npm` on the command line
			```
			cd <REPO ROOT>
			npm install 
			```
	- Build (`Cmd-Shift-B`)
	- Run (`F5`)
	- Testing
		- via `Visual Studio Code` (`Cmd-Shift-T`)
		- via `gulp` on the command line
			```
			cd <REPO ROOT>
			gulp test
			```
			
