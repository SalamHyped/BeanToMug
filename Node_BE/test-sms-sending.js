const vonageService = require('./utils/vonageService');

async function testSmsSending() {
  console.log('🧪 Testing SMS Sending Functionality...\n');
  
  // Test phone number (replace with your actual phone number)
  const testPhoneNumber = process.argv[2] || '1234567890';
  console.log(`Testing with phone number: ${testPhoneNumber}`);
  
  try {
    // Test configuration first
    const config = vonageService.testConfiguration();
    console.log('\n📋 Configuration Status:');
    console.log('- API Key:', config.apiKey ? '✅ Set' : '❌ Missing');
    console.log('- API Secret:', config.apiSecret ? '✅ Set' : '❌ Missing');
    console.log('- From Number:', config.fromNumber ? '✅ Set' : '❌ Missing');
    
    if (!config.configured) {
      console.log('\n❌ Vonage is not properly configured!');
      console.log('Please set the following environment variables:');
      console.log('- VONAGE_API_KEY');
      console.log('- VONAGE_API_SECRET');
      console.log('- VONAGE_FROM_NUMBER (optional)');
      return;
    }
    
    // Generate a test verification code
    const testCode = vonageService.generateVerificationCode();
    console.log(`\n🔢 Generated test verification code: ${testCode}`);
    
    // Test phone number formatting
    const formattedPhone = vonageService.formatPhoneNumber(testPhoneNumber);
    console.log(`📱 Formatted phone number: ${formattedPhone}`);
    
    // Test phone number validation
    const isValid = vonageService.validatePhoneNumber(testPhoneNumber);
    console.log(`✅ Phone number validation: ${isValid ? 'Valid' : 'Invalid'}`);
    
    if (!isValid) {
      console.log('\n❌ Phone number format is invalid!');
      console.log('Please provide a valid phone number (10-15 digits)');
      return;
    }
    
    console.log('\n📤 Attempting to send SMS...');
    
    // Attempt to send SMS
    const response = await vonageService.sendVerificationCode(testPhoneNumber, testCode);
    
    console.log('\n✅ SMS sending test completed successfully!');
    console.log('Check your phone for the verification code.');
    
  } catch (error) {
    console.log('\n❌ SMS sending test failed!');
    console.log('Error:', error.message);
    
    // Common error solutions
    console.log('\n🔧 Common Solutions:');
    console.log('1. Check if your Vonage account has sufficient credits');
    console.log('2. Verify your phone number is in the correct format');
    console.log('3. Ensure your Vonage API credentials are valid');
    console.log('4. Check if your Vonage account is active');
    console.log('5. For trial accounts, verify your phone number in Vonage console');
  }
}

// Run the test
testSmsSending(); 