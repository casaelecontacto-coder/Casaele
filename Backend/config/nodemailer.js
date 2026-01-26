import nodemailer from 'nodemailer';
import * as brevo from '@getbrevo/brevo';

// ============================================
// BREVO HTTP API (Production - Works on Render)
// ============================================
let brevoApiInstance = null;

const getBrevoApi = () => {
  if (brevoApiInstance) return brevoApiInstance;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return null;
  }

  brevoApiInstance = new brevo.TransactionalEmailsApi();
  brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return brevoApiInstance;
};

const sendViaBrevoApi = async (emailOptions) => {
  const api = getBrevoApi();
  if (!api) return null;

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = emailOptions.subject;
  sendSmtpEmail.htmlContent = emailOptions.html;

  // Handle 'from' field - can be string or object
  let fromEmail = process.env.EMAIL_USER;
  let fromName = 'Casa De ELE';

  if (emailOptions.from) {
    if (typeof emailOptions.from === 'string') {
      fromEmail = emailOptions.from;
    } else if (emailOptions.from.address) {
      fromEmail = emailOptions.from.address;
      fromName = emailOptions.from.name || 'Casa De ELE';
    }
  }

  sendSmtpEmail.sender = { email: fromEmail, name: fromName };
  sendSmtpEmail.to = [{ email: emailOptions.to }];

  try {
    const result = await api.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: result.body?.messageId || 'sent' };
  } catch (error) {
    console.error('[Email] Brevo API error:', error.body?.message || error.message);
    return { success: false, error: error.body?.message || error.message };
  }
};

// ============================================
// GMAIL SMTP (Development/Local only)
// ============================================
let cachedTransporter = null;

const createGmailTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
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

  console.log('[Email] Sending to:', emailOptions.to);
  console.log('[Email] Subject:', emailOptions.subject);

  // PRODUCTION: Use Brevo HTTP API (works on Render)
  if (process.env.BREVO_API_KEY) {
    console.log('[Email] Using Brevo HTTP API...');
    const result = await sendViaBrevoApi(emailOptions);
    if (result) {
      const duration = Date.now() - startTime;
      if (result.success) {
        console.log(`[Email] ✅ Sent via Brevo in ${duration}ms`);
      } else {
        console.error(`[Email] ❌ Brevo failed: ${result.error}`);
      }
      return result;
    }
  }

  // DEVELOPMENT: Use Gmail SMTP (only works locally)
  console.log('[Email] Using Gmail SMTP...');
  try {
    const transporter = createGmailTransporter();
    if (!transporter) {
      console.error('[Email] Gmail not configured');
      return { success: false, error: 'Email not configured' };
    }

    const result = await transporter.sendMail(emailOptions);
    const duration = Date.now() - startTime;
    console.log(`[Email] ✅ Sent via Gmail in ${duration}ms`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Email] ❌ Gmail failed after ${duration}ms: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ============================================
// EMAIL TEMPLATES
// ============================================
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
            Please use the OTP code below to verify your email address.
          </p>
          <div style="background-color: white; border: 2px solid #AD1518; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
            <h1 style="margin: 10px 0; font-size: 32px; color: #AD1518; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #999;">This code will expire in 10 minutes</p>
          </div>
        </div>
      </div>
    `
  })
};

// Test email configuration
export const testEmailConfig = async () => {
  if (process.env.BREVO_API_KEY) {
    const api = getBrevoApi();
    if (api) {
      console.log('[Email] Brevo API configured');
      return { success: true, method: 'brevo-api' };
    }
  }

  const transporter = createGmailTransporter();
  if (transporter) {
    try {
      await transporter.verify();
      console.log('[Email] Gmail SMTP configured');
      return { success: true, method: 'gmail' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'No email method configured' };
};
