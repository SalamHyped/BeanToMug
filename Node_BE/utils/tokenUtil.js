const crypto = require('crypto');

// Secret key for tokens - in production, store this in environment variables
const SECRET_KEY = 'beanToMugSecretKey123';

// Token expiration time in milliseconds (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Generate a secure token for email verification
 * @param {string} email - User's email
 * @returns {string} - Generated token
 */
const generateVerificationToken = (email) => {
  const timestamp = Date.now();
  const data = `${email}:${timestamp}`;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');
  
  // Combine data and signature, then encode
  const token = Buffer.from(`${data}:${signature}`).toString('base64');
  return token;
};

/**
 * Verify a token is valid and not expired
 * @param {string} token - The verification token
 * @param {string} email - The user's email
 * @returns {boolean} - Whether the token is valid
 */
const verifyToken = (token, email) => {
  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString();
    const [tokenEmail, timestamp, signature] = decoded.split(':');
    
    // Check if email matches
    if (email !== tokenEmail) {
      return false;
    }
    
    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY) {
      return false;
    }
    
    // Verify the signature
    const data = `${tokenEmail}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

module.exports = {
  generateVerificationToken,
  verifyToken
}; 