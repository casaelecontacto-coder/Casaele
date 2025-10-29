import mongoose from 'mongoose'

const SuggestionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema)
