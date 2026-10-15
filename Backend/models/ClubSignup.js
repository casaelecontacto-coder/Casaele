import mongoose from 'mongoose';

const ClubSignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    club: { type: String, default: '', trim: true },
    plan: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'contacted'], default: 'new' }
  },
  { timestamps: true }
);

ClubSignupSchema.index({ createdAt: -1 });

export default mongoose.models.ClubSignup ||
  mongoose.model('ClubSignup', ClubSignupSchema);
