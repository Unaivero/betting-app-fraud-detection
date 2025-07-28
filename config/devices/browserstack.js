/**
 * BrowserStack Cloud Device Configuration
 */
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
      deviceName: process.env.BS_DEVICE_NAME || 'Samsung Galaxy S22',
      osVersion: process.env.BS_OS_VERSION || '12.0',
      projectName: 'Betting App Fraud Detection',
      buildName: `Fraud Detection Tests - ${process.env.TEST_ENV || 'dev'}`,
      sessionName: 'Suspicious Behavior Tests',
      debug: true,
      networkLogs: true,
      gpsLocation: process.env.BS_GPS_LOCATION || '40.7128,-74.0060', // Default: New York City
      appiumVersion: '2.0.0'
    },
    platformName: 'android',
    'appium:app': process.env.BROWSERSTACK_APP_ID || 'bs://abc123def456',
    'appium:automationName': 'UiAutomator2'
  }]
};