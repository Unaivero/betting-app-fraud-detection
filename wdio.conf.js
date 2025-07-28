/**
 * WebdriverIO Configuration File
 * 
 * This file imports and exports the configuration from the environment-specific loader
 */

// Import the environment-specific config
const { config } = require('./wdio.conf.loader');

// Export the config for WebdriverIO to use
exports.config = config;