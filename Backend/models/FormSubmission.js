import mongoose from 'mongoose'

const formSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.FormSubmission || mongoose.model('FormSubmission', formSubmissionSchema)


