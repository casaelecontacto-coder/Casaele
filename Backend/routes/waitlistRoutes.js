import express from 'express'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'

const router = express.Router()

// Public: join the waiting list
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, course } = req.body || {}
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }
    const created = await WaitlistEntry.create({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 200),
      phone: String(phone || '').trim().slice(0, 40),
      course: String(course || '').trim().slice(0, 120)
    })
    res.status(201).json({ success: true, id: created._id })
  } catch (e) {
    console.error('Waitlist submit error:', e?.message || e)
    res.status(500).json({ message: 'Failed to join the waiting list' })
  }
})

// Admin: list everyone on the waiting list
router.get('/', verifyAdminAccess, async (req, res) => {
  try {
    const items = await WaitlistEntry.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (e) {
    console.error('Waitlist list error:', e?.message || e)
    res.status(500).json({ message: 'Failed to fetch the waiting list' })
  }
})

// Admin: mark contacted / back to waiting
router.put('/:id/status', verifyAdminAccess, async (req, res) => {
  const status = req.body?.status
  if (!['waiting', 'contacted'].includes(status)) {
    return res.status(400).json({ message: 'status must be waiting or contacted' })
  }
  const updated = await WaitlistEntry.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(updated)
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await WaitlistEntry.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router
