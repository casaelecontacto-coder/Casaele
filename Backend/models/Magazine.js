import mongoose from 'mongoose';

const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  coverImageUrl: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  category: { type: String, default: '' },

  // What kind of entry this is, for pages that show more than one kind
  // side by side (e.g. the /products page: the featured issue, loose
  // single texts, and student comics are all Magazine documents,
  // distinguished only by this field). Existing documents default to
  // 'issue' so nothing already published changes categories.
  contentType: { type: String, enum: ['issue', 'text', 'comic'], default: 'issue' },

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

  // Complementary material (zip file)
  complementaryMaterialUrl: { type: String, default: '' },
  complementaryMaterialName: { type: String, default: '' },

  // Action button links (editable per magazine)
  donateLink: { type: String, default: '' },
  subscribeLink: { type: String, default: '' },
  preorderLink: { type: String, default: '' },

  // Embeds (interactive content)
  embedIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Embed' }],

  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for the magazines listing (active + most recently published) and category filter.
magazineSchema.index({ isActive: 1, publishedAt: -1 });
magazineSchema.index({ category: 1 });
magazineSchema.index({ contentType: 1, isActive: 1, publishedAt: -1 });

export default mongoose.models.Magazine || mongoose.model('Magazine', magazineSchema);
