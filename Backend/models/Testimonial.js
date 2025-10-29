import mongoose from 'mongoose'

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    profession: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    videoUrl: { type: String, default: '' }, // For uploaded video/image
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema)


