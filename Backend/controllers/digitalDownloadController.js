import crypto from 'crypto';
import DigitalDownload from '../models/DigitalDownload.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import cloudinary from '../config/cloudinaryConfig.js';
import { getFileStreamFromDrive } from '../services/googleDriveService.js';

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

    console.log('[DigitalDownload] Verifying token:', token);

    const downloadRecord = await DigitalDownload.findOne({ accessToken: token })
      .populate('productId', 'name digitalFiles downloadSettings');

    if (!downloadRecord) {
      console.log('[DigitalDownload] Token not found in database');
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    console.log('[DigitalDownload] Found download record:', downloadRecord._id);

    // Check if product still exists (populate worked)
    if (!downloadRecord.productId) {
      console.log('[DigitalDownload] Product not found for download record');
      return res.status(404).json({
        success: false,
        message: 'Product no longer available'
      });
    }

    // Check if can download
    const canDownload = downloadRecord.canDownload();
    console.log('[DigitalDownload] Can download check:', canDownload);

    if (!canDownload.allowed) {
      return res.status(403).json({
        success: false,
        message: canDownload.reason,
        status: downloadRecord.status
      });
    }

    // Get files array safely
    const digitalFiles = downloadRecord.productId.digitalFiles || [];
    console.log('[DigitalDownload] Digital files count:', digitalFiles.length);

    // Return download info (flat structure for frontend compatibility)
    res.status(200).json({
      productName: downloadRecord.productId.name || 'Unknown Product',
      orderId: downloadRecord.orderId,
      files: digitalFiles.map(file => ({
        fileName: file.fileName || 'Unknown File',
        fileType: file.fileType || 'file',
        fileSize: file.fileSize || 0,
        fileUrl: file.fileUrl || ''
      })),
      downloadCount: downloadRecord.downloadCount,
      maxDownloads: downloadRecord.maxDownloads,
      downloadsRemaining: downloadRecord.maxDownloads - downloadRecord.downloadCount,
      expiresAt: downloadRecord.expiresAt,
      customerName: downloadRecord.customerName,
      status: downloadRecord.status
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
 * @desc    Track download and return download endpoint URL
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

    console.log('[DigitalDownload] File details:', {
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType
    });

    // Find file index for the proxy endpoint
    const fileIndex = downloadRecord.productId.digitalFiles.findIndex(f => f.fileUrl === fileUrl);

    // Return proxy endpoint URL instead of Cloudinary URL directly
    // This allows us to set proper Content-Disposition header
    const proxyUrl = `/api/digital-downloads/file/${token}/${fileIndex}`;

    console.log('[DigitalDownload] Returning proxy URL:', proxyUrl);

    res.status(200).json({
      success: true,
      signedUrl: proxyUrl,  // Now returns proxy URL
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
 * @route   GET /api/digital-downloads/file/:token/:fileIndex
 * @desc    Proxy endpoint to serve file with correct Content-Disposition header
 * @access  Public
 */
export async function serveFile(req, res) {
  try {
    const { token, fileIndex } = req.params;

    console.log('[DigitalDownload] Serving file:', { token, fileIndex });

    const downloadRecord = await DigitalDownload.findOne({ accessToken: token })
      .populate('productId', 'digitalFiles');

    if (!downloadRecord) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    // Check if can download (but don't increment count - already done in track)
    const canDownloadCheck = downloadRecord.canDownload();
    // Allow if status is active OR if they just downloaded (count might be at max now)
    if (!canDownloadCheck.allowed && downloadRecord.status !== 'exhausted') {
      return res.status(403).json({
        success: false,
        message: canDownloadCheck.reason
      });
    }

    const index = parseInt(fileIndex, 10);
    const files = downloadRecord.productId.digitalFiles || [];

    if (isNaN(index) || index < 0 || index >= files.length) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = files[index];
    const fileUrl = file.fileUrl;
    const fileName = file.fileName || 'download';

    // Sanitize filename for Content-Disposition header
    const sanitizedFileName = fileName.replace(/[^\w\s.-]/g, '_');

    if (fileUrl.startsWith('gdrive://')) {
      // --- Google Drive path ---
      const fileId = fileUrl.replace('gdrive://', '');
      console.log('[DigitalDownload] Fetching file from Google Drive:', fileId);

      const { stream, mimeType, size } = await getFileStreamFromDrive(fileId);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      if (size) {
        res.setHeader('Content-Length', size);
      }

      // Pipe the Drive stream directly to the response
      stream.pipe(res);

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      console.log('[DigitalDownload] Google Drive file served successfully:', fileName);
    } else {
      // --- Legacy Cloudinary path ---
      console.log('[DigitalDownload] Fetching file from Cloudinary:', fileUrl);

      const response = await fetch(fileUrl);

      if (!response.ok) {
        console.error('[DigitalDownload] Failed to fetch from Cloudinary:', response.status, response.statusText);
        return res.status(502).json({
          success: false,
          message: 'Failed to fetch file from storage'
        });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      const reader = response.body.getReader();

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(Buffer.from(value));
        }
      };

      await pump();

      console.log('[DigitalDownload] Cloudinary file served successfully:', fileName);
    }

  } catch (error) {
    console.error('[DigitalDownload] Serve file error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to serve file'
      });
    }
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
