import express from 'express'
import Comment from '../models/Comment.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'

const router = express.Router()

// Public: submit comment
router.post('/add', async (req, res) => {
  try {
    const { name, message } = req.body
    if (!name || !message) return res.status(400).json({ message: 'name and message are required' })
    const created = await Comment.create({ name, message, status: 'pending' })
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit comment' })
  }
})

// Public: fetch approved comments (for frontend)
router.get('/approved', async (req, res) => {
  const items = await Comment.find({ status: 'approved' }).sort({ createdAt: -1 })
  res.json(items)
})

// Admin: get all
router.get('/', verifyAdminAccess, async (req, res) => {
  const items = await Comment.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: approve
router.put('/approve/:id', verifyAdminAccess, async (req, res) => {
  const updated = await Comment.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(updated)
})

// Admin: reject
router.put('/reject/:id', verifyAdminAccess, async (req, res) => {
  const updated = await Comment.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(updated)
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await Comment.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router


