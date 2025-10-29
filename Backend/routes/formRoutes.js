import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { submitForm, listForms, exportFormsExcel, getRecentDebug } from '../controllers/formsController.js'

const router = Router()

// Public submit endpoint; add verifyFirebaseToken if you want to restrict
router.post('/', submitForm)

// Admin endpoints
router.get('/', verifyFirebaseToken, listForms)
router.get('/export', verifyFirebaseToken, exportFormsExcel)
// Temporary secure debug endpoint - requires x-debug-key header
router.get('/recent-debug', getRecentDebug)

export default router


