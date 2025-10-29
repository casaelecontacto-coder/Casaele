import express from 'express'
import Teacher from '../models/Teacher.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'

const router = express.Router()

// Public: list
router.get('/', async (req, res) => {
  const items = await Teacher.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: create
router.post('/', verifyAdminAccess, async (req, res) => {
  try {
    const { name, photoUrl, description } = req.body
    if (!name || !photoUrl || !description) return res.status(400).json({ message: 'name, photoUrl, description required' })
    const created = await Teacher.create({ name, photoUrl, description })
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
    res.json(updated)
  } catch (e) {
    res.status(500).json({ message: 'Failed to update teacher' })
  }
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await Teacher.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router


