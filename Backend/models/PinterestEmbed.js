import mongoose from 'mongoose';

const PinterestEmbedSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['pin', 'board'] 
    },
    embedCode: { 
      type: String, 
      required: true 
    },
    imageUrl: { 
      type: String, 
      default: null 
    },
    sourceUrl: { 
      type: String, 
      default: null 
    },
    description: { 
      type: String, 
      default: null 
    },
    createdBy: {
      type: String, // Firebase UID
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
PinterestEmbedSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('PinterestEmbed', PinterestEmbedSchema);
