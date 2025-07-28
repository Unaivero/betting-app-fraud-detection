import Page from './page.js';
import allureReporter from '@wdio/allure-reporter';

/**
 * Page object for the user profile page
 */
class ProfilePage extends Page {
    // Define selectors using getter methods
    get profileButton() { return $('~profile-button'); }
    get logoutButton() { return $('~logout-button'); }
    get confirmLogoutButton() { return $('~confirm-logout-button'); }
    get userInfoContainer() { return $('~user-info'); }
    get usernameText() { return $('~username-text'); }
    get settingsButton() { return $('~settings-button'); }
    get locationText() { return $('~location-text'); }

    /**
     * Open user profile
     */
    async openProfile() {
        allureReporter.startStep('Open user profile');
        await this.profileButton.click();
        await this.userInfoContainer.waitForDisplayed({ timeout: 5000 });
        allureReporter.endStep();
    }

    /**
     * Logout from the app
     */
    async logout() {
        allureReporter.startStep('Logout from app');
        await this.logoutButton.click();
        await this.confirmLogoutButton.click();
        allureReporter.endStep();
    }

    /**
     * Get current username displayed in profile
     */
    async getUsername() {
        return await this.usernameText.getText();
    }

    /**
     * Get current location displayed in profile
     */
    async getLocation() {
        return await this.locationText.getText();
    }

    /**
     * Check if user is logged out
     */
    async isLoggedOut() {
        try {
            // Check if we're back at login page by looking for login button
            const loginButton = $('~login-button');
            await loginButton.waitForDisplayed({ timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new ProfilePage();