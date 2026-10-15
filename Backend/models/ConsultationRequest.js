import mongoose from 'mongoose';

const ConsultationRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    duration: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'contacted'], default: 'new' }
  },
  { timestamps: true }
);

ConsultationRequestSchema.index({ createdAt: -1 });

export default mongoose.models.ConsultationRequest ||
  mongoose.model('ConsultationRequest', ConsultationRequestSchema);
