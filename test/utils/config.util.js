/**
 * Configuration utility for handling environment-specific settings
 */
import path from 'path';
import fs from 'fs';
import allureReporter from '@wdio/allure-reporter';

class ConfigUtil {
    constructor() {
        this.env = process.env.TEST_ENV || 'dev';
        this.configLoaded = false;
        this.envData = null;
    }
    
    /**
     * Initialize the configuration
     */
    init() {
        if (this.configLoaded) return;
        
        try {
            // Dynamic import of environment-specific data
            // Note: Using require here instead of import due to dynamic path
            this.envData = require(`../data/environments/${this.env}.data.js`);
            
            // Log environment configuration loaded
            allureReporter.addStep(`Environment configuration loaded: ${this.env}`);
            console.log(`Environment configuration loaded: ${this.env}`);
            
            this.configLoaded = true;
        } catch (error) {
            console.error(`Failed to load environment configuration for: ${this.env}`);
            console.error(error);
            throw new Error(`Environment configuration loading failed: ${error.message}`);
        }
    }
    
    /**
     * Get environment name
     */
    getEnv() {
        return this.env;
    }
    
    /**
     * Get normal users for current environment
     */
    getNormalUsers() {
        this.init();
        return this.envData.normalUsers || [];
    }
    
    /**
     * Get suspicious users for current environment
     */
    getSuspiciousUsers() {
        this.init();
        return this.envData.suspiciousUsers || [];
    }
    
    /**
     * Get environment settings
     */
    getSettings() {
        this.init();
        return this.envData.envSettings || {};
    }
    
    /**
     * Get fraud detection thresholds for current environment
     */
    getFraudThresholds() {
        this.init();
        return this.envData.envSettings?.fraudThresholds || {
            locationChanges: 3,
            ipChanges: 4,
            highFrequencyTimeWindow: 180000,  // 3 minutes
            highStakeAmount: 1000,
            minimumBetsForAlert: 4
        };
    }
    
    /**
     * Get timeout settings for current environment
     */
    getTimeoutSettings() {
        this.init();
        return this.envData.envSettings?.timeouts || {
            betPlacement: 5000,
            locationChange: 2000,
            ipChange: 3000
        };
    }
    
    /**
     * Log environment info to Allure report
     */
    logEnvironmentInfo() {
        this.init();
        
        const envInfo = {
            environment: this.env,
            fraudThresholds: this.getFraudThresholds(),
            timeoutSettings: this.getTimeoutSettings(),
            testData: {
                normalUserCount: this.getNormalUsers().length,
                suspiciousUserCount: this.getSuspiciousUsers().length,
            }
        };
        
        allureReporter.addAttachment(
            'Environment Configuration',
            JSON.stringify(envInfo, null, 2),
            'application/json'
        );
    }
}

export default new ConfigUtil();