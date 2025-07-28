/**
 * Base page object class with enhanced error handling, visual verification and performance monitoring
 */
import allureReporter from '@wdio/allure-reporter';
import ErrorUtil from '../utils/error.util.js';
import VisualUtil from '../utils/visual.util.js';
import PerformanceUtil from '../utils/performance.util.js';

/**
 * Base Page class
 * @class Page
 */
export default class Page {
    /**
     * Opens a page
     * @param {string} path - Path to navigate to
     */
    async open(path = '') {
        PerformanceUtil.startTiming('page_navigation');
        
        const result = await ErrorUtil.retryOperation(async () => {
            await browser.url(path);
            allureReporter.addStep(`Navigated to: ${path || 'home page'}`);
            return true;
        }, {
            maxRetries: 2,
            description: `open page ${path}`,
            takeScreenshot: true
        });
        
        PerformanceUtil.endTiming('page_navigation', {
            type: 'navigation',
            path: path
        });
        
        return result;
    }
    
    /**
     * Wait for an element to be displayed with retry logic
     * @param {string} selector - Element selector
     * @param {object} options - Wait options
     * @returns {boolean} - Whether element is displayed
     */
    async waitForDisplayed(selector, options = {}) {
        const { timeout = 10000, interval = 500, reverse = false } = options;
        
        PerformanceUtil.startTiming(`wait_for_element_${selector}`);
        
        const result = await ErrorUtil.retryOperation(async () => {
            const element = await $(selector);
            const result = await element.waitForDisplayed({
                timeout,
                interval,
                reverse,
                timeoutMsg: `Element ${selector} ${reverse ? 'still' : 'not'} displayed after ${timeout}ms`
            });
            return result;
        }, {
            maxRetries: 2,
            description: `wait for element ${selector} to be ${reverse ? 'hidden' : 'displayed'}`,
            takeScreenshot: false
        });
        
        PerformanceUtil.endTiming(`wait_for_element_${selector}`, {
            type: 'wait',
            selector: selector
        });
        
        return result;
    }
    
    /**
     * Take a screenshot and add to Allure report
     * @param {string} name - Screenshot name
     * @returns {string} - Screenshot path
     */
    async takeScreenshot(name) {
        return await ErrorUtil.takeErrorScreenshot(name);
    }
    
    /**
     * Add an Allure report step with status
     * @param {string} message - Step message
     * @param {string} status - Step status (passed, failed, broken)
     */
    addAllureStep(message, status = 'passed') {
        allureReporter.addStep(message, status);
    }
    
    /**
     * Verify element against visual baseline
     * @param {string} selector - Element selector
     * @param {string} testName - Name for the comparison
     * @param {object} options - Comparison options
     * @returns {object} - Comparison results
     */
    async verifyElementVisually(selector, testName, options = {}) {
        return await VisualUtil.compareElement(selector, testName, options);
    }
    
    /**
     * Verify current screen against visual baseline
     * @param {string} testName - Name for the comparison
     * @param {object} options - Comparison options
     * @returns {object} - Comparison results
     */
    async verifyScreenVisually(testName, options = {}) {
        return await VisualUtil.compareScreen(testName, options);
    }
    
    /**
     * Click an element with retry logic and performance tracking
     * @param {string} selector - Element selector
     * @param {object} options - Click options
     */
    async clickWithRetry(selector, options = {}) {
        PerformanceUtil.startTiming(`click_${selector}`);
        
        const result = await ErrorUtil.retryOperation(async () => {
            const element = await $(selector);
            await element.waitForClickable({ timeout: options.timeout || 10000 });
            await element.click();
            return true;
        }, {
            maxRetries: options.retries || 3,
            description: `click element ${selector}`,
            takeScreenshot: true
        });
        
        PerformanceUtil.endTiming(`click_${selector}`, {
            type: 'interaction',
            action: 'click',
            selector: selector
        });
        
        // Record for bot detection analysis
        PerformanceUtil.recordInteraction('click', {
            selector: selector,
            options: options
        });
        
        return result;
    }
    
    /**
     * Enter text into field with retry logic and performance tracking
     * @param {string} selector - Element selector
     * @param {string} text - Text to enter
     * @param {object} options - Options
     */
    async setValueWithRetry(selector, text, options = {}) {
        const perfKey = `input_${selector}_${text.length}chars`;
        PerformanceUtil.startTiming(perfKey);
        
        const result = await ErrorUtil.retryOperation(async () => {
            const element = await $(selector);
            await element.waitForDisplayed({ timeout: options.timeout || 10000 });
            await element.clearValue();
            await element.setValue(text);
            return true;
        }, {
            maxRetries: options.retries || 2,
            description: `set value for ${selector}`,
            takeScreenshot: true
        });
        
        PerformanceUtil.endTiming(perfKey, {
            type: 'input',
            action: 'setValue',
            selector: selector,
            textLength: text.length
        });
        
        // Record for bot detection analysis - input is especially important
        PerformanceUtil.recordInteraction('input', {
            selector: selector,
            textLength: text.length,
            options: options
        });
        
        return result;
    }
    
    /**
     * Check if element exists with timeout
     * @param {string} selector - Element selector
     * @param {number} timeout - Timeout in ms
     * @returns {boolean} - Whether element exists
     */
    async isElementExisting(selector, timeout = 5000) {
        try {
            const element = await $(selector);
            return await element.waitForExist({ timeout });
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Verify a fraud indicator is present with visual comparison
     * @param {string} selector - Element selector
     * @param {string} fraudScenario - Name of fraud scenario
     * @returns {boolean} - Whether indicator matches expected pattern
     */
    async verifyFraudIndicator(selector, fraudScenario) {
        return await VisualUtil.verifyFraudIndicator(fraudScenario, selector);
    }
    
    /**
     * Handle error recovery if a page operation fails
     * @param {Error} error - The error that occurred
     */
    async handlePageError(error) {
        ErrorUtil.logError(error, 'Page operation failed');
        await ErrorUtil.takeErrorScreenshot('page-operation-error');
        await ErrorUtil.recoverAppState();
    }
    
    /**
     * Generate a performance report at the end of a test
     * @param {string} testName - Name of the test
     */
    async generatePerformanceReport(testName) {
        return PerformanceUtil.generateTimingReport(testName);
    }
    
    /**
     * Get bot probability score based on interaction patterns
     * @returns {number} - Risk score from 0-100
     */
    getBotProbability() {
        return PerformanceUtil.calculateTimingRiskScore();
    }
}