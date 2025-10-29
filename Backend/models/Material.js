// Backend/models/Material.js
import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  tags: [{ type: String }],
  
  // *** AUTHOR FIELD ***
  author: { type: String, default: '' }, // Author name for the material
  
  // *** ADMIN-DEFINED CATEGORIZATION FIELDS ***
  category: { type: String, default: '' }, // Room/Category (e.g., "Grammar", "Vocabulary", "Conversation")
  subCategory: { type: String, default: '' }, // Sub Category (e.g., "Verbs", "Nouns", "Adjectives")
  theme: { type: String, default: '' }, // Theme/Genre (e.g., "Business", "Travel", "Academic")
  level: { type: String, default: '' }, // Level (e.g., "A1", "A2", "B1", "B2", "C1", "C2")
  country: { type: String, default: '' }, // Country (e.g., "Spain", "Mexico", "Argentina")
  dropdownTitle: { type: String, default: 'Ejercicios' },
  
  // *** EXISTING FIELDS ***
  fileUrl: { type: String, default: '' }, // Main image/file for the card
  bannerImageUrl: { type: String, default: '' }, // Image for banner display
  displayType: { type: String, enum: ['simple', 'banner'], default: 'simple' },
  imageSource: { type: String, enum: ['local', 'pinterest', ''], default: '' },
  embedIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Embed' }],
}, { timestamps: { createdAt: true, updatedAt: true } });

export default mongoose.models.Material || mongoose.model('Material', materialSchema);