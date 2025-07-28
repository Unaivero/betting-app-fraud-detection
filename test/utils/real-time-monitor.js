const EventEmitter = require('events');
const WebSocket = require('ws');

/**
 * 🔴 Real-time Fraud Monitoring System
 * 
 * Enterprise-grade real-time monitoring for fraud detection in betting applications.
 * Implements live behavioral analysis, stream processing, and instant alerting.
 * 
 * Features:
 * - Live user behavior tracking
 * - Real-time risk scoring
 * - Stream processing for fraud events
 * - Instant alert system
 * - Dashboard integration
 * - Historical pattern analysis
 */
class RealTimeFraudMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            alertThreshold: config.alertThreshold || 0.7,
            monitoringWindow: config.monitoringWindow || 300000, // 5 minutes
            maxEventsPerWindow: config.maxEventsPerWindow || 1000,
            streamUrl: config.streamUrl || 'ws://localhost:8080/fraud-stream',
            alertWebhook: config.alertWebhook || null,
            ...config
        };
        
        // Real-time data structures
        this.activeUsers = new Map();
        this.eventStream = [];
        this.behaviorPatterns = new Map();
        this.riskScores = new Map();
        this.alertQueue = [];
        
        // Monitoring components
        this.websocket = null;
        this.isMonitoring = false;
        this.processedEvents = 0;
        this.alertsSent = 0;
        
        // Risk scoring algorithms
        this.riskCalculators = new Map([
            ['velocity', this.calculateVelocityRisk.bind(this)],
            ['pattern', this.calculatePatternRisk.bind(this)],
            ['location', this.calculateLocationRisk.bind(this)],
            ['device', this.calculateDeviceRisk.bind(this)],
            ['behavior', this.calculateBehaviorRisk.bind(this)]
        ]);
        
        // Initialize monitoring system
        this.initializeMonitoring();
    }

    /**
     * Initialize the real-time monitoring system
     */
    async initializeMonitoring() {
        try {
            console.log('🔴 Initializing Real-time Fraud Monitor...');
            
            // Setup WebSocket connection for live data
            await this.setupWebSocketConnection();
            
            // Initialize behavior pattern models
            await this.initializeBehaviorModels();
            
            // Start monitoring loops
            this.startRiskCalculationLoop();
            this.startCleanupLoop();
            
            console.log('✅ Real-time Fraud Monitor initialized successfully');
            this.emit('monitorReady');
            
        } catch (error) {
            console.error('❌ Failed to initialize monitor:', error);
            this.emit('monitorError', error);
        }
    }

    /**
     * Setup WebSocket connection for real-time data streaming
     */
    async setupWebSocketConnection() {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(this.config.streamUrl);
                
                this.websocket.on('open', () => {
                    console.log('🌐 WebSocket connection established');
                    this.isMonitoring = true;
                    resolve();
                });
                
                this.websocket.on('message', (data) => {
                    this.processIncomingEvent(JSON.parse(data));
                });
                
                this.websocket.on('error', (error) => {
                    console.error('🚨 WebSocket error:', error);
                    reject(error);
                });
                
                this.websocket.on('close', () => {
                    console.log('📡 WebSocket connection closed, attempting reconnection...');
                    this.isMonitoring = false;
                    setTimeout(() => this.setupWebSocketConnection(), 5000);
                });
                
            } catch (error) {
                console.log('⚠️ WebSocket unavailable, using simulation mode');
                this.startSimulationMode();
                resolve();
            }
        });
    }

    /**
     * Process incoming real-time events
     */
    processIncomingEvent(event) {
        try {
            // Add timestamp if not present
            event.timestamp = event.timestamp || Date.now();
            event.eventId = event.eventId || this.generateEventId();
            
            // Add to event stream
            this.eventStream.push(event);
            this.processedEvents++;
            
            // Maintain sliding window
            this.maintainSlidingWindow();
            
            // Update user behavior profile
            this.updateUserBehavior(event);
            
            // Calculate real-time risk score
            const riskScore = this.calculateRealTimeRisk(event);
            
            // Check for alerts
            if (riskScore >= this.config.alertThreshold) {
                this.triggerAlert(event, riskScore);
            }
            
            // Emit event for external listeners
            this.emit('fraudEvent', {
                event,
                riskScore,
                userId: event.userId,
                timestamp: event.timestamp
            });
            
        } catch (error) {
            console.error('❌ Error processing event:', error);
            this.emit('processingError', { event, error });
        }
    }

    /**
     * Update user behavior profile with new event data
     */
    updateUserBehavior(event) {
        const userId = event.userId;
        
        if (!this.activeUsers.has(userId)) {
            this.activeUsers.set(userId, {
                userId,
                firstSeen: event.timestamp,
                lastActivity: event.timestamp,
                eventCount: 0,
                behaviorMetrics: {
                    bettingVelocity: 0,
                    locationChanges: 0,
                    deviceSwitches: 0,
                    patternDeviations: 0,
                    suspiciousActions: []
                },
                riskHistory: []
            });
        }
        
        const userProfile = this.activeUsers.get(userId);
        userProfile.lastActivity = event.timestamp;
        userProfile.eventCount++;
        
        // Update specific behavioral metrics
        this.updateBehaviorMetrics(userProfile, event);
        
        // Store updated profile
        this.activeUsers.set(userId, userProfile);
    }

    /**
     * Update behavioral metrics for user
     */
    updateBehaviorMetrics(userProfile, event) {
        const metrics = userProfile.behaviorMetrics;
        
        switch (event.type) {
            case 'bet_placed':
                metrics.bettingVelocity = this.calculateBettingVelocity(userProfile, event);
                if (event.amount > 1000) {
                    metrics.suspiciousActions.push({
                        type: 'high_value_bet',
                        amount: event.amount,
                        timestamp: event.timestamp
                    });
                }
                break;
                
            case 'location_change':
                metrics.locationChanges++;
                if (this.isRapidLocationChange(userProfile, event)) {
                    metrics.suspiciousActions.push({
                        type: 'rapid_location_change',
                        from: event.previousLocation,
                        to: event.currentLocation,
                        timestamp: event.timestamp
                    });
                }
                break;
                
            case 'device_switch':
                metrics.deviceSwitches++;
                metrics.suspiciousActions.push({
                    type: 'device_switch',
                    fromDevice: event.previousDevice,
                    toDevice: event.currentDevice,
                    timestamp: event.timestamp
                });
                break;
                
            case 'login':
                if (event.loginAttempts > 3) {
                    metrics.suspiciousActions.push({
                        type: 'multiple_login_attempts',
                        attempts: event.loginAttempts,
                        timestamp: event.timestamp
                    });
                }
                break;
        }
        
        // Clean old suspicious actions (keep last 24 hours)
        const dayAgo = event.timestamp - (24 * 60 * 60 * 1000);
        metrics.suspiciousActions = metrics.suspiciousActions.filter(
            action => action.timestamp > dayAgo
        );
    }

    /**
     * Calculate real-time risk score for an event
     */
    calculateRealTimeRisk(event) {
        let totalRisk = 0;
        let weightSum = 0;
        
        // Calculate risk using different algorithms
        for (const [type, calculator] of this.riskCalculators) {
            try {
                const { risk, weight } = calculator(event);
                totalRisk += risk * weight;
                weightSum += weight;
            } catch (error) {
                console.warn(`⚠️ Risk calculation failed for ${type}:`, error);
            }
        }
        
        const normalizedRisk = weightSum > 0 ? totalRisk / weightSum : 0;
        
        // Store risk score
        this.riskScores.set(event.userId, {
            score: normalizedRisk,
            timestamp: event.timestamp,
            factors: this.getDetailedRiskFactors(event)
        });
        
        return normalizedRisk;
    }

    /**
     * Calculate velocity-based risk
     */
    calculateVelocityRisk(event) {
        const userProfile = this.activeUsers.get(event.userId);
        if (!userProfile) return { risk: 0, weight: 1 };
        
        const timeWindow = 60000; // 1 minute
        const recentEvents = this.eventStream.filter(e => 
            e.userId === event.userId && 
            e.timestamp > (event.timestamp - timeWindow)
        );
        
        const velocity = recentEvents.length;
        const maxNormalVelocity = 10;
        
        const risk = Math.min(velocity / maxNormalVelocity, 1);
        return { risk, weight: 0.25 };
    }

    /**
     * Calculate pattern-based risk
     */
    calculatePatternRisk(event) {
        const userProfile = this.activeUsers.get(event.userId);
        if (!userProfile) return { risk: 0, weight: 1 };
        
        const suspiciousActionCount = userProfile.behaviorMetrics.suspiciousActions.length;
        const risk = Math.min(suspiciousActionCount / 5, 1);
        
        return { risk, weight: 0.3 };
    }

    /**
     * Calculate location-based risk
     */
    calculateLocationRisk(event) {
        if (event.type !== 'location_change') return { risk: 0, weight: 1 };
        
        const userProfile = this.activeUsers.get(event.userId);
        if (!userProfile) return { risk: 0, weight: 1 };
        
        const locationChanges = userProfile.behaviorMetrics.locationChanges;
        const risk = Math.min(locationChanges / 3, 1);
        
        return { risk, weight: 0.2 };
    }

    /**
     * Calculate device-based risk
     */
    calculateDeviceRisk(event) {
        const userProfile = this.activeUsers.get(event.userId);
        if (!userProfile) return { risk: 0, weight: 1 };
        
        const deviceSwitches = userProfile.behaviorMetrics.deviceSwitches;
        const risk = Math.min(deviceSwitches / 2, 1);
        
        return { risk, weight: 0.15 };
    }

    /**
     * Calculate behavior-based risk
     */
    calculateBehaviorRisk(event) {
        const userProfile = this.activeUsers.get(event.userId);
        if (!userProfile) return { risk: 0, weight: 1 };
        
        const bettingVelocity = userProfile.behaviorMetrics.bettingVelocity;
        const risk = Math.min(bettingVelocity / 100, 1);
        
        return { risk, weight: 0.1 };
    }

    /**
     * Trigger fraud alert
     */
    async triggerAlert(event, riskScore) {
        const alert = {
            alertId: this.generateEventId(),
            timestamp: Date.now(),
            userId: event.userId,
            riskScore,
            event,
            severity: this.getSeverityLevel(riskScore),
            userProfile: this.activeUsers.get(event.userId),
            recommendations: this.generateRecommendations(event, riskScore)
        };
        
        this.alertQueue.push(alert);
        this.alertsSent++;
        
        // Send webhook if configured
        if (this.config.alertWebhook) {
            await this.sendWebhookAlert(alert);
        }
        
        // Emit alert event
        this.emit('fraudAlert', alert);
        
        console.log(`🚨 FRAUD ALERT: User ${event.userId} - Risk: ${(riskScore * 100).toFixed(1)}%`);
    }

    /**
     * Get detailed risk factors for analysis
     */
    getDetailedRiskFactors(event) {
        const factors = [];
        const userProfile = this.activeUsers.get(event.userId);
        
        if (userProfile) {
            const metrics = userProfile.behaviorMetrics;
            
            if (metrics.bettingVelocity > 50) {
                factors.push({
                    type: 'high_betting_velocity',
                    value: metrics.bettingVelocity,
                    impact: 'high'
                });
            }
            
            if (metrics.locationChanges > 2) {
                factors.push({
                    type: 'multiple_location_changes',
                    value: metrics.locationChanges,
                    impact: 'medium'
                });
            }
            
            if (metrics.deviceSwitches > 1) {
                factors.push({
                    type: 'device_switching',
                    value: metrics.deviceSwitches,
                    impact: 'medium'
                });
            }
            
            if (metrics.suspiciousActions.length > 3) {
                factors.push({
                    type: 'multiple_suspicious_actions',
                    value: metrics.suspiciousActions.length,
                    impact: 'high'
                });
            }
        }
        
        return factors;
    }

    /**
     * Generate recommendations based on risk analysis
     */
    generateRecommendations(event, riskScore) {
        const recommendations = [];
        
        if (riskScore >= 0.9) {
            recommendations.push({
                action: 'immediate_account_suspension',
                priority: 'critical',
                reason: 'Extremely high fraud risk detected'
            });
        } else if (riskScore >= 0.7) {
            recommendations.push({
                action: 'enhanced_monitoring',
                priority: 'high',
                reason: 'High fraud risk - increase scrutiny'
            });
            recommendations.push({
                action: 'manual_review',
                priority: 'high',
                reason: 'Requires human analysis'
            });
        } else if (riskScore >= 0.5) {
            recommendations.push({
                action: 'additional_verification',
                priority: 'medium',
                reason: 'Medium risk - verify identity'
            });
        }
        
        return recommendations;
    }

    /**
     * Start simulation mode for testing
     */
    startSimulationMode() {
        console.log('🎭 Starting fraud detection simulation mode...');
        
        setInterval(() => {
            const simulatedEvent = this.generateSimulatedEvent();
            this.processIncomingEvent(simulatedEvent);
        }, 2000);
    }

    /**
     * Generate simulated fraud event for testing
     */
    generateSimulatedEvent() {
        const eventTypes = ['bet_placed', 'login', 'location_change', 'device_switch'];
        const userIds = ['user_001', 'user_002', 'user_003', 'suspicious_user_001'];
        
        const event = {
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            userId: userIds[Math.floor(Math.random() * userIds.length)],
            timestamp: Date.now()
        };
        
        // Add type-specific data
        switch (event.type) {
            case 'bet_placed':
                event.amount = Math.random() > 0.8 ? 
                    Math.random() * 5000 : Math.random() * 100;
                event.matchId = Math.floor(Math.random() * 1000);
                break;
                
            case 'location_change':
                event.previousLocation = 'Madrid, Spain';
                event.currentLocation = Math.random() > 0.7 ? 
                    'London, UK' : 'Barcelona, Spain';
                break;
                
            case 'device_switch':
                event.previousDevice = 'mobile_android';
                event.currentDevice = 'desktop_chrome';
                break;
                
            case 'login':
                event.loginAttempts = Math.random() > 0.8 ? 
                    Math.floor(Math.random() * 10) : 1;
                break;
        }
        
        return event;
    }

    /**
     * Start risk calculation loop
     */
    startRiskCalculationLoop() {
        setInterval(() => {
            this.calculateAggregateRisks();
        }, 30000); // Every 30 seconds
    }

    /**
     * Calculate aggregate risk scores
     */
    calculateAggregateRisks() {
        for (const [userId, userProfile] of this.activeUsers) {
            const timeWindow = this.config.monitoringWindow;
            const cutoff = Date.now() - timeWindow;
            
            // Get recent events for user
            const recentEvents = this.eventStream.filter(e => 
                e.userId === userId && e.timestamp > cutoff
            );
            
            if (recentEvents.length > 0) {
                const aggregateRisk = this.calculateAggregateRisk(recentEvents);
                
                userProfile.riskHistory.push({
                    timestamp: Date.now(),
                    risk: aggregateRisk,
                    eventCount: recentEvents.length
                });
                
                // Keep only last 24 hours of risk history
                const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
                userProfile.riskHistory = userProfile.riskHistory.filter(
                    r => r.timestamp > dayAgo
                );
            }
        }
    }

    /**
     * Start cleanup loop
     */
    startCleanupLoop() {
        setInterval(() => {
            this.cleanupOldData();
        }, 300000); // Every 5 minutes
    }

    /**
     * Cleanup old data to prevent memory leaks
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.monitoringWindow;
        
        // Clean event stream
        this.eventStream = this.eventStream.filter(e => e.timestamp > cutoff);
        
        // Clean inactive users
        for (const [userId, userProfile] of this.activeUsers) {
            if (userProfile.lastActivity < cutoff) {
                this.activeUsers.delete(userId);
            }
        }
        
        // Clean old risk scores
        for (const [userId, riskData] of this.riskScores) {
            if (riskData.timestamp < cutoff) {
                this.riskScores.delete(userId);
            }
        }
        
        // Clean old alerts
        this.alertQueue = this.alertQueue.filter(a => a.timestamp > cutoff);
    }

    /**
     * Get monitoring statistics
     */
    getMonitoringStats() {
        return {
            isMonitoring: this.isMonitoring,
            activeUsers: this.activeUsers.size,
            eventsProcessed: this.processedEvents,
            alertsSent: this.alertsSent,
            eventStreamSize: this.eventStream.length,
            averageRisk: this.calculateAverageRisk(),
            highRiskUsers: this.getHighRiskUsers(),
            systemHealth: this.getSystemHealth()
        };
    }

    /**
     * Helper methods
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    maintainSlidingWindow() {
        const cutoff = Date.now() - this.config.monitoringWindow;
        this.eventStream = this.eventStream.filter(e => e.timestamp > cutoff);
    }

    calculateBettingVelocity(userProfile, event) {
        if (event.type !== 'bet_placed') return userProfile.behaviorMetrics.bettingVelocity;
        
        const timeWindow = 60000; // 1 minute
        const recentBets = this.eventStream.filter(e => 
            e.userId === userProfile.userId && 
            e.type === 'bet_placed' && 
            e.timestamp > (event.timestamp - timeWindow)
        );
        
        return recentBets.length;
    }

    isRapidLocationChange(userProfile, event) {
        const lastLocationChange = this.eventStream
            .filter(e => e.userId === userProfile.userId && e.type === 'location_change')
            .sort((a, b) => b.timestamp - a.timestamp)[1];
        
        if (!lastLocationChange) return false;
        
        const timeDiff = event.timestamp - lastLocationChange.timestamp;
        return timeDiff < 300000; // 5 minutes
    }

    getSeverityLevel(riskScore) {
        if (riskScore >= 0.9) return 'critical';
        if (riskScore >= 0.7) return 'high';
        if (riskScore >= 0.5) return 'medium';
        return 'low';
    }

    calculateAggregateRisk(events) {
        if (events.length === 0) return 0;
        
        const risks = events.map(e => this.calculateRealTimeRisk(e));
        return risks.reduce((sum, risk) => sum + risk, 0) / risks.length;
    }

    calculateAverageRisk() {
        const risks = Array.from(this.riskScores.values()).map(r => r.score);
        if (risks.length === 0) return 0;
        return risks.reduce((sum, risk) => sum + risk, 0) / risks.length;
    }

    getHighRiskUsers() {
        return Array.from(this.riskScores.entries())
            .filter(([_, riskData]) => riskData.score >= this.config.alertThreshold)
            .map(([userId, riskData]) => ({ userId, risk: riskData.score }));
    }

    getSystemHealth() {
        return {
            status: this.isMonitoring ? 'healthy' : 'degraded',
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            lastEvent: this.eventStream.length > 0 ? 
                this.eventStream[this.eventStream.length - 1].timestamp : null
        };
    }

    async sendWebhookAlert(alert) {
        try {
            const response = await fetch(this.config.alertWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to send webhook alert:', error);
        }
    }

    async initializeBehaviorModels() {
        // Initialize behavior pattern models
        console.log('🧠 Initializing behavior pattern models...');
        
        // This would typically load ML models for behavior analysis
        // For now, we'll use rule-based patterns
        this.behaviorPatterns.set('normal_betting', {
            avgBetsPerHour: 5,
            avgBetAmount: 50,
            maxLocationChangesPerDay: 2
        });
        
        this.behaviorPatterns.set('suspicious_betting', {
            rapidBetting: 20, // bets per hour
            highValueBetting: 1000, // bet amount
            frequentLocationChanges: 5 // per day
        });
    }

    /**
     * Stop monitoring and cleanup
     */
    async stop() {
        console.log('🛑 Stopping Real-time Fraud Monitor...');
        
        this.isMonitoring = false;
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        // Final cleanup
        this.cleanupOldData();
        
        console.log('✅ Real-time Fraud Monitor stopped');
        this.emit('monitorStopped');
    }
}

module.exports = RealTimeFraudMonitor;