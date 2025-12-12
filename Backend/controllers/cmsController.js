import CmsPage from '../models/CmsPage.js'
import Pick from '../models/Pick.js'
import Testimonial from '../models/Testimonial.js'
import Teacher from '../models/Teacher.js'
import { getCachedCms, setCachedCms } from '../middleware/cmsCache.js'

export async function createCmsPage(req, res) {
  try {
    // ++ Add 'secondSectionEmbed' ++
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body
    if (!title) return res.status(400).json({ message: 'title is required' })
    const page = await CmsPage.create({ title, slug, content, imageUrl, secondSectionEmbed: secondSectionEmbed || null })
    
    // Clear cache for this slug when created
    const { clearCmsCache } = await import('../middleware/cmsCache.js');
    clearCmsCache(page.slug);
    
    res.status(201).json(page)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create CMS page' })
  }
}

export async function getCmsPages(req, res) {
  try {
    // ++ Add populate here ++
    const pages = await CmsPage.find().sort({ createdAt: -1 }).populate('secondSectionEmbed');
    res.json(pages)
  } catch {
    res.status(500).json({ message: 'Failed to list CMS pages' })
  }
}

export async function getCmsPageById(req, res) {
  try {
    // ++ Add populate here ++
    const page = await CmsPage.findById(req.params.id).populate('secondSectionEmbed');
    if (!page) return res.status(404).json({ message: 'Not found' })
    res.json(page)
  } catch {
    res.status(500).json({ message: 'Failed to fetch CMS page' })
  }
}

export async function getCmsPageBySlug(req, res) {
  try {
    const slug = req.params.slug;
    
    // Check if MongoDB is connected
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    // Check cache first
    const cached = getCachedCms(slug);
    if (cached) {
      return res.json(cached);
    }

    // Fetch from database
    const page = await CmsPage.findOne({ slug }).populate('secondSectionEmbed');
    if (!page) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Cache the result
    setCachedCms(slug, page);
    
    res.json(page);
  } catch (error) {
    console.error('Error in getCmsPageBySlug:', error);
    res.status(500).json({ message: 'Failed to fetch CMS page by slug' });
  }
}

export async function updateCmsPage(req, res) {
  try {
    // ++ Add 'secondSectionEmbed' ++
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body
    const updated = await CmsPage.findByIdAndUpdate(
      req.params.id,
      // ++ Add 'secondSectionEmbed' to update object ++
      { title, slug, content, imageUrl, secondSectionEmbed: secondSectionEmbed || null },
      { new: true, runValidators: true }
    )
    // ++ Add populate here to return the full updated object ++
    .populate('secondSectionEmbed'); 
    
    if (!updated) return res.status(404).json({ message: 'Not found' })
    
    // Clear cache for this slug when updated
    const { clearCmsCache } = await import('../middleware/cmsCache.js');
    clearCmsCache(updated.slug);
    
    res.json(updated)
  } catch(err) { // Add error logging
    console.error("Error updating CMS Page:", err);
    res.status(500).json({ message: 'Failed to update CMS page' });
  }
}

export async function deleteCmsPage(req, res) {
  try {
    const deleted = await CmsPage.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    
    // Clear cache for this slug when deleted
    const { clearCmsCache } = await import('../middleware/cmsCache.js');
    clearCmsCache(deleted.slug);
    
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to delete CMS page' })
  }
}

// Aggregated endpoint for Home page - fetches all CMS blocks, picks, and testimonials in one call
export async function getHomePageData(req, res) {
  try {
    // List of CMS slugs used on the Home page
    const homeCmsSlugs = [
      'home-hero-students-title',
      'home-hero-students-desc',
      'home-hero-teachers-title',
      'home-hero-teachers-desc',
      'home-welcome-title',
      'home-welcome-desc'
    ];

    // Fetch all CMS blocks in parallel
    const cmsPromises = homeCmsSlugs.map(slug =>
      CmsPage.findOne({ slug }).populate('secondSectionEmbed').catch(() => null)
    );
    const cmsResults = await Promise.all(cmsPromises);

    // Build CMS data object
    const cmsData = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      if (page) {
        cmsData[slug] = {
          content: page.content || '',
          imageUrl: page.imageUrl || '',
          title: page.title || ''
        };
      } else {
        cmsData[slug] = null;
      }
    });

    // Fetch picks, testimonials, and teachers in parallel
    const [picks, testimonials, teachers] = await Promise.all([
      Pick.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .limit(3)
        .lean(),
      Testimonial.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .lean(),
      Teacher.find()
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Return aggregated data
    res.json({
      cms: cmsData,
      picks: picks || [],
      testimonials: testimonials || [],
      teachers: teachers || []
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).json({ message: 'Failed to fetch home page data' });
  }
}