import { Router } from 'express'
import { getHomeData } from '../controllers/homeDataController.js'

const router = Router()

// Aggregated endpoint for Home page - returns all CMS, picks, testimonials, and teachers in one call
router.get('/', getHomeData)

export default router
