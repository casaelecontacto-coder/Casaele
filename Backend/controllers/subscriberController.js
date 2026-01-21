import Subscriber from '../models/Subscriber.js';
import { subscribeToBeehive, getSubscriptionStatus, unsubscribeFromBeehive } from '../services/beehiveService.js';

// @route   GET /api/subscribers
// @desc    Get all subscribers
// @access  Admin
export async function getSubscribers(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search,
      sortBy = 'subscribedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const subscribers = await Subscriber.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscriber.countDocuments(query);

    res.status(200).json({
      subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   GET /api/subscribers/:id
// @desc    Get single subscriber
// @access  Admin
export async function getSubscriberById(req, res) {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    res.status(200).json(subscriber);
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   POST /api/subscribers
// @desc    Create new subscriber
// @access  Admin
export async function createSubscriber(req, res) {
  try {
    const subscriber = new Subscriber(req.body);
    await subscriber.save();
    res.status(201).json({ message: 'Subscriber created successfully', subscriber });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subscriber with this email already exists' });
    }
    console.error('Error creating subscriber:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   POST /api/subscribers/public
// @desc    Public subscription endpoint with Beehive integration (no auth)
// @access  Public
export async function subscribePublic(req, res) {
  try {
    const { email, name, role } = req.body || {};

    // Validate email
    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const safeName = name && String(name).trim() ? String(name).trim() : 'Subscriber';
    const tags = [];
    if (role && String(role).trim()) tags.push(String(role).trim());

    // Check if subscriber already exists in our database
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      // If already confirmed, return message
      if (existing.confirmationStatus === 'confirmed') {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to our newsletter',
          alreadySubscribed: true
        });
      }

      // If pending confirmation, check Beehive status
      if (existing.confirmationStatus === 'pending') {
        try {
          const beehiveStatus = await getSubscriptionStatus(cleanEmail);

          if (beehiveStatus.exists && beehiveStatus.status === 'active') {
            // Update local database to confirmed
            existing.confirmationStatus = 'confirmed';
            existing.confirmedAt = new Date(beehiveStatus.confirmedAt);
            existing.isActive = true;
            await existing.save();

            return res.status(200).json({
              success: true,
              message: 'You are already subscribed to our newsletter',
              alreadySubscribed: true
            });
          }
        } catch (beehiveError) {
          console.error('[Beehive] Status check failed:', beehiveError.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Please check your email to confirm your subscription',
          pendingConfirmation: true
        });
      }
    }

    // Subscribe to Beehive (double opt-in)
    let beehiveResult;
    try {
      beehiveResult = await subscribeToBeehive({
        email: cleanEmail,
        customFields: {
          name: safeName,
          role: role || 'Unknown',
          source: 'website',
          tags: tags.join(',')
        }
      });

      console.log('[Beehive] Subscription successful:', {
        email: cleanEmail,
        subscriptionId: beehiveResult.data?.id,
        status: beehiveResult.data?.status
      });

    } catch (beehiveError) {
      console.error('[Beehive] Subscription failed:', beehiveError.message);

      // Store in database with failed status for retry later
      const failedSubscriber = existing || new Subscriber({
        email: cleanEmail,
        name: safeName,
        source: 'beehive',
        tags,
        isActive: false,
        confirmationStatus: 'failed',
        retryCount: (existing?.retryCount || 0) + 1,
        lastRetryAt: new Date()
      });

      if (existing) {
        failedSubscriber.retryCount = (existing.retryCount || 0) + 1;
        failedSubscriber.lastRetryAt = new Date();
        failedSubscriber.confirmationStatus = 'failed';
      }

      await failedSubscriber.save();

      return res.status(500).json({
        success: false,
        message: beehiveError.message || 'Unable to process subscription. Please try again later'
      });
    }

    // Save or update subscriber in our database with pending status
    const subscriberData = {
      email: cleanEmail,
      name: safeName,
      source: 'beehive',
      tags,
      isActive: false, // Will be set to true when confirmed via Beehive
      confirmationStatus: 'pending',
      beehiveSubscriptionId: beehiveResult.data?.id,
      beehiveData: beehiveResult.data,
      subscribedAt: new Date()
    };

    let subscriber;
    if (existing) {
      Object.assign(existing, subscriberData);
      subscriber = await existing.save();
    } else {
      subscriber = await Subscriber.create(subscriberData);
    }

    // Return success with confirmation message
    return res.status(201).json({
      success: true,
      message: 'Please check your email to confirm your subscription',
      requiresConfirmation: true,
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        confirmationStatus: subscriber.confirmationStatus
      }
    });

  } catch (error) {
    console.error('[Subscribe] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error. Please try again later',
      error: error.message
    });
  }
}

// @route   PUT /api/subscribers/:id
// @desc    Update subscriber
// @access  Admin
export async function updateSubscriber(req, res) {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    res.status(200).json({ message: 'Subscriber updated successfully', subscriber });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subscriber with this email already exists' });
    }
    console.error('Error updating subscriber:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   DELETE /api/subscribers/:id
// @desc    Delete subscriber
// @access  Admin
export async function deleteSubscriber(req, res) {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    res.status(200).json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   PUT /api/subscribers/:id/unsubscribe
// @desc    Unsubscribe user from Beehive and local database
// @access  Admin
export async function unsubscribeUser(req, res) {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    // Try to unsubscribe from Beehive if they were subscribed via Beehive
    if (subscriber.source === 'beehive' && subscriber.beehiveSubscriptionId) {
      try {
        await unsubscribeFromBeehive(subscriber.email);
        console.log('[Beehive] Unsubscribed:', subscriber.email);
      } catch (beehiveError) {
        console.error('[Beehive] Unsubscribe failed:', beehiveError.message);
        // Continue with local unsubscribe even if Beehive fails
      }
    }

    // Update local database
    subscriber.isActive = false;
    subscriber.confirmationStatus = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      message: 'User unsubscribed successfully',
      subscriber
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
