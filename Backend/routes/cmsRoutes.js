import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { createCmsPage, getCmsPages, getCmsPageById, getCmsPageBySlug, updateCmsPage, deleteCmsPage, getHomePageData } from '../controllers/cmsController.js'

const router = Router()

router.post('/', verifyFirebaseToken, createCmsPage)
router.get('/', getCmsPages) // public cms list

// Aggregated endpoint for Home page (MUST be before /slug/:slug to avoid conflicts)
router.get('/home', getHomePageData)
router.get('/grouped', getHomePageData) // Alias for /grouped endpoint

// Public fetch by slug (MUST be before /:id to avoid conflicts)
router.get('/slug/:slug', getCmsPageBySlug)

router.get('/:id', getCmsPageById) // public cms by id
router.put('/:id', verifyFirebaseToken, updateCmsPage)
router.delete('/:id', verifyFirebaseToken, deleteCmsPage)

export default router


