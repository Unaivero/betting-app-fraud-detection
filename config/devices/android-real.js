/**
 * Android Real Device Configuration
 */
require('dotenv').config();

exports.config = {
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Device',
    'appium:udid': process.env.ANDROID_DEVICE_UDID,
    'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '12',
    'appium:automationName': 'UiAutomator2',
    'appium:app': process.env.ANDROID_APP_PATH,
    'appium:appPackage': process.env.ANDROID_APP_PACKAGE || 'com.example.bettingapp',
    'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || 'com.example.bettingapp.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:gpsEnabled': true,
    'appium:isHeadless': false,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:locale': 'en',
    'appium:language': 'en',
    'appium:skipDeviceInitialization': false,
    'appium:ignoreUnimportantViews': true,
    'appium:disableWindowAnimation': true,
    'appium:skipUnlock': true,
    'appium:unlockType': 'pin',
    'appium:unlockKey': process.env.ANDROID_UNLOCK_PIN || '0000'
  }]
};