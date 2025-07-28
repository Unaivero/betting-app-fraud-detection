import Page from './page.js';
import allureReporter from '@wdio/allure-reporter';

/**
 * Page object for the login page
 */
class LoginPage extends Page {
    // Define selectors using getter methods
    get inputUsername() { return $('~username'); }
    get inputPassword() { return $('~password'); }
    get btnSubmit() { return $('~login-button'); }
    get errorMessage() { return $('~error-message'); }

    /**
     * Login with provided username and password
     */
    async login(username, password) {
        allureReporter.startStep(`Login with username: ${username}`);
        await this.inputUsername.setValue(username);
        await this.inputPassword.setValue(password);
        await this.btnSubmit.click();
        allureReporter.endStep();
    }

    /**
     * Check if login was successful
     */
    async isLoggedIn() {
        try {
            // Wait for an element that only appears after login (like a dashboard element)
            const dashboardElement = $('~dashboard');
            await dashboardElement.waitForDisplayed({ timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if login error is displayed
     */
    async hasLoginError() {
        try {
            await this.errorMessage.waitForDisplayed({ timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new LoginPage();