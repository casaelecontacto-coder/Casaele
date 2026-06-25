import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

// Index for fetching approved comments newest-first (used by the public comments list).
CommentSchema.index({ status: 1, createdAt: -1 })

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema)


