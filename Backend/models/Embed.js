// Backend/models/Embed.js
import mongoose from 'mongoose'

const EmbedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['AI', 'H5P'] },
    embedCode: { type: String, required: true },
    pageContext: { type: String, default: 'general', index: true },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

// Index for efficient querying by chapter
EmbedSchema.index({ chapterId: 1, order: 1 });

export default mongoose.models.Embed || mongoose.model('Embed', EmbedSchema)