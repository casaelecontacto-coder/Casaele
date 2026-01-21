import mongoose from 'mongoose';

const digitalDownloadSchema = new mongoose.Schema(
  {
    // Links download to order and customer
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },

    // Customer identification
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    // Download tracking
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDownloads: {
      type: Number,
      default: 3,
      min: 1
    },
    downloads: [
      {
        downloadedAt: {
          type: Date,
          default: Date.now
        },
        ipAddress: {
          type: String
        },
        userAgent: {
          type: String
        },
        fileUrl: {
          type: String
        },
        fileName: {
          type: String
        }
      }
    ],

    // Security: unique token for download links
    accessToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Link expiry
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isExpired: {
      type: Boolean,
      default: false
    },

    // Status tracking
    status: {
      type: String,
      enum: ['active', 'exhausted', 'expired', 'revoked'],
      default: 'active',
      index: true
    },

    // Email delivery tracking
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date
    },
    emailDeliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'pending'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
digitalDownloadSchema.index({ orderId: 1, productId: 1 });
digitalDownloadSchema.index({ customerEmail: 1, productId: 1 });
digitalDownloadSchema.index({ status: 1, expiresAt: 1 });

// Pre-save middleware to check expiry
digitalDownloadSchema.pre('save', function (next) {
  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt && !this.isExpired) {
    this.isExpired = true;
    if (this.status === 'active' || this.status === 'exhausted') {
      this.status = 'expired';
    }
  }

  // Check if download limit reached
  if (this.downloadCount >= this.maxDownloads && this.status === 'active') {
    this.status = 'exhausted';
  }

  next();
});

// Instance method to check if download is allowed
digitalDownloadSchema.methods.canDownload = function () {
  // Check if expired
  if (this.isExpired || new Date() > this.expiresAt) {
    return { allowed: false, reason: 'Download link has expired' };
  }

  // Check if revoked
  if (this.status === 'revoked') {
    return { allowed: false, reason: 'Download access has been revoked' };
  }

  // Check download limit
  if (this.downloadCount >= this.maxDownloads) {
    return { allowed: false, reason: 'Download limit reached' };
  }

  // Check status
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Download is not active' };
  }

  return { allowed: true };
};

// Instance method to record a download
digitalDownloadSchema.methods.recordDownload = function (downloadData) {
  this.downloads.push({
    downloadedAt: new Date(),
    ipAddress: downloadData.ipAddress,
    userAgent: downloadData.userAgent,
    fileUrl: downloadData.fileUrl,
    fileName: downloadData.fileName
  });

  this.downloadCount += 1;

  // Update status if limit reached
  if (this.downloadCount >= this.maxDownloads) {
    this.status = 'exhausted';
  }

  return this.save();
};

// Static method to find active downloads for a customer
digitalDownloadSchema.statics.findActiveByCustomer = function (email) {
  return this.find({
    customerEmail: email.toLowerCase().trim(),
    status: { $in: ['active', 'exhausted'] },
    isExpired: false
  }).populate('productId', 'name digitalFiles');
};

// Static method to find downloads for an order
digitalDownloadSchema.statics.findByOrder = function (orderId) {
  return this.find({ orderId })
    .populate('productId', 'name digitalFiles')
    .sort({ createdAt: -1 });
};

const DigitalDownload = mongoose.model('DigitalDownload', digitalDownloadSchema);

export default DigitalDownload;
