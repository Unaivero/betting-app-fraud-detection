/**
 * Production environment configuration
 */
exports.config = {
    // Production-specific settings
    baseUrl: 'https://betting-app.example.com',
    
    // Production environment capabilities
    capabilities: [{
        // For iOS real device in production testing
        platformName: 'iOS',
        'appium:deviceName': 'iPhone 13',
        'appium:platformVersion': '15.0',
        'appium:udid': '${IOS_DEVICE_UDID}', // Set via environment variable
        'appium:app': './app/betting-app-prod.app',
        'appium:automationName': 'XCUITest',
        'appium:newCommandTimeout': 120,
        'appium:noReset': true, // Preserve app state between tests
        'appium:fullReset': false,
        'appium:wdaLaunchTimeout': 80000,
        'appium:wdaConnectionTimeout': 80000,
        'appium:useNewWDA': true,
        'appium:includeSafariInWebviews': true
    }],
    
    // Logging level for production (minimal)
    logLevel: 'error',
    
    // Test timeouts for production (optimized)
    waitforTimeout: 8000,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 1,
    
    // Production-specific services
    services: [
        ['appium', {
            logPath: './logs',
            command: 'appium',
            args: {
                relaxedSecurity: true,
                allowInsecure: 'chromedriver_autodownload'
            }
        }]
    ],
    
    // Mocha options for production
    mochaOpts: {
        ui: 'bdd',
        timeout: 45000,
        bail: true // Exit after first test failure
    },
    
    // Environment identifier
    environment: 'production',
    
    // Production-specific hooks
    before: function (capabilities, specs) {
        console.log('Running tests in PRODUCTION environment');
        console.log('⚠️ CAUTION: Tests running against PRODUCTION environment');
    },
    
    // Take screenshots and collect logs on test failures in production
    afterTest: async function(test, context, { error, passed }) {
        if (error) {
            // Take screenshot on failure
            await browser.takeScreenshot();
            
            // Collect device logs on failure
            if (browser.isAndroid) {
                await browser.getLogTypes().then(async (logTypes) => {
                    for (const logType of logTypes) {
                        await browser.getLogs(logType);
                    }
                });
            }
        }
    }
};