import cloudinary from '../config/cloudinaryConfig.js' // Import the configured cloudinary instance
import { uploadFileToDrive } from '../services/googleDriveService.js'

// Controller function to handle the image upload to Cloudinary
export const uploadCmsImage = async (req, res) => {
  try {
    // Check if multer successfully processed the file into memory
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // Convert the image buffer into a Data URI (Base64 string) for Cloudinary upload
    const fileBuffer = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${fileBuffer}`

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'cms-images', // Stores all CMS images in a dedicated folder
      resource_type: 'auto',
      quality: 'auto:low' // Optional optimization setting
    })

    // Send the secure URL back to the frontend
    res.status(200).json({ success: true, url: result.secure_url })
  } catch (error) {
    console.error('Cloudinary Upload Error:', error)
    res.status(500).json({ success: false, message: 'Image upload failed. Check server logs.' })
  }
}

// Controller function to handle HTML file uploads to Cloudinary
export const uploadHtmlFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // Validate that it's an HTML file
    if (req.file.mimetype !== 'text/html' && !req.file.originalname.endsWith('.html')) {
      return res.status(400).json({ success: false, message: 'Only HTML files are allowed' })
    }

    // Convert the HTML buffer into a Data URI
    const fileBuffer = req.file.buffer.toString('base64')
    const dataUri = `data:text/html;base64,${fileBuffer}`

    // Upload the HTML file to Cloudinary as raw resource
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'html-activities',
      resource_type: 'raw',
      format: 'html',
      access_mode: 'public'
    })

    // Send the secure URL back to the frontend
    res.status(200).json({ success: true, url: result.secure_url })
  } catch (error) {
    console.error('HTML Upload Error:', error)
    res.status(500).json({ success: false, message: 'HTML upload failed. Check server logs.' })
  }
}

// Controller function to handle digital product file uploads (PDF, DOC, MP3, MP4, etc.)
export const uploadDigitalProductFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // Define allowed file types and their extensions
    const allowedTypes = {
      // Documents
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/html': 'html',
      // Audio
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      // Video
      'video/mp4': 'mp4',
      // Archives
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip'
    }

    // Get file extension from original filename
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase()

    // Validate file type
    if (!allowedTypes[req.file.mimetype] && !['pdf', 'doc', 'docx', 'html', 'mp3', 'wav', 'mp4', 'zip'].includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Supported formats: PDF, DOC, DOCX, HTML, MP3, WAV, MP4, ZIP`
      })
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds 100MB limit. File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
      })
    }

    // Check if Google Drive is configured - use it for digital products
    const useGoogleDrive = !!(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.GOOGLE_DRIVE_FOLDER_ID)

    console.log('[Upload] Storage backend:', useGoogleDrive ? 'Google Drive' : 'Cloudinary')
    console.log('[Upload] File:', req.file.originalname, `(${(req.file.size / 1024 / 1024).toFixed(2)}MB)`)

    if (useGoogleDrive) {
      // Upload to Google Drive
      const { fileId } = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype)

      console.log('[Upload] Digital product uploaded to Google Drive:', fileId)

      res.status(200).json({
        success: true,
        url: `gdrive://${fileId}`,
        publicId: fileId,
        fileName: req.file.originalname,
        fileType: fileExtension,
        fileSize: req.file.size,
        resourceType: 'gdrive'
      })
    } else {
      // Fallback: Upload to Cloudinary (legacy behavior)
      let resourceType = 'raw'
      if (req.file.mimetype.startsWith('audio/')) {
        resourceType = 'video'
      } else if (req.file.mimetype.startsWith('video/')) {
        resourceType = 'video'
      }

      const fileBuffer = req.file.buffer.toString('base64')
      const dataUri = `data:${req.file.mimetype};base64,${fileBuffer}`

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `digital-products/${fileExtension}`,
        resource_type: resourceType,
        access_mode: 'authenticated',
        type: 'authenticated'
      })

      res.status(200).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileType: fileExtension,
        fileSize: req.file.size,
        resourceType: resourceType
      })
    }
  } catch (error) {
    console.error('Digital Product File Upload Error:', error)
    res.status(500).json({
      success: false,
      message: 'File upload failed. Please try again.',
      error: error.message
    })
  }
}