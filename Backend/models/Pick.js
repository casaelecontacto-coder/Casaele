import mongoose from 'mongoose';

const pickSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    externalLink: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for Home page query optimization
// Matches: find({ isActive: true }).sort({ order: 1, createdAt: -1 })
pickSchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.model('Pick', pickSchema);
