const fs = require('node:fs');
const path = require('node:path');
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
if (!/release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug/.test(gradle)) {
  throw new Error('Expected Expo release variant to use the debug/test signing config. Refusing to produce an unsigned APK.');
}
if (!fs.existsSync(path.join('android', 'app', 'debug.keystore'))) {
  throw new Error('Generated Android test keystore is missing.');
}
console.log('Test signing verified. Release variant bundles JavaScript and runs without Metro.');