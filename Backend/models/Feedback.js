import mongoose from 'mongoose'

// Unified model for what used to be two separate collections:
//   - Comment: free-text notes left on material/chapter pages (no rating, no target)
//   - Review:  star ratings (1-5) left on a specific course
//
// One shape covers both: a plain comment is a Feedback doc with no `rating`
// and no `course`; a course review is a Feedback doc with both set. Existing
// Comment and Review documents are migrated into this collection by
// Backend/scripts/migrateCommentsAndReviewsToFeedback.js — see that script
// before dropping the old `comments`/`reviews` collections.
const FeedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true }, // was `message` (Comment) / `comment` (Review)
    rating: { type: Number, min: 1, max: 5 }, // present only when this is a course review
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // present only when this is a course review
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

// Admin "all feedback" list, newest first.
FeedbackSchema.index({ status: 1, createdAt: -1 })
// Public "approved reviews for this course" lookup.
FeedbackSchema.index({ course: 1, status: 1 })

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema)
