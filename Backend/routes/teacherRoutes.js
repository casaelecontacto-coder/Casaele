import express from 'express'
import Teacher from '../models/Teacher.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'
import { getCachedTeachers, setCachedTeachers, clearTeachersCache } from '../middleware/teachersCache.js'

const router = express.Router()

// Public: list (optimized with caching, lean, and pagination)
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const isDbConnected = req.app.get('isDbConnected');
    if (!isDbConnected) {
      console.warn('MongoDB not connected. Cannot fetch teachers.');
      return res.status(503).json({ message: 'Service Unavailable: MongoDB not connected' });
    }

    const showAll = req.query.all === 'true';

    // Check cache first (only for public/filtered requests)
    if (!showAll) {
      const cached = getCachedTeachers();
      if (cached) {
        return res.json(cached);
      }
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch from database with optimizations
    const items = await Teacher.find(showAll ? {} : { isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean(); // Use lean() for faster plain JS objects

    // Cache the result
    setCachedTeachers(items);

    res.json(items);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
})

// Admin: create
router.post('/', verifyAdminAccess, async (req, res) => {
  try {
    const { name, photoUrl, description } = req.body
    if (!name || !photoUrl || !description) return res.status(400).json({ message: 'name, photoUrl, description required' })
    const created = await Teacher.create({ name, photoUrl, description })
    
    // Clear cache when new teacher is created
    clearTeachersCache();
    
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ message: 'Failed to create teacher' })
  }
})

// Admin: update
router.put('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const { name, photoUrl, description } = req.body
    const updated = await Teacher.findByIdAndUpdate(req.params.id, { name, photoUrl, description }, { new: true, runValidators: true })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    
    // Clear cache when teacher is updated
    clearTeachersCache();
    
    res.json(updated)
  } catch (e) {
    res.status(500).json({ message: 'Failed to update teacher' })
  }
})

// Admin: toggle visibility
router.patch('/:id/toggle-active', verifyAdminAccess, async (req, res) => {
  try {
    const newActive = req.body.isActive
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' })
    const updated = await Teacher.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    clearTeachersCache()
    res.json({ _id: updated._id, isActive: updated.isActive })
  } catch (e) {
    res.status(500).json({ message: 'Failed to toggle visibility' })
  }
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    
    // Clear cache when teacher is deleted
    clearTeachersCache();
    
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete teacher' })
  }
})

export default router


