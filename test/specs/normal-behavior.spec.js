/**
 * Test suite for normal user behavior in the betting app
 */
import { expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';
import BettingPage from '../pageobjects/betting.page.js';
import ProfilePage from '../pageobjects/profile.page.js';
import UserUtil from '../utils/user.util.js';
import { normalUsers, bettingEvents } from '../data/test-data.js';
import allureReporter from '@wdio/allure-reporter';

describe('Normal User Behavior Test Suite', () => {
    it('should allow normal login and betting activity', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Normal Betting Behavior');
        allureReporter.addStory('User logs in and places bets with normal patterns');
        
        // Select a normal user from test data
        const user = normalUsers[0];
        
        // Login with normal user
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Place a bet with reasonable stake
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        await BettingPage.placebet(user.averageStake);
        
        // Verify bet was placed
        const isBetPlaced = await BettingPage.isBetPlaced();
        expect(isBetPlaced).toBe(true);
        
        // Wait a reasonable time before next action
        await browser.pause(3000);
        
        // Place another bet with similar stake
        await BettingPage.selectMatch(1);
        await BettingPage.selectOdds(1);
        await BettingPage.placebet(user.averageStake * 0.8); // Slight variation in stake
        
        // Verify second bet was placed
        const isSecondBetPlaced = await BettingPage.isBetPlaced();
        expect(isSecondBetPlaced).toBe(true);
        
        // Check user profile
        await ProfilePage.openProfile();
        
        // Log out normally
        await ProfilePage.logout();
        
        // Verify logout was successful
        const isLoggedOut = await ProfilePage.isLoggedOut();
        expect(isLoggedOut).toBe(true);
    });
    
    it('should claim a bonus with normal usage pattern', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Normal Bonus Claiming');
        allureReporter.addStory('User claims bonus and continues normal app usage');
        
        // Select a normal user from test data
        const user = normalUsers[1];
        
        // Login with normal user
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Claim a bonus
        const bonusClaimed = await BettingPage.claimBonus();
        expect(bonusClaimed).toBe(true);
        
        // Continue using the app normally
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        await BettingPage.placebet(user.averageStake);
        
        // Verify bet was placed
        const isBetPlaced = await BettingPage.isBetPlaced();
        expect(isBetPlaced).toBe(true);
        
        // Browse more matches
        await BettingPage.selectMatch(2);
        
        // Check user profile
        await ProfilePage.openProfile();
        
        // Log out normally
        await ProfilePage.logout();
        
        // Verify logout was successful
        const isLoggedOut = await ProfilePage.isLoggedOut();
        expect(isLoggedOut).toBe(true);
    });
    
    it('should have consistent location usage', async () => {
        // Add test details to Allure
        allureReporter.addFeature('Normal Location Usage');
        allureReporter.addStory('User maintains consistent location throughout session');
        
        // Generate a new normal user
        const user = UserUtil.generateUser('low');
        
        // Login with generated user
        await LoginPage.login(user.username, user.password);
        
        // Verify login was successful
        const isLoggedIn = await LoginPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);
        
        // Use the app with consistent location
        await BettingPage.selectMatch(0);
        await BettingPage.selectOdds(0);
        await BettingPage.placebet(user.averageStake);
        
        // Check profile and location
        await ProfilePage.openProfile();
        const location = await ProfilePage.getLocation();
        
        // Log out normally
        await ProfilePage.logout();
        
        // Log back in - should be same location
        await LoginPage.login(user.username, user.password);
        
        // Check profile again
        await ProfilePage.openProfile();
        const newLocation = await ProfilePage.getLocation();
        
        // Locations should match (normal behavior)
        expect(newLocation).toBe(location);
        
        // Log out again
        await ProfilePage.logout();
    });
});