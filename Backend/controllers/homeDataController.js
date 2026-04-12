import CmsPage from '../models/CmsPage.js'
import Pick from '../models/Pick.js'
import Testimonial from '../models/Testimonial.js'
import Teacher from '../models/Teacher.js'
import HomeSlide from '../models/HomeSlide.js'

/**
 * Aggregated endpoint for Home page data
 * Returns all CMS blocks, picks, testimonials, and teachers in one response
 * This reduces API calls from 12-15 to just 1
 */
export async function getHomeData(req, res) {
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

    // Check if MongoDB is connected before querying
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not connected',
        cms: {},
        picks: [],
        testimonials: [],
        teachers: [],
        homeSlides: []
      });
    }

    // Fetch all data in parallel using Promise.all for maximum performance
    const [cmsResults, picks, testimonials, teachers, homeSlides] = await Promise.all([
      // Fetch all CMS blocks in parallel
      Promise.all(
        homeCmsSlugs.map(slug =>
          CmsPage.findOne({ slug }).populate('secondSectionEmbed').catch(() => null)
        )
      ),
      // Fetch picks
      Pick.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .limit(3)
        .lean(),
      // Fetch approved testimonials
      Testimonial.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .lean(),
      // Fetch all teachers
      Teacher.find()
        .sort({ createdAt: -1 })
        .lean(),
      // Fetch active home slides
      HomeSlide.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean()
    ]);

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

    // Return aggregated data
    res.json({
      cms: cmsData,
      picks: picks || [],
      testimonials: testimonials || [],
      teachers: teachers || [],
      homeSlides: homeSlides || []
    });
  } catch (error) {
    console.error('Error fetching home data:', error);
    res.status(500).json({
      message: 'Failed to fetch home data',
      cms: {},
      picks: [],
      testimonials: [],
      teachers: [],
      homeSlides: []
    });
  }
}
