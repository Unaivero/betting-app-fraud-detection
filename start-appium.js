/**
 * Helper script to start the Appium server
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Appium server...');

// Start Appium server
const appium = spawn('npx', ['appium'], {
  stdio: 'inherit'
});

// Handle server exit
appium.on('close', (code) => {
  console.log(`Appium server exited with code ${code}`);
});

// Handle Ctrl+C to gracefully exit
process.on('SIGINT', () => {
  console.log('Shutting down Appium server...');
  appium.kill();
  process.exit();
});