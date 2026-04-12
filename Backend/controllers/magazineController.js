import Magazine from '../models/Magazine.js';
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
// @access  Public (for free magazines)
export const serveMagazinePdf = async (req, res) => {
  try {
    let magazine;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      magazine = await Magazine.findById(req.params.id);
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id });
    }
    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    // Only serve free magazines directly; paid ones need purchase verification
    if (magazine.accessType === 'paid') {
      return res.status(403).json({ message: 'This is a paid magazine. Please purchase to access.' });
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
      // Allow cross-origin access for the flipbook viewer
      res.setHeader('Access-Control-Allow-Origin', '*');

      stream.pipe(res);
    } else {
      // Fallback: redirect to the direct URL (Cloudinary or other)
      res.redirect(pdfUrl);
    }
  } catch (error) {
    console.error('Error serving magazine PDF:', error);
    res.status(500).json({ message: 'Server error serving PDF' });
  }
};
