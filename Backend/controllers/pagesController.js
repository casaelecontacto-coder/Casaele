import CmsPage from '../models/CmsPage.js';
import Pick from '../models/Pick.js';
import Testimonial from '../models/Testimonial.js';
import Teacher from '../models/Teacher.js';
import { getCachedCms, setCachedCms } from '../middleware/cmsCache.js';

/**
 * Helper function to fetch CMS page with caching
 * @param {string} slug - CMS slug
 * @returns {Promise<object|null>} - CMS page data or null
 */
async function fetchCmsWithCache(slug) {
  // Check cache first
  const cached = getCachedCms(slug);
  if (cached) {
    return cached;
  }

  // Check if MongoDB is connected before querying
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState !== 1) {
    console.error(`MongoDB not connected. Cannot fetch CMS slug: ${slug}`);
    return null;
  }

  // Fetch from database
  try {
    const page = await CmsPage.findOne({ slug }).populate('secondSectionEmbed');
    if (page) {
      // Cache the result
      setCachedCms(slug, page);
      return page;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching CMS slug ${slug}:`, error);
    return null;
  }
}

/**
 * GET /api/pages/home
 * Returns all CMS blocks, picks, testimonials, and teachers for Home page
 */
export async function getHomePage(req, res) {
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

    // Fetch all CMS blocks in parallel (using cached lookups)
    const cmsPromises = homeCmsSlugs.map(slug => fetchCmsWithCache(slug));
    const cmsResults = await Promise.all(cmsPromises);

    // Build CMS data object with friendly keys
    const cmsData = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      if (page) {
        // Use friendly keys for easier frontend access
        const key = slug.replace('home-', '').replace(/-/g, '');
        cmsData[key] = {
          content: page.content || '',
          imageUrl: page.imageUrl || '',
          title: page.title || '',
          slug: page.slug
        };
      } else {
        const key = slug.replace('home-', '').replace(/-/g, '');
        cmsData[key] = null;
      }
    });

    // Also include slug-based access for backward compatibility
    const cmsBySlug = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      if (page) {
        cmsBySlug[slug] = {
          content: page.content || '',
          imageUrl: page.imageUrl || '',
          title: page.title || ''
        };
      } else {
        cmsBySlug[slug] = null;
      }
    });

    // Check if MongoDB is connected before querying
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not connected',
        cms: {},
        cmsFriendly: {},
        picks: [],
        testimonials: [],
        teachers: []
      });
    }

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
      cms: cmsBySlug, // Keep slug-based structure for compatibility
      cmsFriendly: cmsData, // New friendly keys
      picks: picks || [],
      testimonials: testimonials || [],
      teachers: teachers || []
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).json({
      message: 'Failed to fetch home page data',
      cms: {},
      cmsFriendly: {},
      picks: [],
      testimonials: [],
      teachers: []
    });
  }
}

/**
 * GET /api/pages/about
 * Returns all CMS blocks needed for About page
 */
export async function getAboutPage(req, res) {
  try {
    // List of CMS slugs used on the About page
    const aboutCmsSlugs = [
      'about-us',
      'about-where-ele-map-image',
      'about-garden-section-content'
    ];

    // Fetch all CMS blocks in parallel (using cached lookups)
    const cmsPromises = aboutCmsSlugs.map(slug => fetchCmsWithCache(slug));
    const cmsResults = await Promise.all(cmsPromises);

    // Build CMS data object
    const cmsData = {};
    aboutCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      if (page) {
        cmsData[slug] = {
          content: page.content || '',
          imageUrl: page.imageUrl || '',
          title: page.title || '',
          secondSectionEmbed: page.secondSectionEmbed || null
        };
      } else {
        cmsData[slug] = null;
      }
    });

    // Return aggregated data
    res.json({
      cms: cmsData
    });
  } catch (error) {
    console.error('Error fetching about page data:', error);
    res.status(500).json({
      message: 'Failed to fetch about page data',
      cms: {}
    });
  }
}

