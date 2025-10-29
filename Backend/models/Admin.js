import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  role: { 
    type: String, 
    default: 'admin',
    enum: ['admin', 'super-admin']
  },
  verified: { 
    type: Boolean, 
    default: true // Admins are now verified on creation by a super admin
  },
  createdBy: {
    type: String, // Firebase UID of the creator
    ref: 'Admin',
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware to update updatedAt
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to check if admin can login
adminSchema.virtual('canLogin').get(function() {
  return this.verified;
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;