const { withAppBuildGradle } = require("expo/config-plugins");

// Adds a private "release" signing config to the generated android/app/build.gradle.
// The keystore path and password come from environment variables at Gradle time, so
// nothing secret is written into the generated project:
//   ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS
// When ANDROID_KEYSTORE_PATH is unset (local builds), release falls back to the
// public debug key. CI refuses that fallback; see scripts/check-release-signing.cjs.

const MARKER = "// pokefightz-release-signing";

const RELEASE_SIGNING_CONFIG = `
        release { ${MARKER}
            if (System.getenv('ANDROID_KEYSTORE_PATH')) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            }
        }`;

const RELEASE_BUILD_TYPE_SIGNING =
  "signingConfig System.getenv('ANDROID_KEYSTORE_PATH') ? signingConfigs.release : signingConfigs.debug";

function applyReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const signingConfigs = /(signingConfigs\s*\{\s*\n\s*debug\s*\{[^}]*\})/;
  if (!signingConfigs.test(gradle)) {
    throw new Error("with-release-signing: could not find signingConfigs.debug in app/build.gradle");
  }
  let result = gradle.replace(signingConfigs, `$1${RELEASE_SIGNING_CONFIG}`);

  const releaseBuildType = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/;
  if (!releaseBuildType.test(result)) {
    throw new Error("with-release-signing: could not find the release build type's signingConfig");
  }
  result = result.replace(releaseBuildType, `$1${RELEASE_BUILD_TYPE_SIGNING}`);

  return result;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("with-release-signing: expected a Groovy app/build.gradle");
    }
    mod.modResults.contents = applyReleaseSigning(mod.modResults.contents);
    return mod;
  });
};

module.exports.applyReleaseSigning = applyReleaseSigning;
