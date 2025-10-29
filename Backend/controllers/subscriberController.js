import Subscriber from '../models/Subscriber.js';

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
// @desc    Public subscription endpoint (no auth)
// @access  Public
export async function subscribePublic(req, res) {
  try {
    const { email, name, role } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const safeName = name && String(name).trim() ? String(name).trim() : 'Subscriber';
    const tags = [];
    if (role && String(role).trim()) tags.push(String(role).trim());

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      existing.name = existing.name || safeName;
      // merge tags without duplicates
      const set = new Set([...(existing.tags || []), ...tags]);
      existing.tags = Array.from(set);
      await existing.save();
      return res.status(200).json({ message: 'Already subscribed, updated preferences', subscriber: existing });
    }

    const subscriber = await Subscriber.create({
      email,
      name: safeName,
      isActive: true,
      source: 'website',
      tags
    });
    return res.status(201).json({ message: 'Subscribed successfully', subscriber });
  } catch (error) {
    console.error('Public subscribe error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
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
// @desc    Unsubscribe user
// @access  Admin
export async function unsubscribeUser(req, res) {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    
    subscriber.isActive = false;
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
