/**
 * Performance Measurement Utility
 * Provides timing analysis to detect suspicious automation patterns
 */
import allureReporter from '@wdio/allure-reporter';
import fs from 'fs';
import path from 'path';
import ConfigUtil from './config.util.js';

class PerformanceUtil {
    constructor() {
        // Initialize tracking arrays
        this.interactions = [];
        this.navigationEvents = [];
        this.inputEvents = [];
        this.interactionTimings = {};
        this.suspiciousPatterns = [];
        
        // Load thresholds from environment
        this.thresholds = {
            // Minimum time expected between interactions (ms)
            minInteractionGap: 50,
            // Minimum time expected for form filling (ms)
            minFormFillTime: 200,
            // Minimum time to read content before interacting (ms)
            minReadTime: 500,
            // Minimum time variance expected for human interaction
            minTimeVariance: 0.2, // 20% variance
            // Maximum consistent timing precision (ms) - humans aren't precise
            maxTimingPrecision: 10 
        };
        
        // Performance logging path
        this.performanceLogPath = path.join(process.cwd(), 'performance-logs');
        this._ensureLogDirectoryExists();
    }
    
    /**
     * Ensure the log directory exists
     * @private
     */
    _ensureLogDirectoryExists() {
        if (!fs.existsSync(this.performanceLogPath)) {
            fs.mkdirSync(this.performanceLogPath, { recursive: true });
        }
    }
    
    /**
     * Start timing an interaction
     * @param {string} interactionName - Name of the interaction to time
     */
    startTiming(interactionName) {
        this.interactionTimings[interactionName] = {
            start: Date.now(),
            end: null,
            duration: null
        };
        
        // Log start of timing
        console.log(`Started timing: ${interactionName}`);
    }
    
    /**
     * End timing an interaction and record metrics
     * @param {string} interactionName - Name of the interaction being timed
     * @param {Object} metadata - Additional metadata about the interaction
     * @returns {Object} - Timing information
     */
    endTiming(interactionName, metadata = {}) {
        if (!this.interactionTimings[interactionName]) {
            console.warn(`No timing started for: ${interactionName}`);
            return null;
        }
        
        const endTime = Date.now();
        const timing = this.interactionTimings[interactionName];
        
        timing.end = endTime;
        timing.duration = endTime - timing.start;
        
        // Record the interaction with metadata
        const interaction = {
            name: interactionName,
            start: timing.start,
            end: timing.end,
            duration: timing.duration,
            timestamp: new Date().toISOString(),
            ...metadata
        };
        
        this.interactions.push(interaction);
        
        // Categorize interaction
        if (metadata.type === 'navigation') {
            this.navigationEvents.push(interaction);
        } else if (metadata.type === 'input') {
            this.inputEvents.push(interaction);
        }
        
        // Log timing result
        console.log(`Completed timing: ${interactionName} - Duration: ${timing.duration}ms`);
        
        // Check for suspicious patterns
        this._checkForSuspiciousPattern(interaction);
        
        return timing;
    }
    
    /**
     * Record a user interaction without explicit timing
     * @param {string} interactionType - Type of interaction (click, swipe, input, etc.)
     * @param {Object} details - Details about the interaction
     */
    recordInteraction(interactionType, details = {}) {
        const timestamp = Date.now();
        
        const interaction = {
            type: interactionType,
            timestamp,
            details,
            humanTimestamp: new Date(timestamp).toISOString()
        };
        
        // Calculate time since last interaction
        if (this.interactions.length > 0) {
            const lastInteraction = this.interactions[this.interactions.length - 1];
            interaction.timeSinceLast = timestamp - lastInteraction.end || lastInteraction.timestamp;
        } else {
            interaction.timeSinceLast = 0;
        }
        
        this.interactions.push(interaction);
        
        // Check for suspicious patterns
        this._checkForSuspiciousPattern(interaction);
        
        return interaction;
    }
    
    /**
     * Check for suspicious performance patterns in the interaction
     * @param {Object} interaction - The interaction to analyze
     * @private
     */
    _checkForSuspiciousPattern(interaction) {
        const suspiciousPatterns = [];
        
        // Skip if fewer than 3 interactions (need data to establish patterns)
        if (this.interactions.length < 3) {
            return;
        }
        
        // Check for suspiciously fast input
        if (interaction.type === 'input' && interaction.duration) {
            if (interaction.duration < this.thresholds.minFormFillTime) {
                suspiciousPatterns.push({
                    type: 'fast_input',
                    threshold: this.thresholds.minFormFillTime,
                    actual: interaction.duration,
                    interaction
                });
            }
        }
        
        // Check for suspiciously fast interactions
        if (interaction.timeSinceLast && interaction.timeSinceLast < this.thresholds.minInteractionGap) {
            suspiciousPatterns.push({
                type: 'rapid_interaction',
                threshold: this.thresholds.minInteractionGap,
                actual: interaction.timeSinceLast,
                interaction
            });
        }
        
        // Check for suspiciously consistent timing (bot behavior)
        if (this.interactions.length >= 5) {
            // Get last 5 interactions for analysis
            const recentInteractions = this.interactions.slice(-5);
            
            // Check timing consistency (bots often have very consistent timing)
            const timings = recentInteractions
                .filter(i => i.timeSinceLast)
                .map(i => i.timeSinceLast);
                
            if (timings.length >= 3) {
                // Calculate variance
                const avg = timings.reduce((sum, t) => sum + t, 0) / timings.length;
                const variance = timings.map(t => Math.pow(t - avg, 2)).reduce((sum, v) => sum + v, 0) / timings.length;
                const stdDev = Math.sqrt(variance);
                const varianceRatio = stdDev / avg;
                
                // If variance is suspiciously low (too consistent for human)
                if (varianceRatio < this.thresholds.minTimeVariance) {
                    suspiciousPatterns.push({
                        type: 'consistent_timing',
                        threshold: this.thresholds.minTimeVariance,
                        actual: varianceRatio,
                        interaction,
                        timings
                    });
                }
            }
        }
        
        // If suspicious patterns detected, log them
        if (suspiciousPatterns.length > 0) {
            suspiciousPatterns.forEach(pattern => {
                this.suspiciousPatterns.push(pattern);
                
                // Log to console
                console.warn(`Suspicious interaction pattern detected: ${pattern.type}`);
                console.warn(`  Threshold: ${pattern.threshold}, Actual: ${pattern.actual}`);
                
                // Log to Allure
                allureReporter.addStep(
                    `anomaly_detected: Suspicious interaction timing - ${pattern.type}`,
                    'broken'
                );
                
                // Add detailed attachment to Allure
                allureReporter.addAttachment(
                    `Performance anomaly: ${pattern.type}`,
                    JSON.stringify(pattern, null, 2),
                    'application/json'
                );
            });
        }
    }
    
    /**
     * Generate a timing report for test actions
     * @param {string} testName - Name of the test for reporting
     * @returns {Object} - Summary report
     */
    generateTimingReport(testName) {
        // Skip if no interactions
        if (this.interactions.length === 0) {
            return {
                testName,
                interactionCount: 0,
                suspiciousPatterns: 0,
                summary: 'No interactions recorded'
            };
        }
        
        // Calculate timing statistics
        const durations = this.interactions
            .filter(i => i.duration !== undefined)
            .map(i => i.duration);
            
        const interactionGaps = this.interactions
            .filter(i => i.timeSinceLast !== undefined)
            .map(i => i.timeSinceLast);
        
        const stats = {
            totalInteractions: this.interactions.length,
            suspiciousPatterns: this.suspiciousPatterns.length,
            averageDuration: durations.length > 0 
                ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
                : 0,
            averageGap: interactionGaps.length > 0 
                ? interactionGaps.reduce((sum, g) => sum + g, 0) / interactionGaps.length 
                : 0
        };
        
        // Generate summary
        const report = {
            testName,
            timestamp: new Date().toISOString(),
            env: ConfigUtil.getEnv(),
            statistics: stats,
            suspiciousPatterns: this.suspiciousPatterns,
        };
        
        // Write report to file
        const reportFile = path.join(
            this.performanceLogPath,
            `performance-${testName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`
        );
        
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Add to Allure
        allureReporter.addAttachment(
            'Performance Report',
            JSON.stringify(report, null, 2),
            'application/json'
        );
        
        // If suspicious patterns found, mark in report
        if (this.suspiciousPatterns.length > 0) {
            allureReporter.addStep(
                `risk_flagged: ${this.suspiciousPatterns.length} suspicious interaction patterns detected`,
                'broken'
            );
        }
        
        return report;
    }
    
    /**
     * Calculate risk score based on timing analysis
     * Higher score indicates more suspicious behavior
     * @returns {number} Risk score from 0-100
     */
    calculateTimingRiskScore() {
        // If no interactions, return 0 risk
        if (this.interactions.length === 0) {
            return 0;
        }
        
        let riskScore = 0;
        
        // Base score on suspicious patterns
        riskScore += this.suspiciousPatterns.length * 20;
        
        // Analyze timing consistency
        if (this.interactions.length >= 5) {
            const timings = this.interactions
                .filter(i => i.timeSinceLast)
                .map(i => i.timeSinceLast);
                
            if (timings.length >= 3) {
                const avg = timings.reduce((sum, t) => sum + t, 0) / timings.length;
                const variance = timings.map(t => Math.pow(t - avg, 2)).reduce((sum, v) => sum + v, 0) / timings.length;
                const stdDev = Math.sqrt(variance);
                const varianceRatio = stdDev / avg;
                
                // Human interactions have natural variance
                // Low variance suggests automation
                if (varianceRatio < 0.1) {
                    riskScore += 40;
                } else if (varianceRatio < 0.2) {
                    riskScore += 20;
                } else if (varianceRatio < 0.3) {
                    riskScore += 10;
                }
            }
        }
        
        // Check for impossibly fast inputs
        const fastInputs = this.interactions.filter(i => 
            i.type === 'input' && 
            i.duration && 
            i.duration < this.thresholds.minFormFillTime
        ).length;
        
        riskScore += fastInputs * 15;
        
        // Cap at 100
        return Math.min(100, riskScore);
    }
    
    /**
     * Reset performance tracking
     */
    reset() {
        this.interactions = [];
        this.navigationEvents = [];
        this.inputEvents = [];
        this.interactionTimings = {};
        this.suspiciousPatterns = [];
    }
}

export default new PerformanceUtil();