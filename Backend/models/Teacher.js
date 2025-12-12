import mongoose from 'mongoose'

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

// Add index on createdAt for faster sorting
TeacherSchema.index({ createdAt: -1 })

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema)


