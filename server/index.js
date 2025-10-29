const mongoose = require('mongoose');
const securityHeaders = require('./config/security');
const cors = require('cors');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    }
}, { timestamps: true });

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://your-production-domain.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Security headers middleware
app.use((req, res, next) => {
    Object.keys(securityHeaders).forEach(headerKey => {
        res.setHeader(headerKey, securityHeaders[headerKey]);
    });
    res.setHeader('Content-Security-Policy', "default-src 'self'; font-src 'self' https: data:; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;");
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = mongoose.model("Category", categorySchema);