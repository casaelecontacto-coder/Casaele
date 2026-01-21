import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  source: { type: String, default: 'website' }, // website, admin, import, beehive
  tags: [{ type: String }], // For segmentation

  // Beehive integration fields
  confirmationStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'unsubscribed'],
    default: 'pending'
  },
  confirmedAt: { type: Date },
  beehiveSubscriptionId: { type: String }, // Beehive's subscription ID for reference
  beehiveData: { type: mongoose.Schema.Types.Mixed }, // Store any additional Beehive metadata

  // Retry tracking for failed subscriptions
  retryCount: { type: Number, default: 0 },
  lastRetryAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subscriberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
