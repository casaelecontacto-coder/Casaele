import express from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { createEmbed, getEmbeds, updateEmbed, deleteEmbed } from '../controllers/embedController.js'

const router = express.Router()

// Public read; admin-protected writes
router.get('/', getEmbeds)
router.post('/', verifyFirebaseToken, createEmbed)
router.patch('/:id/toggle-active', verifyFirebaseToken, async (req, res) => {
  try {
    const Embed = (await import('../models/Embed.js')).default
    const newActive = req.body.isActive
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' })
    const updated = await Embed.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Embed not found' })
    res.json({ _id: updated._id, isActive: updated.isActive })
  } catch (error) {
    res.status(500).json({ message: 'Error toggling embed visibility' })
  }
})
router.put('/:id', verifyFirebaseToken, updateEmbed)
router.delete('/:id', verifyFirebaseToken, deleteEmbed)

export default router


