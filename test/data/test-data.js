/**
 * Test data for betting app automation tests
 */
import { faker } from '@faker-js/faker';

// Normal users - low risk profiles
export const normalUsers = [
    {
        username: 'normal_user1',
        password: 'Password123',
        email: 'normal1@example.com',
        riskFactor: 'low',
        bettingFrequency: 'moderate',
        averageStake: 50,
        location: 'United States'
    },
    {
        username: 'normal_user2',
        password: 'Password123',
        email: 'normal2@example.com',
        riskFactor: 'low',
        bettingFrequency: 'low',
        averageStake: 25,
        location: 'Canada'
    }
];

// Suspicious users - high risk profiles
export const suspiciousUsers = [
    {
        username: 'suspicious_user1',
        password: 'Password123',
        email: 'suspicious1@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 2000,
        location: 'United Kingdom',
        vpnUsage: true
    },
    {
        username: 'suspicious_user2',
        password: 'Password123',
        email: 'suspicious2@example.com',
        riskFactor: 'high',
        bettingFrequency: 'very_high',
        averageStake: 5000,
        location: 'Germany',
        vpnUsage: true
    }
];

// Betting events data
export const bettingEvents = [
    {
        name: 'Real Madrid vs Barcelona',
        sport: 'Football',
        odds: [
            { name: 'Real Madrid Win', value: 2.10 },
            { name: 'Draw', value: 3.40 },
            { name: 'Barcelona Win', value: 3.20 }
        ]
    },
    {
        name: 'Liverpool vs Manchester United',
        sport: 'Football',
        odds: [
            { name: 'Liverpool Win', value: 1.75 },
            { name: 'Draw', value: 3.50 },
            { name: 'Manchester United Win', value: 4.50 }
        ]
    },
    {
        name: 'Lakers vs Warriors',
        sport: 'Basketball',
        odds: [
            { name: 'Lakers Win', value: 1.90 },
            { name: 'Warriors Win', value: 1.85 }
        ]
    }
];

// Generate random stakes based on risk factor
export function generateStakes(riskFactor = 'low', count = 5) {
    const stakes = [];
    let min, max;
    
    switch(riskFactor) {
        case 'high':
            min = 500;
            max = 10000;
            break;
        case 'medium':
            min = 100;
            max = 500;
            break;
        case 'low':
        default:
            min = 10;
            max = 100;
            break;
    }
    
    for (let i = 0; i < count; i++) {
        stakes.push(faker.datatype.number({ min, max }));
    }
    
    return stakes;
}

// Generate time intervals between bets
export function generateTimeIntervals(riskFactor = 'low', count = 5) {
    const intervals = [];
    let min, max;
    
    switch(riskFactor) {
        case 'high':
            // Very fast betting (suspicious)
            min = 5; 
            max = 30;
            break;
        case 'medium':
            min = 30;
            max = 180;
            break;
        case 'low':
        default:
            min = 180;
            max = 600;
            break;
    }
    
    for (let i = 0; i < count; i++) {
        intervals.push(faker.datatype.number({ min, max }) * 1000); // Convert to milliseconds
    }
    
    return intervals;
}

// Location data for simulating changes
export const locations = [
    { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
    { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
    { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
    { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 }
];