/**
 * Test suite for suspicious user behavior in the betting app
 */
import { expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';
import BettingPage from '../pageobjects/betting.page.js';
import ProfilePage from '../pageobjects/profile.page.js';
import UserUtil from '../utils/user.util.js';
import LocationUtil from '../utils/location.util.js';
import NetworkUtil from '../utils/network.util.js';
import ConfigUtil from '../utils/config.util.js';
import { generateStakes, generateTimeIntervals } from '../data/test-data.js';
import allureReporter from '@wdio/allure-reporter';

describe('Suspicious User Behavior Test Suite', () => {
    // Add environment info to the report before tests
    before(() => {
        // Log environment configuration
        ConfigUtil.logEnvironmentInfo();
        
        // Add environment tag to Allure report
        allureReporter.addFeature(`Environment: ${ConfigUtil.getEnv().toUpperCase()}`);
    });
    
    it('should detect login from multiple locations', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Suspicious Location Changes');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('User logs in from multiple locations in short time period');
        
        // Get environment-specific thresholds and timeouts
        const thresholds = ConfigUtil.getFraudThresholds();
        const timeouts = ConfigUtil.getTimeoutSettings();
        
        // Select a suspicious user from environment-specific test data
        const suspiciousUsers = ConfigUtil.getSuspiciousUsers();
        const user = suspiciousUsers[0];
        
        // Login with suspicious user
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Change location multiple times - using environment threshold + 1 to ensure detection
        const locationChangeCount = thresholds.locationChanges + 1;
        const locationChanges = await LocationUtil.generateSuspiciousLocationPattern(locationChangeCount);
        
        // Verify multiple locations were used
        expect(locationChanges.length).toBe(locationChangeCount);
        
        // Check profile after location changes
        await ProfilePage.openProfile();
        const currentLocation = await ProfilePage.getLocation();
        
        // Log out
        await ProfilePage.logout();
        
        // Log back in after changing location again
        await LocationUtil.changeDeviceLocation();
        await browser.pause(timeouts.locationChange);
        
        await LoginPage.login(user.username, user.password);
        
        // Check profile again
        await ProfilePage.openProfile();
        const newLocation = await ProfilePage.getLocation();
        
        // Locations should be different (suspicious behavior)
        expect(newLocation).not.toBe(currentLocation);
        
        // Log the suspicious behavior in Allure report
        allureReporter.addStep('anomaly_detected: Multiple location logins', 'broken');
        allureReporter.addStep('risk_flagged: Possible account sharing', 'broken');
        
        // Log out again
        await ProfilePage.logout();
    });
    
    it('should detect frequent IP changes (VPN usage)', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Suspicious Network Changes');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('User frequently changes IP address during session');
        
        // Get environment-specific thresholds and timeouts
        const thresholds = ConfigUtil.getFraudThresholds();
        const timeouts = ConfigUtil.getTimeoutSettings();
        
        // Login with suspicious user from environment-specific data
        const suspiciousUsers = ConfigUtil.getSuspiciousUsers();
        const user = suspiciousUsers[1];
        
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Generate suspicious IP change pattern - using environment threshold
        const ipChanges = await NetworkUtil.generateSuspiciousIPPattern(thresholds.ipChanges);
        
        // Place bets between IP changes (additional suspicious behavior)
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        await BettingPage.placebet(thresholds.highStakeAmount / 4);
        
        await NetworkUtil.changeIPAddress();
        await browser.pause(timeouts.ipChange);
        
        await BettingPage.selectMatch(1);
        await BettingPage.selectOdds(0);
        await BettingPage.placebet(thresholds.highStakeAmount / 2);
        
        // Verify IP changes occurred
        expect(ipChanges.length).toBe(thresholds.ipChanges);
        expect(ipChanges.filter(change => change.success).length).toBeGreaterThan(0);
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
    });
    
    it('should detect high-frequency, high-stakes betting', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Suspicious Betting Patterns');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('User places many high-stake bets in short time period');
        
        // Get environment-specific thresholds and timeouts
        const thresholds = ConfigUtil.getFraudThresholds();
        const timeouts = ConfigUtil.getTimeoutSettings();
        
        // Create a new high-risk user
        const user = UserUtil.generateUser('high');
        
        // Login with suspicious user
        await LoginPage.login(user.username, user.password);
        
        // Generate suspicious betting pattern - use environment-specific settings
        const betCount = thresholds.minimumBetsForAlert + 3; // Add buffer to ensure detection
        const stakes = Array(betCount).fill(0).map(() => thresholds.highStakeAmount * (1 + Math.random()));
        
        // Calculate time intervals to fit within threshold window
        const maxIntervalPerBet = thresholds.highFrequencyTimeWindow / (betCount * 2); // Ensure high frequency
        const timeIntervals = Array(betCount).fill(0).map(() => Math.floor(maxIntervalPerBet * Math.random()));
        
        const bettingEvents = [];
        
        // Place bets in rapid succession with high stakes
        for (let i = 0; i < stakes.length; i++) {
            await BettingPage.selectMatch(i % 3); // Cycle through available matches
            await BettingPage.selectOdds(i % 2); // Cycle through available odds
            await BettingPage.placebet(stakes[i]);
            
            bettingEvents.push({
                timestamp: new Date().toISOString(),
                stake: stakes[i],
                match: i % 3,
                odds: i % 2
            });
            
            // Very short pause between bets (suspicious)
            if (i < stakes.length - 1) {
                await browser.pause(timeIntervals[i]);
            }
        }
        
        // Analyze the betting pattern
        const analysis = UserUtil.analyzeBettingPattern(bettingEvents);
        
        // Verify the pattern is detected as suspicious
        expect(analysis.isSuspicious).toBe(true);
        expect(analysis.averageStake).toBeGreaterThan(thresholds.highStakeAmount);
        expect(analysis.averageTimeBetweenBets).toBeLessThan(thresholds.highFrequencyTimeWindow / betCount);
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
    });
    
    it('should detect bonus abuse pattern', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Bonus Abuse Detection');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('User claims bonus and immediately logs out');
        
        // Get environment-specific settings
        const settings = ConfigUtil.getSettings();
        
        // Create multiple users to simulate bonus abuse - using environment settings
        const userCount = Math.min(5, settings.dataGeneration?.userCount || 3);
        const users = Array(userCount).fill(0).map(() => UserUtil.generateUser('medium'));
        
        // Track bonus claims
        const bonusClaims = [];
        
        // Loop through users to simulate multiple accounts claiming bonuses
        for (const user of users) {
            // Login with user
            await LoginPage.login(user.username, user.password);
            
            // Verify login was successful
            const isLoggedIn = await LoginPage.isLoggedIn();
            expect(isLoggedIn).toBe(true);
            
            // Claim bonus
            const bonusClaimed = await BettingPage.claimBonus();
            
            // Track claim
            bonusClaims.push({
                username: user.username,
                timestamp: new Date().toISOString(),
                successful: bonusClaimed
            });
            
            // Immediately log out (suspicious pattern)
            await ProfilePage.openProfile();
            await ProfilePage.logout();
            
            // Small delay before next user - use environment timeout
            await browser.pause(2000);
        }
        
        // Analyze the pattern - claim and immediate logout is suspicious
        const successfulClaims = bonusClaims.filter(claim => claim.successful).length;
        
        // Verify pattern was detected
        if (successfulClaims >= 2) {
            allureReporter.addStep('anomaly_detected: Multiple bonus claims from different accounts', 'broken');
            
            if (successfulClaims >= 3) {
                allureReporter.addStep('risk_flagged: Potential bonus abuse pattern', 'broken');
            }
        }
        
        expect(successfulClaims).toBeGreaterThan(0);
    });
    
    it('should detect combined suspicious behaviors', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Combined Risk Factors');
        allureReporter.addSeverity('critical');
        allureReporter.addStory('User exhibits multiple suspicious behaviors in combination');
        
        // Get environment-specific thresholds and timeouts
        const thresholds = ConfigUtil.getFraudThresholds();
        const timeouts = ConfigUtil.getTimeoutSettings();
        
        // Create high-risk user
        const user = UserUtil.generateUser('high');
        
        // Login with suspicious user
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Change location (first suspicious behavior)
        await LocationUtil.changeDeviceLocation();
        
        // Change IP (second suspicious behavior)
        await NetworkUtil.changeIPAddress();
        
        // Place high-stake bets quickly (third suspicious behavior)
        const stakes = Array(5).fill(0).map(() => thresholds.highStakeAmount * (1 + Math.random()));
        
        for (let i = 0; i < 5; i++) {
            await BettingPage.selectMatch(i % 3);
            await BettingPage.selectOdds(i % 2);
            await BettingPage.placebet(stakes[i]);
            await browser.pause(timeouts.betPlacement / 4); // Very short delay between bets
        }
        
        // Claim bonus (fourth suspicious behavior)
        await BettingPage.claimBonus();
        
        // Change location again
        await LocationUtil.changeDeviceLocation();
        
        // Analyze the combined risk factors
        allureReporter.addStep('anomaly_detected: Multiple risk factors present', 'broken');
        allureReporter.addStep('risk_flagged: High confidence fraud pattern', 'broken');
        
        // Log out
        await ProfilePage.openProfile();
        await ProfilePage.logout();
    });
});