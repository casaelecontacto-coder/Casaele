import nodemailer from 'nodemailer';

// Create Gmail transporter
let cachedTransporter = null;

const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[Email] ERROR: EMAIL_USER or EMAIL_PASS not set!');
    return null;
  }

  console.log('[Email] Creating Gmail transporter for:', process.env.EMAIL_USER);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  cachedTransporter = transporter;
  return transporter;
};

// Send email function
export const sendEmail = async (emailOptions) => {
  const startTime = Date.now();
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.error('[Email] Transporter not configured');
      return { success: false, error: 'Email not configured' };
    }

    const result = await transporter.sendMail(emailOptions);
    const duration = Date.now() - startTime;
    console.log(`[Email] Sent successfully in ${duration}ms:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Email] Failed after ${duration}ms:`, error.message);
    return { success: false, error: error.message };
  }
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
