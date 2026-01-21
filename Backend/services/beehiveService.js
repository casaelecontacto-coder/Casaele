// Backend/services/beehiveService.js
// Beehive newsletter API integration service
// Documentation: https://developers.beehiiv.com/docs/v2/

/**
 * Beehive API Service
 * Handles all interactions with Beehive newsletter platform
 * Implements double opt-in subscription flow
 */

const BEEHIVE_API_BASE_URL = 'https://api.beehiiv.com/v2';
const BEEHIVE_API_KEY = process.env.BEEHIVE_API_KEY;
const BEEHIVE_PUBLICATION_ID = process.env.BEEHIVE_PUBLICATION_ID;

/**
 * Subscribe a user to Beehive newsletter with double opt-in
 * @param {Object} subscriptionData - User subscription data
 * @param {string} subscriptionData.email - User's email address
 * @param {string} [subscriptionData.customFields] - Optional custom fields for segmentation
 * @returns {Promise<Object>} Beehive API response
 */
export async function subscribeToBeehive(subscriptionData) {
  const { email, customFields = {} } = subscriptionData;

  if (!BEEHIVE_API_KEY || !BEEHIVE_PUBLICATION_ID) {
    throw new Error('Beehive API credentials are not configured. Please check your environment variables.');
  }

  if (!email || !validateEmail(email)) {
    throw new Error('Valid email address is required');
  }

  try {
    // Basic payload - start simple without custom fields
    const payload = {
      email: email.toLowerCase().trim(),
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: 'newsletter_form',
      referring_site: 'casaele.com'
    };

    // Build custom_fields array (beehive expects array of {name, value} objects)
    // NOTE: Custom fields must be created in Beehive dashboard first
    const customFieldsArray = [];

    if (customFields && customFields.name) {
      customFieldsArray.push({ name: 'name', value: customFields.name });
    }
    if (customFields && customFields.role) {
      customFieldsArray.push({ name: 'role', value: customFields.role });
    }

    // Only add custom_fields if we have any (and they exist in Beehive)
    if (customFieldsArray.length > 0) {
      payload.custom_fields = customFieldsArray;
    }

    const response = await fetch(
      `${BEEHIVE_API_BASE_URL}/publications/${BEEHIVE_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEEHIVE_API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Log error details
      console.error('[Beehive] API Error:', {
        status: response.status,
        message: data.message || data.errors?.[0]?.message,
        email: email
      });

      // Handle specific Beehive API errors
      if (response.status === 400 && data.message?.includes('already exists')) {
        throw new Error('This email is already subscribed to our newsletter');
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later');
      }
      throw new Error(data.message || data.errors?.[0]?.message || `Beehive API error: ${response.status}`);
    }

    // Log successful subscription
    console.log('[Beehive] Successfully subscribed:', {
      email: email,
      status: data.data?.status,
      subscriptionId: data.data?.id,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: data.data,
      message: 'Please check your email to confirm your subscription'
    };

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('[Beehive] Subscription error:', {
      email: email,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Re-throw with user-friendly message
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to newsletter service. Please try again later');
    }

    throw error;
  }
}

/**
 * Get subscription status from Beehive
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Subscription status
 */
export async function getSubscriptionStatus(email) {
  if (!BEEHIVE_API_KEY || !BEEHIVE_PUBLICATION_ID) {
    throw new Error('Beehive API credentials are not configured');
  }

  try {
    const response = await fetch(
      `${BEEHIVE_API_BASE_URL}/publications/${BEEHIVE_PUBLICATION_ID}/subscriptions?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BEEHIVE_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, status: null };
      }
      throw new Error(`Beehive API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      exists: true,
      status: data.data?.status, // 'active', 'pending', 'unsubscribed'
      confirmedAt: data.data?.confirmed_at,
      subscribedAt: data.data?.created_at
    };

  } catch (error) {
    console.error('[Beehive] Status check error:', error.message);
    throw error;
  }
}

/**
 * Unsubscribe a user from Beehive
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Unsubscribe response
 */
export async function unsubscribeFromBeehive(email) {
  if (!BEEHIVE_API_KEY || !BEEHIVE_PUBLICATION_ID) {
    throw new Error('Beehive API credentials are not configured');
  }

  try {
    // First, get the subscription ID
    const status = await getSubscriptionStatus(email);

    if (!status.exists) {
      throw new Error('Subscription not found');
    }

    const response = await fetch(
      `${BEEHIVE_API_BASE_URL}/publications/${BEEHIVE_PUBLICATION_ID}/subscriptions/${status.subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${BEEHIVE_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Beehive API error: ${response.status}`);
    }

    console.log('[Beehive] Successfully unsubscribed:', email);

    return {
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    };

  } catch (error) {
    console.error('[Beehive] Unsubscribe error:', error.message);
    throw error;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Health check for Beehive API integration
 * @returns {Promise<Object>} Health status
 */
export async function checkBeehiveHealth() {
  try {
    if (!BEEHIVE_API_KEY || !BEEHIVE_PUBLICATION_ID) {
      return {
        healthy: false,
        message: 'Beehive credentials not configured',
        configured: false
      };
    }

    // Try to fetch publication details
    const response = await fetch(
      `${BEEHIVE_API_BASE_URL}/publications/${BEEHIVE_PUBLICATION_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BEEHIVE_API_KEY}`
        }
      }
    );

    return {
      healthy: response.ok,
      status: response.status,
      configured: true,
      message: response.ok ? 'Beehive integration is healthy' : 'Beehive API connection failed'
    };

  } catch (error) {
    return {
      healthy: false,
      configured: true,
      message: error.message,
      error: true
    };
  }
}
