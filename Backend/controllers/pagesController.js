import CmsPage from '../models/CmsPage.js';
import Pick from '../models/Pick.js';
import Testimonial from '../models/Testimonial.js';
import Teacher from '../models/Teacher.js';
import HomeSlide from '../models/HomeSlide.js';
import { getCachedCms, setCachedCms } from '../middleware/cmsCache.js';

/**
 * Helper function to fetch CMS page with caching
 * Uses negative caching to prevent repeated DB hits for missing slugs
 *
 * @param {string} slug - CMS slug
 * @returns {Promise<object|null>} - CMS page data or null
 */
async function fetchCmsWithCache(slug) {
  // 1️⃣ Check cache first
  const cached = getCachedCms(slug);

  // IMPORTANT:
  // undefined → cache miss
  // null      → cached 404
  // object    → cached CMS page
  if (cached !== undefined) {
    return cached;
  }

  // 2️⃣ Ensure MongoDB connection
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState !== 1) {
    console.error(`MongoDB not connected. Cannot fetch CMS slug: ${slug}`);
    return null;
  }

  // 3️⃣ Fetch from database
  try {
    const page = await CmsPage.findOne({ slug })
      .populate('secondSectionEmbed')
      .lean();

    // 4️⃣ Cache result (including null for 404)
    setCachedCms(slug, page || null);

    return page;
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
    const homeCmsSlugs = [
      'home-hero-students-title',
      'home-hero-students-desc',
      'home-hero-teachers-title',
      'home-hero-teachers-desc',
      'home-welcome-title',
      'home-welcome-desc'
    ];

    // Fetch CMS blocks in parallel
    const cmsResults = await Promise.all(
      homeCmsSlugs.map(slug => fetchCmsWithCache(slug))
    );

    // Friendly CMS keys for frontend
    const cmsFriendly = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      const key = slug.replace('home-', '').replace(/-/g, '');

      cmsFriendly[key] = page
        ? {
            content: page.content || '',
            imageUrl: page.imageUrl || '',
            title: page.title || '',
            slug: page.slug
          }
        : null;
    });

    // Slug-based CMS object (backward compatibility)
    const cmsBySlug = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      cmsBySlug[slug] = page
        ? {
            content: page.content || '',
            imageUrl: page.imageUrl || '',
            title: page.title || ''
          }
        : null;
    });

    // Ensure MongoDB connection before other queries
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not connected',
        cms: {},
        cmsFriendly: {},
        picks: [],
        testimonials: [],
        teachers: [],
        homeSlides: []
      });
    }

    // Fetch other homepage data in parallel
    const [picks, testimonials, teachers, homeSlides] = await Promise.all([
      Pick.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .limit(3)
        .lean(),

      Testimonial.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .lean(),

      Teacher.find()
        .sort({ createdAt: -1 })
        .lean(),

      HomeSlide.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean()
    ]);

    // Final response
    res.json({
      cms: cmsBySlug,
      cmsFriendly,
      picks: picks || [],
      testimonials: testimonials || [],
      teachers: teachers || [],
      homeSlides: homeSlides || []
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).json({
      message: 'Failed to fetch home page data',
      cms: {},
      cmsFriendly: {},
      picks: [],
      testimonials: [],
      teachers: [],
      homeSlides: []
    });
  }
}

/**
 * GET /api/pages/about
 * Returns all CMS blocks needed for About page
 */
export async function getAboutPage(req, res) {
  try {
    const aboutCmsSlugs = [
      'about-us',
      'about-where-ele-map-image',
      'about-garden-section-content'
    ];

    const cmsResults = await Promise.all(
      aboutCmsSlugs.map(slug => fetchCmsWithCache(slug))
    );

    const cmsData = {};
    aboutCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      cmsData[slug] = page
        ? {
            content: page.content || '',
            imageUrl: page.imageUrl || '',
            title: page.title || '',
            secondSectionEmbed: page.secondSectionEmbed || null
          }
        : null;
    });

    res.json({ cms: cmsData });
  } catch (error) {
    console.error('Error fetching about page data:', error);
    res.status(500).json({
      message: 'Failed to fetch about page data',
      cms: {}
    });
  }
}
