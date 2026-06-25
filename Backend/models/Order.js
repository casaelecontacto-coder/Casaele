import mongoose from 'mongoose';

// --- Define Schema for Items within an Order ---
const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }, // Price *at the time of order*
    // Reference to the actual Product or Course document
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        // Ref can point dynamically if needed, but easier to keep separate or add type
        refPath: 'orderItems.itemModel' // Points to the model type below
    },
    itemModel: { // Specifies whether 'product' ref is 'Product', 'Course', or 'Magazine'
        type: String,
        required: true,
        enum: ['Product', 'Course', 'Magazine']
    },
    // Optional: Store selected level/format if applicable
    selectedLevel: { type: String },
    selectedFormat: { type: String },
    // Snapshot fields for persistent access (survives deletion of original item)
    coverImageUrl: { type: String },
    pdfUrl: { type: String },
});

// --- Main Order Schema ---
const orderSchema = new mongoose.Schema(
    {
        // Link to the user who placed the order
        userEmail: {
            type: String,
            index: true
        },
        firebaseUid: {
            type: String,
            index: true
        },

        // *** CHANGED: Use orderItems array ***
        orderItems: [orderItemSchema], // Array of subdocuments based on item schema

        // *** CHANGED: Use shippingAddress structure ***
        shippingAddress: {
            fullName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
            state: { type: String }, // Optional? Add required: true if needed
            phone: { type: String }, // Optional? Add required: true if needed
            email: { type: String, required: true }, // Add email here
        },
        
        // Removed 'customer' field if 'shippingAddress' covers it

        paymentMethod: {
            type: String,
            required: true,
            default: 'Razorpay', // Or based on what's used
        },
        paymentResult: { // Details from the payment gateway
            id: { type: String }, // e.g., razorpay_payment_id
            status: { type: String },
            update_time: { type: String }, // Or Date
            email_address: { type: String },
        },

        itemsPrice: { // Price of items before tax/shipping
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        
        // *** CHANGED: Use totalPrice instead of amount ***
        totalPrice: { // Final total amount paid
            type: Number,
            required: true,
            default: 0.0,
        },
        
        // Coupon information (optional)
        couponCode: { type: String },
        discountAmount: { type: Number, default: 0 },
        
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: { // Optional: for physical goods tracking
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: { // Optional
            type: Date,
        },
        
        // *** CHANGED: Use razorpayOrderId ***
        razorpayOrderId: { // Store Razorpay's order ID
            type: String,
            required: true, // Make required as it's part of verification
        },
        // Removed 'orderId' field if 'razorpayOrderId' replaces it

        // Newsletter opt-in from checkout
        newsletterOptIn: {
            type: Boolean,
            default: false
        },

        // Digital product delivery tracking
        digitalDeliveryStatus: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'not_applicable'],
            default: 'not_applicable' // Only 'pending' if order contains digital products
        },
        digitalDeliverySentAt: {
            type: Date
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Indexes — newest-first listings (admin orders + dashboard) and fast payment-verification lookups.
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ 'paymentResult.id': 1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);