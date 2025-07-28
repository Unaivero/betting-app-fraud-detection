/**
 * Base WebdriverIO configuration
 * Contains common settings shared across all environments
 */
const path = require('path');
const allure = require('@wdio/allure-reporter').default;
const fs = require('fs');
const retry = require('retry');

exports.config = {
    // Runner and framework configurations
    runner: 'local',
    framework: 'mocha',
    
    // Test specs configuration
    specs: [
        './test/specs/**/*.js'
    ],
    suites: {
        normal: [
            './test/specs/normal-behavior.spec.js'
        ],
        suspicious: [
            './test/specs/suspicious-behavior.spec.js'
        ],
        all: [
            './test/specs/normal-behavior.spec.js',
            './test/specs/suspicious-behavior.spec.js'
        ],
        visual: [
            './test/specs/visual-baseline.spec.js'
        ]
    },
    exclude: [],
    maxInstances: 1,
    
    // Common timeouts
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // Common reporter configuration
    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false,
        }]
    ],
    
    // Common Mocha options
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        // Enable retries for flaky tests
        retries: 2
    },
    
    // Visual regression testing - image comparison service
    services: [
        'appium',
        [
            'image-comparison',
            {
                baselineFolder: path.join(process.cwd(), 'test/visual-baseline/'),
                formatImageName: '{tag}-{logName}-{width}x{height}',
                screenshotPath: path.join(process.cwd(), 'test/screenshots/'),
                savePerInstance: true,
                autoSaveBaseline: true,
                blockOutStatusBar: true,
                blockOutNavigationBar: true,
                // Custom comparisons for different scenarios
                customSnapshotIdentifier: (context) => {
                    // Add environment to snapshot name
                    return `${process.env.TEST_ENV || 'default'}-${context.tag}`;
                }
            }
        ]
    ],
    
    // Common before/after hooks
    beforeSession: function (config, capabilities) {
        // This hook runs before the session is created
        console.log('Test session starting...');
        
        // Create screenshots and visual baseline directories if they don't exist
        const dirs = [
            path.join(process.cwd(), 'test/screenshots/'),
            path.join(process.cwd(), 'test/visual-baseline/'),
            path.join(process.cwd(), 'error-screenshots/')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    },
    
    before: function (capabilities, specs) {
        // This hook runs before the test execution begins
        console.log('Setting up test environment...');
        
        // Set up chai for assertions
        const chai = require('chai');
        const chaiAsPromised = require('chai-as-promised');
        chai.use(chaiAsPromised);
        global.expect = chai.expect;
        
        // Add custom commands for retry logic
        browser.addCommand('retryClick', async function (selector, options = {}) {
            const maxRetries = options.retries || 3;
            const retryDelay = options.delay || 1000;
            
            return new Promise((resolve, reject) => {
                const operation = retry.operation({
                    retries: maxRetries,
                    factor: 1,
                    minTimeout: retryDelay,
                    maxTimeout: retryDelay * 2,
                });
                
                operation.attempt(async (currentAttempt) => {
                    try {
                        console.log(`Attempting to click ${selector} (Attempt ${currentAttempt})`);
                        const element = await $(selector);
                        await element.waitForClickable({ timeout: 5000 });
                        await element.click();
                        resolve(true);
                    } catch (err) {
                        console.log(`Click attempt ${currentAttempt} failed: ${err.message}`);
                        if (operation.retry(err)) {
                            return;
                        }
                        reject(operation.mainError());
                    }
                });
            });
        });
        
        // Add custom retry command for finding elements
        browser.addCommand('retryFindElement', async function (selector, options = {}) {
            const maxRetries = options.retries || 3;
            const retryDelay = options.delay || 1000;
            
            return new Promise((resolve, reject) => {
                const operation = retry.operation({
                    retries: maxRetries,
                    factor: 1,
                    minTimeout: retryDelay,
                    maxTimeout: retryDelay * 2,
                });
                
                operation.attempt(async (currentAttempt) => {
                    try {
                        console.log(`Attempting to find ${selector} (Attempt ${currentAttempt})`);
                        const element = await $(selector);
                        await element.waitForExist({ timeout: 5000 });
                        resolve(element);
                    } catch (err) {
                        console.log(`Find element attempt ${currentAttempt} failed: ${err.message}`);
                        if (operation.retry(err)) {
                            return;
                        }
                        reject(operation.mainError());
                    }
                });
            });
        });
        
        // Add visual comparison command
        browser.addCommand('compareScreen', async function (testName, options = {}) {
            try {
                // Get environment name for snapshot identifier
                const env = process.env.TEST_ENV || 'default';
                const result = await browser.checkScreen(`${env}-${testName}`, options);
                return result;
            } catch (error) {
                console.error(`Visual comparison error: ${error.message}`);
                allure.addAttachment('Visual comparison error', error.message, 'text/plain');
                throw error;
            }
        });
        
        // Add element visual comparison command
        browser.addCommand('compareElement', async function (selector, testName, options = {}) {
            try {
                const env = process.env.TEST_ENV || 'default';
                const element = await $(selector);
                await element.waitForDisplayed();
                const result = await browser.checkElement(element, `${env}-${testName}`, options);
                return result;
            } catch (error) {
                console.error(`Element visual comparison error: ${error.message}`);
                allure.addAttachment('Visual comparison error', error.message, 'text/plain');
                throw error;
            }
        });
    },
    
    beforeSuite: function (suite) {
        // This hook runs before each test suite starts
        console.log(`Starting test suite: ${suite.title}`);
    },
    
    beforeTest: function (test, context) {
        // Log test start in Allure
        allure.addFeature(test.parent);
        allure.addStory(test.title);
    },
    
    afterTest: function (test, context, { error, result, duration, passed, retries }) {
        // Take screenshot on test failure and add to Allure report
        if (!passed) {
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
            const screenshotName = `error-${test.parent}-${test.title}-${timestamp}.png`;
            const screenshotPath = path.join('error-screenshots', screenshotName);
            
            console.log(`Test failed: "${test.parent} - ${test.title}". Taking screenshot...`);
            
            // Take screenshot and add to Allure
            browser.takeScreenshot().then((screenshot) => {
                allure.addAttachment('Screenshot on failure', Buffer.from(screenshot, 'base64'), 'image/png');
                fs.writeFileSync(screenshotPath, Buffer.from(screenshot, 'base64'));
                console.log(`Screenshot saved to ${screenshotPath}`);
                
                // Add error details to Allure
                if (error) {
                    allure.addAttachment('Error details', error.stack || error.message, 'text/plain');
                }
                
                // If test allows retries, log retry count
                if (retries > 0) {
                    allure.addAttachment('Retry information', `Test retried ${retries} times`, 'text/plain');
                }
            }).catch((err) => {
                console.error('Failed to take screenshot:', err);
            });
        }
    },
    
    afterSuite: function (suite) {
        // This hook runs after each test suite completes
        console.log(`Completed test suite: ${suite.title}`);
    },
    
    after: function (result, capabilities, specs) {
        // This hook runs after all tests are done
        console.log('Test execution completed.');
    },
    
    afterSession: function (config, capabilities) {
        // This hook runs after the session is closed
        console.log('Test session completed.');
    },
    
    // Error handling for failed commands
    onPrepare: function (config, capabilities) {
        console.log('Starting test preparations...');
    },
    
    // Global error handling
    uncaughtException: function (err, msg, stacktrace) {
        console.error('Uncaught exception:', err);
        allure.addAttachment('Uncaught exception', err.stack || err.message, 'text/plain');
    }
};