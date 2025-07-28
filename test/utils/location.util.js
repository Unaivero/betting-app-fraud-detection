/**
 * Utilities for manipulating location settings in tests
 */
import { faker } from '@faker-js/faker';
import allureReporter from '@wdio/allure-reporter';

class LocationUtil {
    /**
     * Simulate changing device location
     */
    async changeDeviceLocation() {
        const locations = [
            { latitude: 40.7128, longitude: -74.0060, name: 'New York' },      // New York
            { latitude: 51.5074, longitude: -0.1278, name: 'London' },         // London
            { latitude: 48.8566, longitude: 2.3522, name: 'Paris' },           // Paris
            { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo' },         // Tokyo
            { latitude: 55.7558, longitude: 37.6173, name: 'Moscow' }          // Moscow
        ];
        
        // Select random location
        const randomLocation = faker.helpers.arrayElement(locations);
        
        allureReporter.startStep(`Change device location to ${randomLocation.name}`);
        
        try {
            // For Android
            if (driver.isAndroid) {
                await driver.executeScript('mobile: setGeoLocation', [{
                    latitude: randomLocation.latitude,
                    longitude: randomLocation.longitude
                }]);
            } 
            // For iOS
            else if (driver.isIOS) {
                await driver.executeScript('mobile: setLocation', [{
                    latitude: randomLocation.latitude,
                    longitude: randomLocation.longitude
                }]);
            }
            
            allureReporter.addStep('Location changed successfully');
            return randomLocation;
        } catch (error) {
            allureReporter.addStep('Failed to change location', 'failed');
            console.error('Error changing location:', error);
            throw error;
        } finally {
            allureReporter.endStep();
        }
    }
    
    /**
     * Get a random location for test data
     */
    getRandomLocation() {
        const countries = ['United States', 'United Kingdom', 'France', 'Germany', 
                          'Japan', 'Australia', 'Canada', 'Russia', 'Brazil', 'India'];
        
        return faker.helpers.arrayElement(countries);
    }
    
    /**
     * Generate a suspicious location pattern (multiple locations in short time)
     * @param {number} count - Number of location changes to generate
     */
    async generateSuspiciousLocationPattern(count = 3) {
        allureReporter.startStep('Generate suspicious location pattern');
        const locationChanges = [];
        
        try {
            for (let i = 0; i < count; i++) {
                const location = await this.changeDeviceLocation();
                locationChanges.push(location);
                
                // Small delay between location changes
                await browser.pause(1000);
            }
            
            allureReporter.addStep(`Generated ${count} location changes`, 'passed');
            
            if (count >= 3) {
                allureReporter.addStep('anomaly_detected: Multiple location changes', 'broken');
            }
            
            return locationChanges;
        } catch (error) {
            allureReporter.addStep('Failed to generate location pattern', 'failed');
            throw error;
        } finally {
            allureReporter.endStep();
        }
    }
}

export default new LocationUtil();