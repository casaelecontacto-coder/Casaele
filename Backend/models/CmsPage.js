import mongoose from 'mongoose'

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const cmsPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, default: '' },
    imageUrl: { type: String, default: '' }, // For the first image
    
    // ++ ADD THIS FIELD ++
    // Reference to an Embed document for the second section
    secondSectionEmbed: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Embed', // Must match the Embed model name
      default: null 
    }, 
  },
  { timestamps: true }
)

cmsPageSchema.pre('validate', function (next) {
  if (!this.slug && this.title) this.slug = slugify(this.title)
  next()
})

export default mongoose.models.CmsPage || mongoose.model('CmsPage', cmsPageSchema)