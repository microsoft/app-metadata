# Description

This library will help you retrieve the most frequently extracted metadata and icons within an iOS, Android and UWP application.

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

IPA

| Property        | Description           |
| ------------- |:--------------|
| icon      |  |
| iconName      |       |
| languages | Array of language strings compiled from .lproj files      |
| hasProvisioning | Should always be true since IPA will contain a provisioning profile      |
| appex_provisioning_profiles | Array of all other provisioning profiles included in the metadata      |

- from Plist (info.plist):
```
displayName
CFBundleDisplayName
uniqueIdentifier
version
buildVersion
executableName
minimumOsVersion
deviceFamily
```
- from Provisioning Profile (embedded.mobileprovision):
```
pathName
mobileProvisionFileContent
teamIdentifier
profileType
expiredAt
idName
name
UniqueDeviceIdentifierList
deviceFamily
```

APK
- from Manifest:
```
iconName
icon
uniqueIdentifier
version
buildVersion
minimumOsVersion
deviceFamily
```

APPX - either uploaded with .appx, appxupload or .zip extension
- from Manifest:
```
deviceFamily
displayName
iconFullPath
uniqueIdentifier
buildVersion
minimumOsVersion
executableName 
languages
```


APPXBundle - either uploaded with .appxbundle, appxupload or .zip extension
for .appxbundle app packages, the manifest is checked for the correct name of the appx subpackage.
	if it is found, the metadata is parsed directly from there, otherwise you scavenge for as much as you can get from the appxbundle manifest and metadata
```
iconAppx = the name of the zipped file within the package that contains icons
icon and iconName speak for themselves
languages = built from .appx language files. Example- VLC_WinRT.WindowsPhone_1.8.4.0_language-en.appx
```
- from Manifest:
```
deviceFamily = "windows"
uniqueIdentifier =  Bundle.Identity.Name
buildVersion =  Bundle.Identity.Version
minimumOsVersion = Bundle.Prerequisites.OSMinVersion || Bundle.Dependencies.TargetDeviceFamily
```

The assumption for zip and appxUpload is that the unziped folders will have the appx or appxbundle which we will then process as we do normally

## Prerequisites ##

- Install [node](https://nodejs.org/) version [5.11.0](https://nodejs.org/dist/v0.12.7/x64/)

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
	npm install -g npm@3.3
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

- If it's
	- Larger than a bug fix - create a feature branch (`feature/<SOME NAME>`) and work on this branch. While on your feature branch you are free to use self-defined rules. When your feature is complete (coded _and_ tested) create a pull request for `develop`.
	
	- A bug fix - fix it on `develop`
	
	- Smaller than a bug fix - nope

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
- Pull requests to `develop` are required but require no aproval to merge. Use best judgement.

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
			
