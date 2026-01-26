import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createDownloadRecords } from './digitalDownloadController.js';
import { sendDigitalProductEmail } from '../services/digitalDeliveryEmailService.js';
import { sendPurchaseConfirmationEmail } from '../services/purchaseConfirmationEmailService.js';
import { subscribeToBeehive } from '../services/beehiveService.js';

dotenv.config();

// Initialize Razorpay instance
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("Backend Error: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("Razorpay initialized successfully.");
  }
} catch (initError) {
  console.error("Backend Error: Failed to initialize Razorpay.", initError);
}

// Utility to handle Mongoose validation errors
const handleValidationError = (error, res) => {
  const errors = {};
  Object.keys(error.errors).forEach((key) => {
    errors[key] = error.errors[key].message;
  });
  console.error("Backend: Mongoose Validation Error:", errors);
  return res.status(400).json({ success: false, message: "Validation Error", errors });
};

/* -------------------------------------------------------------------------- */
/* CREATE ORDER                                 */
/* -------------------------------------------------------------------------- */
// @desc    Create Razorpay Order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  console.log("Backend: Received POST /api/orders request");

  if (!razorpay) {
    console.error("Backend: Attempted to create order, but Razorpay is not initialized.");
    return res.status(500).json({ success: false, message: 'Razorpay service is not available.' });
  }

  try {
    const { amount, currency } = req.body;
    const numericAmount = Number(amount);

    if (amount == null || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided.' });
    }

    const options = {
      amount: Math.round(numericAmount),
      currency: currency || 'INR',
      receipt: `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      return res.status(500).json({ success: false, message: 'Razorpay order creation failed.' });
    }

    res.status(200).json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Backend: Error creating Razorpay order:', error);
    const errorMessage = error.error?.description || error.message || 'Unknown server error';
    res.status(error.statusCode || 500).json({
      success: false,
      message: `Server error: ${errorMessage}`,
      error: error.error,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY PAYMENT                                 */
/* -------------------------------------------------------------------------- */
// @desc    Verify Razorpay Payment and Create Order in DB
// @route   POST /api/orders/verify
// @access  Public
export const verifyPayment = async (req, res) => {
  console.log("Backend: Received POST /api/orders/verify request");
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billingDetails,
      cartItems,
      totalAmount,
      couponCode,
      discountAmount,
    } = req.body;

    // Debug: Log cart items to see their structure
    console.log('[Order] Cart items received from frontend:');
    cartItems.forEach((item, idx) => {
      console.log(`[Order] CartItem ${idx + 1}:`, {
        _id: item._id,
        name: item.name,
        title: item.title,
        itemType: item.itemType,
        productType: item.productType
      });
    });

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !billingDetails ||
      !cartItems ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0 ||
      totalAmount == null ||
      isNaN(totalAmount)
    ) {
      return res.status(400).json({ success: false, message: 'Missing or invalid verification details.' });
    }

    if (
      !billingDetails.firstName ||
      !billingDetails.lastName ||
      !billingDetails.email ||
      !billingDetails.phone ||
      !billingDetails.address ||
      !billingDetails.city ||
      !billingDetails.postalCode ||
      !billingDetails.country
    ) {
      return res.status(400).json({ success: false, message: 'Incomplete billing details.' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const existingOrder = await Order.findOne({ 'paymentResult.id': razorpay_payment_id });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Order already exists.',
          orderId: existingOrder._id,
        });
      }

      const orderItems = cartItems.map((item) => {
        // Determine itemModel - check multiple indicators
        let itemModel = 'Product'; // Default to Product

        if (item.itemType === 'course') {
          itemModel = 'Course';
        } else if (item.itemType === 'product') {
          itemModel = 'Product';
        } else if (item.productType) {
          // If item has productType (Digital/Physical/Both), it's a Product
          itemModel = 'Product';
        } else if (item.title && !item.name) {
          // Only treat as Course if it has title but NO name
          itemModel = 'Course';
        }
        // If it has 'name' field, keep it as Product (default)

        console.log(`[Order] Mapping cart item: _id=${item._id}, name=${item.name}, title=${item.title}, itemType=${item.itemType}, productType=${item.productType} => itemModel=${itemModel}`);

        return {
          name: item.title || item.name || 'Item',
          qty: item.quantity || 1,
          price: Number(item.discountPrice || item.price || 0),
          product: item._id,
          itemModel,
          selectedLevel: item.selectedLevel,
          selectedFormat: item.selectedFormat,
        };
      });

      const calculatedItemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      const calculatedTotalPrice = Number(totalAmount);
      const appliedDiscount = Number(discountAmount) || 0;

      // Increment coupon usage count if coupon was applied
      if (couponCode) {
        try {
          const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
          if (coupon) {
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            await coupon.save();
          }
        } catch (couponError) {
          console.error('Error updating coupon usage:', couponError);
          // Don't fail the order if coupon update fails
        }
      }

      const newOrder = new Order({
        orderItems,
        shippingAddress: {
          fullName: `${billingDetails.firstName} ${billingDetails.lastName}`,
          address: billingDetails.address,
          city: billingDetails.city,
          state: billingDetails.state || '',
          postalCode: billingDetails.postalCode,
          country: billingDetails.country,
          phone: billingDetails.phone,
          email: billingDetails.email,
        },
        paymentMethod: 'Razorpay',
        paymentResult: {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
          email_address: billingDetails.email,
        },
        itemsPrice: calculatedItemsPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: calculatedTotalPrice,
        couponCode: couponCode || null,
        discountAmount: appliedDiscount,
        isPaid: true,
        paidAt: new Date(),
        razorpayOrderId: razorpay_order_id,
        orderStatus: 'Processing',
        newsletterOptIn: req.body.newsletterOptIn || false,
      });

      const savedOrder = await newOrder.save();
      console.log('[Order] Order saved:', savedOrder._id);

      // RESPOND IMMEDIATELY - don't make user wait for emails
      res.status(201).json({
        success: true,
        message: 'Payment verified, order created.',
        orderId: savedOrder._id,
      });

      // ============================================
      // BACKGROUND PROCESSING (after response sent)
      // ============================================
      // All operations below run asynchronously without blocking the response

      // Helper function to run background tasks with error handling
      const runBackgroundTask = async (taskName, taskFn) => {
        try {
          await taskFn();
        } catch (error) {
          console.error(`[Order] Background task "${taskName}" failed:`, error.message);
        }
      };

      // --- Send Purchase Confirmation Email (background) ---
      runBackgroundTask('Purchase Confirmation Email', async () => {
        console.log('[Order] Sending purchase confirmation email...');
        const purchaseEmailResult = await sendPurchaseConfirmationEmail({
          customerEmail: billingDetails.email,
          customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
          orderId: savedOrder._id.toString(),
          orderItems: orderItems,
          totalPrice: calculatedTotalPrice,
          itemsPrice: calculatedItemsPrice,
          discountAmount: appliedDiscount,
          shippingAddress: {
            fullName: `${billingDetails.firstName} ${billingDetails.lastName}`,
            address: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state || '',
            postalCode: billingDetails.postalCode,
            country: billingDetails.country,
            email: billingDetails.email,
            phone: billingDetails.phone
          },
          currency: req.body.currency || 'INR'
        });

        if (purchaseEmailResult.success) {
          console.log('[Order] Purchase confirmation email sent successfully');
        } else {
          console.error('[Order] Purchase confirmation email failed:', purchaseEmailResult.error);
        }
      });

      // --- Handle Newsletter Subscription (background) ---
      if (req.body.newsletterOptIn) {
        runBackgroundTask('Newsletter Subscription', async () => {
          console.log('[Order] Newsletter opt-in detected, subscribing to Beehive...');
          const beehiveResult = await subscribeToBeehive({
            email: billingDetails.email,
            customFields: {
              name: `${billingDetails.firstName} ${billingDetails.lastName}`,
              role: 'Customer',
              source: 'checkout',
              tags: 'customer,purchase'
            }
          });
          console.log('[Order] Beehive subscription result:', beehiveResult.success ? 'Success' : 'Failed');
        });
      }

      // --- Digital Delivery (background) ---
      runBackgroundTask('Digital Delivery', async () => {
        console.log('[Order] Processing order items for digital delivery:');
        orderItems.forEach((item, idx) => {
          console.log(`[Order] Item ${idx + 1}: name="${item.name}", itemModel="${item.itemModel}", productId="${item.product}", selectedFormat="${item.selectedFormat || 'N/A'}"`);
        });

        const productIds = orderItems
          .filter(item => item.itemModel === 'Product')
          .map(item => item.product);

        console.log(`[Order] Found ${productIds.length} Product items (not Course), productIds:`, productIds);

        if (productIds.length > 0) {
          const products = await Product.find({ _id: { $in: productIds } });
          console.log(`[Order] Fetched ${products.length} products from database`);

          products.forEach(p => {
            const orderItem = orderItems.find(item => item.product.toString() === p._id.toString());
            console.log(`[Order] Product "${p.name}": productType="${p.productType}", selectedFormat="${orderItem?.selectedFormat || 'N/A'}", digitalFiles=${p.digitalFiles?.length || 0} files`);
          });

          const digitalProducts = products.filter(p => {
            const orderItem = orderItems.find(item => item.product.toString() === p._id.toString());

            if (p.productType === 'Digital') {
              return true;
            }

            if (p.productType === 'Both') {
              const selectedFormat = orderItem?.selectedFormat;
              return selectedFormat === 'Digital' || !selectedFormat;
            }

            return false;
          });

          console.log(`[Order] Filtered to ${digitalProducts.length} digital product(s) (considering selectedFormat)`);

          if (digitalProducts.length > 0) {
            console.log(`[Order] Found ${digitalProducts.length} digital product(s), initiating delivery...`);

            savedOrder.digitalDeliveryStatus = 'pending';
            await savedOrder.save();

            const downloadRecordsData = {
              orderId: savedOrder._id.toString(),
              customerEmail: billingDetails.email,
              customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
              products: digitalProducts.map(product => {
                const orderItem = orderItems.find(item => item.product.toString() === product._id.toString());
                return {
                  productId: product._id.toString(),
                  productName: product.name,
                  digitalFiles: product.digitalFiles,
                  maxDownloads: product.downloadSettings?.maxDownloads || 3,
                  linkExpiryDays: product.downloadSettings?.linkExpiryDays || 30,
                  selectedLevel: orderItem?.selectedLevel,
                  selectedFormat: orderItem?.selectedFormat
                };
              })
            };

            console.log('[Order] Calling createDownloadRecords...');
            const downloadRecords = await createDownloadRecords(downloadRecordsData);
            console.log(`[Order] Created ${downloadRecords.length} download record(s)`);

            const downloadLinks = downloadRecords.map(record => ({
              productName: record.productName,
              accessToken: record.accessToken,
              fileCount: record.files.length,
              downloadsRemaining: record.maxDownloads,
              maxDownloads: record.maxDownloads,
              expiryDate: record.expiresAt
            }));

            const emailResult = await sendDigitalProductEmail({
              customerEmail: billingDetails.email,
              customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
              downloadLinks,
              orderId: savedOrder._id.toString()
            });

            if (emailResult.success) {
              console.log('[Order] Digital delivery email sent successfully');
              savedOrder.digitalDeliveryStatus = 'sent';
              savedOrder.digitalDeliverySentAt = new Date();
            } else {
              console.error('[Order] Digital delivery email failed:', emailResult.error);
              savedOrder.digitalDeliveryStatus = 'failed';
            }

            await savedOrder.save();
          } else {
            console.log('[Order] No digital products in this order');
          }
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }
  } catch (error) {
    console.error('Backend: Error during payment verification/order saving:', error);
    if (error.name === 'ValidationError') return handleValidationError(error, res);
    res.status(500).json({
      success: false,
      message: 'Server error during verification/creation',
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* GET ORDERS                                  */
/* -------------------------------------------------------------------------- */
// @desc    Get all orders (admin) or user orders
// @route   GET /api/orders
// @access  Admin
export const getOrders = async (req, res) => {
  console.log('\n--- [DEBUG] /api/orders GET CONTROLLER HIT ---');
  console.log(`[DEBUG] Time: ${new Date().toISOString()}`);
  console.log('[DEBUG] Raw Query Params:', JSON.stringify(req.query, null, 2));

  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const filter = {};
  const keyword = req.query.search;
  const paymentStatus = req.query.paymentStatus;
  const orderStatus = req.query.status;

  if (keyword) {
    filter.$or = [
      { 'shippingAddress.fullName': { $regex: keyword, $options: 'i' } },
      { 'shippingAddress.email': { $regex: keyword, $options: 'i' } },
      { razorpayOrderId: { $regex: keyword, $options: 'i' } },
    ];
  }

  if (paymentStatus) {
    if (paymentStatus === 'completed') filter.isPaid = true;
    else if (paymentStatus === 'pending') {
      filter.isPaid = false;
      filter['paymentResult.status'] = { $ne: 'failed' };
    } else if (paymentStatus === 'failed') filter['paymentResult.status'] = 'failed';
  }

  if (orderStatus) {
    if (orderStatus === 'pending') filter.isPaid = false;
    else if (orderStatus === 'processing') {
      filter.isPaid = true;
      filter.isDelivered = { $ne: true };
    } else if (orderStatus === 'delivered') filter.isDelivered = true;
  }

  console.log('[DEBUG] Final MongoDB Filter Object:', JSON.stringify(filter, null, 2));

  try {
    const count = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name title');

    const responseJson = {
      orders,
      page,
      totalPages: Math.ceil(count / pageSize),
      totalOrders: count,
    };

    console.log(`[DEBUG] Sending response with ${orders.length} orders.`);
    console.log(`[DEBUG] getOrders: Sending response:`, JSON.stringify(responseJson, null, 2));
    res.status(200).json(responseJson);
  } catch (error) {
    console.error('--- [DEBUG] ERROR IN getOrders CATCH BLOCK ---');
    console.error(error);
    res.status(500).json({
      message: 'Server error fetching orders',
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* GET ORDER BY ID                                */
/* -------------------------------------------------------------------------- */
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Admin
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const order = await Order.findById(req.params.id).populate(
      'orderItems.product',
      'name title price imageUrl images'
    );
    if (order) res.json(order);
    else res.status(404).json({ message: 'Order not found' });
  } catch (error) {
    console.error('Backend: Error fetching order by ID:', error);
    res.status(500).json({ message: 'Server error fetching order', error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE ORDER                                  */
/* -------------------------------------------------------------------------- */
// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Admin
export const updateOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const order = await Order.findById(req.params.id);

    if (order) {
      const { isDelivered, status } = req.body;
      if (status) {
        console.log(`[DEBUG] Updating order ${req.params.id} with status: ${status}`);
        if (status === 'delivered') {
          order.isDelivered = true;
          order.deliveredAt = Date.now();
        } else if (status === 'processing') {
          order.isPaid = true;
          order.isDelivered = false;
          order.deliveredAt = null;
        } else if (status === 'pending') {
          order.isPaid = false;
          order.isDelivered = false;
          order.deliveredAt = null;
        }
      } else if (typeof isDelivered === 'boolean') {
        console.log(`[DEBUG] Updating order ${req.params.id} with isDelivered: ${isDelivered}`);
        order.isDelivered = isDelivered;
        order.deliveredAt = isDelivered ? Date.now() : null;
      } else {
        console.log("Backend: updateOrder called without specific action for ID:", req.params.id);
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Backend: Error updating order:', error);
    if (error.name === 'ValidationError') return handleValidationError(error, res);
    res.status(500).json({ message: 'Server error updating order', error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE ORDER                                  */
/* -------------------------------------------------------------------------- */
// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Admin
export const deleteOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (order) {
      console.log("Backend: Order deleted:", req.params.id);
      res.json({ success: true, message: 'Order removed' });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('Backend: Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting order',
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* CREATE FREE ORDER                                                           */
/* -------------------------------------------------------------------------- */
// @desc    Create order for free products (no payment required)
// @route   POST /api/orders/free
// @access  Public
export const createFreeOrder = async (req, res) => {
  console.log("Backend: Received POST /api/orders/free request");
  try {
    const {
      billingDetails,
      cartItems,
      totalAmount,
      couponCode,
      discountAmount,
      newsletterOptIn
    } = req.body;

    // Validate that total is actually 0 or very close to 0
    if (totalAmount > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for free orders. Please use the payment flow for paid orders.'
      });
    }

    if (
      !billingDetails ||
      !cartItems ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      return res.status(400).json({ success: false, message: 'Missing billing details or cart items.' });
    }

    if (
      !billingDetails.firstName ||
      !billingDetails.lastName ||
      !billingDetails.email ||
      !billingDetails.phone ||
      !billingDetails.address ||
      !billingDetails.city ||
      !billingDetails.postalCode ||
      !billingDetails.country
    ) {
      return res.status(400).json({ success: false, message: 'Incomplete billing details.' });
    }

    // Map cart items to order items
    const orderItems = cartItems.map((item) => {
      let itemModel = 'Product';

      if (item.itemType === 'course') {
        itemModel = 'Course';
      } else if (item.itemType === 'product') {
        itemModel = 'Product';
      } else if (item.productType) {
        itemModel = 'Product';
      } else if (item.title && !item.name) {
        itemModel = 'Course';
      }

      console.log(`[FreeOrder] Mapping cart item: _id=${item._id}, name=${item.name}, title=${item.title}, itemType=${item.itemType} => itemModel=${itemModel}`);

      return {
        name: item.title || item.name || 'Item',
        qty: item.quantity || 1,
        price: 0, // Free order
        product: item._id,
        itemModel,
        selectedLevel: item.selectedLevel,
        selectedFormat: item.selectedFormat,
      };
    });

    // Generate a unique order reference for free orders
    const freeOrderRef = `FREE_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const newOrder = new Order({
      orderItems,
      shippingAddress: {
        fullName: `${billingDetails.firstName} ${billingDetails.lastName}`,
        address: billingDetails.address,
        city: billingDetails.city,
        state: billingDetails.state || '',
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        phone: billingDetails.phone,
        email: billingDetails.email,
      },
      paymentMethod: 'Free',
      paymentResult: {
        id: freeOrderRef,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: billingDetails.email,
      },
      itemsPrice: 0,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 0,
      couponCode: couponCode || null,
      discountAmount: Number(discountAmount) || 0,
      isPaid: true,
      paidAt: new Date(),
      razorpayOrderId: freeOrderRef,
      orderStatus: 'Processing',
      newsletterOptIn: newsletterOptIn || false,
    });

    const savedOrder = await newOrder.save();
    console.log('[FreeOrder] Order created:', savedOrder._id);

    // RESPOND IMMEDIATELY - don't make user wait for emails
    res.status(201).json({
      success: true,
      message: 'Free order created successfully.',
      orderId: savedOrder._id,
    });

    // ============================================
    // BACKGROUND PROCESSING (after response sent)
    // ============================================
    // All operations below run asynchronously without blocking the response

    // Helper function to run background tasks with error handling
    const runBackgroundTask = async (taskName, taskFn) => {
      try {
        await taskFn();
      } catch (error) {
        console.error(`[FreeOrder] Background task "${taskName}" failed:`, error.message);
      }
    };

    // --- Send Purchase Confirmation Email (background) ---
    runBackgroundTask('Purchase Confirmation Email', async () => {
      console.log('[FreeOrder] Sending purchase confirmation email...');
      const purchaseEmailResult = await sendPurchaseConfirmationEmail({
        customerEmail: billingDetails.email,
        customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
        orderId: savedOrder._id.toString(),
        orderItems: orderItems,
        totalPrice: 0,
        itemsPrice: 0,
        discountAmount: Number(discountAmount) || 0,
        shippingAddress: {
          fullName: `${billingDetails.firstName} ${billingDetails.lastName}`,
          address: billingDetails.address,
          city: billingDetails.city,
          state: billingDetails.state || '',
          postalCode: billingDetails.postalCode,
          country: billingDetails.country,
          email: billingDetails.email,
          phone: billingDetails.phone
        },
        currency: 'INR'
      });

      if (purchaseEmailResult.success) {
        console.log('[FreeOrder] Purchase confirmation email sent successfully');
      } else {
        console.error('[FreeOrder] Purchase confirmation email failed:', purchaseEmailResult.error);
      }
    });

    // --- Handle Newsletter Subscription (background) ---
    if (newsletterOptIn) {
      runBackgroundTask('Newsletter Subscription', async () => {
        console.log('[FreeOrder] Newsletter opt-in detected, subscribing to Beehive...');
        const beehiveResult = await subscribeToBeehive({
          email: billingDetails.email,
          customFields: {
            name: `${billingDetails.firstName} ${billingDetails.lastName}`,
            role: 'Customer',
            source: 'checkout',
            tags: 'customer,free-order'
          }
        });
        console.log('[FreeOrder] Beehive subscription result:', beehiveResult.success ? 'Success' : 'Failed');
      });
    }

    // --- Digital Delivery for Free Products (background) ---
    runBackgroundTask('Digital Delivery', async () => {
      console.log('[FreeOrder] Processing order items for digital delivery:');
      orderItems.forEach((item, idx) => {
        console.log(`[FreeOrder] Item ${idx + 1}: name="${item.name}", itemModel="${item.itemModel}", productId="${item.product}", selectedFormat="${item.selectedFormat || 'N/A'}"`);
      });

      const productIds = orderItems
        .filter(item => item.itemModel === 'Product')
        .map(item => item.product);

      console.log(`[FreeOrder] Found ${productIds.length} Product items, productIds:`, productIds);

      if (productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } });
        console.log(`[FreeOrder] Fetched ${products.length} products from database`);

        products.forEach(p => {
          const orderItem = orderItems.find(item => item.product.toString() === p._id.toString());
          console.log(`[FreeOrder] Product "${p.name}": productType="${p.productType}", selectedFormat="${orderItem?.selectedFormat || 'N/A'}", digitalFiles=${p.digitalFiles?.length || 0} files`);
        });

        const digitalProducts = products.filter(p => {
          const orderItem = orderItems.find(item => item.product.toString() === p._id.toString());

          if (p.productType === 'Digital') {
            return true;
          }

          if (p.productType === 'Both') {
            const selectedFormat = orderItem?.selectedFormat;
            return selectedFormat === 'Digital' || !selectedFormat;
          }

          return false;
        });

        console.log(`[FreeOrder] Filtered to ${digitalProducts.length} digital product(s)`);

        if (digitalProducts.length > 0) {
          console.log(`[FreeOrder] Found ${digitalProducts.length} digital product(s), initiating delivery...`);

          savedOrder.digitalDeliveryStatus = 'pending';
          await savedOrder.save();

          const downloadRecordsData = {
            orderId: savedOrder._id.toString(),
            customerEmail: billingDetails.email,
            customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
            products: digitalProducts.map(product => {
              const orderItem = orderItems.find(item => item.product.toString() === product._id.toString());
              return {
                productId: product._id.toString(),
                productName: product.name,
                digitalFiles: product.digitalFiles,
                maxDownloads: product.downloadSettings?.maxDownloads || 3,
                linkExpiryDays: product.downloadSettings?.linkExpiryDays || 30,
                selectedLevel: orderItem?.selectedLevel,
                selectedFormat: orderItem?.selectedFormat
              };
            })
          };

          console.log('[FreeOrder] Calling createDownloadRecords...');
          const downloadRecords = await createDownloadRecords(downloadRecordsData);
          console.log(`[FreeOrder] Created ${downloadRecords.length} download record(s)`);

          const downloadLinks = downloadRecords.map(record => ({
            productName: record.productName,
            accessToken: record.accessToken,
            fileCount: record.files.length,
            downloadsRemaining: record.maxDownloads,
            maxDownloads: record.maxDownloads,
            expiryDate: record.expiresAt
          }));

          const emailResult = await sendDigitalProductEmail({
            customerEmail: billingDetails.email,
            customerName: `${billingDetails.firstName} ${billingDetails.lastName}`,
            downloadLinks,
            orderId: savedOrder._id.toString()
          });

          if (emailResult.success) {
            console.log('[FreeOrder] Digital delivery email sent successfully');
            savedOrder.digitalDeliveryStatus = 'sent';
            savedOrder.digitalDeliverySentAt = new Date();
          } else {
            console.error('[FreeOrder] Digital delivery email failed:', emailResult.error);
            savedOrder.digitalDeliveryStatus = 'failed';
          }

          await savedOrder.save();
        } else {
          console.log('[FreeOrder] No digital products in this order');
        }
      }
    });

  } catch (error) {
    console.error('Backend: Error creating free order:', error);
    if (error.name === 'ValidationError') return handleValidationError(error, res);
    res.status(500).json({
      success: false,
      message: 'Server error creating free order',
      error: error.message,
    });
  }
};