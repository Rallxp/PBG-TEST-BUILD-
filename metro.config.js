const { getDefaultConfig } = require("expo/metro-config");

// This repository is a standalone Expo app, not a packages/mobile workspace.
// Keep Metro rooted at the project directory so builds do not scan parent folders.
module.exports = getDefaultConfig(__dirname);
