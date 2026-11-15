# PokeFightz — Android test APK

Expo/React Native WebView wrapper of **https://pbranke-cw8e4hd.runable.site/**.
Exported from the prepared managed mobile app. This repository contains only the Android wrapper, not the hosted game's server or assets.

## Build on GitHub

1. Put these files at the repository root. Keep `.github/workflows/android-apk.yml` in its exact location.
2. One time only: create the private release keystore and add the two repository secrets (see **Release signing** below). Builds fail without them.
3. Open **Actions → PokeFightz Android APK → Run workflow**. A push to `main` also triggers a build.
4. When the run is successful, open it and download **PokeFightz-apk** under **Artifacts**.
5. Unzip the download and install **PokeFightz.apk** on Android. Allow installation from the browser/file manager when Android asks.

No Expo account or EAS token is required. Native compilation happens on the GitHub runner, never in the Runable sandbox.

## What this build produces

- Standalone APK with bundled JavaScript: no Expo Go or Metro dev server needed.
- Signed with your **private release key** from the repository secrets. The build fails rather than fall back to the public debug key.
- ARM64 and 32-bit ARM support; minimum Android version is determined by Expo SDK 54.
- GitHub Actions can consume your account's CI minutes; this workflow has a 60-minute job limit and keeps artifacts for 14 days.

## Release signing

The APK is signed with a private keystore that only you hold. Android installs an update only when it is signed with the **same key** as the installed app, so:

- **Back the keystore and its password up somewhere safe (password manager plus an offline copy).** If you lose them, you can never publish an update to this app again; every user would have to uninstall and reinstall.
- Switching from the earlier test-key builds (1.1.1 and older from this repository) to the private key requires uninstalling the old app once. That deletes the teams saved in the app.
- Never commit the keystore. `.gitignore` already blocks `*.keystore`, `*.jks` and `*.p12`.

### One-time setup (on your own computer, not in a shared or cloud machine)

Requires Java's `keytool` (included with any JDK 17+). Use one password for both prompts; the key alias must be `pokefightz`.

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore pokefightz-release.keystore \
  -alias pokefightz -keyalg RSA -keysize 4096 -validity 10000
```

Encode it for GitHub (macOS: `base64 -i pokefightz-release.keystore | tr -d '\n'`; Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("pokefightz-release.keystore"))`):

```sh
base64 -w0 pokefightz-release.keystore > pokefightz-release.keystore.b64
```

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the full contents of `pokefightz-release.keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |

Then delete the `.b64` file. Each build's summary prints the signing certificate's SHA-256; it should be the same on every run.

To use a different alias, change `ANDROID_KEY_ALIAS` in `.github/workflows/android-apk.yml`.

## Hosting requirement

The app requires internet access and a **public** hosted clone. The URL responded with HTTP 200 on November 10, 2026. Publish the revised PokeFightz web app separately: the APK loads the current hosted page, not the web preview or a bundled offline game.

The underlying clone is a local demo: no original Pokémon Battlegrounds accounts, rankings or multiplayer connection. Team data stays in the APK's WebView storage and is separate from your browser's saved teams.

To change the hosted URL, edit `constants/clone.ts` and rebuild.

## Local source checks (no native compilation)

```sh
npm ci --include=dev
npm test
npm run typecheck
```

The build workflow generates native Android files on GitHub with Expo Prebuild, checks that the private release key is configured, runs Gradle `assembleRelease`, and verifies the APK is not signed with the public debug key. Generated native files and secrets are excluded from source control.

## Version 1.1.1 / build 3

Standalone Metro configuration; native Android error fallback; safer SPA/native back handling; a 25-second loading timeout; valid iOS bundle identifier; development-only analytics debug mode; cleanup for the web safe-area poller; and regression tests for navigation and URL filtering. The APK checksum file now works directly from the downloaded artifact directory.

Existing Android package `com.pbranked_6a9d.runable`, scheme and storage namespace are retained for compatibility. Updating an installed APK also requires the same signing certificate; see **Release signing**.

The wrapper and hosted game are separate: publish the revised website, then replace these repository files and rebuild the APK. This ZIP is source code, not an APK.
