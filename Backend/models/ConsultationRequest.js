import mongoose from 'mongoose';

const ConsultationRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    duration: { type: String, default: '', trim: true },
    role: { type: String, default: '', trim: true },
    situation: { type: String, default: '', trim: true },
    whatsapp: { type: String, default: '', trim: true },
    age: { type: String, default: '', trim: true },
    dream: { type: String, default: '', trim: true },
    gremlin: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'contacted'], default: 'new' },
    // Payment is checked server-side against Razorpay, never trusted from the browser.
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paymentLinkId: { type: String, default: '' },
    paymentLinkUrl: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

ConsultationRequestSchema.index({ createdAt: -1 });

export default mongoose.models.ConsultationRequest ||
  mongoose.model('ConsultationRequest', ConsultationRequestSchema);
