/**
 * iOS Real Device Configuration
 */
require('dotenv').config();

exports.config = {
  capabilities: [{
    platformName: 'iOS',
    'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone',
    'appium:udid': process.env.IOS_DEVICE_UDID,
    'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '15.0',
    'appium:automationName': 'XCUITest',
    'appium:bundleId': process.env.IOS_BUNDLE_ID || 'com.example.bettingapp',
    'appium:xcodeSigningId': 'iPhone Developer',
    'appium:xcodeOrgId': process.env.IOS_TEAM_ID,
    'appium:updatedWDABundleId': process.env.IOS_WDA_BUNDLE_ID || 'com.example.WebDriverAgentRunner',
    'appium:useNewWDA': true,
    'appium:wdaLaunchTimeout': 120000,
    'appium:autoAcceptAlerts': true,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:webviewConnectTimeout': 10000,
    'appium:nativeWebTap': true,
    'appium:locationServicesEnabled': true,
    'appium:locationServicesAuthorized': true,
    'appium:shouldTerminateApp': true,
    'appium:connectHardwareKeyboard': false
  }]
};