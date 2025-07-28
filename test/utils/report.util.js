/**
 * Utilities for enhanced Allure reporting with fraud detection markers
 */
import allureReporter from '@wdio/allure-reporter';

class ReportUtil {
    /**
     * Log an anomaly detection event
     * @param {string} anomalyType - Type of anomaly detected
     * @param {object} details - Additional details about the anomaly
     */
    logAnomalyDetected(anomalyType, details = {}) {
        allureReporter.addStep(`anomaly_detected: ${anomalyType}`, {
            content: JSON.stringify(details, null, 2),
            name: 'Anomaly Details',
            type: 'text/plain'
        }, 'broken');
        
        console.log(`ANOMALY DETECTED: ${anomalyType}`, details);
    }
    
    /**
     * Log a risk flag event (higher confidence of fraud)
     * @param {string} riskType - Type of risk flagged
     * @param {object} details - Additional details about the risk
     */
    logRiskFlagged(riskType, details = {}) {
        allureReporter.addStep(`risk_flagged: ${riskType}`, {
            content: JSON.stringify(details, null, 2),
            name: 'Risk Details',
            type: 'text/plain'
        }, 'broken');
        
        console.log(`RISK FLAGGED: ${riskType}`, details);
    }
    
    /**
     * Add detailed evidence to the report
     * @param {string} title - Title for the evidence
     * @param {object} data - The evidence data
     */
    addEvidence(title, data) {
        allureReporter.addAttachment(
            title,
            JSON.stringify(data, null, 2),
            'application/json'
        );
    }
    
    /**
     * Create a marker in the timeline for later analysis
     * @param {string} markerName - Name of the marker
     */
    markTimeline(markerName) {
        allureReporter.addStep(`Marker: ${markerName}`);
    }
    
    /**
     * Calculate and report risk score based on detected behaviors
     * @param {Array} riskFactors - Array of detected risk factors
     * @returns {number} - Calculated risk score
     */
    calculateRiskScore(riskFactors) {
        // Simple scoring system - each factor has a weight
        const riskWeights = {
            'location_change': 25,
            'ip_change': 20,
            'high_frequency_betting': 30,
            'high_stakes': 25,
            'bonus_abuse': 40,
            'immediate_logout': 15
        };
        
        // Calculate total risk score
        let totalScore = 0;
        const detectedFactors = [];
        
        for (const factor of riskFactors) {
            if (riskWeights[factor]) {
                totalScore += riskWeights[factor];
                detectedFactors.push(factor);
            }
        }
        
        // Cap at 100
        const finalScore = Math.min(totalScore, 100);
        
        // Add to report
        this.addEvidence('Risk Score Analysis', {
            score: finalScore,
            detectedFactors,
            timestamp: new Date().toISOString()
        });
        
        // Add visual indicator based on score
        if (finalScore >= 75) {
            this.logRiskFlagged('High Risk Score', { score: finalScore });
        } else if (finalScore >= 50) {
            this.logAnomalyDetected('Medium Risk Score', { score: finalScore });
        }
        
        return finalScore;
    }
}

export default new ReportUtil();