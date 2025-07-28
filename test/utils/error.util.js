/**
 * Error Handling Utility
 * Provides error handling, recovery and logging functionality
 */
import allureReporter from '@wdio/allure-reporter';
import fs from 'fs';
import path from 'path';
import { retry } from 'retry';

class ErrorUtil {
    /**
     * Retry a function multiple times with configurable delays
     * @param {Function} fn - Function to retry
     * @param {Object} options - Retry options
     * @returns {Promise} - Result of function execution
     */
    static async retryOperation(fn, options = {}) {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            onRetry = null,
            description = 'operation'
        } = options;

        return new Promise((resolve, reject) => {
            const operation = retry.operation({
                retries: maxRetries,
                factor: 1,
                minTimeout: retryDelay,
                maxTimeout: retryDelay * 2
            });

            operation.attempt(async (currentAttempt) => {
                try {
                    console.log(`Attempting ${description} (Attempt ${currentAttempt}/${maxRetries + 1})`);
                    allureReporter.addStep(`Attempt ${currentAttempt} for: ${description}`);
                    
                    // Execute the function
                    const result = await fn();
                    resolve(result);
                } catch (err) {
                    console.log(`Attempt ${currentAttempt} failed: ${err.message}`);
                    allureReporter.addStep(`Attempt ${currentAttempt} failed: ${err.message}`, 'broken');
                    
                    // Execute custom retry logic if provided
                    if (onRetry && typeof onRetry === 'function') {
                        await onRetry(err, currentAttempt);
                    }
                    
                    if (operation.retry(err)) {
                        return;
                    }
                    
                    // All retries failed
                    allureReporter.addStep(`All ${maxRetries + 1} attempts failed for: ${description}`, 'failed');
                    reject(operation.mainError());
                }
            });
        });
    }
    
    /**
     * Take a screenshot with a timestamp and add to Allure report
     * @param {string} name - Base name for the screenshot
     * @returns {string} - Path to saved screenshot
     */
    static async takeErrorScreenshot(name) {
        try {
            // Create directory if it doesn't exist
            const screenshotDir = path.join(process.cwd(), 'error-screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            // Generate unique filename with timestamp
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
            const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const filename = `error-${sanitizedName}-${timestamp}.png`;
            const filePath = path.join(screenshotDir, filename);
            
            // Take screenshot
            const screenshot = await browser.takeScreenshot();
            
            // Save to file
            fs.writeFileSync(filePath, Buffer.from(screenshot, 'base64'));
            
            // Add to Allure report
            allureReporter.addAttachment(`Error Screenshot: ${name}`, Buffer.from(screenshot, 'base64'), 'image/png');
            
            console.log(`Screenshot saved to ${filePath}`);
            return filePath;
        } catch (err) {
            console.error('Failed to take error screenshot:', err);
            allureReporter.addAttachment('Screenshot Error', err.message, 'text/plain');
            return null;
        }
    }
    
    /**
     * Log detailed error information to Allure and console
     * @param {Error} error - The error object
     * @param {string} context - Additional context information
     */
    static logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorDetails = {
            timestamp,
            message: error.message,
            stack: error.stack,
            context
        };
        
        // Log to console
        console.error(`[ERROR] ${timestamp} - ${context}:`, error);
        
        // Log to Allure
        allureReporter.addAttachment(
            `Error Details: ${context || 'Unknown context'}`,
            JSON.stringify(errorDetails, null, 2),
            'application/json'
        );
        
        // Add as a failed step
        allureReporter.addStep(`Error: ${error.message}`, 'failed');
    }
    
    /**
     * Reset application state after error
     * Attempts to return to a known good state
     */
    static async recoverAppState() {
        try {
            allureReporter.addStep('Attempting to recover app state');
            
            // Try to go back to home screen or main menu
            try {
                // This will depend on your specific app's navigation structure
                // Example: Look for a home button, or press back multiple times
                const backButton = await $('~back'); // Example accessibility ID
                if (await backButton.isExisting()) {
                    await backButton.click();
                    await browser.pause(1000);
                }
            } catch (e) {
                console.log('Could not find back button, trying alternative recovery');
            }
            
            // Try app reset as last resort
            try {
                await browser.reset();
                await browser.pause(3000); // Wait for app to restart
                allureReporter.addStep('App reset performed for recovery', 'broken');
            } catch (resetErr) {
                console.error('App reset failed:', resetErr);
                allureReporter.addStep('App reset failed, test may be in unknown state', 'failed');
            }
            
            allureReporter.addStep('App state recovery attempted');
            return true;
        } catch (err) {
            console.error('Failed to recover app state:', err);
            allureReporter.addStep('Failed to recover app state', 'failed');
            return false;
        }
    }
    
    /**
     * Create an error handling wrapper for a function
     * @param {Function} fn - The function to wrap
     * @param {Object} options - Options for error handling
     * @returns {Function} - Wrapped function with error handling
     */
    static createErrorHandler(fn, options = {}) {
        const {
            retries = 2,
            takeScreenshot = true,
            recover = true,
            description = 'operation'
        } = options;
        
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                // Log the error
                ErrorUtil.logError(error, description);
                
                // Take screenshot if enabled
                if (takeScreenshot) {
                    await ErrorUtil.takeErrorScreenshot(`${description}-error`);
                }
                
                // Try to recover if enabled
                if (recover) {
                    await ErrorUtil.recoverAppState();
                }
                
                // Re-throw the error
                throw error;
            }
        };
    }
}

export default ErrorUtil;