/**
 * Development environment configuration
 */
exports.config = {
    // Development-specific settings
    baseUrl: 'http://dev-betting-app.example.com',
    
    // Development environment capabilities
    capabilities: [{
        // For Android emulator
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:app': './app/betting-app-dev.apk',
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 240,
        'appium:noReset': false,
        'appium:fullReset': true
    }],
    
    // Logging level for development
    logLevel: 'info',
    
    // Test timeouts for development (longer to allow for debugging)
    waitforTimeout: 15000,
    connectionRetryTimeout: 180000,
    connectionRetryCount: 3,
    
    // Development-specific services
    services: [
        ['appium', {
            logPath: './logs',
            command: 'appium',
            args: {
                debugLogSpacing: true,
                sessionOverride: true,
                allowInsecure: 'chromedriver_autodownload'
            }
        }]
    ],
    
    // Mocha options for development
    mochaOpts: {
        ui: 'bdd',
        timeout: 90000
    },
    
    // Environment identifier
    environment: 'development',
    
    // Development-specific hooks
    before: function (capabilities, specs) {
        console.log('Running tests in DEVELOPMENT environment');
    }
};