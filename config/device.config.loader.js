/**
 * Device Configuration Loader
 * Dynamically loads device-specific WebdriverIO configurations
 */
const path = require('path');
const fs = require('fs');
const { merge } = require('lodash');

/**
 * Load device configuration based on command line arguments or environment variables
 * @returns {Object} Merged WebdriverIO configuration
 */
function loadDeviceConfig() {
    // Get device from command line args or environment variable
    const deviceArg = process.argv.find(arg => arg.startsWith('--device='));
    const device = deviceArg
        ? deviceArg.split('=')[1]
        : process.env.TEST_DEVICE || 'android-real';
    
    // Get cloud service from command line args or environment variable
    const serviceArg = process.argv.find(arg => arg.startsWith('--service='));
    const service = serviceArg
        ? serviceArg.split('=')[1]
        : process.env.CLOUD_SERVICE || null;
    
    console.log(`Loading device configuration for: ${device}${service ? ` on ${service}` : ''}`);
    
    // Base configuration path
    const baseConfigPath = path.join(__dirname, '..', 'wdio.conf.base.js');
    const { config: baseConfig } = require(baseConfigPath);
    
    // Environment-specific configuration path
    const env = process.env.TEST_ENV || 'dev';
    const envConfigPath = path.join(__dirname, '..', `wdio.conf.${env}.js`);
    
    let envConfig = {};
    if (fs.existsSync(envConfigPath)) {
        envConfig = require(envConfigPath).config;
    }
    
    // Device-specific configuration path
    let deviceConfig = {};
    const deviceConfigPath = path.join(__dirname, 'devices', `${device}.js`);
    
    if (fs.existsSync(deviceConfigPath)) {
        deviceConfig = require(deviceConfigPath).config;
    } else {
        console.warn(`Device configuration not found for ${device}. Using default config.`);
    }
    
    // Cloud service configuration (if applicable)
    let cloudConfig = {};
    if (service) {
        const cloudConfigPath = path.join(__dirname, 'devices', `${service}.js`);
        
        if (fs.existsSync(cloudConfigPath)) {
            cloudConfig = require(cloudConfigPath).config;
        } else {
            console.warn(`Cloud configuration not found for ${service}. Using default config.`);
        }
    }
    
    // Merge configurations with priority: base < environment < device < cloud
    const mergedConfig = merge({}, baseConfig, envConfig, deviceConfig, cloudConfig);
    
    // Add execution metadata
    mergedConfig.capabilities[0].metadata = {
        device,
        environment: env,
        timestamp: new Date().toISOString(),
        cloudService: service || 'local'
    };
    
    return mergedConfig;
}

// Export the configuration
exports.config = loadDeviceConfig();