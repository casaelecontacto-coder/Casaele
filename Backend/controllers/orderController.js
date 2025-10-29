import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

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
    } = req.body;

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

      const orderItems = cartItems.map((item) => ({
        name: item.title || item.name || 'Item',
        qty: item.quantity || 1,
        price: Number(item.discountPrice || item.price || 0),
        product: item._id,
        itemModel:
          item.itemType === 'course'
            ? 'Course'
            : item.itemType === 'product'
            ? 'Product'
            : item.title
            ? 'Course'
            : 'Product',
        selectedLevel: item.selectedLevel,
        selectedFormat: item.selectedFormat,
      }));

      const calculatedItemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      const calculatedTotalPrice = Number(totalAmount);

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
        isPaid: true,
        paidAt: new Date(),
        razorpayOrderId: razorpay_order_id,
        orderStatus: 'Processing', // <-- THIS IS THE ADDED LINE
      });

      const savedOrder = await newOrder.save();
      res.status(201).json({
        success: true,
        message: 'Payment verified, order created.',
        orderId: savedOrder._id,
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
      res.status(4404).json({ success: false, message: 'Order not found' });
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