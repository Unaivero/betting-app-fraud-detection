/**
 * Staging environment configuration
 */
exports.config = {
    // Staging-specific settings
    baseUrl: 'http://staging-betting-app.example.com',
    
    // Staging environment capabilities
    capabilities: [{
        // For Android real device
        platformName: 'Android',
        'appium:deviceName': 'Samsung Galaxy S20',
        'appium:udid': '${ANDROID_DEVICE_UDID}', // Set via environment variable
        'appium:app': './app/betting-app-staging.apk',
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 180,
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:skipUnlock': true,
        'appium:ignoreHiddenApiPolicyError': true
    }],
    
    // Logging level for staging
    logLevel: 'warn',
    
    // Test timeouts for staging (balanced for stability)
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 2,
    
    // Staging-specific services
    services: [
        ['appium', {
            logPath: './logs',
            command: 'appium',
            args: {
                sessionOverride: true,
                relaxedSecurity: true
            }
        }]
    ],
    
    // Mocha options for staging
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        bail: true // Exit after first test failure
    },
    
    // Environment identifier
    environment: 'staging',
    
    // Staging-specific hooks
    before: function (capabilities, specs) {
        console.log('Running tests in STAGING environment');
    },
    
    // Take screenshots on test failures in staging
    afterTest: async function(test, context, { error }) {
        if (error) {
            await browser.takeScreenshot();
        }
    }
};