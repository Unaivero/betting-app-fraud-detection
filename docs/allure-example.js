/**
 * This is a sample script that demonstrates what the Allure report for fraud detection would look like.
 * This file is for documentation purposes only and is not meant to be executed.
 */

// Sample Allure report output for suspicious behavior tests
const suspiciousBehaviorReport = {
  "name": "Suspicious User Behavior Test Suite",
  "status": "passed",
  "testCases": [
    {
      "name": "should detect login from multiple locations",
      "status": "passed",
      "steps": [
        { "name": "Login with suspicious user", "status": "passed" },
        { "name": "Generate suspicious location pattern", "status": "passed" },
        { "name": "anomaly_detected: Multiple location changes", "status": "broken" },
        { "name": "risk_flagged: Possible account sharing", "status": "broken" }
      ],
      "labels": [
        { "name": "feature", "value": "Suspicious Location Changes" },
        { "name": "severity", "value": "critical" },
        { "name": "story", "value": "User logs in from multiple locations in short time period" }
      ],
      "attachments": [
        {
          "name": "Location Changes",
          "type": "application/json",
          "content": JSON.stringify([
            { "name": "London", "country": "United Kingdom", "timestamp": "2025-07-26T18:01:22.345Z" },
            { "name": "Paris", "country": "France", "timestamp": "2025-07-26T18:02:15.612Z" },
            { "name": "Berlin", "country": "Germany", "timestamp": "2025-07-26T18:03:05.841Z" },
            { "name": "New York", "country": "United States", "timestamp": "2025-07-26T18:03:45.123Z" }
          ], null, 2)
        }
      ]
    },
    {
      "name": "should detect frequent IP changes (VPN usage)",
      "status": "passed",
      "steps": [
        { "name": "Login with suspicious user", "status": "passed" },
        { "name": "Generate suspicious IP change pattern", "status": "passed" },
        { "name": "anomaly_detected: Frequent IP changes", "status": "broken" },
        { "name": "risk_flagged: VPN usage suspected", "status": "broken" }
      ],
      "labels": [
        { "name": "feature", "value": "Suspicious Network Changes" },
        { "name": "severity", "value": "critical" }
      ],
      "attachments": [
        {
          "name": "IP Changes",
          "type": "application/json",
          "content": JSON.stringify([
            { "ip": "192.168.1.1", "timestamp": "2025-07-26T18:10:02.345Z" },
            { "ip": "45.67.89.123", "timestamp": "2025-07-26T18:10:32.612Z" },
            { "ip": "98.76.54.32", "timestamp": "2025-07-26T18:11:02.841Z" },
            { "ip": "11.22.33.44", "timestamp": "2025-07-26T18:11:32.123Z" },
            { "ip": "55.66.77.88", "timestamp": "2025-07-26T18:12:02.456Z" }
          ], null, 2)
        }
      ]
    },
    {
      "name": "should detect high-frequency, high-stakes betting",
      "status": "passed",
      "steps": [
        { "name": "Login with suspicious user", "status": "passed" },
        { "name": "Place multiple high-stake bets", "status": "passed" },
        { "name": "anomaly_detected: High-frequency betting", "status": "broken" },
        { "name": "anomaly_detected: High-stake betting", "status": "broken" },
        { "name": "risk_flagged: Suspicious high-frequency, high-stake betting", "status": "broken" }
      ],
      "labels": [
        { "name": "feature", "value": "Suspicious Betting Patterns" },
        { "name": "severity", "value": "critical" }
      ],
      "attachments": [
        {
          "name": "Betting Pattern Analysis",
          "type": "application/json",
          "content": JSON.stringify({
            "bets": [
              { "stake": 2500, "timestamp": "2025-07-26T18:20:05.123Z" },
              { "stake": 3000, "timestamp": "2025-07-26T18:20:25.456Z" },
              { "stake": 1500, "timestamp": "2025-07-26T18:20:45.789Z" },
              { "stake": 5000, "timestamp": "2025-07-26T18:21:05.012Z" },
              { "stake": 2000, "timestamp": "2025-07-26T18:21:25.345Z" },
              { "stake": 4000, "timestamp": "2025-07-26T18:21:45.678Z" },
              { "stake": 3500, "timestamp": "2025-07-26T18:22:05.901Z" },
              { "stake": 6000, "timestamp": "2025-07-26T18:22:25.234Z" }
            ],
            "analysis": {
              "timeSpan": 140111, // milliseconds
              "averageTimeBetweenBets": 20016, // milliseconds
              "totalStake": 27500,
              "averageStake": 3437.5,
              "isSuspicious": true
            }
          }, null, 2)
        }
      ]
    },
    {
      "name": "should detect bonus abuse pattern",
      "status": "passed",
      "steps": [
        { "name": "Login with first user", "status": "passed" },
        { "name": "Claim bonus", "status": "passed" },
        { "name": "Immediate logout", "status": "passed" },
        { "name": "Login with second user", "status": "passed" },
        { "name": "Claim bonus", "status": "passed" },
        { "name": "Immediate logout", "status": "passed" },
        { "name": "Login with third user", "status": "passed" },
        { "name": "Claim bonus", "status": "passed" },
        { "name": "Immediate logout", "status": "passed" },
        { "name": "anomaly_detected: Multiple bonus claims from different accounts", "status": "broken" },
        { "name": "risk_flagged: Potential bonus abuse pattern", "status": "broken" }
      ]
    },
    {
      "name": "should detect combined suspicious behaviors",
      "status": "passed",
      "steps": [
        { "name": "Login with suspicious user", "status": "passed" },
        { "name": "Change location", "status": "passed" },
        { "name": "Change IP address", "status": "passed" },
        { "name": "Place high-stake bets quickly", "status": "passed" },
        { "name": "Claim bonus", "status": "passed" },
        { "name": "Change location again", "status": "passed" },
        { "name": "anomaly_detected: Multiple risk factors present", "status": "broken" },
        { "name": "risk_flagged: High confidence fraud pattern", "status": "broken" }
      ]
    }
  ],
  "riskScoreAnalysis": {
    "highRiskUsers": 3,
    "mediumRiskUsers": 1,
    "lowRiskUsers": 2,
    "averageRiskScore": 68.5
  }
};