import { Router } from 'express'
import Material from '../models/Material.js'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = Router()

// Create (admin)
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('📝 Creating new material with data size:', JSON.stringify(req.body).length, 'characters');
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
      const Embed = (await import('../models/Embed.js')).default
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
    
    const material = await Material.create({ 
      title, 
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
    const materials = await Material.find({}, 'category subCategory theme level country');
    
    // Extract unique values for each filter
    const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];
    const subCategories = [...new Set(materials.map(m => m.subCategory).filter(Boolean))];
    const themes = [...new Set(materials.map(m => m.theme).filter(Boolean))];
    const levels = [...new Set(materials.map(m => m.level).filter(Boolean))];
    const countries = [...new Set(materials.map(m => m.country).filter(Boolean))];
    
    res.json({
      categories: categories.sort(),
      subCategories: subCategories.sort(),
      themes: themes.sort(),
      levels: levels.sort(),
      countries: countries.sort()
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
    const filter = {};
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
    
    // If no filters are applied, return all materials (for admin panel)
    if (!hasFilters) {
      console.log(`🔍 No filters applied, returning all materials`);
      const allItems = await Material.find({}).populate('embedIds').sort({ createdAt: -1 });
      return res.json(allItems);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with filtering, pagination, and sorting
    const items = await Material.find(filter)
      .populate('embedIds')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination info
    const totalCount = await Material.countDocuments(filter);
    
    // Debug logging for search results
    if (keyword && keyword.trim()) {
      console.log(`🔍 Found ${items.length} results for keyword: "${keyword}"`);
      items.forEach((item, index) => {
        console.log(`🔍 Result ${index + 1}: "${item.title}" - Category: "${item.category}" - Tags: [${item.tags?.join(', ') || 'none'}]`);
      });
    }
    
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

// Read one (public)
// No changes needed
router.get('/:id', async (req, res) => {
  const item = await Material.findById(req.params.id).populate('embedIds')
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

// Update (admin)
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('📝 Updating material with ID:', req.params.id, 'Data size:', JSON.stringify(req.body).length, 'characters');
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
      const Embed = (await import('../models/Embed.js')).default
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
    
    // updateData object with all categorization fields
    const updateData = { 
      title, 
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

// Delete (admin)
// No changes needed
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const deleted = await Material.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router;