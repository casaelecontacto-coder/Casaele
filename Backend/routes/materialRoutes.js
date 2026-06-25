import { Router } from 'express'
import mongoose from 'mongoose'
import Material from '../models/Material.js'
import Embed from '../models/Embed.js'
import { verifyFirebaseToken, verifyAdmin } from '../middleware/auth.js'

function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(slug, excludeId = null) {
  let candidate = slug;
  let counter = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Material.findOne(query);
    if (!existing) return candidate;
    candidate = `${slug}-${counter++}`;
  }
}

const router = Router()

// Create (admin)
router.post('/', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    // Extract all fields including new categorization fields
    const {
      title, 
      author,
      category, 
      subCategory, 
      theme, 
      level, 
      country, 
      fileUrl, 
      imageSource, 
      description, 
      tags, 
      embedIds, 
      embeds, 
      bannerImageUrl,
      dropdownTitle
    } = req.body
    if (!title) return res.status(400).json({ message: 'title is required' })
    
    let finalEmbedIds = embedIds || []
    
    // Handle direct embed creation (new feature)
    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      const createdEmbeds = []
      
      for (const embedData of embeds) {
        if (embedData.title && embedData.type && embedData.embedCode) {
          const embed = await Embed.create({
            title: embedData.title,
            type: embedData.type,
            embedCode: embedData.embedCode
          })
          createdEmbeds.push(embed._id)
        }
      }
      
      finalEmbedIds = [...finalEmbedIds, ...createdEmbeds]
    }
    
    const baseSlug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const material = await Material.create({
      title,
      slug,
      author: author || '',
      description: description || '',
      category: category || '', 
      subCategory: subCategory || '',
      theme: theme || '',
      level: level || '',
      country: country || '',
      fileUrl: fileUrl || '', 
      imageSource: imageSource || '',
      tags: Array.isArray(tags) ? tags : [],
      embedIds: finalEmbedIds,
      bannerImageUrl: bannerImageUrl || '',
      dropdownTitle: dropdownTitle || 'Ejercicios'
    }).then(doc => doc.populate('embedIds'))
    
    res.status(201).json(material)
  } catch (e) {
    console.error('Error creating material:', e)
    res.status(500).json({ message: 'Failed to create material' })
  }
})

// Get filter options (public) - returns all available categories, levels, etc.
router.get('/filter-options', async (req, res) => {
  try {
    // Compute the distinct filter values server-side with a single aggregation
    // instead of pulling every material document into app memory.
    const [grouped] = await Material.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          subCategories: { $addToSet: '$subCategory' },
          themes: { $addToSet: '$theme' },
          levels: { $addToSet: '$level' },
          countries: { $addToSet: '$country' }
        }
      }
    ]);

    // Drop empty values and sort — identical output shape to before.
    const clean = (arr) => (arr || []).filter(Boolean).sort();

    res.json({
      categories: clean(grouped?.categories),
      subCategories: clean(grouped?.subCategories),
      themes: clean(grouped?.themes),
      levels: clean(grouped?.levels),
      countries: clean(grouped?.countries)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Failed to fetch filter options' });
  }
});

// Read all (public) with filtering support
router.get('/', async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      category, 
      subCategory, 
      theme, 
      level, 
      country, 
      keyword,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object for MongoDB query
    const showAll = req.query.all === 'true';
    const filter = showAll ? {} : { isActive: { $ne: false } };
    let hasFilters = false;
    
    // Category filter (Room/Category) - exact match with admin-defined category
    if (category && category !== 'Room/Category') {
      filter.category = category;
      hasFilters = true;
    }
    
    // Sub Category filter - exact match with admin-defined subCategory
    if (subCategory && subCategory !== 'Sub Category') {
      filter.subCategory = subCategory;
      hasFilters = true;
    }
    
    // Theme filter - exact match with admin-defined theme
    if (theme && theme !== 'Theme/Genre') {
      filter.theme = theme;
      hasFilters = true;
    }
    
    // Level filter - exact match with admin-defined level
    if (level && level !== 'Level') {
      filter.level = level;
      hasFilters = true;
    }
    
    // Country filter - exact match with admin-defined country
    if (country && country !== 'Country') {
      filter.country = country;
      hasFilters = true;
    }
    
    // Keyword search (searches across title, description, and tags) - EXACT WORD MATCHING
    if (keyword && keyword.trim()) {
      const cleanKeyword = keyword.trim();
      
      // Create regex that matches whole words only (not partial matches)
      // \b ensures word boundaries, so "hand" won't match "handsome" or "shorthand"
      const exactWordRegex = new RegExp(`\\b${cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      console.log(`🔍 Keyword search for: "${cleanKeyword}"`);
      console.log(`🔍 Using regex pattern: ${exactWordRegex}`);
      
      // For keyword search, we need to ensure it's the primary filter
      // If there are other filters, combine them with $and
      if (hasFilters) {
        filter.$and = [
          { $or: filter.$or || {} },
          { $or: [
            { title: exactWordRegex },
            { description: exactWordRegex },
            { tags: { $in: [exactWordRegex] } },
            { category: exactWordRegex },
            { subCategory: exactWordRegex },
            { theme: exactWordRegex },
            { level: exactWordRegex },
            { country: exactWordRegex }
          ]}
        ];
        delete filter.$or; // Remove the old $or since we're using $and now
      } else {
        // If no other filters, use keyword as the main filter
        filter.$or = [
          { title: exactWordRegex },
          { description: exactWordRegex },
          { tags: { $in: [exactWordRegex] } },
          { category: exactWordRegex },
          { subCategory: exactWordRegex },
          { theme: exactWordRegex },
          { level: exactWordRegex },
          { country: exactWordRegex }
        ];
      }
      hasFilters = true;
    }
    
    // List responses for the public site (cards) don't render embeds, so only
    // pull the lightweight title/type — keeping the heavy embedCode/HTML out of
    // list payloads. The admin panel (all=true) still gets full embeds for editing.
    const embedPopulate = showAll ? 'embedIds' : { path: 'embedIds', select: 'title type' };

    // If no filters are applied, return all materials (for admin panel)
    if (!hasFilters) {
      const allItems = await Material.find({})
        .populate(embedPopulate)
        .sort({ createdAt: -1 })
        .lean();
      return res.json(allItems);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with filtering, pagination, and sorting
    const items = await Material.find(filter)
      .populate(embedPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination info
    const totalCount = await Material.countDocuments(filter);
    
    // Return results with pagination info
    res.json({
      materials: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        category,
        subCategory,
        theme,
        level,
        country,
        keyword
      }
    });
  } catch (error) {
    console.error('Error fetching materials with filters:', error);
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
})

// Read one (public) - supports both ObjectId and slug
router.get('/:id', async (req, res) => {
  try {
    let item;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      item = await Material.findById(req.params.id).populate('embedIds');
    }
    if (!item) {
      item = await Material.findOne({ slug: req.params.id }).populate('embedIds');
    }
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
})

// Update (admin)
router.put('/:id', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    // Extract all fields including new categorization fields
    const {
      title,
      author,
      category,
      subCategory,
      theme,
      level,
      country,
      fileUrl,
      embedIds,
      embeds,
      description,
      tags,
      imageSource,
      bannerImageUrl,
      dropdownTitle
    } = req.body

    let finalEmbedIds = embedIds || []

    // Handle direct embed creation
    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      const createdEmbeds = []
      
      for (const embedData of embeds) {
        if (embedData.title && embedData.type && embedData.embedCode) {
          const embed = await Embed.create({
            title: embedData.title,
            type: embedData.type,
            embedCode: embedData.embedCode
          })
          createdEmbeds.push(embed._id)
        }
      }
      
      finalEmbedIds = [...finalEmbedIds, ...createdEmbeds]
    }
    
    // Handle slug
    let slugValue;
    if (req.body.slug !== undefined) {
      const baseSlug = generateSlug(req.body.slug || title || '');
      if (baseSlug) slugValue = await ensureUniqueSlug(baseSlug, req.params.id);
    }

    // updateData object with all categorization fields
    const updateData = {
      title,
      ...(slugValue && { slug: slugValue }),
      author: author || '',
      category, 
      subCategory,
      theme,
      level,
      country,
      fileUrl, 
      embedIds: finalEmbedIds, 
      description,
      tags: Array.isArray(tags) ? tags : [],
      imageSource,
      bannerImageUrl,
      dropdownTitle
    }

    const updated = await Material.findByIdAndUpdate(
      req.params.id,
      updateData, // Use the updateData object
      { new: true, runValidators: true }
    ).populate('embedIds')
    
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch (e) {
    console.error('Error updating material:', e)
    res.status(500).json({ message: 'Failed to update. ' + e.message })
  }
})

// Toggle visibility (admin)
router.patch('/:id/toggle-active', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const newActive = req.body.isActive
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' })
    const updated = await Material.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json({ _id: updated._id, isActive: updated.isActive })
  } catch (e) {
    res.status(500).json({ message: 'Failed to toggle visibility' })
  }
})

// Delete (admin)
router.delete('/:id', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  const deleted = await Material.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router;