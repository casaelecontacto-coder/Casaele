import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

// Single moderation view over everything in the Feedback collection —
// chapter/material comments and course reviews together, newest first.
// The old, separate /api/comments and /api/reviews endpoints still exist
// (the public site's comment form and course review widget still call
// them), but the admin's merged Feedback page reads and writes here.

// GET /api/feedback - everything, admin only
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const items = await Feedback.find()
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json(items.map((f) => ({
      _id: f._id,
      type: f.rating ? 'review' : 'comment',
      name: f.name,
      text: f.text,
      rating: f.rating || null,
      course: f.course || null,
      status: f.status,
      createdAt: f.createdAt,
    })));
  } catch (e) {
    console.error('Error fetching feedback:', e);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// PUT /api/feedback/:id - approve / reject / reset
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('course', 'title');
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({
      _id: updated._id,
      type: updated.rating ? 'review' : 'comment',
      name: updated.name,
      text: updated.text,
      rating: updated.rating || null,
      course: updated.course || null,
      status: updated.status,
      createdAt: updated.createdAt,
    });
  } catch (e) {
    console.error('Error updating feedback status:', e);
    res.status(500).json({ message: 'Failed to update feedback' });
  }
});

// DELETE /api/feedback/:id
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting feedback:', e);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

export default router;
