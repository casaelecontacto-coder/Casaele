import express from 'express';
import Pick from '../models/Pick.js';
import { verifyAdminAccess } from '../middleware/superAdminAuth.js';

const router = express.Router();

// Get all picks (public)
router.get('/', async (req, res) => {
  try {
    const picks = await Pick.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(3);
    res.json(picks);
  } catch (error) {
    console.error('Error fetching picks:', error);
    res.status(500).json({ message: 'Error fetching picks' });
  }
});

// Get all picks for admin
router.get('/admin', verifyAdminAccess, async (req, res) => {
  try {
    const picks = await Pick.find().sort({ order: 1, createdAt: -1 });
    res.json(picks);
  } catch (error) {
    console.error('Error fetching picks for admin:', error);
    res.status(500).json({ message: 'Error fetching picks' });
  }
});

// Create a new pick
router.post('/', verifyAdminAccess, async (req, res) => {
  try {
    const { title, description, imageUrl, externalLink, order } = req.body;

    if (!title || !description || !imageUrl || !externalLink) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const pick = new Pick({
      title,
      description,
      imageUrl,
      externalLink,
      order: order || 0
    });

    await pick.save();
    res.status(201).json(pick);
  } catch (error) {
    console.error('Error creating pick:', error);
    res.status(500).json({ message: 'Error creating pick' });
  }
});

// Update a pick
router.put('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const { title, description, imageUrl, externalLink, isActive, order } = req.body;

    const pick = await Pick.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        imageUrl,
        externalLink,
        isActive,
        order
      },
      { new: true }
    );

    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    res.json(pick);
  } catch (error) {
    console.error('Error updating pick:', error);
    res.status(500).json({ message: 'Error updating pick' });
  }
});

// Delete a pick
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const pick = await Pick.findByIdAndDelete(req.params.id);

    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    res.json({ message: 'Pick deleted successfully' });
  } catch (error) {
    console.error('Error deleting pick:', error);
    res.status(500).json({ message: 'Error deleting pick' });
  }
});

export default router;
