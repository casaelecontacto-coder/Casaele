import express from 'express'
import Suggestion from '../models/Suggestion.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'

const router = express.Router()

// Public: submit suggestion
router.post('/add', async (req, res) => {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) return res.status(400).json({ message: 'name, email, and message are required' })
    const created = await Suggestion.create({ name, email, message })
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit suggestion' })
  }
})

// Admin: get all
router.get('/', verifyAdminAccess, async (req, res) => {
  const items = await Suggestion.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await Suggestion.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router
