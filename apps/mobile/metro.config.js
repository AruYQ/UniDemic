// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const gracefulFs = require('graceful-fs');

// Gracefully handle EMFILE (too many open files) on Windows
gracefulFs.gracefulify(fs);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit worker processes on Windows multi-core to prevent V8 heap/Zone memory exhaustion
config.maxWorkers = 2;

module.exports = config;
