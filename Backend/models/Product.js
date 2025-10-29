import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String, default: '' }, // Single image URL for product
  // *** NEW FIELD ***
  availableLevels: [{ type: String }], // Array of available levels like ['A1', 'B2']
  // *** END NEW FIELD ***
  productType: { type: String, enum: ['Digital', 'Physical', 'Both'], default: 'Digital' },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);