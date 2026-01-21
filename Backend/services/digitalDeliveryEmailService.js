import { sendEmail } from '../config/nodemailer.js';

/**
 * Generate HTML email template for digital product delivery
 */
function buildDigitalDeliveryEmailTemplate(data) {
  const { customerName, downloadLinks, orderId, supportEmail } = data;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Build download links HTML
  const downloadLinksHTML = downloadLinks
    .map(
      (link) => `
      <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #AD1518;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${link.productName}</h3>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
          ${link.fileCount} ${link.fileCount === 1 ? 'file' : 'files'} included
        </p>
        <p style="margin: 0 0 15px 0; color: #999; font-size: 12px;">
          Downloads remaining: <strong style="color: #AD1518;">${link.downloadsRemaining}/${link.maxDownloads}</strong> •
          Valid until: <strong>${new Date(link.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </p>
        <a href="${frontendUrl}/download/${link.accessToken}"
           style="display: inline-block; background-color: #AD1518; color: white; text-decoration: none;
                  padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px;">
          Download Files
        </a>
      </div>
    `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
      <!-- Header -->
      <div style="background-color: #AD1518; color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Casa De ELE</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your Digital Products Are Ready!</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px 20px; background-color: white;">
        <h2 style="color: #333; margin-bottom: 10px; font-size: 22px;">Hi ${customerName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 14px;">
          Thank you for your purchase! Your digital products are ready to download.
          Click the download buttons below to access your files.
        </p>

        <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 14px;">
          <strong>Order ID:</strong> #${orderId}
        </p>

        <!-- Download Links -->
        <div style="margin: 30px 0;">
          ${downloadLinksHTML}
        </div>

        <!-- Instructions -->
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 15px 0; color: #AD1518; font-size: 16px;">Important Information:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
            <li>Each product can be downloaded <strong>up to 3 times</strong></li>
            <li>Download links are <strong>valid for 30 days</strong> from the date of purchase</li>
            <li>Files are delivered instantly - no waiting required</li>
            <li>Make sure to save your files after downloading</li>
          </ul>
        </div>

        <!-- Security Notice -->
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 13px;">
            <strong>⚠️ Security Notice:</strong> This email and download links are personalized for you.
            Please do not share these links with others as all downloads are tracked and logged.
          </p>
        </div>

        <!-- Support -->
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; line-height: 1.6; margin-bottom: 10px; font-size: 14px;">
            <strong>Need Help?</strong>
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0; font-size: 14px;">
            If you experience any issues downloading your files, please contact us at:
            <a href="mailto:${supportEmail}" style="color: #AD1518; text-decoration: none;">${supportEmail}</a>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
          This is an automated message from Casa De ELE.
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Casa De ELE. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/**
 * Send digital product delivery email to customer
 * @param {Object} emailData - Email configuration data
 * @param {string} emailData.customerEmail - Customer's email address
 * @param {string} emailData.customerName - Customer's name
 * @param {Array} emailData.downloadLinks - Array of download link objects
 * @param {string} emailData.orderId - Order ID for reference
 * @returns {Promise<Object>} Result of email sending operation
 */
export async function sendDigitalProductEmail(emailData) {
  const { customerEmail, customerName, downloadLinks, orderId } = emailData;

  // Validate required fields
  if (!customerEmail || !customerName || !downloadLinks || downloadLinks.length === 0) {
    throw new Error('Missing required email data: customerEmail, customerName, and downloadLinks are required');
  }

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@casadeele.com';

  // Build email template
  const emailHtml = buildDigitalDeliveryEmailTemplate({
    customerName,
    downloadLinks,
    orderId,
    supportEmail
  });

  // Email options
  const emailOptions = {
    from: {
      name: 'Casa De ELE',
      address: process.env.EMAIL_USER
    },
    to: customerEmail,
    subject: `Your Digital Products from Casa De ELE - Order #${orderId}`,
    html: emailHtml
  };

  try {
    const result = await sendEmail(emailOptions);

    if (result.success) {
      console.log('[DigitalDelivery] Email sent successfully to:', customerEmail);
      return {
        success: true,
        messageId: result.messageId,
        recipient: customerEmail
      };
    } else {
      console.error('[DigitalDelivery] Email sending failed:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('[DigitalDelivery] Email service error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send resend download email (for manual admin triggers)
 * @param {Object} emailData - Same structure as sendDigitalProductEmail
 * @returns {Promise<Object>} Result of email sending operation
 */
export async function resendDigitalProductEmail(emailData) {
  // Use the same function but log as resend
  console.log('[DigitalDelivery] Resending email to:', emailData.customerEmail);
  return await sendDigitalProductEmail(emailData);
}
