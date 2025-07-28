/**
 * WebdriverIO Configuration Loader
 * 
 * This file loads the appropriate environment configuration based on 
 * the TEST_ENV environment variable.
 */

const fs = require('fs');
const path = require('path');

// Get environment from env variable or default to 'dev'
const env = process.env.TEST_ENV || 'dev';
const validEnvironments = ['dev', 'staging', 'prod'];

// Validate environment
if (!validEnvironments.includes(env)) {
    console.error(`Error: Invalid environment '${env}'. Valid options are: ${validEnvironments.join(', ')}`);
    process.exit(1);
}

// Check if environment config exists
const envConfigPath = path.join(__dirname, 'environments', `${env}.conf.js`);
if (!fs.existsSync(envConfigPath)) {
    console.error(`Error: Environment configuration file not found: ${envConfigPath}`);
    process.exit(1);
}

// Import base config and environment-specific config
const baseConfig = require('./wdio.conf.base.js').config;
const envConfig = require(envConfigPath).config;

// Merge configurations (environment config overrides base config)
const mergedConfig = {
    ...baseConfig,
    ...envConfig,
    
    // Merge nested objects
    capabilities: envConfig.capabilities || baseConfig.capabilities,
    services: envConfig.services || baseConfig.services,
    mochaOpts: {
        ...baseConfig.mochaOpts,
        ...(envConfig.mochaOpts || {})
    }
};

// Display environment info
console.log(`Using ${env.toUpperCase()} environment configuration`);

exports.config = mergedConfig;