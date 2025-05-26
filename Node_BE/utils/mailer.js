const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'shibli.salam30@gmail.com', // your email
    pass: 'azduwstqpnfkyhvo'  // your password or app-specific password
  }
});

// Send verification email
const sendVerificationEmail = async (email, token) => {
  // Create verification URL (replace with your frontend URL in production)
  const verificationUrl = `http://localhost:5173/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"BeanToMug Coffee Shop" <noreply@beantomug.com>',
    to: email,
    subject: 'Please verify your email address',
    text: `Welcome to BeanToMug Coffee Shop! Please verify your email by clicking the following link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5d4037;">Welcome to BeanToMug Coffee Shop!</h2>
        <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #5d4037; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">Verify Email Address</a>
        <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>BeanToMug Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"BeanToMug Coffee Shop" <noreply@beantomug.com>',
    to: email,
    subject: 'Reset your password',
    text: `You requested to reset your password. Please click the following link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5d4037;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #5d4037; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>BeanToMug Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
}; 