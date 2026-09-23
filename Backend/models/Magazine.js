import mongoose from 'mongoose';

const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  coverImageUrl: { type: String, required: true },
  // Not `required: true` any more: a 'text' document may instead read from
  // readLinkUrl or readEmbedUrl (see readSourceType below). Issues and
  // comics still always need a PDF — enforced in the controller, where
  // contentType is known, rather than here.
  pdfUrl: { type: String, default: '' },
  category: { type: String, default: '' },

  // For contentType 'text' only: which of pdfUrl / readLinkUrl / readEmbedUrl
  // actually holds this text's content — mutually exclusive by construction,
  // so "Read the text" on the public site knows whether to auth-download a
  // PDF, open an external link in a new tab, or render an embed inline on
  // the page. Issues/comics ignore this and always use pdfUrl.
  readSourceType: { type: String, enum: ['pdf', 'link', 'embed'], default: 'pdf' },
  readLinkUrl: { type: String, default: '' },
  readEmbedUrl: { type: String, default: '' },

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

  // Manually picks which document is shown in the "featured" slot for its
  // contentType (e.g. the El Desvelo hero), overriding the default of
  // "newest publishedAt wins". At most one per contentType should be true
  // at a time — enforced in the controller, not here, since Mongoose
  // schema validators can't see sibling documents.
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for the magazines listing (active + most recently published) and category filter.
magazineSchema.index({ isActive: 1, publishedAt: -1 });
magazineSchema.index({ category: 1 });
magazineSchema.index({ contentType: 1, isActive: 1, publishedAt: -1 });
magazineSchema.index({ contentType: 1, isFeatured: 1 });

export default mongoose.models.Magazine || mongoose.model('Magazine', magazineSchema);
