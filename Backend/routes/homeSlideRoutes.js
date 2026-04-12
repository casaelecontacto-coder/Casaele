import express from 'express';
import HomeSlide from '../models/HomeSlide.js';
import { verifyAdminAccess } from '../middleware/superAdminAuth.js';
import { getCachedHomeSlides, setCachedHomeSlides, clearHomeSlidesCache } from '../middleware/homeSlidesCache.js';

const router = express.Router();

// Get all active slides (public) - CACHED
router.get('/', async (req, res) => {
  try {
    const isDbConnected = req.app.get('isDbConnected');
    if (!isDbConnected) {
      return res.status(503).json({ message: 'Service Unavailable: MongoDB not connected' });
    }

    const cached = getCachedHomeSlides();
    if (cached) {
      return res.json(cached);
    }

    const slides = await HomeSlide.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    setCachedHomeSlides(slides);
    res.json(slides);
  } catch (error) {
    console.error('Error fetching home slides:', error);
    res.status(500).json({ message: 'Error fetching home slides' });
  }
});

// Get all slides for admin
router.get('/admin', verifyAdminAccess, async (req, res) => {
  try {
    const slides = await HomeSlide.find().sort({ order: 1, createdAt: -1 });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching home slides for admin:', error);
    res.status(500).json({ message: 'Error fetching home slides' });
  }
});

// Create a new slide
router.post('/', verifyAdminAccess, async (req, res) => {
  try {
    const { title, imageUrl, buttonLink, buttonText, order } = req.body;

    if (!title || !imageUrl || !buttonLink) {
      return res.status(400).json({ message: 'Title, image, and button link are required' });
    }

    const slide = new HomeSlide({
      title,
      imageUrl,
      buttonLink,
      buttonText: buttonText || 'Vamos',
      order: order || 0
    });

    await slide.save();
    clearHomeSlidesCache();
    res.status(201).json(slide);
  } catch (error) {
    console.error('Error creating home slide:', error);
    res.status(500).json({ message: 'Error creating home slide' });
  }
});

// Update a slide
router.put('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const { title, imageUrl, buttonLink, buttonText, isActive, order } = req.body;

    const slide = await HomeSlide.findByIdAndUpdate(
      req.params.id,
      { title, imageUrl, buttonLink, buttonText, isActive, order },
      { new: true }
    );

    if (!slide) {
      return res.status(404).json({ message: 'Home slide not found' });
    }

    clearHomeSlidesCache();
    res.json(slide);
  } catch (error) {
    console.error('Error updating home slide:', error);
    res.status(500).json({ message: 'Error updating home slide' });
  }
});

// Delete a slide
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const slide = await HomeSlide.findByIdAndDelete(req.params.id);

    if (!slide) {
      return res.status(404).json({ message: 'Home slide not found' });
    }

    clearHomeSlidesCache();
    res.json({ message: 'Home slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting home slide:', error);
    res.status(500).json({ message: 'Error deleting home slide' });
  }
});

export default router;
