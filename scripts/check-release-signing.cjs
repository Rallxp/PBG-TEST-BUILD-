// Run after `expo prebuild`, before Gradle. Fails the build instead of shipping an APK
// signed with the public debug key.
const fs = require("node:fs");

const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
if (!gradle.includes("// pokefightz-release-signing")) {
  throw new Error("Release signing config is missing. Is plugins/with-release-signing.js listed in app.json?");
}
if (!/release\s*\{[\s\S]*?signingConfig\s+System\.getenv\('ANDROID_KEYSTORE_PATH'\)\s*\?\s*signingConfigs\.release/.test(gradle)) {
  throw new Error("Release build type is not wired to signingConfigs.release.");
}

const missing = ["ANDROID_KEYSTORE_PATH", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS"].filter(
  (name) => !process.env[name],
);
if (missing.length > 0) {
  throw new Error(`Missing ${missing.join(", ")}. Add the ANDROID_KEYSTORE_BASE64 and ANDROID_KEYSTORE_PASSWORD repository secrets.`);
}
if (!fs.existsSync(process.env.ANDROID_KEYSTORE_PATH) || fs.statSync(process.env.ANDROID_KEYSTORE_PATH).size === 0) {
  throw new Error("Release keystore file is missing or empty. Check the ANDROID_KEYSTORE_BASE64 secret.");
}

console.log("Release signing configured with the private keystore.");
