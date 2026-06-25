import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  subtitle: { type: String, default: '' }, // Optional subtitle for courses
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  instructor: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  images: [{ type: String }], // Array for multiple images
  // Embeds (AI/H5P interactive content)
  embedIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Embed' }],

  level: { type: String }, // Keep this if you use it for a default/main level
  // *** NEW FIELD ***
  availableLevels: [{ type: String }], // Array of available levels like ['A1', 'B2']
  // *** END NEW FIELD ***
  productType: { type: String, enum: ['Digital', 'Physical', 'Both'], default: 'Digital' },
  isActive: { type: Boolean, default: true },
  // Purchase type: 'price' for paid courses, 'form' for lead generation via Google Form
  purchaseType: { type: String, enum: ['price', 'form'], default: 'price' },
  // Google Form URL - required when purchaseType is 'form'
  formUrl: { type: String, default: '' },
}, { timestamps: true });

// Indexes for the courses listing (active + newest first) and category filter.
courseSchema.index({ isActive: 1, createdAt: -1 });
courseSchema.index({ category: 1 });

export default mongoose.models.Course || mongoose.model('Course', courseSchema);