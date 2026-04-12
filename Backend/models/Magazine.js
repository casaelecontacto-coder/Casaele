import mongoose from 'mongoose';

const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  coverImageUrl: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  category: { type: String, default: '' },

  // Free or Paid
  accessType: { type: String, enum: ['free', 'paid'], default: 'free' },
  price: { type: Number, default: 0 },
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

  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Magazine || mongoose.model('Magazine', magazineSchema);
