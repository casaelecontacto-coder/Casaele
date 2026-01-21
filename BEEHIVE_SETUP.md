# Beehive Newsletter Integration - Setup Guide

This guide will help you set up Beehive newsletter integration for your LMS platform with double opt-in email confirmation.

## Overview

The newsletter subscription system now uses Beehive platform instead of storing subscriptions directly in the database. This provides:

- **Double Opt-In**: Users must confirm their email before being subscribed
- **Professional Newsletter Platform**: Leverage Beehive's email delivery infrastructure
- **Better Deliverability**: Higher email open rates with professional newsletter service
- **Advanced Analytics**: Track opens, clicks, and subscriber engagement through Beehive dashboard

## Prerequisites

1. **Beehive Account**: Create an account at [https://www.beehiiv.com/](https://www.beehiiv.com/)
2. **Publication**: Set up your publication in Beehive dashboard

## Step-by-Step Setup

### 1. Get Beehive API Credentials

#### Get Your API Key:
1. Log in to your Beehive account
2. Navigate to **Settings** → **Integrations**
3. Scroll to **API** section
4. Click **Generate API Key**
5. Copy the generated API key (it will look like: `bh_api_xxxxxxxxxxxxx`)

#### Get Your Publication ID:
1. In Beehive dashboard, go to **Settings** → **Publication**
2. Find your **Publication ID** (it will look like: `pub_xxxxxxxxxxxxx`)
3. Alternatively, check the URL when viewing your publication settings

### 2. Update Environment Variables

Open `Backend/.env` file and replace the placeholder values:

```env
# Beehive Newsletter Integration
BEEHIVE_API_KEY=bh_api_your_actual_api_key_here
BEEHIVE_PUBLICATION_ID=pub_your_actual_publication_id_here
```

**Important**: Keep these credentials secure and never commit them to version control.

### 3. Configure Beehive Settings

In your Beehive dashboard:

1. **Enable Double Opt-In**:
   - Go to Settings → Email Settings
   - Enable "Require email confirmation"
   - Customize your confirmation email template

2. **Welcome Email** (Optional):
   - Configure a welcome email sent after confirmation
   - Add your branding and introduction

3. **Custom Fields** (Optional):
   - Add custom fields for role segmentation (Teacher, Student, Explorer)
   - This will help you send targeted content

### 4. Restart Backend Server

After updating environment variables:

```bash
cd Backend
npm run dev
```

The server will now use Beehive for all newsletter subscriptions.

## How It Works

### User Flow

1. **User subscribes** on your website
2. **Beehive sends confirmation email** to the user
3. **User clicks confirmation link** in email
4. **Subscription is activated** in Beehive
5. **Status is synced** in your database

### Technical Flow

```
Frontend (Newsletter.jsx)
    ↓
Backend API (/api/subscribers/public)
    ↓
Beehive Service (beehiveService.js)
    ↓
Beehive API (Double Opt-In)
    ↓
Confirmation Email Sent
    ↓
User Confirms via Email
    ↓
Subscription Active in Beehive
```

## Database Schema

Subscribers are now stored with additional fields:

```javascript
{
  email: String,
  name: String,
  confirmationStatus: 'pending' | 'confirmed' | 'failed' | 'unsubscribed',
  confirmedAt: Date,
  beehiveSubscriptionId: String,
  beehiveData: Object,
  source: 'beehive',
  tags: [String],  // ['Teacher', 'Student', 'Explorer']
  retryCount: Number,
  lastRetryAt: Date
}
```

## Testing the Integration

### 1. Test Subscription Flow

1. Go to your website's newsletter section
2. Enter a test email address
3. Submit the form
4. Check that you see: **"Please check your email to confirm your subscription"**
5. Check the test email inbox for Beehive confirmation email
6. Click the confirmation link
7. Verify subscription is active in Beehive dashboard

### 2. Verify in Admin Panel

1. Log in to admin panel
2. Go to **Subscribers** page
3. Find your test subscription
4. Check that `confirmationStatus` is `'pending'` initially
5. After email confirmation, it should update to `'confirmed'`

### 3. Test Error Handling

Test various scenarios:
- Invalid email format
- Already subscribed email
- Network failures (simulated)
- Missing API credentials

## User Experience

### Success State

When a user subscribes successfully, they will see:

```
✓ Check Your Email

Confirmation Email Sent!
Please check your email to confirm your subscription
Don't forget to check your spam folder if you don't see it in your inbox.
```

### Already Subscribed

If email is already subscribed:

```
✓ Already Subscribed

You are already subscribed to our newsletter
```

### Error State

If there's an error:

```
⚠ Unable to connect to newsletter service. Please try again later
```

## Monitoring and Maintenance

### Check Integration Health

The Beehive service includes a health check function:

```javascript
import { checkBeehiveHealth } from './services/beehiveService.js';

const health = await checkBeehiveHealth();
console.log(health);
// { healthy: true, configured: true, message: 'Beehive integration is healthy' }
```

### View Logs

All Beehive API calls are logged with the `[Beehive]` prefix:

```bash
# Check backend logs
cd Backend
npm run dev

# Look for:
[Beehive] Successfully subscribed: user@example.com
[Beehive] Subscription error: <error details>
```

### Retry Failed Subscriptions

The system tracks failed subscriptions with `retryCount`. You can implement a cron job to retry failed subscriptions:

```javascript
// Find failed subscriptions
const failed = await Subscriber.find({
  confirmationStatus: 'failed',
  retryCount: { $lt: 3 }
});

// Retry each
for (const subscriber of failed) {
  await retrySubscription(subscriber);
}
```

## API Endpoints

### Public Subscribe
```
POST /api/subscribers/public
Body: { email, role, name }
Response: {
  success: true,
  message: "Please check your email to confirm your subscription",
  requiresConfirmation: true
}
```

### Admin - Get Subscribers
```
GET /api/subscribers
Headers: { Authorization: Bearer <token> }
Response: { subscribers, total, currentPage, totalPages }
```

### Admin - Unsubscribe User
```
PUT /api/subscribers/:id/unsubscribe
Headers: { Authorization: Bearer <token> }
```

## Troubleshooting

### Issue: "Beehive API credentials are not configured"

**Solution**:
- Verify `BEEHIVE_API_KEY` and `BEEHIVE_PUBLICATION_ID` are set in `.env`
- Restart backend server after updating `.env`

### Issue: Confirmation emails not arriving

**Solution**:
- Check Beehive dashboard for delivery status
- Verify email is not in spam folder
- Check Beehive email settings are enabled
- Verify your Beehive account is active

### Issue: "Already subscribed" but user never confirmed

**Solution**:
- Check Beehive dashboard for subscription status
- Delete the subscriber from database to allow re-subscription
- Or manually update `confirmationStatus` to `'failed'` to trigger retry

### Issue: API rate limiting errors

**Solution**:
- Beehive has rate limits (usually 100 req/min)
- Implement exponential backoff
- Consider caching subscriber status

## Security Best Practices

1. **Never expose API credentials**:
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Validate email addresses**:
   - Frontend and backend validation
   - Sanitize inputs

3. **Rate limiting**:
   - Implement rate limiting on subscription endpoint
   - Prevent abuse

4. **HTTPS only**:
   - Always use HTTPS in production
   - Secure API communication

## Migration from Old System

If you have existing subscribers in the database:

1. **Export existing subscribers**:
```bash
# From admin panel → Subscribers → Export to CSV
```

2. **Import to Beehive**:
- Use Beehive's CSV import feature
- Map fields: email, name, tags

3. **Update database records**:
```javascript
await Subscriber.updateMany(
  { source: 'website' },
  {
    source: 'beehive',
    confirmationStatus: 'confirmed',
    confirmedAt: new Date()
  }
);
```

## Support

For issues with:
- **Beehive Platform**: Contact [Beehive Support](https://www.beehiiv.com/support)
- **Integration Code**: Check logs and review this documentation
- **Custom Requirements**: Modify `beehiveService.js` and `subscriberController.js`

## Resources

- [Beehive API Documentation](https://developers.beehiiv.com/docs/v2/)
- [Beehive Dashboard](https://app.beehiiv.com/)
- [Best Practices for Double Opt-In](https://www.beehiiv.com/blog/double-opt-in)

---

**Last Updated**: January 2026
**Integration Version**: 1.0.0
