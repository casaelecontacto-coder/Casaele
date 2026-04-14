import Magazine from '../models/Magazine.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { getFileStreamFromDrive } from '../services/googleDriveService.js';

function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(Model, slug, excludeId = null) {
  let candidate = slug;
  let counter = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query);
    if (!existing) return candidate;
    candidate = `${slug}-${counter++}`;
  }
}

// @desc    Get all magazines (public: only active, admin: all)
// @route   GET /api/magazines
// @access  Public
export const getMagazines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const showAll = req.query.all === 'true';

    const filter = showAll ? {} : { isActive: true };

    const totalMagazines = await Magazine.countDocuments(filter);
    const totalPages = Math.ceil(totalMagazines / limit);
    const magazines = await Magazine.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      magazines,
      currentPage: page,
      totalPages,
      totalMagazines,
    });
  } catch (error) {
    console.error('Error fetching magazines:', error);
    res.status(500).json({ message: 'Server error fetching magazines' });
  }
};

// @desc    Get single magazine by ID or slug
// @route   GET /api/magazines/:id
// @access  Public
export const getMagazineById = async (req, res) => {
  try {
    let magazine;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      magazine = await Magazine.findById(req.params.id);
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id });
    }
    if (magazine) {
      res.json(magazine);
    } else {
      res.status(404).json({ message: 'Magazine not found' });
    }
  } catch (error) {
    console.error('Error fetching magazine by ID:', error);
    res.status(500).json({ message: 'Server error fetching magazine' });
  }
};

// @desc    Create a new magazine
// @route   POST /api/magazines
// @access  Admin
export const createMagazine = async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      description,
      coverImageUrl,
      pdfUrl,
      category,
      accessType,
      price,
      discountPrice,
      prices,
      complementaryMaterialUrl,
      complementaryMaterialName,
      donateLink,
      subscribeLink,
      preorderLink,
      isActive,
      publishedAt,
    } = req.body;

    if (!title || !coverImageUrl || !pdfUrl) {
      return res.status(400).json({ message: 'Title, cover image, and PDF are required' });
    }

    const baseSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    const slug = await ensureUniqueSlug(Magazine, baseSlug);

    const newMagazine = new Magazine({
      title,
      slug,
      description: description || '',
      coverImageUrl,
      pdfUrl,
      category: category || '',
      accessType: accessType || 'free',
      price: price || 0,
      discountPrice: discountPrice || 0,
      prices: prices || { USD: { price: 0, discountPrice: 0 }, EUR: { price: 0, discountPrice: 0 }, INR: { price: 0, discountPrice: 0 } },
      complementaryMaterialUrl: complementaryMaterialUrl || '',
      complementaryMaterialName: complementaryMaterialName || '',
      donateLink: donateLink || '',
      subscribeLink: subscribeLink || '',
      preorderLink: preorderLink || '',
      isActive: typeof isActive === 'boolean' ? isActive : true,
      publishedAt: publishedAt || Date.now(),
    });

    const saved = await newMagazine.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating magazine:', error);
    res.status(500).json({ message: 'Server error creating magazine', error: error.message });
  }
};

// @desc    Update a magazine
// @route   PUT /api/magazines/:id
// @access  Admin
export const updateMagazine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid magazine ID format' });
    }

    const {
      title,
      slug: customSlug,
      description,
      coverImageUrl,
      pdfUrl,
      category,
      accessType,
      price,
      discountPrice,
      prices,
      complementaryMaterialUrl,
      complementaryMaterialName,
      donateLink,
      subscribeLink,
      preorderLink,
      isActive,
      publishedAt,
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (customSlug !== undefined) {
      const baseSlug = generateSlug(customSlug || title || '');
      if (baseSlug) updateData.slug = await ensureUniqueSlug(Magazine, baseSlug, req.params.id);
    }
    if (description !== undefined) updateData.description = description;
    if (coverImageUrl) updateData.coverImageUrl = coverImageUrl;
    if (pdfUrl) updateData.pdfUrl = pdfUrl;
    if (category !== undefined) updateData.category = category;
    if (accessType !== undefined) updateData.accessType = accessType;
    if (price != null) updateData.price = price;
    if (discountPrice != null) updateData.discountPrice = discountPrice;
    if (prices) updateData.prices = prices;
    if (complementaryMaterialUrl !== undefined) updateData.complementaryMaterialUrl = complementaryMaterialUrl;
    if (complementaryMaterialName !== undefined) updateData.complementaryMaterialName = complementaryMaterialName;
    if (donateLink !== undefined) updateData.donateLink = donateLink;
    if (subscribeLink !== undefined) updateData.subscribeLink = subscribeLink;
    if (preorderLink !== undefined) updateData.preorderLink = preorderLink;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (publishedAt) updateData.publishedAt = publishedAt;

    updateData.updatedAt = Date.now();

    const updated = await Magazine.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Magazine not found' });
    }
  } catch (error) {
    console.error('Error updating magazine:', error);
    res.status(500).json({ message: 'Server error updating magazine', error: error.message });
  }
};

// @desc    Delete a magazine
// @route   DELETE /api/magazines/:id
// @access  Admin
export const deleteMagazine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid magazine ID format' });
    }
    const deleted = await Magazine.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.json({ message: 'Magazine deleted successfully' });
    } else {
      res.status(404).json({ message: 'Magazine not found' });
    }
  } catch (error) {
    console.error('Error deleting magazine:', error);
    res.status(500).json({ message: 'Server error deleting magazine' });
  }
};

// @desc    Serve magazine PDF (proxy from Google Drive)
// @route   GET /api/magazines/:id/pdf
// @access  Free magazines: requires email param; Paid: requires auth + purchase
export const serveMagazinePdf = async (req, res) => {
  try {
    let magazine;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      magazine = await Magazine.findById(req.params.id);
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id });
    }
    // If magazine was deleted, try to serve from order snapshot
    if (!magazine) {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme === 'Bearer' && token && mongoose.Types.ObjectId.isValid(req.params.id)) {
        try {
          const { auth: firebaseAuth } = await import('../config/firebaseAdmin.js');
          const decoded = await firebaseAuth.verifyIdToken(token);
          const snapEmailRegex = new RegExp(`^${decoded.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          const order = await Order.findOne({
            $or: [
              { 'shippingAddress.email': snapEmailRegex },
              { userEmail: snapEmailRegex },
              { 'paymentResult.email_address': snapEmailRegex }
            ],
            isPaid: true,
            'orderItems.product': req.params.id
          });
          if (order) {
            const item = order.orderItems.find(i => i.product.toString() === req.params.id);
            if (item?.pdfUrl) {
              // Serve from snapshot
              const snapshotUrl = item.pdfUrl;
              if (snapshotUrl.startsWith('gdrive://')) {
                const fileId = snapshotUrl.replace('gdrive://', '');
                const { stream, size, fileName } = await getFileStreamFromDrive(fileId);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${fileName || 'magazine.pdf'}"`);
                if (size) res.setHeader('Content-Length', size);
                res.setHeader('Access-Control-Allow-Origin', '*');
                return stream.pipe(res);
              } else {
                return res.redirect(snapshotUrl);
              }
            }
          }
        } catch (e) { /* fall through to 404 */ }
      }
      return res.status(404).json({ message: 'Magazine not found' });
    }

    // For paid magazines, verify the user has purchased it
    if (magazine.accessType === 'paid') {
      // Check for auth token
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Login required to access paid magazines.' });
      }

      try {
        const { auth: firebaseAuth } = await import('../config/firebaseAdmin.js');
        const decoded = await firebaseAuth.verifyIdToken(token);
        const userEmail = decoded.email;

        if (!userEmail) {
          return res.status(401).json({ message: 'Could not verify your identity.' });
        }

        // Check if user has a paid order containing this magazine
        const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const hasPurchased = await Order.findOne({
          $or: [
            { 'shippingAddress.email': emailRegex },
            { userEmail: emailRegex },
            { 'paymentResult.email_address': emailRegex }
          ],
          isPaid: true,
          'orderItems.product': magazine._id
        });

        if (!hasPurchased) {
          return res.status(403).json({ message: 'Please purchase this magazine to access it.' });
        }
      } catch (authErr) {
        console.error('Auth verification error in PDF serve:', authErr?.message);
        return res.status(401).json({ message: 'Authentication failed.' });
      }
    }

    const pdfUrl = magazine.pdfUrl;
    if (!pdfUrl) {
      return res.status(404).json({ message: 'No PDF available for this magazine' });
    }

    if (pdfUrl.startsWith('gdrive://')) {
      const fileId = pdfUrl.replace('gdrive://', '');
      const { stream, mimeType, size, fileName } = await getFileStreamFromDrive(fileId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName || 'magazine.pdf'}"`);
      if (size) res.setHeader('Content-Length', size);
      res.setHeader('Access-Control-Allow-Origin', '*');

      stream.pipe(res);
    } else {
      res.redirect(pdfUrl);
    }
  } catch (error) {
    console.error('Error serving magazine PDF:', error);
    res.status(500).json({ message: 'Server error serving PDF' });
  }
};

// @desc    Check if user has purchased a specific magazine
// @route   GET /api/magazines/:id/access
// @access  Requires auth
export const checkMagazineAccess = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.json({ hasAccess: false });
    }

    let magazine;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      magazine = await Magazine.findById(req.params.id);
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id });
    }

    // If magazine exists and is free, grant access
    if (magazine && magazine.accessType !== 'paid') {
      return res.json({ hasAccess: true });
    }

    // Check purchase (works even if magazine was deleted - uses the stored ObjectId)
    const magazineId = magazine?._id || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(magazineId)) {
      return res.json({ hasAccess: false });
    }

    // Search by Firebase email, userEmail field, or billing email
    const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const order = await Order.findOne({
      $or: [
        { 'shippingAddress.email': emailRegex },
        { userEmail: emailRegex },
        { 'paymentResult.email_address': emailRegex }
      ],
      isPaid: true,
      'orderItems.product': magazineId
    });

    if (!order) {
      return res.json({ hasAccess: false });
    }

    // Return snapshot data from order (don't filter by itemModel since old orders may have 'Product')
    const orderItem = order.orderItems.find(
      item => item.product.toString() === magazineId.toString()
    );

    return res.json({
      hasAccess: true,
      snapshot: orderItem ? {
        name: orderItem.name,
        coverImageUrl: orderItem.coverImageUrl || '',
        pdfUrl: orderItem.pdfUrl || '',
      } : null
    });
  } catch (error) {
    console.error('Error checking magazine access:', error);
    res.status(500).json({ message: 'Server error checking access' });
  }
};
