import express from 'express';
import { sendEmail, testEmailConfig } from '../config/nodemailer.js';

const router = express.Router();

// Test email configuration
router.get('/test-email-config', async (req, res) => {
  console.log('[Test] Testing email configuration...');

  const result = await testEmailConfig();

  if (result.success) {
    res.json({
      success: true,
      message: 'Email configuration is valid. SMTP connection successful.'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Email configuration failed',
      error: result.error
    });
  }
});

// Send test email
router.post('/test-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    });
  }

  console.log(`[Test] Sending test email to: ${email}`);

  const emailOptions = {
    from: {
      name: 'Casa De ELE - Test',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'Test Email - Casa De ELE Digital Product Delivery',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
        <!-- Header -->
        <div style="background-color: #AD1518; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Casa De ELE</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Email Configuration Test</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px 20px; background-color: white;">
          <h2 style="color: #333; margin-bottom: 10px; font-size: 22px;">✅ Email Test Successful!</h2>

          <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 14px;">
            Congratulations! Your email configuration is working correctly.
          </p>

          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #AD1518; font-size: 16px;">Test Details:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
              <li>Email service: ${process.env.EMAIL_SERVICE || 'gmail'}</li>
              <li>Sender: ${process.env.EMAIL_USER}</li>
              <li>Recipient: ${email}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
          </div>

          <p style="color: #666; line-height: 1.6; margin-top: 20px; font-size: 14px;">
            Your digital product delivery emails will be sent from the same configuration.
            If you received this email, customers will receive their download links successfully.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
            This is a test message from Casa De ELE.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Casa De ELE. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmail(emailOptions);

    if (result.success) {
      console.log('[Test] Test email sent successfully:', result.messageId);
      res.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId
      });
    } else {
      console.error('[Test] Test email failed:', result.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[Test] Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

export default router;
