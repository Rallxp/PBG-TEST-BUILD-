# PokeFightz — Android test APK

Expo/React Native WebView wrapper of **https://pbranke-cw8e4hd.runable.site/**.
Exported from the prepared managed mobile app. This repository contains only the Android wrapper, not the hosted game's server or assets.

## Build on GitHub

1. Put these files at the repository root. Keep `.github/workflows/android-apk.yml` in its exact location.
2. Open **Actions → PokeFightz Android APK → Run workflow**. A push to `main` also triggers a build.
3. When the run is successful, open it and download **PokeFightz-test-apk** under **Artifacts**.
4. Unzip the download and install **PokeFightz-test.apk** on Android. Allow installation from the browser/file manager when Android asks.

No Expo account, EAS token, or private signing key is required. Native compilation happens on the GitHub runner, never in the Runable sandbox.

## What this build produces

- Standalone APK with bundled JavaScript: no Expo Go or Metro dev server needed.
- Signed with the generated Expo/Android **test key**, not a production signing identity.
- ARM64 and 32-bit ARM support; minimum Android version is determined by Expo SDK 54.
- Not intended for Play Store distribution. Do not reuse the test key for a production app.
- GitHub Actions can consume your account's CI minutes; this workflow has a 60-minute job limit and keeps artifacts for 14 days.

## Hosting requirement

The app requires internet access and a **public** hosted clone. The URL responded with HTTP 200 on November 10, 2026. Publish the revised PokeFightz web app separately: the APK loads the current hosted page, not the web preview or a bundled offline game.

The underlying clone is a local demo: no original Pokémon Battlegrounds accounts, rankings or multiplayer connection. Team data stays in the APK's WebView storage and is separate from your browser's saved teams.

To change the hosted URL, edit `constants/clone.ts` and rebuild.

## Local source checks (no native compilation)

```sh
npm ci --include=dev
npm run typecheck
```

The build workflow generates native Android files on GitHub with Expo Prebuild, checks test signing, and runs Gradle `assembleRelease`. Generated native files and secrets are excluded from source control.

## Version 1.1.0 / build 2

PokeFightz display name, PF icon and splash; portrait orientation; Android back bridge for the hosted SPA; short-screen scrollable errors. Existing Android package `com.pbranked_6a9d.runable`, scheme and storage namespace are retained for compatibility. Updating an installed APK also requires the same signing certificate; this has not been compared to your existing APK.

The wrapper and hosted game are separate: publish the revised website, then replace these repository files and rebuild the APK. This ZIP is source code, not an APK.
