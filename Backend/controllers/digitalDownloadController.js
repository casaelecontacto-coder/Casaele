import crypto from 'crypto';
import DigitalDownload from '../models/DigitalDownload.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import cloudinary from '../config/cloudinaryConfig.js';

/**
 * Generate cryptographically secure access token
 */
function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiry date based on product settings
 */
function calculateExpiryDate(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

/**
 * Generate Cloudinary signed URL for authenticated resources
 */
function generateSignedUrl(publicId, resourceType = 'raw') {
  try {
    const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

    const signatureParams = {
      timestamp,
      type: 'authenticated'
    };

    const signature = cloudinary.utils.api_sign_request(
      signatureParams,
      process.env.CLOUDINARY_API_SECRET
    );

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const signedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/authenticated/${publicId}?timestamp=${timestamp}&signature=${signature}`;

    return signedUrl;
  } catch (error) {
    console.error('[Cloudinary] Signed URL generation error:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * @route   POST /api/digital-downloads/create
 * @desc    Create download records for digital products in an order (internal use)
 * @access  Internal (called after order verification)
 */
export async function createDownloadRecords(orderData) {
  const { orderId, customerEmail, customerName, products } = orderData;

  try {
    const downloadRecords = [];

    // Support both 'products' and 'digitalProducts' for backward compatibility
    const digitalProducts = products || orderData.digitalProducts || [];

    for (const item of digitalProducts) {
      const product = await Product.findById(item.productId);

      if (!product || !product.digitalFiles || product.digitalFiles.length === 0) {
        console.warn(`[DigitalDownload] Product ${item.productId} has no digital files`);
        continue;
      }

      // Get download settings from product or use defaults
      const maxDownloads = product.downloadSettings?.maxDownloads || 3;
      const linkExpiryDays = product.downloadSettings?.linkExpiryDays || 30;

      // Create download record
      const downloadRecord = await DigitalDownload.create({
        orderId,
        productId: product._id,
        customerEmail: customerEmail.toLowerCase().trim(),
        customerName,
        downloadCount: 0,
        maxDownloads,
        accessToken: generateAccessToken(),
        expiresAt: calculateExpiryDate(linkExpiryDays),
        status: 'active',
        emailSent: false,
        emailDeliveryStatus: 'pending'
      });

      // Add product info for email template
      downloadRecords.push({
        ...downloadRecord.toObject(),
        productName: product.name,
        files: product.digitalFiles || [],
        maxDownloads,
        expiresAt: downloadRecord.expiresAt
      });
    }

    // Return array directly for backward compatibility with orderController
    return downloadRecords;
  } catch (error) {
    console.error('[DigitalDownload] Create records error:', error);
    throw error;
  }
}

/**
 * @route   GET /api/digital-downloads/verify/:token
 * @desc    Verify download token and get product info
 * @access  Public
 */
export async function verifyDownloadToken(req, res) {
  try {
    const { token } = req.params;

    const downloadRecord = await DigitalDownload.findOne({ accessToken: token })
      .populate('productId', 'name digitalFiles downloadSettings');

    if (!downloadRecord) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    // Check if can download
    const canDownload = downloadRecord.canDownload();

    if (!canDownload.allowed) {
      return res.status(403).json({
        success: false,
        message: canDownload.reason,
        status: downloadRecord.status
      });
    }

    // Return download info
    res.status(200).json({
      success: true,
      data: {
        productName: downloadRecord.productId.name,
        files: downloadRecord.productId.digitalFiles.map(file => ({
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize
        })),
        downloadCount: downloadRecord.downloadCount,
        maxDownloads: downloadRecord.maxDownloads,
        downloadsRemaining: downloadRecord.maxDownloads - downloadRecord.downloadCount,
        expiresAt: downloadRecord.expiresAt,
        customerName: downloadRecord.customerName,
        status: downloadRecord.status
      }
    });
  } catch (error) {
    console.error('[DigitalDownload] Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
}

/**
 * @route   POST /api/digital-downloads/track/:token
 * @desc    Track download and return signed Cloudinary URL
 * @access  Public
 */
export async function trackDownload(req, res) {
  try {
    const { token } = req.params;
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    const downloadRecord = await DigitalDownload.findOne({ accessToken: token })
      .populate('productId', 'digitalFiles');

    if (!downloadRecord) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    // Check if can download
    const canDownload = downloadRecord.canDownload();

    if (!canDownload.allowed) {
      return res.status(403).json({
        success: false,
        message: canDownload.reason
      });
    }

    // Find the specific file
    const file = downloadRecord.productId.digitalFiles.find(f => f.fileUrl === fileUrl);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Record the download
    await downloadRecord.recordDownload({
      ipAddress,
      userAgent,
      fileUrl: file.fileUrl,
      fileName: file.fileName
    });

    // Generate signed URL for Cloudinary
    let signedUrl;
    try {
      // Extract public ID from Cloudinary URL
      const urlParts = file.fileUrl.split('/');
      const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
      const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
      const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

      // Determine resource type
      let resourceType = 'raw';
      if (['mp3', 'wav', 'mp4'].includes(file.fileType)) {
        resourceType = 'video';
      }

      signedUrl = generateSignedUrl(publicId, resourceType);
    } catch (urlError) {
      console.error('[DigitalDownload] Signed URL generation error:', urlError);
      // Fallback to original URL (less secure but functional)
      signedUrl = file.fileUrl;
    }

    res.status(200).json({
      success: true,
      signedUrl,
      fileName: file.fileName,
      downloadsRemaining: downloadRecord.maxDownloads - downloadRecord.downloadCount
    });
  } catch (error) {
    console.error('[DigitalDownload] Track download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed. Please try again.'
    });
  }
}

/**
 * @route   GET /api/digital-downloads/admin/orders/:orderId
 * @desc    Get all digital downloads for an order (admin)
 * @access  Admin
 */
export async function getOrderDownloads(req, res) {
  try {
    const { orderId } = req.params;

    const downloads = await DigitalDownload.findByOrder(orderId);

    res.status(200).json({
      success: true,
      data: downloads
    });
  } catch (error) {
    console.error('[DigitalDownload] Get order downloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve downloads'
    });
  }
}

/**
 * @route   GET /api/digital-downloads/admin
 * @desc    Get all digital downloads with filters (admin)
 * @access  Admin
 */
export async function getAllDownloads(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      email,
      orderId
    } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (email) filter.customerEmail = email.toLowerCase().trim();
    if (orderId) filter.orderId = orderId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const downloads = await DigitalDownload.find(filter)
      .populate('productId', 'name')
      .populate('orderId', 'razorpayOrderId totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DigitalDownload.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: downloads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[DigitalDownload] Get all downloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve downloads'
    });
  }
}

/**
 * @route   POST /api/digital-downloads/admin/reset/:id
 * @desc    Reset download count for a customer (admin)
 * @access  Admin
 */
export async function resetDownloadCount(req, res) {
  try {
    const { id } = req.params;

    const downloadRecord = await DigitalDownload.findById(id);

    if (!downloadRecord) {
      return res.status(404).json({
        success: false,
        message: 'Download record not found'
      });
    }

    // Reset count and status
    downloadRecord.downloadCount = 0;
    downloadRecord.downloads = [];
    if (downloadRecord.status === 'exhausted') {
      downloadRecord.status = 'active';
    }

    await downloadRecord.save();

    res.status(200).json({
      success: true,
      message: 'Download count reset successfully',
      data: downloadRecord
    });
  } catch (error) {
    console.error('[DigitalDownload] Reset download count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset download count'
    });
  }
}
