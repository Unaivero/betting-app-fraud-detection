/**
 * Test suite for detecting automated bots/scripts through performance analysis
 */
import { expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';
import BettingPage from '../pageobjects/betting.page.js';
import ProfilePage from '../pageobjects/profile.page.js';
import UserUtil from '../utils/user.util.js';
import PerformanceUtil from '../utils/performance.util.js';
import ConfigUtil from '../utils/config.util.js';
import allureReporter from '@wdio/allure-reporter';

describe('Performance-Based Bot Detection Test Suite', () => {
    before(() => {
        // Log environment configuration
        ConfigUtil.logEnvironmentInfo();
        allureReporter.addFeature(`Performance Bot Detection - ${ConfigUtil.getEnv().toUpperCase()}`);
    });
    
    afterEach(() => {
        // Generate performance report after each test
        const testName = this.currentTest ? this.currentTest.title : 'unknown_test';
        PerformanceUtil.generateTimingReport(testName);
    });
    
    it('should detect suspiciously fast user interactions', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Bot Detection');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('Detect suspiciously fast form interactions');
        
        // Reset performance tracking
        PerformanceUtil.reset();
        
        // Get normal user from configuration
        const normalUsers = ConfigUtil.getNormalUsers();
        const user = normalUsers[0];
        
        // Start timing login sequence
        PerformanceUtil.startTiming('login_sequence');
        
        // Login with credentials - this will track performance within the page objects
        await LoginPage.login(user.username, user.password);
        
        // End timing login sequence
        PerformanceUtil.endTiming('login_sequence', {
            type: 'auth',
            username: user.username
        });
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Simulate a very fast series of interactions (suspicious)
        PerformanceUtil.startTiming('rapid_betting_sequence');
        
        // Place several bets in rapid succession (suspicious pattern)
        for (let i = 0; i < 5; i++) {
            await BettingPage.selectMatch(i % 3);
            await BettingPage.selectOdds(i % 2);
            await BettingPage.placebet(100 + (i * 50));
            
            // Don't pause between actions - this is suspicious!
            // Human users would have natural pauses
        }
        
        PerformanceUtil.endTiming('rapid_betting_sequence', {
            type: 'betting',
            betCount: 5
        });
        
        // Calculate bot probability
        const botScore = PerformanceUtil.calculateTimingRiskScore();
        
        // Add score to Allure
        allureReporter.addAttachment(
            'Bot Detection Score',
            `Bot probability score: ${botScore}/100`,
            'text/plain'
        );
        
        // If score is high, mark as suspicious
        if (botScore > 70) {
            allureReporter.addStep('anomaly_detected: Suspicious interaction timing patterns', 'broken');
            allureReporter.addStep('risk_flagged: Possible automated betting script detected', 'broken');
        }
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
        
        // Verify the score is high (we expect it to be since we made suspiciously fast interactions)
        expect(botScore).toBeGreaterThan(50);
    });
    
    it('should recognize normal human interaction patterns', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Bot Detection');
        allureReporter.addSeverity('normal');
        allureReporter.addStory('Verify normal human interaction patterns are not flagged');
        
        // Reset performance tracking
        PerformanceUtil.reset();
        
        // Get normal user from configuration
        const normalUsers = ConfigUtil.getNormalUsers();
        const user = normalUsers[0];
        
        // Login with credentials
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Simulate human-like interaction patterns with natural pauses
        for (let i = 0; i < 3; i++) {
            // Select a match
            await BettingPage.selectMatch(i);
            
            // Simulate "thinking" pause (humans pause to read/think)
            const thinkingTime = 1000 + Math.random() * 2000; // 1-3 seconds
            await browser.pause(thinkingTime);
            
            // Select odds
            await BettingPage.selectOdds(i % 2);
            
            // Another natural pause
            const decisionTime = 800 + Math.random() * 1500; // 0.8-2.3 seconds
            await browser.pause(decisionTime);
            
            // Enter stake with variable timing
            await BettingPage.enterStake(100 + (i * 75));
            
            // Final pause before confirming bet
            const confirmTime = 500 + Math.random() * 1000; // 0.5-1.5 seconds
            await browser.pause(confirmTime);
            
            // Place the bet
            await BettingPage.placeBet();
            
            // Pause between bets
            const betweenBetsTime = 2000 + Math.random() * 3000; // 2-5 seconds
            await browser.pause(betweenBetsTime);
        }
        
        // Calculate bot probability
        const botScore = PerformanceUtil.calculateTimingRiskScore();
        
        // Add score to Allure
        allureReporter.addAttachment(
            'Bot Detection Score',
            `Bot probability score: ${botScore}/100`,
            'text/plain'
        );
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
        
        // Verify the score is low (we expect it to be since we simulated human-like behavior)
        expect(botScore).toBeLessThan(30);
    });
});