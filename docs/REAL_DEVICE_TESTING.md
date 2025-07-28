# Real Device Testing Setup Guide
# Betting App Fraud Detection Project

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Local Real Device Setup](#local-real-device-setup)
   - [Android Setup](#android-setup)
   - [iOS Setup](#ios-setup)
4. [Environment Variables](#environment-variables)
5. [Cloud Testing Integration](#cloud-testing-integration)
   - [BrowserStack Integration](#browserstack-integration)
   - [Sauce Labs Integration](#sauce-labs-integration)
   - [AWS Device Farm Integration](#aws-device-farm-integration)
6. [Test Execution on Real Devices](#test-execution-on-real-devices)
7. [Device-Specific Configurations](#device-specific-configurations)
8. [Troubleshooting](#troubleshooting)

## Introduction

This guide provides detailed instructions for setting up and running the Betting App Fraud Detection tests on real mobile devices. While emulators are useful for development, real device testing is essential for accurate fraud detection, as it provides:

- Realistic geolocation behavior
- Genuine network characteristics
- Authentic device fingerprints
- Real-world performance metrics

## Prerequisites

Before setting up real device testing, ensure you have the following:

- Node.js v14+ and npm v6+
- Appium Server v2.0+
- Android SDK and/or Xcode (latest stable versions)
- USB debugging cables
- Access to cloud testing services (optional)
- All project dependencies installed (`npm install`)

## Local Real Device Setup

### Android Setup

1. **Enable Developer Options**:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Return to Settings to find Developer Options

2. **Enable USB Debugging**:
   - In Developer Options, enable "USB Debugging"
   - Connect your device via USB
   - Accept the authorization prompt on the device

3. **Check Device Connection**:
   ```bash
   adb devices
   ```
   You should see your device listed with a device ID.

4. **Update Configuration**:
   Create a device-specific configuration file in `config/devices/` with the following format:
   
   ```js
   // config/devices/samsung-s21.js
   exports.config = {
     capabilities: [{
       platformName: 'Android',
       'appium:deviceName': 'Samsung Galaxy S21',
       'appium:udid': 'DEVICE_UDID_HERE', // Get this from 'adb devices'
       'appium:platformVersion': '12',
       'appium:automationName': 'UiAutomator2',
       'appium:app': '/absolute/path/to/your/betting-app.apk',
       'appium:appPackage': 'com.example.bettingapp',
       'appium:appActivity': 'com.example.bettingapp.MainActivity',
       'appium:autoGrantPermissions': true,
       'appium:noReset': false,
       'appium:fullReset': false,
       'appium:newCommandTimeout': 240
     }]
   };
   ```

### iOS Setup

1. **Install Dependencies**:
   ```bash
   brew install libimobiledevice
   npm install -g ios-deploy
   ```

2. **Register Apple Developer Account** in Xcode.

3. **Prepare Your Device**:
   - Connect your iOS device via USB
   - Trust the computer on your device when prompted
   - In Xcode, go to Window > Devices and Simulators to verify connection

4. **Get Device UDID**:
   ```bash
   xcrun xctrace list devices
   ```
   Note the UDID of your iOS device.

5. **Update Configuration**:
   Create a device-specific configuration file in `config/devices/` with the following format:
   
   ```js
   // config/devices/iphone-13.js
   exports.config = {
     capabilities: [{
       platformName: 'iOS',
       'appium:deviceName': 'iPhone 13',
       'appium:udid': 'DEVICE_UDID_HERE',
       'appium:platformVersion': '15.0',
       'appium:automationName': 'XCUITest',
       'appium:bundleId': 'com.example.bettingapp',
       'appium:xcodeSigningId': 'iPhone Developer',
       'appium:xcodeOrgId': 'YOUR_TEAM_ID',
       'appium:updatedWDABundleId': 'com.example.WebDriverAgentRunner',
       'appium:useNewWDA': true,
       'appium:wdaLaunchTimeout': 120000,
       'appium:autoAcceptAlerts': true,
       'appium:noReset': false,
       'appium:fullReset': false,
       'appium:newCommandTimeout': 240
     }]
   };
   ```

## Environment Variables

Set up environment variables for secure and flexible device configuration:

```bash
# Android
export ANDROID_DEVICE_UDID="your_device_udid"
export ANDROID_APP_PATH="/path/to/your/app.apk"

# iOS
export IOS_DEVICE_UDID="your_device_udid"
export IOS_BUNDLE_ID="com.example.bettingapp"
export IOS_TEAM_ID="your_team_id"

# Test Environment
export TEST_ENV="dev|staging|prod"

# Appium
export APPIUM_HOST="localhost"
export APPIUM_PORT="4723"
```

These can be loaded through the `dotenv` package in your project.

## Cloud Testing Integration

### BrowserStack Integration

1. **Sign up** for a [BrowserStack](https://www.browserstack.com/app-automate) account.

2. **Create BrowserStack Configuration**:

```js
// config/browserstack.conf.js
require('dotenv').config();

exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  services: [
    ['browserstack', {
      browserstackLocal: true,
      opts: { forcelocal: false }
    }]
  ],
  
  capabilities: [{
    'bstack:options': {
      deviceName: 'Samsung Galaxy S22',
      osVersion: '12.0',
      projectName: 'Betting App Fraud Detection',
      buildName: 'Fraud Detection Test Build',
      sessionName: 'Suspicious Behavior Tests',
      debug: true,
      networkLogs: true,
      gpsLocation: '40.7128,-74.0060', // New York City
      appiumVersion: '2.0.0'
    },
    platformName: 'android',
    'appium:app': process.env.BROWSERSTACK_APP_ID || 'bs://abc123def456',
    'appium:automationName': 'UiAutomator2'
  }],
  
  commonCapabilities: {
    'bstack:options': {
      projectName: 'Betting App Fraud Detection',
      buildName: `Fraud Tests - ${process.env.TEST_ENV || 'dev'}`
    }
  }
};
```

3. **Upload App to BrowserStack**:

```bash
curl -u "BROWSERSTACK_USERNAME:BROWSERSTACK_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@/path/to/app.apk" \
  -F "custom_id=BettingApp"
```

4. **Run Tests on BrowserStack**:

```bash
TEST_ENV=staging DEVICE=browserstack npm test
```

### Sauce Labs Integration

1. **Sign up** for a [Sauce Labs](https://saucelabs.com/) account.

2. **Create Sauce Labs Configuration**:

```js
// config/saucelabs.conf.js
require('dotenv').config();

exports.config = {
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  
  services: [
    ['sauce', {
      sauceConnect: true,
      sauceConnectOpts: {}
    }]
  ],
  
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': 'Samsung Galaxy S10',
    'appium:platformVersion': '10.0',
    'appium:app': 'sauce-storage:betting-app.apk',
    'appium:automationName': 'UiAutomator2',
    'sauce:options': {
      build: `Fraud Detection Tests - ${new Date().toISOString()}`,
      name: 'Suspicious Behavior Tests',
      appiumVersion: '2.0.0'
    }
  }]
};
```

3. **Upload App to Sauce Labs**:

```bash
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/app.apk \
  "https://saucelabs.com/rest/v1/storage/$SAUCE_USERNAME/betting-app.apk?overwrite=true"
```

4. **Run Tests on Sauce Labs**:

```bash
TEST_ENV=staging DEVICE=saucelabs npm test
```

### AWS Device Farm Integration

1. **Set up** [AWS Device Farm](https://aws.amazon.com/device-farm/) access.

2. **Create AWS Device Farm Configuration**:

```js
// config/aws-device-farm.conf.js
const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-west-2'
});

exports.config = {
  services: [
    ['aws-device-farm', {
      projectName: 'Betting App Fraud Detection',
      devicePoolName: 'Fraud Detection Devices',
      testSpecName: 'WebdriverIO-Appium-Test-Spec',
      app: process.env.AWS_APP_ARN || 'arn:aws:devicefarm:us-west-2:account:app:app-id',
      deviceFarmRegion: 'us-west-2'
    }]
  ],
  
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Device Pool'
  }
};
```

3. **Upload App to AWS Device Farm** (using AWS CLI):

```bash
aws devicefarm create-upload --project-arn "$AWS_PROJECT_ARN" \
  --name "betting-app.apk" --type "ANDROID_APP" --region "us-west-2"

# Then use the returned upload URL to upload the file
curl -T /path/to/betting-app.apk "$UPLOAD_URL"
```

4. **Run Tests on AWS Device Farm**:

```bash
TEST_ENV=staging DEVICE=aws npm test
```

## Test Execution on Real Devices

### Running Tests on Local Devices

Use the device selector script to choose the appropriate device:

```bash
# Run all tests on local Android device
npm run test:device -- --device=android-real

# Run suspicious behavior tests on local iOS device
npm run test:suspicious:device -- --device=ios-real

# Run tests with specific environment
TEST_ENV=staging npm run test:device -- --device=android-real
```

### Running Tests on Cloud Services

```bash
# Run on BrowserStack
npm run test:cloud -- --service=browserstack --device="Samsung Galaxy S22"

# Run on Sauce Labs
npm run test:cloud -- --service=saucelabs --device="iPhone 13"

# Run on AWS Device Farm
npm run test:cloud -- --service=aws --pool="Top Devices"
```

## Device-Specific Configurations

Create device-specific configurations for different form factors:

```js
// config/device-types/tablet.conf.js
exports.config = {
  // Base config extensions for tablets
  capabilities: [{
    // Tablet-specific selectors and settings
    'appium:deviceScreenSize': '1280x800',
    'appium:deviceScreenDensity': 320
  }]
};

// Use with:
// npm run test:device -- --device=android-tablet
```

## Troubleshooting

### Common Issues and Solutions

1. **Device Not Detected**:
   - Check USB connection and cable
   - Restart adb server: `adb kill-server && adb start-server`
   - Ensure device USB debugging is enabled

2. **iOS Real Device Connection Issues**:
   - Verify WebDriverAgent is properly installed and trusted
   - Check Apple Developer certificates are valid
   - Run: `xcodebuild -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination 'id=<UDID>' test`

3. **App Installation Failures**:
   - Ensure app package is signed properly
   - Check device has enough storage
   - Verify app is compatible with device OS version

4. **Geolocation Mocking Issues**:
   - Android: Ensure app has location permissions
   - iOS: Add location mocking entitlements to app
   - Use Appium's location commands: `driver.setGeoLocation({latitude: 40.712, longitude: -74.006, altitude: 10})`

5. **Cloud Testing Connection Timeouts**:
   - Check network connectivity
   - Increase timeouts in config
   - Verify VPN/proxy settings are correct

### Logs and Debugging

Enable detailed logging for troubleshooting:

```js
// In your config file
exports.config = {
  logLevel: 'debug',
  outputDir: './logs',
  
  // For cloud services
  capabilities: [{
    'browserstack:debug': true,
    'sauce:options': {
      extendedDebugging: true
    }
  }]
};
```

Use `adb logcat` for Android device logs:

```bash
adb -s <DEVICE_UDID> logcat > device_logs.txt
```

For iOS, use the Console app or:

```bash
xcrun simctl spawn <DEVICE_UDID> log stream --level debug > device_logs.txt
```