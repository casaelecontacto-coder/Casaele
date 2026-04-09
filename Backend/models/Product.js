import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // Default price (kept for backward compatibility)
  discountPrice: { type: Number, default: 0 },

  // Multi-currency pricing
  prices: {
    USD: {
      price: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 }
    },
    EUR: {
      price: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 }
    },
    INR: {
      price: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 }
    }
  },

  category: { type: String, required: true },
  
  // --- CHANGE ---
  // We are replacing the old 'imageUrl' string
  // with an array of strings called 'imageUrls'
  imageUrls: [{ type: String }],
  // --- END CHANGE ---

  availableLevels: [{ type: String }], // Array of available levels like ['A1', 'B2']
  productType: { type: String, enum: ['Digital', 'Physical', 'Both'], default: 'Digital' },

  // Digital product files (for Digital and Both product types)
  digitalFiles: [{
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // 'pdf', 'doc', 'docx', 'html', 'mp3', 'mp4', 'wav', 'zip'
    fileSize: { type: Number }, // in bytes
    cloudinaryPublicId: { type: String }, // for file management and deletion
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Subscription option (optional external link)
  subscriptionUrl: { type: String, default: '' },
  subscriptionLabel: { type: String, default: 'Subscribe' },

  // Download settings for digital products
  downloadSettings: {
    maxDownloads: { type: Number, default: 3, min: 1 },
    linkExpiryDays: { type: Number, default: 30, min: 1 },
    requireAuth: { type: Boolean, default: false } // future: require login to download
  }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);