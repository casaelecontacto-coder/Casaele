import mongoose from 'mongoose';

const WaitlistEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    course: { type: String, default: '', trim: true },
    whatsapp: { type: String, default: '', trim: true },
    age: { type: String, default: '', trim: true },
    // Answers from the waiting-list questionnaire (all optional)
    relationship: { type: String, default: '', trim: true },
    origin: { type: [String], default: [] },
    originOther: { type: String, default: '', trim: true },
    goals: { type: [String], default: [] },
    goalsOther: { type: String, default: '', trim: true },
    struggles: { type: [String], default: [] },
    strugglesOther: { type: String, default: '', trim: true },
    about: { type: String, default: '', trim: true },
    status: { type: String, enum: ['waiting', 'contacted'], default: 'waiting' }
  },
  { timestamps: true }
);

WaitlistEntrySchema.index({ createdAt: -1 });

export default mongoose.models.WaitlistEntry ||
  mongoose.model('WaitlistEntry', WaitlistEntrySchema);
