/**
 * Staging environment test data
 */
import { faker } from '@faker-js/faker';

// Staging environment users (closer to production)
export const normalUsers = [
    {
        username: 'staging_normal_user1',
        password: 'Password123',
        email: 'staging_normal1@example.com',
        riskFactor: 'low',
        bettingFrequency: 'moderate',
        averageStake: 50,
        location: 'United States'
    },
    {
        username: 'staging_normal_user2',
        password: 'Password123',
        email: 'staging_normal2@example.com',
        riskFactor: 'low',
        bettingFrequency: 'low',
        averageStake: 25,
        location: 'Canada'
    }
];

// Staging suspicious users (more realistic patterns)
export const suspiciousUsers = [
    {
        username: 'staging_suspicious_user1',
        password: 'Password123',
        email: 'staging_suspicious1@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 2000,
        location: 'United Kingdom',
        vpnUsage: true
    },
    {
        username: 'staging_suspicious_user2',
        password: 'Password123',
        email: 'staging_suspicious2@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 5000,
        location: 'Germany',
        vpnUsage: true
    }
];

// Staging environment specific settings
export const envSettings = {
    // Moderate thresholds for triggering fraud alerts in staging environment
    fraudThresholds: {
        locationChanges: 3,         // Number of location changes to trigger alert
        ipChanges: 4,               // Number of IP changes to trigger alert
        highFrequencyTimeWindow: 180000,  // Time window in ms (3 minutes)
        highStakeAmount: 1000,      // Amount considered high stake
        minimumBetsForAlert: 4      // Minimum number of bets to consider a pattern
    },
    
    // Moderate timeouts for more realistic testing
    timeouts: {
        betPlacement: 5000,         // Time between bets in ms
        locationChange: 2000,       // Time between location changes in ms
        ipChange: 3000              // Time between IP changes in ms
    },
    
    // Test data generation settings
    dataGeneration: {
        userCount: 10,              // Number of users to generate
        betsPerUser: 10             // Number of bets to generate per user
    }
};