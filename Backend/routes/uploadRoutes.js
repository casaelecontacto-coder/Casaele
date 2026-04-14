import express from 'express'
import { uploadCmsImage, uploadHtmlFile, uploadDigitalProductFile, uploadMagazinePdf } from '../controllers/uploadController.js'
import { upload } from '../config/cloudinaryConfig.js'

const router = express.Router()

// The route: POST /api/upload/cms-image
// 1. `upload.single('image')` processes the file. 'image' must match the key used in the frontend's FormData.
// 2. `uploadCmsImage` executes the Cloudinary upload logic.
router.post('/cms-image', upload.single('image'), uploadCmsImage)

// The route: POST /api/upload/html-file
// Upload HTML activity files to Cloudinary
router.post('/html-file', upload.single('htmlFile'), uploadHtmlFile)

// The route: POST /api/uploads/digital-product-file
// Upload digital product files (PDF, DOC, MP3, MP4, etc.) to Cloudinary
router.post('/digital-product-file', upload.single('file'), uploadDigitalProductFile)

// Magazine PDF uploads (publicly accessible for viewing)
router.post('/magazine-pdf', upload.single('file'), uploadMagazinePdf)

// Magazine complementary material uploads (zip files)
router.post('/magazine-material', upload.single('file'), uploadDigitalProductFile)

export default router