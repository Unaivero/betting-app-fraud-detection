/**
 * Production environment test data
 */
import { faker } from '@faker-js/faker';

// Production environment users (read-only real user profiles)
export const normalUsers = [
    {
        username: 'prod_normal_user1',
        password: 'Password123',
        email: 'prod_normal1@example.com',
        riskFactor: 'low',
        bettingFrequency: 'moderate',
        averageStake: 50,
        location: 'United States'
    },
    {
        username: 'prod_normal_user2',
        password: 'Password123',
        email: 'prod_normal2@example.com',
        riskFactor: 'low',
        bettingFrequency: 'low',
        averageStake: 25,
        location: 'Canada'
    }
];

// Production suspicious users (realistic fraud patterns)
export const suspiciousUsers = [
    {
        username: 'prod_suspicious_user1',
        password: 'Password123',
        email: 'prod_suspicious1@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 2000,
        location: 'United Kingdom',
        vpnUsage: true
    },
    {
        username: 'prod_suspicious_user2',
        password: 'Password123',
        email: 'prod_suspicious2@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 5000,
        location: 'Germany',
        vpnUsage: true
    }
];

// Production environment specific settings - strict thresholds
export const envSettings = {
    // Strict thresholds for triggering fraud alerts in production environment
    fraudThresholds: {
        locationChanges: 4,         // Number of location changes to trigger alert
        ipChanges: 5,               // Number of IP changes to trigger alert
        highFrequencyTimeWindow: 300000,  // Time window in ms (5 minutes)
        highStakeAmount: 2000,      // Amount considered high stake
        minimumBetsForAlert: 5      // Minimum number of bets to consider a pattern
    },
    
    // Realistic timeouts for production testing
    timeouts: {
        betPlacement: 10000,        // Time between bets in ms
        locationChange: 5000,       // Time between location changes in ms
        ipChange: 5000              // Time between IP changes in ms
    },
    
    // Test data generation settings
    dataGeneration: {
        userCount: 20,              // Number of users to generate
        betsPerUser: 15             // Number of bets to generate per user
    }
};