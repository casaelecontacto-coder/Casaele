import mongoose from 'mongoose';

const ClubSignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    club: { type: String, default: '', trim: true },
    plan: { type: String, default: '', trim: true },
    whatsapp: { type: String, default: '', trim: true },
    age: { type: String, default: '', trim: true },
    superpower: { type: String, default: '', trim: true },
    confidence: { type: String, default: '', trim: true },
    culture: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'contacted'], default: 'new' }
  },
  { timestamps: true }
);

ClubSignupSchema.index({ createdAt: -1 });

export default mongoose.models.ClubSignup ||
  mongoose.model('ClubSignup', ClubSignupSchema);
