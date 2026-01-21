# Email Setup Guide for Digital Product Delivery

## Issue: Emails Not Being Sent

If digital product delivery emails are not being received, follow these steps:

## Step 1: Generate Gmail App Password

Google requires **App Passwords** for third-party applications. Your regular Gmail password won't work.

### How to Create Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Under "How you sign in to Google", select **2-Step Verification**
   - Follow the prompts to enable it

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Enter "Casa De ELE LMS"
   - Click **Generate**
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Update Backend/.env file**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=visheshvasu2305@gmail.com
   EMAIL_PASS=abcdefghijklmnop  # Replace with your 16-character App Password (no spaces)
   ```

## Step 2: Verify Email Configuration

### Option A: Test via API Endpoint

1. Start your backend server:
   ```bash
   cd Backend
   npm start
   ```

2. Test email delivery using the test endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com"}'
   ```

3. Check the backend console logs for:
   - `[Email Config] Creating transporter with:` - Shows if credentials are loaded
   - `[Email] Test email sent successfully` - Confirms email was sent

### Option B: Test via Admin Panel

1. Create a test digital product with productType "Digital"
2. Upload a test file (PDF, MP3, etc.)
3. Make a test purchase
4. Check backend console for:
   ```
   [Order] Found X digital product(s), initiating delivery...
   [Order] Created X download record(s)
   [Order] Digital delivery email sent successfully
   ```

## Step 3: Common Issues & Solutions

### Issue 1: "Missing credentials for PLAIN"
**Solution**: Email credentials not loaded from .env
- Restart the backend server after updating .env
- Verify .env file is in the Backend/ directory
- Check that EMAIL_USER and EMAIL_PASS have no extra spaces

### Issue 2: "Invalid login credentials"
**Solution**: Using regular password instead of App Password
- Generate and use Gmail App Password (see Step 1)
- Remove any spaces from the 16-character App Password

### Issue 3: "Connection timeout"
**Solution**: Gmail blocking connection
- Ensure 2-Step Verification is enabled
- Try the alternative SMTP configuration below

### Issue 4: Emails going to Spam
**Solution**:
- Check recipient's spam folder
- Add sender email to recipient's contacts
- For production, use a custom domain email (not Gmail)

## Alternative SMTP Configuration (if Gmail doesn't work)

If Gmail App Password still doesn't work, use direct SMTP configuration:

```javascript
// Backend/config/nodemailer.js
return nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

## Production Recommendations

For production deployment:

1. **Use a Professional Email Service**:
   - SendGrid (https://sendgrid.com/) - 100 emails/day free
   - Mailgun (https://www.mailgun.com/) - 5,000 emails/month free
   - AWS SES (https://aws.amazon.com/ses/) - Very cheap, highly reliable

2. **Use Custom Domain Email**:
   - Example: `noreply@casadeele.com` or `support@casadeele.com`
   - More professional and better deliverability

3. **Update Environment Variables**:
   ```env
   FRONTEND_URL=https://casadeele.com
   SUPPORT_EMAIL=support@casadeele.com
   EMAIL_USER=noreply@casadeele.com
   ```

## Testing Checklist

- [ ] App Password generated from Google Account
- [ ] .env file updated with App Password (no spaces)
- [ ] Backend server restarted
- [ ] Email test endpoint returns success
- [ ] Test order with digital product sends email
- [ ] Email arrives in inbox (check spam folder too)
- [ ] Download links in email work correctly

## Need Help?

If emails still aren't working after following this guide:

1. Check backend console logs for detailed error messages
2. Verify Gmail account doesn't have security blocks
3. Try sending a test email using the test endpoint
4. Consider switching to SendGrid or another email service for production
