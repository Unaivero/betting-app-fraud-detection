import Page from './page.js';
import allureReporter from '@wdio/allure-reporter';

/**
 * Page object for the betting page
 */
class BettingPage extends Page {
    // Define selectors using getter methods
    get matchListContainer() { return $('~match-list'); }
    get matchItems() { return $$('~match-item'); }
    get betSlip() { return $('~bet-slip'); }
    get stakeInput() { return $('~stake-input'); }
    get placeBetButton() { return $('~place-bet-button'); }
    get betConfirmation() { return $('~bet-confirmation'); }
    get betOdds() { return $$('~bet-odds'); }
    get bonusButton() { return $('~bonus-button'); }
    get bonusClaimButton() { return $('~claim-bonus-button'); }
    get bonusConfirmation() { return $('~bonus-confirmation'); }

    /**
     * Select a match from the list by index
     */
    async selectMatch(index = 0) {
        allureReporter.startStep(`Select match at index: ${index}`);
        const matches = await this.matchItems;
        if (matches.length > index) {
            await matches[index].click();
            allureReporter.addStep('Match selected');
        } else {
            allureReporter.addStep('No match available at the specified index', 'failed');
            throw new Error('Match not available at the specified index');
        }
        allureReporter.endStep();
    }

    /**
     * Select odds from available options
     */
    async selectOdds(index = 0) {
        allureReporter.startStep('Select odds');
        const odds = await this.betOdds;
        if (odds.length > index) {
            await odds[index].click();
            allureReporter.addStep('Odds selected');
        } else {
            allureReporter.addStep('No odds available at the specified index', 'failed');
            throw new Error('Odds not available at the specified index');
        }
        allureReporter.endStep();
    }

    /**
     * Enter stake amount and place bet
     */
    async placebet(stakeAmount) {
        allureReporter.startStep(`Place bet with stake: ${stakeAmount}`);
        await this.stakeInput.setValue(stakeAmount);
        await this.placeBetButton.click();
        
        try {
            await this.betConfirmation.waitForDisplayed({ timeout: 10000 });
            allureReporter.addStep('Bet placed successfully');
        } catch (error) {
            allureReporter.addStep('Bet placement failed', 'failed');
            throw new Error('Bet placement confirmation not displayed');
        }
        allureReporter.endStep();
    }

    /**
     * Claim available bonus
     */
    async claimBonus() {
        allureReporter.startStep('Claim bonus');
        await this.bonusButton.click();
        await this.bonusClaimButton.click();
        
        try {
            await this.bonusConfirmation.waitForDisplayed({ timeout: 5000 });
            allureReporter.addStep('Bonus claimed successfully');
            return true;
        } catch (error) {
            allureReporter.addStep('Bonus claim failed', 'failed');
            return false;
        }
        allureReporter.endStep();
    }

    /**
     * Check if bet was successful
     */
    async isBetPlaced() {
        try {
            await this.betConfirmation.waitForDisplayed({ timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new BettingPage();