const fs = require('fs');
const path = require('path');
const plist = require('plist');

const tenantName = process.argv[2];
const successSymbol = '🚀 ';
const errorSymbol = '❌ ';
const doneSymbol = '✅ ';

// Utility function to copy folders
function copyFolderSync(src, dest, cleanTarget) {
  if (cleanTarget && fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
  } else if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath, cleanTarget);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

/**
 * Increment semantic version and version code
 * @param {string} versionName e.g. "0.2.3"
 * @param {number|string} versionCode e.g. 75
 */
function incrementVersion(versionName = '1.0.0', versionCode = 1) {
  // 🔒 Ensure versionCode is a valid number
  const safeCode = Number.parseInt(versionCode, 10);
  const finalCode = Number.isFinite(safeCode) ? safeCode : 1;

  let [major, minor, patch] = (versionName || '1.0.0')
    .toString()
    .split('.')
    .map(v => Number.parseInt(v, 10) || 0);

  patch += 1;
  if (patch > 9) {
    patch = 0;
    minor += 1;
    if (minor > 9) {
      minor = 0;
      major += 1;
    }
  }

  return {
    newVersionName: `${major}.${minor}.${patch}`,
    newVersionCode: finalCode + 1,
  };
}

if (!tenantName) {
  console.error(errorSymbol + 'Please provide a tenant folder name.');
  process.exit(1);
}

const projectRoot = process.cwd();
const tenantFolder = path.join(projectRoot, 'tenants', tenantName);
const tenantInfoPath = path.join(tenantFolder, 'tenantInfo.json');

if (!fs.existsSync(tenantFolder)) {
  console.error(
    errorSymbol + `Tenant folder '${tenantFolder}' does not exist.`,
  );
  process.exit(1);
}

if (!fs.existsSync(tenantInfoPath)) {
  console.error(
    errorSymbol + `tenantInfo.json file not found in '${tenantFolder}'.`,
  );
  process.exit(1);
}

// Tenant Info File  --- START
const tenantInfoDest = path.join(projectRoot, 'src', 'tenantInfo.ts');

// Read tenantInfo.json (already done earlier)
const tenantInfo = JSON.parse(fs.readFileSync(tenantInfoPath, 'utf8'));

// 👉 Run rename before proceeding
const { execSync } = require('child_process');

try {
  const renameCommand = `npx react-native-rename@latest "${tenantInfo.AppName}" --iosBundleID "${tenantInfo.BundleId}" --skipGitStatusCheck`;
  console.log(`Running: ${renameCommand}`);
  execSync(renameCommand, { stdio: 'inherit' });
  console.warn(
    successSymbol +
      `Project renamed to '${tenantInfo.AppName}' with bundle ID '${tenantInfo.BundleId}'.`,
  );
} catch (error) {
  console.error(
    errorSymbol + 'Failed to rename project using react-native-rename.',
  );
  console.error(error.message);
  process.exit(1);
}

// Create the TypeScript content
const tsContent =
  '// This file is auto-generated. Do not edit directly.\n\n' +
  'export const TenantInfo = ' +
  JSON.stringify(tenantInfo, null, 2) +
  ';\n';

console.log('Replacing Tenant Info file...');
// Write the content to tenantInfo.ts
fs.writeFileSync(tenantInfoDest, tsContent, 'utf8');

console.warn(
  successSymbol + `Tenant Info Configuration done for '${tenantFolder}'.`,
);
// Tenant Info File  --- END

// ------------------------------------
// 🔢 CENTRAL VERSION BUMP
// ------------------------------------
const { newVersionName: IosNewVersionName, newVersionCode: IosNewVersionCode } =
  incrementVersion(tenantInfo.IosVersionName, tenantInfo.IosVersionCode);

const {
  newVersionName: AndroidNewVersionName,
  newVersionCode: AndroidNewVersionCode,
} = incrementVersion(
  tenantInfo.AndroidVersionName,
  tenantInfo.AndroidVersionCode,
);

console.log(successSymbol + `IOS Version bump preview:`);
console.log(
  `IOS Version Name: ${tenantInfo.IosVersionName} → ${IosNewVersionName}`,
);
console.log(`IOS Code: ${tenantInfo.IosVersionCode} → ${IosNewVersionCode}`);

console.log(successSymbol + `Android Version bump preview:`);
console.log(
  `Android Version Name: ${tenantInfo.AndroidVersionName} → ${AndroidNewVersionName}`,
);
console.log(
  `Android Code: ${tenantInfo.AndroidVersionCode} → ${AndroidNewVersionCode}`,
);

// Sync both platforms
tenantInfo.IosVersionName = IosNewVersionName;
tenantInfo.IosVersionCode = IosNewVersionCode;
tenantInfo.AndroidVersionName = AndroidNewVersionName;
tenantInfo.AndroidVersionCode = AndroidNewVersionCode;

// Version bump --- END

// Android Res Folder --- START
const androidResSrc = path.join(tenantFolder, 'res');
const androidResDest = path.join(
  projectRoot,
  'android',
  'app',
  'src',
  'main',
  'res',
);

// Copy Android res folder
console.log('Copying Android res folder...');
//copyFolderSync(androidResSrc, androidResDest, true);
[
  'drawable',
  'drawable-hdpi',
  'drawable-mdpi',
  'drawable-xhdpi',
  'drawable-xxhdpi',
  'drawable-xxxhdpi',
  'mipmap',
  'mipmap-hdpi',
  'mipmap-mdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
].forEach(folder => {
  const srcFolder = path.join(androidResSrc, folder);
  const destFolder = path.join(androidResDest, folder);
  if (fs.existsSync(srcFolder)) {
    copyFolderSync(srcFolder, destFolder, true);
    console.log(successSymbol + `Copied ${folder}`);
  }
});
console.warn(successSymbol + `Res folder copied for '${tenantFolder}'.`);

// Android Res Folder --- END

// google-service.json  --- START
const googleServicesJsonSrc = path.join(tenantFolder, 'google-services.json');
const googleServicesJsonDest = path.join(
  projectRoot,
  'android',
  'app',
  'google-services.json',
);

// Copy google-services.json file
console.log('Copying google-services.json file...');
fs.copyFileSync(googleServicesJsonSrc, googleServicesJsonDest);
console.warn(
  successSymbol + `Google services for android copied for '${tenantFolder}'.`,
);

// google-service.json  --- END

// googleservice-info.plist  --- START
const iosGoogleServicePlistSrc = path.join(
  tenantFolder,
  'GoogleService-Info.plist',
);
const iosGoogleServicePlistDest = path.join(
  projectRoot,
  'ios',
  tenantName,
  'GoogleService-Info.plist',
);

// Copy GoogleService-Info.plist file
console.log('Copying GoogleService-Info.plist file...');
fs.copyFileSync(iosGoogleServicePlistSrc, iosGoogleServicePlistDest);
console.warn(
  successSymbol + `Google services for ios copied for '${tenantFolder}'.`,
);
// googleservice-info.plist  --- END

// Ios app icon  --- START
const iosImagesSrc = path.join(tenantFolder, 'Images.xcassets');
const iosImagesDest = path.join(
  projectRoot,
  'ios',
  tenantName,
  'Images.xcassets',
);

// Copy Images.xcassets
console.log('Copying Images.xcassets...');
copyFolderSync(iosImagesSrc, iosImagesDest, true);
console.warn(successSymbol + `Ios icon copied for '${tenantFolder}'.`);

// Ios app icon  --- END

// Color folder  --- START
const colorSrc = path.join(tenantFolder, 'assets', 'colors');
const colorDest = path.join(projectRoot, 'src', 'theme', 'assets', 'colors');

console.log('Copying color folder...');
copyFolderSync(colorSrc, colorDest, false);
console.warn(
  successSymbol + `Color configuration copied for '${tenantFolder}'.`,
);

// Color folder  --- END

// Font folder  --- START
const fontSrc = path.join(tenantFolder, 'assets', 'fonts');
const fontDest = path.join(projectRoot, 'src', 'theme', 'assets', 'fonts');

console.log('Copying font folder...');
copyFolderSync(fontSrc, fontDest, true);
console.warn(
  successSymbol + `Font configuration copied for '${tenantFolder}'.`,
);

// Font folder  --- END

// Image folder  --- START
const imageSrc = path.join(tenantFolder, 'assets', 'images');
const imageDest = path.join(
  projectRoot,
  'src',
  'theme',
  'assets',
  'images',
  'images',
);

console.log('Copying Images folder...');
copyFolderSync(imageSrc, imageDest, false);
console.warn(
  successSymbol + `Image configuration copied for '${tenantFolder}'.`,
);

// Image folder  --- END

// Translation folder  --- START

const transaltionsSrc = path.join(tenantFolder, 'translations');
const transaltionsDest = path.join(
  projectRoot,
  'src',
  'translations',
  'tenantTranslations',
);

// Copy translation folder
console.log('Copying translations folder...');
copyFolderSync(transaltionsSrc, transaltionsDest, true);
console.warn(successSymbol + `Translations copied for '${tenantFolder}'.`);

// Translation folder  --- END

// Credentials folder  --- START

const credentialsSrc = path.join(tenantFolder, 'credentials');
const credentialsDest = path.join(projectRoot, 'fastlane');

// Copy credentials folder
console.log('Copying credentials folder...');
copyFolderSync(credentialsSrc, credentialsDest, false);
console.warn(successSymbol + `Credentials copied for '${tenantFolder}'.`);

// Credentials folder  --- END

// Package Name  --- START
const androidBuildGradle = path.join(
  projectRoot,
  'android',
  'app',
  'build.gradle',
);

// Update Android package name and app name
console.log('Updating Android package name and app name...');
const buildGradleContent = fs.readFileSync(androidBuildGradle, 'utf8');
const newBuildGradleContent = buildGradleContent
  .replace(
    /applicationId "[^"]+"/g,
    `applicationId "${tenantInfo.PackageName}"`,
  )
  .replace(
    /resValue "string", "app_name", "[^"]+"/g,
    `resValue "string", "app_name", "${tenantInfo.AppName}"`,
  )
  .replace(
    /buildConfigField "String", "app_name", "\\"[^"]*\\""/g,
    `buildConfigField "String", "app_name", "\\"${tenantInfo.AppName.replace(
      /\s+/g,
      '',
    )}\\""`,
  )
  .replace(/auth0Domain: "[^"]*"/g, `auth0Domain: "${tenantInfo.Auth0Domain}"`);

fs.writeFileSync(androidBuildGradle, newBuildGradleContent);

// Package Name  --- END

// App Name in settings.grdale  --- START
const androidSettingGradle = path.join(
  projectRoot,
  'android',
  'settings.gradle',
);

// Update Android package name and app name
console.log('Updating Android app name in settings.gradle...');
const seetingGradleContent = fs.readFileSync(androidSettingGradle, 'utf8');
const newSettingGradleContent = seetingGradleContent.replace(
  /rootProject\.name\s*=\s*".*"/,
  `rootProject.name = "${tenantInfo.AppName.replace(/\s+/g, '')}"`,
);

fs.writeFileSync(androidSettingGradle, newSettingGradleContent);

// App Name in settings.grdale  --- END

// Bundle ID  --- START
console.log('Updating iOS Info.plist...');
const iosInfoPlist = path.join(projectRoot, 'ios', tenantName, 'Info.plist');

const infoPlistContent = fs.readFileSync(iosInfoPlist, 'utf8');
const infoPlistObj = plist.parse(infoPlistContent);

infoPlistObj.CFBundleIdentifier = tenantInfo.BundleId;
infoPlistObj.CFBundleName = tenantInfo.AppName;
infoPlistObj.CFBundleDisplayName = tenantInfo.AppName;

if (infoPlistObj.CFBundleURLTypes) {
  for (let urlType of infoPlistObj.CFBundleURLTypes) {
    if (urlType.CFBundleURLName === 'auth0' && urlType.CFBundleURLSchemes) {
      urlType.CFBundleURLSchemes = [`${tenantInfo.BundleId}.auth0`];
      break;
    }
  }
}

// Dynamically load fonts from tenant's AppFont directory
const fontDirPath = path.join(projectRoot, 'tenants', tenantName, 'assets', 'fonts', 'AppFont');
let fontFiles = ['MaterialDesignIcons.ttf'];
if (fs.existsSync(fontDirPath)) {
  const files = fs.readdirSync(fontDirPath);
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const fontFilesFromDir = files
    .filter(file => fontExtensions.some(ext => file.toLowerCase().endsWith(ext)) && file !== '.DS_Store')
    .sort();
  fontFiles = ['MaterialDesignIcons.ttf', ...fontFilesFromDir];
}

if (infoPlistObj.UIAppFonts) {
  infoPlistObj.UIAppFonts = fontFiles;
}

const newInfoPlistContent = plist.build(infoPlistObj);
fs.writeFileSync(iosInfoPlist, newInfoPlistContent);

console.log('Updating iOS Info-Debug.plist...');
const iosInfoDebugPlist = path.join(
  projectRoot,
  'ios',
  tenantName,
  'Info-Debug.plist',
);

const infoDebugPlistContent = fs.readFileSync(iosInfoDebugPlist, 'utf8');
const infoDebugPlistObj = plist.parse(infoDebugPlistContent);

infoDebugPlistObj.CFBundleIdentifier = tenantInfo.BundleId;
infoDebugPlistObj.CFBundleName = tenantInfo.AppName;
infoDebugPlistObj.CFBundleDisplayName = tenantInfo.AppName;

if (infoDebugPlistObj.CFBundleURLTypes) {
  for (let urlType of infoDebugPlistObj.CFBundleURLTypes) {
    if (urlType.CFBundleURLName === 'auth0' && urlType.CFBundleURLSchemes) {
      urlType.CFBundleURLSchemes = [`${tenantInfo.BundleId}.auth0`];
      break;
    }
  }
}

if (infoDebugPlistObj.UIAppFonts) {
  infoDebugPlistObj.UIAppFonts = fontFiles;
}

const newInfoDebugPlistContent = plist.build(infoDebugPlistObj);
fs.writeFileSync(iosInfoDebugPlist, newInfoDebugPlistContent);

// Bundle ID  --- END

function updateJsonFile(filePath, keyPath, newValue) {
  const fullPath = path.resolve(__dirname, filePath);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  // Traverse to the parent of the final key
  let obj = json;
  for (let i = 0; i < keyPath.length - 1; i++) {
    const key = keyPath[i];
    if (!obj[key]) {
      obj[key] = {};
    }
    obj = obj[key];
  }

  const finalKey = keyPath[keyPath.length - 1];
  obj[finalKey] = newValue;

  fs.writeFileSync(fullPath, JSON.stringify(json, null, 2));
}

// Android Version change  --- START

// Update Android package name and app name
console.log('Updating Android version code and name...');
const buildGradleContentForVersion = fs.readFileSync(
  androidBuildGradle,
  'utf8',
);
const newBuildGradleContentForVersion = buildGradleContentForVersion
  .replace(
    /versionCode\s+\d+/,
    `versionCode ${parseInt(tenantInfo.AndroidVersionCode, 10)}`,
  )
  // 🔄 Update versionName
  .replace(
    /versionName\s+"[^"]+"/,
    `versionName "${tenantInfo.AndroidVersionName}"`,
  );

fs.writeFileSync(androidBuildGradle, newBuildGradleContentForVersion);

// Android version change --- END

const packageJson = path.join(projectRoot, 'package.json');
// Update package.json: "name"
updateJsonFile(
  packageJson,
  ['name'],
  tenantInfo.AppName.replace(/\s+/g, '').toLowerCase(),
);
console.log('Updating app name in package.json...');

const appJson = path.join(projectRoot, 'app.json');
// Update app.json: "name" and/or "expo.name"
updateJsonFile(appJson, ['name'], tenantInfo.AppName.replace(/\s+/g, ''));
updateJsonFile(
  appJson,
  ['displayName'],
  tenantInfo.AppName.replace(/\s+/g, ''),
);
console.log('Updating app name in app.json...');

if (process.platform == 'darwin') {
  try {
    const iosClean = `npm run ios:clean`;
    console.log(`Running: ${iosClean}`);
    execSync(iosClean, { stdio: 'inherit' });
    console.warn(successSymbol + `Ios clean and pod installed.`);
  } catch (error) {
    console.error(errorSymbol + 'Failed to clean iOS build.');
    console.error(error.message);
    process.exit(1);
  }

  // Ios Version change  --- START
  const pbxprojPath = path.join(
    projectRoot,
    'ios',
    `${tenantName}.xcodeproj`,
    'project.pbxproj',
  );

  if (!fs.existsSync(pbxprojPath)) {
    console.error(`❌ iOS project file not found: ${pbxprojPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(pbxprojPath, 'utf8');

  // ===============================
  // 🔍 Match buildSettings blocks
  // ===============================
  const buildSettingsRegex = /buildSettings = {[\s\S]*?};/g;
  const blocks = content.match(buildSettingsRegex);

  if (!blocks) {
    console.error(`❌ No buildSettings blocks found in ${pbxprojPath}`);
    process.exit(1);
  }

  let matched = false;
  let matchedNotificationService = false;
  const newCurrentVersion = parseInt(tenantInfo.IosVersionCode ?? '1', 10);
  const newMarketingVersion = (tenantInfo.IosVersionName ?? '1.0.0').replace(
    /"/g,
    '',
  );

  const updatedBlocks = blocks.map(block => {
    let updatedBlock = block;

    // 🎯 Main app target (tenant-specific)
    if (
      block.includes(
        `INFOPLIST_KEY_CFBundleDisplayName = ${tenantInfo.AppName};`,
      ) ||
      block.includes(
        `INFOPLIST_KEY_CFBundleDisplayName = "${tenantInfo.AppName}";`,
      ) ||
      block.includes(
        `INFOPLIST_KEY_CFBundleDisplayName = ${tenantInfo.AppName.replaceAll(
          ' ',
          '',
        )};`,
      ) ||
      block.includes(
        `INFOPLIST_KEY_CFBundleDisplayName = "${tenantInfo.AppName.replaceAll(
          ' ',
          '',
        )}";`,
      )
    ) {
      matched = true;

      updatedBlock = updatedBlock
        .replace(
          /CURRENT_PROJECT_VERSION = .+;/,
          `CURRENT_PROJECT_VERSION = ${newCurrentVersion};`,
        )
        .replace(
          /MARKETING_VERSION = .+;/,
          `MARKETING_VERSION = ${newMarketingVersion};`,
        )
        .replace(/CODE_SIGN_STYLE = .+;/, `CODE_SIGN_STYLE = Manual;`)
        .replace(
          /PRODUCT_BUNDLE_IDENTIFIER = .+;/,
          `PRODUCT_BUNDLE_IDENTIFIER = ${tenantInfo.BundleId};`,
        );

      console.log(`✅ Updated for tenant "${tenantInfo.AppName}":`);
      console.log(`   - CURRENT_PROJECT_VERSION = ${newCurrentVersion}`);
      console.log(`   - MARKETING_VERSION = ${newMarketingVersion}`);
    }

    // 🎯 NotifeeNotificationService target
    if (
      block.includes(
        `INFOPLIST_KEY_CFBundleDisplayName = NotifeeNotificationService;`,
      )
    ) {
      matchedNotificationService = true;

      updatedBlock = updatedBlock
        .replace(/CODE_SIGN_STYLE = .+;/, `CODE_SIGN_STYLE = Manual;`)
        .replace(
          /PRODUCT_BUNDLE_IDENTIFIER = .+;/,
          `PRODUCT_BUNDLE_IDENTIFIER = ${tenantInfo.BundleId}.NotifeeNotificationService;`,
        );

      console.log(
        `✅ Updated NotifeeNotificationService target: CODE_SIGN_STYLE = Manual`,
      );
    }

    return updatedBlock;
  });

  if (!matched || !matchedNotificationService) {
    console.log(
      `⚠️ No buildSettings block matched tenant: ${tenantInfo.AppName}`,
    );
    process.exit(0);
  }

  // ===============================
  // 💾 Replace and Save
  // ===============================
  let updatedContent = content;
  blocks.forEach((original, index) => {
    updatedContent = updatedContent.replace(original, updatedBlocks[index]);
  });

  fs.writeFileSync(pbxprojPath, updatedContent, 'utf8');
  console.log(`🎉 project.pbxproj updated successfully.`);
  // Version change  --- END
}

console.warn(doneSymbol + 'App successfully shifted to ' + tenantName);
