/**
 * Development environment test data
 */
import { faker } from '@faker-js/faker';

// Development environment users (more permissive limits for testing)
export const normalUsers = [
    {
        username: 'dev_normal_user1',
        password: 'Password123',
        email: 'dev_normal1@example.com',
        riskFactor: 'low',
        bettingFrequency: 'moderate',
        averageStake: 50,
        location: 'United States'
    },
    {
        username: 'dev_normal_user2',
        password: 'Password123',
        email: 'dev_normal2@example.com',
        riskFactor: 'low',
        bettingFrequency: 'low',
        averageStake: 25,
        location: 'Canada'
    }
];

// Development suspicious users (for fraud detection testing)
export const suspiciousUsers = [
    {
        username: 'dev_suspicious_user1',
        password: 'Password123',
        email: 'dev_suspicious1@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 2000,
        location: 'United Kingdom',
        vpnUsage: true
    },
    {
        username: 'dev_suspicious_user2',
        password: 'Password123',
        email: 'dev_suspicious2@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 5000,
        location: 'Germany',
        vpnUsage: true
    }
];

// Development environment specific settings
export const envSettings = {
    // Lower thresholds for triggering fraud alerts in dev environment
    fraudThresholds: {
        locationChanges: 2,         // Number of location changes to trigger alert
        ipChanges: 3,               // Number of IP changes to trigger alert
        highFrequencyTimeWindow: 120000,  // Time window in ms (2 minutes)
        highStakeAmount: 500,       // Amount considered high stake
        minimumBetsForAlert: 3      // Minimum number of bets to consider a pattern
    },
    
    // Shorter timeouts for development testing
    timeouts: {
        betPlacement: 3000,         // Time between bets in ms
        locationChange: 1000,       // Time between location changes in ms
        ipChange: 2000              // Time between IP changes in ms
    },
    
    // Test data generation settings
    dataGeneration: {
        userCount: 5,               // Number of users to generate
        betsPerUser: 8              // Number of bets to generate per user
    }
};