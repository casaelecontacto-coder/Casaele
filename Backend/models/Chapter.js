// Backend/models/Chapter.js
import mongoose from 'mongoose';

const ChapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    order: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String, // Firebase UID or admin email
      required: true
    },
    embedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient querying
ChapterSchema.index({ order: 1, createdAt: -1 });
ChapterSchema.index({ isActive: 1 });

// Virtual for embeds
ChapterSchema.virtual('embeds', {
  ref: 'Embed',
  localField: '_id',
  foreignField: 'chapterId'
});

// Pre-save middleware to handle order
ChapterSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    // Auto-assign order based on existing chapters
    const count = await mongoose.model('Chapter').countDocuments();
    this.order = count + 1;
  }
  next();
});

const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);

export default Chapter;
