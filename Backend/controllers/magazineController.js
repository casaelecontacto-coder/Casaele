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

// Only one magazine per contentType should be the featured one (e.g. the
// El Desvelo hero picks whichever issue has isFeatured: true). Called after
// setting isFeatured on `keepId`, this clears the flag on every other
// document sharing that contentType.
async function clearOtherFeatured(contentType, keepId) {
  await Magazine.updateMany(
    { contentType, _id: { $ne: keepId }, isFeatured: true },
    { $set: { isFeatured: false } }
  );
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
      magazine = await Magazine.findById(req.params.id).populate('embedIds');
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id }).populate('embedIds');
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
      contentType,
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
      isFeatured,
      publishedAt,
      embedIds,
      embeds,
      readSourceType,
      readLinkUrl,
      readEmbedUrl,
    } = req.body;

    if (!title || !coverImageUrl) {
      return res.status(400).json({ message: 'Title and cover image are required' });
    }

    // Issues and comics always read from a PDF. A text picks exactly one of
    // pdf/link/embed via readSourceType, so only that one field is required.
    const isText = (contentType || 'issue') === 'text';
    const finalReadSourceType = isText && ['pdf', 'link', 'embed'].includes(readSourceType) ? readSourceType : 'pdf';
    if (!isText && !pdfUrl) {
      return res.status(400).json({ message: 'PDF is required' });
    }
    if (isText) {
      const value = finalReadSourceType === 'link' ? readLinkUrl : finalReadSourceType === 'embed' ? readEmbedUrl : pdfUrl;
      if (!value) {
        const label = finalReadSourceType === 'link' ? 'link' : finalReadSourceType === 'embed' ? 'HTML embed' : 'PDF';
        return res.status(400).json({ message: `Please provide a ${label} for this text.` });
      }
    }

    // Handle inline embed creation
    let finalEmbedIds = Array.isArray(embedIds) ? [...embedIds] : [];
    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      const Embed = (await import('../models/Embed.js')).default;
      for (const embedData of embeds) {
        if (embedData.title && embedData.type && embedData.embedCode) {
          const embed = await Embed.create({
            title: embedData.title,
            type: embedData.type,
            embedCode: embedData.embedCode
          });
          finalEmbedIds.push(embed._id);
        }
      }
    }

    const baseSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    const slug = await ensureUniqueSlug(Magazine, baseSlug);

    const newMagazine = new Magazine({
      title,
      slug,
      description: description || '',
      coverImageUrl,
      pdfUrl: pdfUrl || '',
      category: category || '',
      contentType: contentType || 'issue',
      readSourceType: finalReadSourceType,
      readLinkUrl: isText ? (readLinkUrl || '') : '',
      readEmbedUrl: isText ? (readEmbedUrl || '') : '',
      accessType: accessType || 'free',
      price: price || 0,
      discountPrice: discountPrice || 0,
      prices: prices || { USD: { price: 0, discountPrice: 0 }, EUR: { price: 0, discountPrice: 0 }, INR: { price: 0, discountPrice: 0 } },
      complementaryMaterialUrl: complementaryMaterialUrl || '',
      complementaryMaterialName: complementaryMaterialName || '',
      donateLink: donateLink || '',
      subscribeLink: subscribeLink || '',
      preorderLink: preorderLink || '',
      embedIds: finalEmbedIds,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isFeatured: isFeatured === true,
      publishedAt: publishedAt || Date.now(),
    });

    const saved = await newMagazine.save();
    if (saved.isFeatured) await clearOtherFeatured(saved.contentType, saved._id);
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
      contentType,
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
      isFeatured,
      publishedAt,
      embedIds,
      embeds,
      readSourceType,
      readLinkUrl,
      readEmbedUrl,
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (customSlug !== undefined) {
      const baseSlug = generateSlug(customSlug || title || '');
      if (baseSlug) updateData.slug = await ensureUniqueSlug(Magazine, baseSlug, req.params.id);
    }
    if (description !== undefined) updateData.description = description;
    if (coverImageUrl) updateData.coverImageUrl = coverImageUrl;
    // Explicit !== undefined (not just truthy) so a text can clear pdfUrl
    // when switching its readSourceType away from 'pdf' to link/embed.
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;
    if (['pdf', 'link', 'embed'].includes(readSourceType)) updateData.readSourceType = readSourceType;
    if (readLinkUrl !== undefined) updateData.readLinkUrl = readLinkUrl;
    if (readEmbedUrl !== undefined) updateData.readEmbedUrl = readEmbedUrl;
    if (category !== undefined) updateData.category = category;
    if (contentType !== undefined) updateData.contentType = contentType;
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
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (publishedAt) updateData.publishedAt = publishedAt;

    // Handle embeds
    if (embedIds !== undefined) {
      let finalEmbedIds = Array.isArray(embedIds) ? [...embedIds] : [];
      if (embeds && Array.isArray(embeds) && embeds.length > 0) {
        const Embed = (await import('../models/Embed.js')).default;
        for (const embedData of embeds) {
          if (!embedData._id && embedData.title && embedData.type && embedData.embedCode) {
            const embed = await Embed.create({
              title: embedData.title,
              type: embedData.type,
              embedCode: embedData.embedCode
            });
            finalEmbedIds.push(embed._id);
          }
        }
      }
      updateData.embedIds = finalEmbedIds;
    }

    updateData.updatedAt = Date.now();

    const updated = await Magazine.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (updated) {
      if (updated.isFeatured) await clearOtherFeatured(updated.contentType, updated._id);
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
// @access  Requires a logged-in user for any magazine; paid ones additionally
// require a verified purchase.
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

    // Free standalone texts are public reading material: anyone can open one
    // without an account. Everything else — issues, comics, and any paid
    // entry — needs a logged-in user, and paid ones a verified purchase.
    const isOpenText = magazine.contentType === 'text' && magazine.accessType !== 'paid';

    if (!isOpenText) {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Login required to access this content.' });
      }

      let decoded;
      try {
        const { auth: firebaseAuth } = await import('../config/firebaseAdmin.js');
        decoded = await firebaseAuth.verifyIdToken(token);
      } catch (authErr) {
        console.error('Auth verification error in PDF serve:', authErr?.message);
        return res.status(401).json({ message: 'Authentication failed.' });
      }

      // Paid magazines additionally require a verified purchase.
      if (magazine.accessType === 'paid') {
        const userEmail = decoded.email;
        const userUid = decoded.uid;

        if (!userEmail && !userUid) {
          return res.status(401).json({ message: 'Could not verify your identity.' });
        }

        // Check if user has a paid order containing this magazine
        const pdfOrConditions = [];
        if (userEmail) {
          const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          pdfOrConditions.push({ 'shippingAddress.email': emailRegex });
          pdfOrConditions.push({ userEmail: emailRegex });
          pdfOrConditions.push({ 'paymentResult.email_address': emailRegex });
        }
        if (userUid) {
          pdfOrConditions.push({ firebaseUid: userUid });
        }

        const hasPurchased = await Order.findOne({
          $or: pdfOrConditions,
          isPaid: true,
          'orderItems.product': magazine._id
        });

        if (!hasPurchased) {
          return res.status(403).json({ message: 'Please purchase this magazine to access it.' });
        }
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
    const userUid = req.user?.uid;
    if (!userEmail && !userUid) {
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

    // Build OR conditions for finding the order
    const orConditions = [];
    if (userEmail) {
      const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      orConditions.push({ 'shippingAddress.email': emailRegex });
      orConditions.push({ userEmail: emailRegex });
      orConditions.push({ 'paymentResult.email_address': emailRegex });
    }
    if (userUid) {
      orConditions.push({ firebaseUid: userUid });
    }

    console.log(`[MagazineAccess] Checking access for magazine=${magazineId}, userEmail=${userEmail}, uid=${userUid}`);

    const order = await Order.findOne({
      $or: orConditions,
      isPaid: true,
      'orderItems.product': magazineId
    });

    if (!order) {
      // Self-healing: find any paid order with this magazine that has no firebaseUid
      // and the billing email matches. Also backfill firebaseUid for future lookups.
      if (userUid) {
        const orphanOrder = await Order.findOne({
          'orderItems.product': magazineId,
          isPaid: true,
          $or: [
            { firebaseUid: { $exists: false } },
            { firebaseUid: '' },
            { firebaseUid: null }
          ]
        });
        if (orphanOrder) {
          // Backfill the firebaseUid and userEmail so future lookups work
          console.log(`[MagazineAccess] Backfilling firebaseUid=${userUid} on order ${orphanOrder._id}`);
          await Order.updateOne({ _id: orphanOrder._id }, { $set: { firebaseUid: userUid, userEmail: userEmail || orphanOrder.shippingAddress?.email } });

          const orderItem = orphanOrder.orderItems.find(
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
        }
      }

      console.log(`[MagazineAccess] No paid order found for magazine=${magazineId}, email=${userEmail}, uid=${userUid}`);
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
