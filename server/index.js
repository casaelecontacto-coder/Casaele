// server/index.js (REPLACE your old file with this)

// 1. Load Environment Variables FIRST
// This reads your server/.env file
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

// 2. Import Modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const securityHeaders = require('./config/security'); //

// 3. Initialize App and Set Port
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// 4. Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => ('MongoDB Connected successfully.'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 5. Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Security & CORS Middleware (THE FIX IS HERE)
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use((req, res, next) => {
    // *** THIS IS THE FIX for the "Cross-Origin-Opener-Policy" error ***
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    // Other headers, including Content-Security-Policy
    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://js.stripe.com https://checkout.razorpay.com;",
      "frame-src 'self' https://apis.google.com https://www.google.com https://js.stripe.com https://api.razorpay.com;",
      "connect-src 'self' " + CORS_ORIGIN + " http://localhost:" + PORT + " https://*.firebaseio.com wss://*.firebaseio.com https://www.googleapis.com;",
      "font-src 'self' https: data:;",
      "img-src 'self' https: data:;",
      "style-src 'self' 'unsafe-inline' https:;"
    ].join(' ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
});

// 7. Import and Use API Routes
// (Import all your other route files from the *first* batch you sent)
const categoryRoutes = require('./routes/Category');
// const userRoutes = require('./routes/userRoutes');
// const courseRoutes = require('./routes/courseRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// ... etc.

// Example route
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Use the category routes
app.use('/api/categories', categoryRoutes);
// (Add all your other routes here)
// app.use('/api/users', userRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/orders', orderRoutes);
// ... etc.


// 8. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 9. Start the Server
app.listen(PORT, () => {
    (`Server listening on port ${PORT}`);
});