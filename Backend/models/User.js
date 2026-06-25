import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    provider: {
      type: String,
      default: '',
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for newest-first user listings (admin dashboard recent activity).
// (email already has a unique index from the field definition above.)
userSchema.index({ createdAt: -1 })

const User = mongoose.model('User', userSchema)
export default User


