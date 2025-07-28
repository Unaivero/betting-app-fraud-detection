/**
 * Visual Testing Utility
 * Provides functions for visual verification and comparison
 */
import allureReporter from '@wdio/allure-reporter';
import fs from 'fs';
import path from 'path';
import ErrorUtil from './error.util';

class VisualUtil {
    /**
     * Compare the current screen with a baseline
     * @param {string} testName - Name for the test/comparison
     * @param {Object} options - Additional options for image comparison
     * @returns {Object} - Comparison results
     */
    static async compareScreen(testName, options = {}) {
        try {
            // Get environment for tagging
            const env = process.env.TEST_ENV || 'default';
            const fullTestName = `${env}-${testName}`;
            
            // Log step to Allure
            allureReporter.addStep(`Visual comparison: ${testName}`);
            
            // Perform the comparison
            const result = await browser.checkScreen(fullTestName, options);
            
            // Add results to Allure
            this._processComparisonResult(result, testName);
            
            return result;
        } catch (error) {
            await ErrorUtil.takeErrorScreenshot(`visual-error-${testName}`);
            ErrorUtil.logError(error, `Visual comparison failed for ${testName}`);
            throw error;
        }
    }
    
    /**
     * Compare a specific element with a baseline
     * @param {string} selector - Element selector
     * @param {string} testName - Name for the test/comparison
     * @param {Object} options - Additional options for image comparison
     * @returns {Object} - Comparison results
     */
    static async compareElement(selector, testName, options = {}) {
        try {
            // Get environment for tagging
            const env = process.env.TEST_ENV || 'default';
            const fullTestName = `${env}-${testName}`;
            
            // Log step to Allure
            allureReporter.addStep(`Visual element comparison: ${testName} (${selector})`);
            
            // Find the element and ensure it's displayed
            const element = await $(selector);
            await element.waitForDisplayed({ timeout: 10000 });
            
            // Perform the comparison
            const result = await browser.checkElement(element, fullTestName, options);
            
            // Add results to Allure
            this._processComparisonResult(result, testName);
            
            return result;
        } catch (error) {
            await ErrorUtil.takeErrorScreenshot(`visual-element-error-${testName}`);
            ErrorUtil.logError(error, `Visual element comparison failed for ${testName} (${selector})`);
            throw error;
        }
    }
    
    /**
     * Process and report visual comparison results
     * @param {Object} result - Comparison result from WebdriverIO
     * @param {string} testName - Name of the test
     * @private
     */
    static _processComparisonResult(result, testName) {
        if (result === undefined || result === null) {
            allureReporter.addStep(`Baseline created for: ${testName}`, 'passed');
            return;
        }
        
        // Handle comparison result
        if (result.misMatchPercentage === 0) {
            // Perfect match
            allureReporter.addStep(`Visual verification passed for: ${testName}`, 'passed');
        } else if (result.misMatchPercentage <= 0.1) {
            // Minor differences (could be acceptable based on device rendering)
            allureReporter.addStep(`Visual verification passed with minimal differences (${result.misMatchPercentage}%) for: ${testName}`, 'passed');
        } else {
            // Visual differences detected
            allureReporter.addStep(`Visual verification failed - ${result.misMatchPercentage}% difference for: ${testName}`, 'failed');
            
            if (result.getImageDataUrl) {
                // Add diff image to report
                const diffImage = result.getImageDataUrl();
                allureReporter.addAttachment(
                    `Visual Difference for ${testName}`,
                    Buffer.from(diffImage.replace(/^data:image\/png;base64,/, ''), 'base64'),
                    'image/png'
                );
            }
        }
    }
    
    /**
     * Take screenshot of specific UI element for fraud verification
     * @param {string} selector - Element selector
     * @param {string} name - Name for the screenshot
     * @returns {string} - Path to saved screenshot
     */
    static async captureElementForFraudAnalysis(selector, name) {
        try {
            // Create directories if they don't exist
            const screenshotDir = path.join(process.cwd(), 'fraud-evidence');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
            const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const filename = `fraud-evidence-${sanitizedName}-${timestamp}.png`;
            const filePath = path.join(screenshotDir, filename);
            
            // Find the element
            const element = await $(selector);
            await element.waitForExist();
            
            // Take screenshot
            const screenshot = await browser.takeScreenshot();
            fs.writeFileSync(filePath, Buffer.from(screenshot, 'base64'));
            
            // Add to Allure report
            allureReporter.addAttachment(
                `Fraud Evidence: ${name}`,
                Buffer.from(screenshot, 'base64'),
                'image/png'
            );
            
            return filePath;
        } catch (error) {
            console.error(`Failed to capture element for fraud analysis: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Check if UI matches expectations for specific fraud scenario
     * @param {string} scenarioName - Name of the fraud scenario
     * @param {string} selector - Element to check
     * @param {Object} options - Comparison options
     * @returns {boolean} - True if UI matches expected fraud pattern
     */
    static async verifyFraudIndicator(scenarioName, selector, options = {}) {
        try {
            // Get environment
            const env = process.env.TEST_ENV || 'default';
            
            // Create baseline name
            const baselineName = `fraud-${env}-${scenarioName}`;
            
            // Find the element
            const element = await $(selector);
            await element.waitForDisplayed();
            
            // Compare with baseline
            const result = await browser.checkElement(element, baselineName, options);
            
            // Process result and add to Allure
            if (result && result.misMatchPercentage <= 2.0) {
                // Low mismatch percentage means the fraud indicator is present as expected
                allureReporter.addStep(`Fraud indicator verified: ${scenarioName}`, 'passed');
                return true;
            } else {
                // High difference suggests the fraud indicator is not displaying correctly
                allureReporter.addStep(`Fraud indicator verification failed: ${scenarioName}`, 'broken');
                
                // Take current screenshot for evidence
                await this.captureElementForFraudAnalysis(selector, `failed-${scenarioName}`);
                return false;
            }
        } catch (error) {
            console.error(`Fraud indicator verification error: ${error.message}`);
            allureReporter.addStep(`Error verifying fraud indicator: ${error.message}`, 'failed');
            return false;
        }
    }
}

export default VisualUtil;