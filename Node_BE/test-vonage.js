const vonageService = require('./utils/vonageService');

console.log('Testing Vonage Configuration...\n');

// Test configuration
const config = vonageService.testConfiguration();

console.log('\nConfiguration Details:');
console.log('- API Key configured:', config.apiKey ? '✅ Yes' : '❌ No');
console.log('- API Secret configured:', config.apiSecret ? '✅ Yes' : '❌ No');
console.log('- From Number configured:', config.fromNumber ? '✅ Yes' : '❌ No');
console.log('- Overall configured:', config.configured ? '✅ Yes' : '❌ No');

if (!config.configured) {
  console.log('\n❌ Vonage is not properly configured!');
  console.log('Please check your .env file and ensure the following variables are set:');
  console.log('- VONAGE_API_KEY');
  console.log('- VONAGE_API_SECRET');
  process.exit(1);
}

console.log('\n✅ Vonage appears to be properly configured!');
console.log('\nNote: This test only checks configuration, not actual SMS sending.');
console.log('To test SMS sending, try using the /auth/send-sms-verification endpoint.'); 