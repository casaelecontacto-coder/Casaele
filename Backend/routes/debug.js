import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = Router()

router.get('/token', verifyFirebaseToken, (req, res) => {
  res.json({ decoded: req.user })
})

export default router


