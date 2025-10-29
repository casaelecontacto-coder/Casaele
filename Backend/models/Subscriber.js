import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  source: { type: String, default: 'website' }, // website, admin, import
  tags: [{ type: String }], // For segmentation
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subscriberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
