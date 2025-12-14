import CmsPage from '../models/CmsPage.js';
import Pick from '../models/Pick.js';
import Testimonial from '../models/Testimonial.js';
import Teacher from '../models/Teacher.js';
import {
  getCachedCms,
  setCachedCms,
  clearCmsCache
} from '../middleware/cmsCache.js';

/**
 * CREATE CMS PAGE
 */
export async function createCmsPage(req, res) {
  try {
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: 'title and slug are required' });
    }

    const page = await CmsPage.create({
      title,
      slug,
      content,
      imageUrl,
      secondSectionEmbed: secondSectionEmbed || null
    });

    // Invalidate cache for this slug
    clearCmsCache(page.slug);

    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating CMS page:', error);
    res.status(500).json({ message: 'Failed to create CMS page' });
  }
}

/**
 * GET ALL CMS PAGES
 */
export async function getCmsPages(req, res) {
  try {
    const pages = await CmsPage.find()
      .sort({ createdAt: -1 })
      .populate('secondSectionEmbed');

    res.json(pages);
  } catch (error) {
    console.error('Error listing CMS pages:', error);
    res.status(500).json({ message: 'Failed to list CMS pages' });
  }
}

/**
 * GET CMS PAGE BY ID
 */
export async function getCmsPageById(req, res) {
  try {
    const page = await CmsPage.findById(req.params.id)
      .populate('secondSectionEmbed');

    if (!page) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Error fetching CMS page by ID:', error);
    res.status(500).json({ message: 'Failed to fetch CMS page' });
  }
}

/**
 * GET CMS PAGE BY SLUG
 * Uses negative caching (null values cached as 404)
 */
export async function getCmsPageBySlug(req, res) {
  try {
    const slug = req.params.slug;

    // 1️⃣ Check cache first
    const cached = getCachedCms(slug);

    // undefined → cache miss
    // null      → cached 404
    // object    → cached CMS page
    if (cached !== undefined) {
      if (cached === null) {
        return res.status(404).json({ message: 'Not found' });
      }
      return res.json(cached);
    }

    // 2️⃣ Ensure MongoDB is connected
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    // 3️⃣ Fetch from database
    const page = await CmsPage.findOne({ slug })
      .populate('secondSectionEmbed')
      .lean();

    // 4️⃣ Cache result (including negative cache)
    setCachedCms(slug, page || null);

    if (!page) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Error in getCmsPageBySlug:', error);
    res.status(500).json({ message: 'Failed to fetch CMS page by slug' });
  }
}

/**
 * UPDATE CMS PAGE
 */
export async function updateCmsPage(req, res) {
  try {
    const { title, slug, content, imageUrl, secondSectionEmbed } = req.body;

    const updated = await CmsPage.findByIdAndUpdate(
      req.params.id,
      {
        title,
        slug,
        content,
        imageUrl,
        secondSectionEmbed: secondSectionEmbed || null
      },
      { new: true, runValidators: true }
    ).populate('secondSectionEmbed');

    if (!updated) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Invalidate cache for updated slug
    clearCmsCache(updated.slug);

    res.json(updated);
  } catch (error) {
    console.error('Error updating CMS page:', error);
    res.status(500).json({ message: 'Failed to update CMS page' });
  }
}

/**
 * DELETE CMS PAGE
 */
export async function deleteCmsPage(req, res) {
  try {
    const deleted = await CmsPage.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Invalidate cache for deleted slug
    clearCmsCache(deleted.slug);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting CMS page:', error);
    res.status(500).json({ message: 'Failed to delete CMS page' });
  }
}

/**
 * AGGREGATED HOME PAGE DATA
 * (CMS blocks + picks + testimonials + teachers)
 */
export async function getHomePageData(req, res) {
  try {
    const homeCmsSlugs = [
      'home-hero-students-title',
      'home-hero-students-desc',
      'home-hero-teachers-title',
      'home-hero-teachers-desc',
      'home-welcome-title',
      'home-welcome-desc'
    ];

    const cmsResults = await Promise.all(
      homeCmsSlugs.map(slug =>
        CmsPage.findOne({ slug })
          .populate('secondSectionEmbed')
          .lean()
          .catch(() => null)
      )
    );

    const cmsData = {};
    homeCmsSlugs.forEach((slug, index) => {
      const page = cmsResults[index];
      cmsData[slug] = page
        ? {
            content: page.content || '',
            imageUrl: page.imageUrl || '',
            title: page.title || ''
          }
        : null;
    });

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
