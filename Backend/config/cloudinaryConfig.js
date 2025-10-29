import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import dotenv from 'dotenv'

dotenv.config()

// 1. Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// 2. Configure Multer to store the file in memory (important for buffer upload to Cloudinary)
const storage = multer.memoryStorage()
export const upload = multer({ storage: storage })

// 3. Export Cloudinary instance
export default cloudinary