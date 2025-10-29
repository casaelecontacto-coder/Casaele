import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  instructor: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  images: [{ type: String }], // Array for multiple images
  level: { type: String }, // Keep this if you use it for a default/main level
  // *** NEW FIELD ***
  availableLevels: [{ type: String }], // Array of available levels like ['A1', 'B2']
  // *** END NEW FIELD ***
  productType: { type: String, enum: ['Digital', 'Physical', 'Both'], default: 'Digital' },
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model('Course', courseSchema);