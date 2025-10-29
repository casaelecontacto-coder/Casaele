import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'flat'],
    default: 'percentage'
  },
  discountValue: { type: Number, required: true, min: 0 },
  minPurchase: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

couponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now <= this.expiryDate && 
         this.usedCount < this.usageLimit;
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
