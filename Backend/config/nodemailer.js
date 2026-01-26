import nodemailer from 'nodemailer';
import * as brevo from '@getbrevo/brevo';

// ============================================
// BREVO HTTP API (Works on Render - no SMTP needed)
// ============================================
let brevoApiInstance = null;

const getBrevoApi = () => {
  if (brevoApiInstance) return brevoApiInstance;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log('[Email] BREVO_API_KEY not set, falling back to SMTP');
    return null;
  }

  brevoApiInstance = new brevo.TransactionalEmailsApi();
  brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  console.log('[Email] Using Brevo HTTP API');
  return brevoApiInstance;
};

// Send email via Brevo HTTP API
const sendViaBrevoApi = async (emailOptions) => {
  const api = getBrevoApi();
  if (!api) return null; // Fall back to SMTP

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = emailOptions.subject;
  sendSmtpEmail.htmlContent = emailOptions.html;
  sendSmtpEmail.sender = {
    email: emailOptions.from || process.env.EMAIL_USER,
    name: 'Casa De ELE'
  };
  sendSmtpEmail.to = [{ email: emailOptions.to }];

  try {
    const result = await api.sendTransacEmail(sendSmtpEmail);
    console.log('[Email] Sent via Brevo API:', result.body?.messageId || 'success');
    return { success: true, messageId: result.body?.messageId };
  } catch (error) {
    console.error('[Email] Brevo API error:', error.body?.message || error.message);
    return { success: false, error: error.body?.message || error.message };
  }
};

// ============================================
// SMTP FALLBACK (For development)
// ============================================
let cachedTransporter = null;

const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[Email Config] ERROR: EMAIL_USER or EMAIL_PASS not set!');
    return null;
  }

  let transportConfig;

  if (process.env.SMTP_HOST) {
    transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    };
    console.log('[Email Config] SMTP configured:', process.env.SMTP_HOST);
  } else {
    transportConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };
    console.log('[Email Config] Gmail configured');
  }

  const transporter = nodemailer.createTransport({
    ...transportConfig,
    pool: true,
    maxConnections: 5,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false }
  });

  cachedTransporter = transporter;
  return transporter;
};

// ============================================
// MAIN EMAIL FUNCTION
// ============================================
export const sendEmail = async (emailOptions) => {
  const startTime = Date.now();

  // Try Brevo HTTP API first (works on Render)
  if (process.env.BREVO_API_KEY) {
    const result = await sendViaBrevoApi(emailOptions);
    if (result) {
      const duration = Date.now() - startTime;
      if (result.success) {
        console.log(`[Email] Sent in ${duration}ms via Brevo API`);
      }
      return result;
    }
  }

  // Fallback to SMTP (for development)
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email not configured' };
    }

    const sendWithTimeout = (timeout = 30000) => {
      return Promise.race([
        transporter.sendMail(emailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email timeout')), timeout)
        )
      ]);
    };

    const result = await sendWithTimeout(30000);
    const duration = Date.now() - startTime;
    console.log(`[Email] Sent in ${duration}ms via SMTP:`, result.messageId);
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
  // Test Brevo API first
  if (process.env.BREVO_API_KEY) {
    try {
      const api = getBrevoApi();
      if (api) {
        console.log('[Email] Brevo API configured and ready');
        return { success: true, method: 'brevo-api' };
      }
    } catch (error) {
      console.error('[Email] Brevo API test failed:', error.message);
    }
  }

  // Test SMTP
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email not configured' };
    }
    await transporter.verify();
    console.log('[Email] SMTP configuration valid');
    return { success: true, method: 'smtp' };
  } catch (error) {
    console.error('[Email] Config error:', error.message);
    return { success: false, error: error.message };
  }
};
