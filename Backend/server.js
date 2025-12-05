import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import productRoutes from './routes/productRoutes.js';
import materialCrudRoutes from './routes/materialRoutes.js';
import materialsRoutes from './routes/materials.js';
import debugRoutes from './routes/debug.js';
import cmsRoutes from './routes/cmsRoutes.js';
import formRoutes from './routes/formRoutes.js';
import embedRoutes from './routes/embedRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';
import pinterestRoutes from './routes/pinterestRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Razorpay from 'razorpay';
import { v2 as cloudinary } from 'cloudinary';
import postRoutes from './routes/postRoutes.js';
import pickRoutes from './routes/pickRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

// Log environment variables for debugging
console.log("--- Environment Variables ---");
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded" : "Missing");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "Loaded" : "Missing");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "Loaded" : "Missing");
console.log("RAZORPAYSECRETKEY or RAZORPAY_KEY_SECRET:", (process.env.RAZORPAYSECRETKEY || process.env.RAZORPAY_KEY_SECRET) ? "Loaded" : "Missing");
console.log("FIREBASE_SERVICE_ACCOUNT_PATH:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? "Loaded" : "Missing");
console.log("FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT ? "Loaded" : "Missing");
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN ? "Loaded" : "Missing");
console.log("--------------------------");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Connect to MongoDB
let isDbConnected = false;
const dbConn = await connectDB();
if (dbConn) {
  isDbConnected = true;
  try {
    const db = mongoose.connection.useDb('amritDB');
    const result = await db.collection('test').insertOne({ name: 'Natansh', status: 'connected' });
    console.log('Dummy document inserted into amritDB.test:', result.insertedId);
  } catch (err) {
    console.error('Failed to insert dummy document into amritDB.test:', err.message);
  }
} else {
  console.warn('Skipping dummy insert because DB is not connected');
}

const app = express();
app.set('isDbConnected', isDbConnected);

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Security Headers (including fix for Cross-Origin-Opener-Policy)
app.use((req, res, next) => {
  // Fix for Cross-Origin-Opener-Policy error
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Content-Security-Policy for Firebase, Google APIs, Razorpay, etc.
  const csp = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://js.stripe.com https://checkout.razorpay.com;",
    "frame-src 'self' https://apis.google.com https://www.google.com https://js.stripe.com https://api.razorpay.com;",
    "connect-src 'self' " + (process.env.CORS_ORIGIN || "http://localhost:5173") + " http://localhost:" + (process.env.PORT || 5000) + " https://*.firebaseio.com wss://*.firebaseio.com https://www.googleapis.com;",
    "font-src 'self' https: data:;",
    "img-src 'self' https: data:;",
    "style-src 'self' 'unsafe-inline' https:;"
  ].join(' ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// Increase body parser limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle request entity too large errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request entity too large. Please reduce file size or try again.',
    });
  }
  next(err);
});

// Serve static files from public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../src/public')));

// Mongoose Connection Events
mongoose.connection.on('connected', () => {
  app.set('isDbConnected', true);
  console.log('Mongoose event: connected');
});
mongoose.connection.on('disconnected', () => {
  app.set('isDbConnected', false);
  console.warn('Mongoose event: disconnected');
});
mongoose.connection.on('error', (err) => {
  app.set('isDbConnected', false);
  console.error('Mongoose event: error', err?.message || err);
});

// Razorpay Integration
const hasRazorpayKeys =
  !!process.env.RAZORPAY_KEY_ID && !!(process.env.RAZORPAYSECRETKEY || process.env.RAZORPAY_KEY_SECRET);

let razorpayInstance = null;
if (hasRazorpayKeys) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAYSECRETKEY || process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized');
  } catch (err) {
    console.warn('Failed to initialize Razorpay:', err?.message || err);
  }
} else {
  console.warn('Razorpay keys missing - Razorpay routes will be disabled');
}

app.post('/create-razorpay-order', async (req, res) => {
  if (!razorpayInstance) {
    return res.status(503).json({ message: 'Razorpay not configured' });
  }
  const { amount, currency } = req.body;
  const options = {
    amount: amount,
    currency: currency,
    receipt: 'receipt_order_74394',
  };
  try {
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Stripe Payment Intent Route (using dynamic import)
let stripe = null;
if (process.env.STRIPESECRETKEY) {
  try {
    const { default: Stripe } = await import('stripe');
    stripe = Stripe(process.env.STRIPESECRETKEY);
    console.log('Stripe initialized');
  } catch (err) {
    console.warn('Failed to initialize Stripe:', err?.message || err);
  }
} else {
  console.warn('Stripe keys missing - Stripe routes will be disabled');
}

app.post('/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Stripe not configured' });
  }
  const { amount, currency } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cloudinary Signature Route
app.get('/api/cloudinary-signature', (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      upload_preset: 'casadeele_materials',
    },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({ timestamp, signature });
});

// Disable caching for all /api responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/materials', materialCrudRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/embeds', embedRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/pinterest', pinterestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});