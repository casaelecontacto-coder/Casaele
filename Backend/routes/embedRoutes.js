import express from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { createEmbed, getEmbeds, updateEmbed, deleteEmbed } from '../controllers/embedController.js'

const router = express.Router()

// Public read; admin-protected writes
router.get('/', getEmbeds)
router.post('/', verifyFirebaseToken, createEmbed)
router.put('/:id', verifyFirebaseToken, updateEmbed)
router.delete('/:id', verifyFirebaseToken, deleteEmbed)

export default router


