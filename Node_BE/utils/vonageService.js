const { Vonage } = require('@vonage/server-sdk');
require('dotenv').config();

class VonageService {
  constructor() {
    this.vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY || "0d3ad4fc",
      apiSecret: process.env.VONAGE_API_SECRET || "wT6PPK6foCs5xptD"
    });
    this.fromNumber = process.env.VONAGE_FROM_NUMBER;
    this.isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  }

  /**
   * Check if Vonage is properly configured
   * @returns {boolean} - Whether Vonage is configured
   */
  isConfigured() {
    return !!(process.env.VONAGE_API_KEY && 
              process.env.VONAGE_API_SECRET);
  }

  /**
   * Send SMS verification code to user
   * @param {string} toPhone - User's phone number
   * @param {string} verificationCode - 6-digit verification code
   * @returns {Promise} - Vonage message response
   */
  async sendVerificationCode(toPhone, verificationCode) {
    try {
      // Check if Vonage is configured
      if (!this.isConfigured()) {
        throw new Error('Vonage is not properly configured. Please check your environment variables.');
      }

      // Format phone number to E.164 format
      const formattedPhone = this.formatPhoneNumber(toPhone);
      
      console.log(`Attempting to send SMS to: ${formattedPhone}`);
      console.log(`Using API Key: ${process.env.VONAGE_API_KEY || 'Using fallback key'}`);
      console.log(`From Number: ${this.fromNumber || 'BeanToMug (default)'}`);
      
      const message = `🔐 BeanToMug Verification Code\n\n` +
                     `Your verification code is: ${verificationCode}\n\n` +
                     `This code will expire in 10 minutes.\n\n` +
                     `If you didn't request this code, please ignore this message.`;

      // DEVELOPMENT MODE: Show verification code in console
      if (this.isDevelopment) {
        console.log('\n🔐 DEVELOPMENT MODE - VERIFICATION CODE:');
        console.log('='.repeat(50));
        console.log(`📱 Phone: ${formattedPhone}`);
        console.log(`🔢 Verification Code: ${verificationCode}`);
        console.log(`⏰ Expires: 10 minutes`);
        console.log('='.repeat(50));
        console.log('💡 Use this code to test phone verification in your app!');
        console.log('📋 In production, this code would be sent via SMS.\n');
      }

      // Use the correct Vonage SMS API
      const response = await this.vonage.sms.send({
        from: this.fromNumber || 'BeanToMug',
        to: formattedPhone,
        text: message
      });

      console.log(`SMS API Response:`, JSON.stringify(response, null, 2));
      
      if (response.messages && response.messages[0]) {
        const messageStatus = response.messages[0].status;
        console.log(`Message Status: ${messageStatus}`);
        
        if (messageStatus === '0') {
          console.log(`✅ Verification SMS sent successfully to ${formattedPhone}. Message ID: ${response.messages[0]['message-id']}`);
          
          // Additional development info
          if (this.isDevelopment) {
            console.log('\n🎯 To test in your React app:');
            console.log('1. Go to Profile page');
            console.log('2. Enter phone number: ' + formattedPhone);
            console.log('3. Click "Send Verification Code"');
            console.log('4. Enter the code shown above: ' + verificationCode);
            console.log('5. Click "Verify Code"\n');
          }
        } else {
          console.log(`❌ SMS failed to send. Status: ${messageStatus}, Error: ${response.messages[0]['error-text'] || 'Unknown error'}`);
          throw new Error(`SMS failed to send: ${response.messages[0]['error-text'] || 'Unknown error'}`);
        }
      } else {
        console.log(`❌ Unexpected response format:`, response);
        throw new Error('Unexpected response format from Vonage API');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error sending verification SMS:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      });
      throw error;
    }
  }

  /**
   * Send welcome SMS after successful registration
   * @param {string} toPhone - User's phone number
   * @param {string} username - User's username
   * @returns {Promise} - Vonage message response
   */
  async sendWelcomeSMS(toPhone, username) {
    try {
      // Check if Vonage is configured
      if (!this.isConfigured()) {
        throw new Error('Vonage is not properly configured. Please check your environment variables.');
      }

      const formattedPhone = this.formatPhoneNumber(toPhone);
      
      const message = `🎉 Welcome to BeanToMug, ${username}!\n\n` +
                     `Your account has been successfully created.\n\n` +
                     `You can now place orders and track them in real-time.\n\n` +
                     `Thank you for choosing BeanToMug! ☕`;

      // Use the correct Vonage SMS API
      const response = await this.vonage.sms.send({
        from: this.fromNumber || 'BeanToMug',
        to: formattedPhone,
        text: message
      });

      console.log(`Welcome SMS sent successfully to ${formattedPhone}. Message ID: ${response.messages[0]['message-id']}`);
      return response;
    } catch (error) {
      console.error('Error sending welcome SMS:', error);
      throw error;
    }
  }

  /**
   * Generate a random 6-digit verification code
   * @returns {string} - 6-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it already starts with +, return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // If it's a US number without country code, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it has 11 digits and starts with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // For Israeli numbers (972)
    if (cleaned.startsWith('972')) {
      return `+${cleaned}`;
    }
    
    // If it has international format, add +
    if (cleaned.length >= 10) {
      return `+${cleaned}`;
    }
    
    // Default: assume it's a US number
    return `+1${cleaned}`;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  validatePhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Test Vonage configuration
   * @returns {Object} - Configuration status
   */
  testConfiguration() {
    const config = {
      apiKey: !!process.env.VONAGE_API_KEY,
      apiSecret: !!process.env.VONAGE_API_SECRET,
      fromNumber: !!process.env.VONAGE_FROM_NUMBER,
      configured: this.isConfigured()
    };
    
    console.log('Vonage Configuration Status:', config);
    return config;
  }
}

module.exports = new VonageService(); 