import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  createdBy: { type: String }, // To store Firebase UID of the admin
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model('Post', postSchema);