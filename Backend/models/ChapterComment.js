import mongoose from 'mongoose'

// A comment on one course chapter (Material), with one level of threading:
// a top-level comment has parent = null; a reply has parent = the id of the
// top-level comment it hangs off. Replying to a reply attaches to that reply's
// root and records who it was answering in replyToName, so threads stay flat
// and readable instead of nesting arbitrarily deep.
//
// Deliberately separate from the Feedback collection: Feedback is the
// moderated-before-shown "note to the school" / course-review feed the admin's
// Feedback page reads, and has no chapter, author account, or threading.
const ChapterCommentSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ChapterComment', default: null },
    // Firebase uid of the author. Never sent to clients — they only get a
    // `mine` flag — so it can't be used to link a person across the site.
    uid: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    photoUrl: { type: String, default: '' },
    replyToName: { type: String, default: '', maxlength: 60 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
)

// Loading a chapter's thread, oldest first.
ChapterCommentSchema.index({ material: 1, createdAt: 1 })
// Per-user posting rate limit.
ChapterCommentSchema.index({ uid: 1, createdAt: -1 })
// Deleting a comment's replies.
ChapterCommentSchema.index({ parent: 1 })

export default mongoose.models.ChapterComment || mongoose.model('ChapterComment', ChapterCommentSchema)
