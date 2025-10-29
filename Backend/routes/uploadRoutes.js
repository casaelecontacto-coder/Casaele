import express from 'express'
import { uploadCmsImage } from '../controllers/uploadController.js'
import { upload } from '../config/cloudinaryConfig.js'

const router = express.Router()

// The route: POST /api/upload/cms-image
// 1. `upload.single('image')` processes the file. 'image' must match the key used in the frontend's FormData.
// 2. `uploadCmsImage` executes the Cloudinary upload logic.
router.post('/cms-image', upload.single('image'), uploadCmsImage)

export default router