import nodemailer from 'nodemailer';

// Cache the transporter to reuse connections
let cachedTransporter = null;

// Create transporter using environment variables
const createTransporter = () => {
  // Reuse cached transporter in production for better performance
  if (cachedTransporter && process.env.NODE_ENV === 'production') {
    return cachedTransporter;
  }

  // Log to help debug (only on first creation)
  if (!cachedTransporter) {
    console.log('[Email Config] Creating transporter with:', {
      service: process.env.EMAIL_SERVICE || 'gmail',
      user: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-10) : 'MISSING',
      pass: process.env.EMAIL_PASS ? '***' : 'MISSING'
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[Email Config] ERROR: EMAIL_USER or EMAIL_PASS not set in environment variables!');
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Connection settings for reliability
    pool: true, // Use pooled connections
    maxConnections: 5,
    maxMessages: 100,
    // Timeouts to prevent hanging
    connectionTimeout: 10000, // 10 seconds to connect
    greetingTimeout: 10000,   // 10 seconds for greeting
    socketTimeout: 30000,     // 30 seconds for socket operations
    // TLS settings
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  cachedTransporter = transporter;
  return transporter;
};

// Email templates
export const emailTemplates = {
  adminOTP: (email, otp) => ({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Admin Account Verification - OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #AD1518; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Casa De ELE</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Account Verification</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Casa De ELE Admin Panel</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            You have been invited to join the Casa De ELE admin panel. To complete your account setup, 
            please use the OTP code below to verify your email address.
          </p>
          
          <div style="background-color: white; border: 2px solid #AD1518; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
            <h1 style="margin: 10px 0; font-size: 32px; color: #AD1518; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #999;">This code will expire in 10 minutes</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you didn't request this admin account, please ignore this email or contact the main administrator.
          </p>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message from Casa De ELE. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function with timeout
export const sendEmail = async (emailOptions) => {
  const startTime = Date.now();
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.error('[Email] Transporter not configured - check EMAIL_USER and EMAIL_PASS');
      return { success: false, error: 'Email not configured' };
    }

    // Add timeout wrapper to prevent hanging
    const sendWithTimeout = (timeout = 30000) => {
      return Promise.race([
        transporter.sendMail(emailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout after ' + timeout + 'ms')), timeout)
        )
      ]);
    };

    const result = await sendWithTimeout(30000); // 30 second timeout
    const duration = Date.now() - startTime;
    console.log(`[Email] Sent successfully in ${duration}ms:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Email] Failed after ${duration}ms:`, error.message);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email not configured - check environment variables' };
    }
    await transporter.verify();
    console.log('[Email] Configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('[Email] Configuration error:', error.message);
    return { success: false, error: error.message };
  }
};
