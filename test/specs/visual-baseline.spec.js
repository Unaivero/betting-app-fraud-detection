/**
 * Visual Baseline Test Suite
 * Creates baseline images for visual comparison in fraud detection tests
 */
import { expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';
import BettingPage from '../pageobjects/betting.page.js';
import ProfilePage from '../pageobjects/profile.page.js';
import UserUtil from '../utils/user.util.js';
import VisualUtil from '../utils/visual.util.js';
import ConfigUtil from '../utils/config.util.js';
import allureReporter from '@wdio/allure-reporter';

describe('Visual Baseline Test Suite', () => {
    before(() => {
        // Log environment configuration
        ConfigUtil.logEnvironmentInfo();
        allureReporter.addFeature(`Visual Baseline Creation - ${ConfigUtil.getEnv().toUpperCase()}`);
    });
    
    it('should create visual baseline for login screen', async () => {
        // Navigate to login page
        await LoginPage.open();
        
        // Wait for page to be fully loaded
        await browser.pause(2000);
        
        // Create baseline for entire login screen
        await VisualUtil.compareScreen('login-screen');
        
        // Create baselines for login components
        await VisualUtil.compareElement(LoginPage.inputUsername, 'login-username-field');
        await VisualUtil.compareElement(LoginPage.inputPassword, 'login-password-field');
        await VisualUtil.compareElement(LoginPage.btnSubmit, 'login-submit-button');
    });
    
    it('should create visual baseline for normal betting flow', async () => {
        // Get normal user from configuration
        const normalUsers = ConfigUtil.getNormalUsers();
        const user = normalUsers[0];
        
        // Login with normal user
        await LoginPage.login(user.username, user.password);
        
        // Create baseline for betting page
        await VisualUtil.compareScreen('betting-main-screen');
        
        // Create baselines for betting components
        await VisualUtil.compareElement(BettingPage.matchList, 'betting-match-list');
        await VisualUtil.compareElement(BettingPage.oddsContainer, 'betting-odds-container');
        await VisualUtil.compareElement(BettingPage.btnPlaceBet, 'betting-place-bet-button');
        
        // Create baseline for betting slip
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        await VisualUtil.compareScreen('betting-slip-open');
        
        // Create baseline for stake input
        await VisualUtil.compareElement(BettingPage.inputStake, 'betting-stake-input');
        
        // Create baseline for profile page
        await ProfilePage.openProfile();
        await VisualUtil.compareScreen('profile-screen');
        
        // Log out
        await ProfilePage.logout();
    });
    
    it('should create visual baseline for suspicious betting patterns', async () => {
        // Get suspicious user from configuration
        const suspiciousUsers = ConfigUtil.getSuspiciousUsers();
        const user = suspiciousUsers[0];
        
        // Login with suspicious user
        await LoginPage.login(user.username, user.password);
        
        // Create baseline for high stakes betting
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        
        // Get environment-specific thresholds
        const thresholds = ConfigUtil.getFraudThresholds();
        
        // Enter high stake
        await BettingPage.enterStake(thresholds.highStakeAmount * 2);
        
        // Create baseline for high stake warning (if displayed)
        try {
            const highStakeWarning = await $('~high-stake-warning');
            if (await highStakeWarning.isDisplayed()) {
                await VisualUtil.compareElement('~high-stake-warning', 'fraud-high-stake-warning');
            }
        } catch (error) {
            console.log('High stake warning element not found - may not be implemented in the app');
        }
        
        // Create baseline for risk indicator
        try {
            const riskIndicator = await $('~risk-indicator');
            if (await riskIndicator.isDisplayed()) {
                await VisualUtil.compareElement('~risk-indicator', 'fraud-risk-indicator');
            }
        } catch (error) {
            console.log('Risk indicator element not found - may not be implemented in the app');
        }
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
    });
    
    it('should create visual baseline for location change warning', async () => {
        // Get suspicious user from configuration
        const suspiciousUsers = ConfigUtil.getSuspiciousUsers();
        const user = suspiciousUsers[0];
        
        // Login with suspicious user
        await LoginPage.login(user.username, user.password);
        
        // Try to trigger location warning if available in the app
        try {
            // This is a mock function - in reality we'd need to interact with location services
            // which is already implemented in our location.util.js
            await browser.execute(() => {
                // Mock code to simulate location change in the app for testing
                if (window.mockLocationChange) {
                    window.mockLocationChange();
                }
            });
            
            // Check if warning appears
            const locationWarning = await $('~location-change-warning');
            if (await locationWarning.isDisplayed()) {
                await VisualUtil.compareElement('~location-change-warning', 'fraud-location-warning');
            }
        } catch (error) {
            console.log('Location change warning element not found - may not be implemented in the app');
        }
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
    });
});