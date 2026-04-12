import mongoose from 'mongoose';

const homeSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    buttonLink: {
      type: String,
      required: true,
      trim: true
    },
    buttonText: {
      type: String,
      default: 'Vamos',
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

homeSlideSchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.model('HomeSlide', homeSlideSchema);
