// Backend/models/Embed.js
import mongoose from 'mongoose'

const EmbedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['AI', 'H5P'] },
    embedCode: { type: String, required: true },
    pageContext: { type: String, default: 'general', index: true } // Add this line (e.g., 'general', 'about', 'material')
  },
  { timestamps: true }
)

export default mongoose.models.Embed || mongoose.model('Embed', EmbedSchema) // Changed export