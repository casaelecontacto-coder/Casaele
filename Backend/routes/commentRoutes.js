import express from 'express'
import Feedback from '../models/Feedback.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'

const router = express.Router()

// Backed by the unified Feedback collection now (see models/Feedback.js) —
// a "comment" is just a Feedback doc with no rating/course. The response
// shape below is kept identical to the old Comment model on purpose so
// CommentForm/CommentList/CommentsManager don't need any changes.
const toCommentShape = (f) => ({
  _id: f._id,
  name: f.name,
  message: f.text,
  date: f.createdAt,
  status: f.status,
})

// Public: submit comment
router.post('/add', async (req, res) => {
  try {
    const { name, message } = req.body
    if (!name || !message) return res.status(400).json({ message: 'name and message are required' })
    const created = await Feedback.create({ name, text: message, status: 'pending' })
    res.status(201).json(toCommentShape(created))
  } catch (e) {
    console.error('Error submitting comment:', e)
    res.status(500).json({ message: 'Failed to submit comment' })
  }
})

// Public: fetch approved comments (for frontend)
router.get('/approved', async (req, res) => {
  const items = await Feedback.find({ status: 'approved', rating: { $exists: false } }).sort({ createdAt: -1 })
  res.json(items.map(toCommentShape))
})

// Admin: get all
router.get('/', verifyAdminAccess, async (req, res) => {
  const items = await Feedback.find({ rating: { $exists: false } }).sort({ createdAt: -1 })
  res.json(items.map(toCommentShape))
})

// Admin: approve
router.put('/approve/:id', verifyAdminAccess, async (req, res) => {
  const updated = await Feedback.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(toCommentShape(updated))
})

// Admin: reject
router.put('/reject/:id', verifyAdminAccess, async (req, res) => {
  const updated = await Feedback.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(toCommentShape(updated))
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await Feedback.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router
