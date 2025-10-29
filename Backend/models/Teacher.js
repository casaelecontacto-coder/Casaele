import mongoose from 'mongoose'

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema)


