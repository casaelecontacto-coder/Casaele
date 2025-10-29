import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true 
  },
  rating: { 
    type: Number, 
    required: [true, 'Rating is required'], 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: [true, 'Comment is required'], 
    trim: true 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);