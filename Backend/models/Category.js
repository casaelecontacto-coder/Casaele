import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
