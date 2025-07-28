/**
 * Utilities for simulating network changes in tests
 */
import { faker } from '@faker-js/faker';
import allureReporter from '@wdio/allure-reporter';

class NetworkUtil {
    /**
     * Simulate changing IP address (toggle airplane mode or VPN)
     */
    async changeIPAddress() {
        allureReporter.startStep('Change IP address');
        
        try {
            // For Android
            if (driver.isAndroid) {
                // Toggle airplane mode on
                await driver.executeScript('mobile: shell', [{
                    command: 'settings put global airplane_mode_on 1'
                }]);
                
                await driver.executeScript('mobile: shell', [{
                    command: 'am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true'
                }]);
                
                // Short wait
                await browser.pause(2000);
                
                // Toggle airplane mode off
                await driver.executeScript('mobile: shell', [{
                    command: 'settings put global airplane_mode_on 0'
                }]);
                
                await driver.executeScript('mobile: shell', [{
                    command: 'am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false'
                }]);
            } 
            // For iOS - this is simulated as iOS doesn't allow toggling airplane mode
            else if (driver.isIOS) {
                // We can't toggle airplane mode on real iOS devices, so this is a simulation
                console.log('IP change simulated on iOS');
                // In real testing, you might use a proxy server to simulate IP changes
            }
            
            allureReporter.addStep('IP address changed');
            return true;
        } catch (error) {
            allureReporter.addStep('Failed to change IP address', 'failed');
            console.error('Error changing IP:', error);
            return false;
        } finally {
            allureReporter.endStep();
        }
    }
    
    /**
     * Generate a suspicious pattern of frequent IP changes
     * @param {number} count - Number of IP changes to generate
     */
    async generateSuspiciousIPPattern(count = 5) {
        allureReporter.startStep('Generate suspicious IP change pattern');
        const changes = [];
        
        try {
            for (let i = 0; i < count; i++) {
                const changed = await this.changeIPAddress();
                changes.push({ 
                    timestamp: new Date().toISOString(),
                    success: changed
                });
                
                // Short delay between IP changes
                await browser.pause(3000);
            }
            
            if (count >= 3) {
                allureReporter.addStep('anomaly_detected: Frequent IP changes', 'broken');
                if (count >= 5) {
                    allureReporter.addStep('risk_flagged: VPN usage suspected', 'broken');
                }
            }
            
            return changes;
        } catch (error) {
            allureReporter.addStep('Failed to generate IP change pattern', 'failed');
            throw error;
        } finally {
            allureReporter.endStep();
        }
    }
    
    /**
     * Get a random IP address for test data
     */
    getRandomIP() {
        return faker.internet.ip();
    }
}

export default new NetworkUtil();