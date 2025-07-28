/**
 * Utilities for generating user data for tests
 */
import { faker } from '@faker-js/faker';
import allureReporter from '@wdio/allure-reporter';

class UserUtil {
    /**
     * Generate a random user profile
     */
    generateUser(riskFactor = 'low') {
        const username = faker.internet.userName().toLowerCase();
        const email = faker.internet.email().toLowerCase();
        const password = faker.internet.password(8, false, /[A-Za-z0-9]/);
        
        // Different risk levels have different properties
        let user = {
            username,
            email,
            password,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
            location: faker.address.country(),
            riskFactor
        };
        
        // Add risk-specific properties based on risk factor
        switch(riskFactor) {
            case 'high':
                user.bettingFrequency = 'very_high';
                user.averageStake = faker.datatype.number({ min: 500, max: 10000 });
                user.depositMethod = faker.helpers.arrayElement(['crypto', 'e-wallet', 'prepaid_card']);
                break;
                
            case 'medium':
                user.bettingFrequency = 'high';
                user.averageStake = faker.datatype.number({ min: 100, max: 500 });
                user.depositMethod = faker.helpers.arrayElement(['credit_card', 'e-wallet', 'bank_transfer']);
                break;
                
            case 'low':
            default:
                user.bettingFrequency = 'moderate';
                user.averageStake = faker.datatype.number({ min: 10, max: 100 });
                user.depositMethod = faker.helpers.arrayElement(['debit_card', 'bank_transfer']);
                break;
        }
        
        return user;
    }
    
    /**
     * Generate a betting pattern based on risk level
     */
    generateBettingPattern(riskFactor = 'low', count = 5) {
        const pattern = [];
        
        // Define stake ranges based on risk factor
        let minStake, maxStake, timeWindow;
        
        switch(riskFactor) {
            case 'high':
                minStake = 500;
                maxStake = 10000;
                timeWindow = 60000; // 1 minute in milliseconds
                break;
                
            case 'medium':
                minStake = 100;
                maxStake = 500;
                timeWindow = 300000; // 5 minutes in milliseconds
                break;
                
            case 'low':
            default:
                minStake = 10;
                maxStake = 100;
                timeWindow = 600000; // 10 minutes in milliseconds
                break;
        }
        
        // Generate betting events
        for (let i = 0; i < count; i++) {
            pattern.push({
                eventName: faker.helpers.arrayElement([
                    'Real Madrid vs Barcelona', 
                    'Manchester United vs Liverpool',
                    'Bayern Munich vs Borussia Dortmund',
                    'Lakers vs Warriors',
                    'Yankees vs Red Sox'
                ]),
                stake: faker.datatype.number({ min: minStake, max: maxStake }),
                odds: faker.datatype.float({ min: 1.1, max: 10, precision: 0.01 }),
                timestamp: new Date(Date.now() + (i * (timeWindow / count))).toISOString()
            });
        }
        
        return pattern;
    }
    
    /**
     * Check for suspicious betting patterns
     */
    analyzeBettingPattern(pattern) {
        allureReporter.startStep('Analyze betting pattern');
        
        try {
            // Check for high-frequency betting
            const timeSpan = new Date(pattern[pattern.length - 1].timestamp) - new Date(pattern[0].timestamp);
            const averageTimeBetweenBets = timeSpan / (pattern.length - 1);
            
            // Calculate total and average stake
            const totalStake = pattern.reduce((sum, bet) => sum + bet.stake, 0);
            const averageStake = totalStake / pattern.length;
            
            // Flag suspicious patterns
            if (averageTimeBetweenBets < 60000 && pattern.length >= 5) { // Less than 1 minute between bets
                allureReporter.addStep('anomaly_detected: High-frequency betting', 'broken');
            }
            
            if (averageStake > 500) {
                allureReporter.addStep('anomaly_detected: High-stake betting', 'broken');
            }
            
            if (averageTimeBetweenBets < 60000 && averageStake > 500) {
                allureReporter.addStep('risk_flagged: Suspicious high-frequency, high-stake betting', 'broken');
            }
            
            return {
                timeSpan,
                averageTimeBetweenBets,
                totalStake,
                averageStake,
                isSuspicious: (averageTimeBetweenBets < 60000 && pattern.length >= 5) || (averageStake > 500)
            };
        } catch (error) {
            allureReporter.addStep('Error analyzing betting pattern', 'failed');
            throw error;
        } finally {
            allureReporter.endStep();
        }
    }
}

export default new UserUtil();