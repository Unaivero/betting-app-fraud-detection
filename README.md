# Mobile Automation for Fraud Detection in Betting Apps

This project demonstrates how to use mobile automation testing to detect suspicious user behavior patterns in betting applications. It's inspired by real fraud prevention scenarios at companies like Superbet.

## Project Overview

The automation suite simulates various user behaviors in a mobile betting app and uses pattern detection to flag potential fraud risks. It leverages WebdriverIO with Appium for mobile test automation and implements advanced test scenarios that go beyond traditional functional testing.

## Key Features

### Suspicious Behavior Detection

This automation framework detects several suspicious user behavior patterns:

1. **Multi-location Login Detection**: Identifies users logging in from multiple geographic locations in short time periods, which may indicate account sharing or compromise.

2. **VPN/IP Change Detection**: Detects rapid IP address changes that might suggest the use of VPNs or proxy services to hide true location.

3. **Suspicious Betting Patterns**: Identifies high-frequency, high-stakes betting activities that deviate from normal user behavior.

4. **Bonus Abuse Detection**: Flags users who claim bonuses and immediately log out, a common pattern in bonus abuse scenarios.

### Architecture

- **Page Object Model**: Maintains clear separation between test logic and page interactions
- **External Test Data**: Stores user profiles and test scenarios in JSON format
- **Detailed Reporting**: Uses Allure Reporter with custom step labels for anomaly detection

## Technology Stack

- **WebdriverIO**: Test automation framework
- **Appium**: Mobile automation server
- **Faker.js**: Generation of randomized user data and betting patterns
- **Allure Reporter**: Test reporting with custom labels for risk flagging

## Test Suites

1. **Normal Behavior Tests**: Baseline test suite simulating typical user betting patterns
2. **Suspicious Behavior Tests**: Test suite implementing various fraud scenarios

## Running the Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run normal behavior tests only
npm run test:normal

# Run suspicious behavior tests only
npm run test:suspicious

# Generate and open Allure report
npm run report
```

## Example Allure Report Output

When executed, the test suite generates comprehensive Allure reports with:

- **anomaly_detected** labels: Highlighting detected suspicious patterns
- **risk_flagged** labels: Indicating high-confidence fraud signals
- Detailed test steps with timestamps and screenshots

![Allure Report Example](./docs/allure-report-example.png)

Example report sections:
- User behavior timeline with anomaly markers
- Location change frequency visualization
- IP change detection results
- High-risk behavior combinations

## CI Integration

### GitHub Actions Integration

Add the following `.github/workflows/automation.yml` file to integrate with GitHub Actions:

```yaml
name: Mobile Fraud Detection Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily run

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run Appium Server
      run: |
        npm install -g appium
        appium &
      
    - name: Run suspicious behavior tests
      run: npm run test:suspicious
      
    - name: Generate Allure Report
      run: npm run report
      
    - name: Upload Allure Report
      uses: actions/upload-artifact@v2
      with:
        name: allure-report
        path: allure-report/
```

### Jenkins Integration

Create a `Jenkinsfile` in the project root:

```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'Node16'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Start Appium Server') {
            steps {
                sh 'npm install -g appium'
                sh 'appium &'
                sh 'sleep 10' // Give Appium time to start
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm run test:suspicious'
            }
        }
        
        stage('Generate Report') {
            steps {
                sh 'npm run report'
            }
        }
    }
    
    post {
        always {
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'allure-report',
                reportFiles: 'index.html',
                reportName: 'Fraud Detection Test Report'
            ])
        }
    }
}
```

## How This Helps Detect Fraud

Traditional QA testing focuses on ensuring features work correctly. This automation framework goes beyond functional testing by:

1. **Proactive Fraud Detection**: Identifies suspicious patterns before they cause financial damage
2. **Behavioral Analysis**: Uses automation to build user behavior profiles and detect anomalies
3. **Multi-factor Risk Assessment**: Combines multiple risk signals for higher confidence detection
4. **Real-time Alerting**: Integrates with reporting systems to flag suspicious activities as they occur

By simulating and detecting these patterns, security and fraud prevention teams can:
- Tune their fraud detection algorithms
- Create appropriate rule sets for their risk engines
- Test fraud prevention systems thoroughly
- Build historical data for machine learning models

## Future Enhancements

1. **Machine Learning Integration**: Add ML components to detect more complex fraud patterns
2. **Real Device Farm**: Integrate with device farms for testing across multiple real devices
3. **API Validation**: Add API-level checks to validate backend fraud detection systems
4. **Performance Metrics**: Add timing analysis to detect automation tools used by fraudsters