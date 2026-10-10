import mongoose from 'mongoose';

const WaitlistEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    course: { type: String, default: '', trim: true },
    status: { type: String, enum: ['waiting', 'contacted'], default: 'waiting' }
  },
  { timestamps: true }
);

WaitlistEntrySchema.index({ createdAt: -1 });

export default mongoose.models.WaitlistEntry ||
  mongoose.model('WaitlistEntry', WaitlistEntrySchema);
