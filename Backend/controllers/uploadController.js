import cloudinary from '../config/cloudinaryConfig.js' // Import the configured cloudinary instance

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