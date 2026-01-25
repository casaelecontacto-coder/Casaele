import { sendEmail } from '../config/nodemailer.js';

/**
 * Generate HTML email template for purchase confirmation
 */
function buildPurchaseConfirmationEmailTemplate(data) {
  const {
    customerName,
    orderId,
    orderItems,
    totalPrice,
    discountAmount,
    itemsPrice,
    shippingAddress,
    supportEmail,
    currency = 'INR'
  } = data;

  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  };
  const currencySymbol = currencySymbols[currency] || currency;

  // Build order items HTML
  const orderItemsHTML = orderItems
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 15px 10px; color: #333; font-size: 14px;">
          ${item.name}
          ${item.selectedLevel ? `<br><span style="color: #666; font-size: 12px;">Level: ${item.selectedLevel}</span>` : ''}
          ${item.selectedFormat ? `<br><span style="color: #666; font-size: 12px;">Format: ${item.selectedFormat}</span>` : ''}
        </td>
        <td style="padding: 15px 10px; color: #666; font-size: 14px; text-align: center;">${item.qty}</td>
        <td style="padding: 15px 10px; color: #333; font-size: 14px; text-align: right;">${currencySymbol}${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
      <!-- Header -->
      <div style="background-color: #AD1518; color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Casa De ELE</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
      </div>

      <!-- Success Banner -->
      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px 20px; margin: 0;">
        <p style="margin: 0; color: #155724; font-size: 16px; font-weight: bold;">
          ✓ Payment Successful!
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 30px 20px; background-color: white;">
        <h2 style="color: #333; margin-bottom: 10px; font-size: 22px;">Thank you, ${customerName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 14px;">
          We've received your order and it's being processed. You'll receive another email when your order is ready.
        </p>

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
          <p style="margin: 0; color: #333; font-size: 14px;">
            <strong>Order Number:</strong> #${orderId}
          </p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
            Order Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <!-- Order Items -->
        <h3 style="color: #AD1518; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #AD1518; padding-bottom: 10px;">
          Order Details
        </h3>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f9f9f9;">
              <th style="padding: 12px 10px; color: #666; font-size: 13px; text-align: left; border-bottom: 2px solid #e0e0e0;">Item</th>
              <th style="padding: 12px 10px; color: #666; font-size: 13px; text-align: center; border-bottom: 2px solid #e0e0e0;">Qty</th>
              <th style="padding: 12px 10px; color: #666; font-size: 13px; text-align: right; border-bottom: 2px solid #e0e0e0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>

        <!-- Price Summary -->
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666; font-size: 14px;">Subtotal:</span>
            <span style="color: #333; font-size: 14px;">${currencySymbol}${itemsPrice.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #28a745; font-size: 14px;">Discount:</span>
            <span style="color: #28a745; font-size: 14px;">-${currencySymbol}${discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="border-top: 2px solid #AD1518; padding-top: 10px; margin-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #333; font-size: 18px; font-weight: bold;">Total Paid:</span>
              <span style="color: #AD1518; font-size: 18px; font-weight: bold;">${currencySymbol}${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Billing Details -->
        <h3 style="color: #AD1518; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #AD1518; padding-bottom: 10px;">
          Billing Details
        </h3>

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <p style="margin: 0 0 5px 0; color: #333; font-size: 14px; font-weight: bold;">${shippingAddress.fullName}</p>
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${shippingAddress.address}</p>
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${shippingAddress.city}${shippingAddress.state ? `, ${shippingAddress.state}` : ''} ${shippingAddress.postalCode}</p>
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${shippingAddress.country}</p>
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Email: ${shippingAddress.email}</p>
          ${shippingAddress.phone ? `<p style="margin: 0; color: #666; font-size: 14px;">Phone: ${shippingAddress.phone}</p>` : ''}
        </div>

        <!-- What's Next -->
        <div style="background-color: #e8f4fd; border-left: 4px solid #007bff; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #004085; font-size: 14px;">What's Next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #004085; font-size: 13px; line-height: 1.8;">
            <li>If you purchased digital products, you'll receive a separate email with download links.</li>
            <li>For physical products, we'll notify you when your order ships.</li>
            <li>You can view your order history in your account dashboard.</li>
          </ul>
        </div>

        <!-- Support -->
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; line-height: 1.6; margin-bottom: 10px; font-size: 14px;">
            <strong>Questions about your order?</strong>
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0; font-size: 14px;">
            Contact us at:
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
          &copy; ${new Date().getFullYear()} Casa De ELE. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/**
 * Send purchase confirmation email to customer
 * @param {Object} emailData - Email configuration data
 * @param {string} emailData.customerEmail - Customer's email address
 * @param {string} emailData.customerName - Customer's name
 * @param {string} emailData.orderId - Order ID for reference
 * @param {Array} emailData.orderItems - Array of order items
 * @param {number} emailData.totalPrice - Total amount paid
 * @param {number} emailData.itemsPrice - Subtotal before discount
 * @param {number} emailData.discountAmount - Discount amount applied
 * @param {Object} emailData.shippingAddress - Billing/shipping address
 * @param {string} emailData.currency - Currency code (INR, USD, EUR)
 * @returns {Promise<Object>} Result of email sending operation
 */
export async function sendPurchaseConfirmationEmail(emailData) {
  const {
    customerEmail,
    customerName,
    orderId,
    orderItems,
    totalPrice,
    itemsPrice,
    discountAmount = 0,
    shippingAddress,
    currency = 'INR'
  } = emailData;

  // Validate required fields
  if (!customerEmail || !customerName || !orderId || !orderItems || orderItems.length === 0) {
    throw new Error('Missing required email data: customerEmail, customerName, orderId, and orderItems are required');
  }

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@casadeele.com';

  // Build email template
  const emailHtml = buildPurchaseConfirmationEmailTemplate({
    customerName,
    orderId,
    orderItems,
    totalPrice,
    itemsPrice,
    discountAmount,
    shippingAddress,
    supportEmail,
    currency
  });

  // Email options
  const emailOptions = {
    from: {
      name: 'Casa De ELE',
      address: process.env.EMAIL_USER
    },
    to: customerEmail,
    subject: `Order Confirmation - Casa De ELE #${orderId}`,
    html: emailHtml
  };

  try {
    const result = await sendEmail(emailOptions);

    if (result.success) {
      console.log('[PurchaseConfirmation] Email sent successfully to:', customerEmail);
      return {
        success: true,
        messageId: result.messageId,
        recipient: customerEmail
      };
    } else {
      console.error('[PurchaseConfirmation] Email sending failed:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('[PurchaseConfirmation] Email service error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
