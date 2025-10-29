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
    itemModel: { // Specifies whether 'product' ref is 'Product' or 'Course'
        type: String,
        required: true,
        enum: ['Product', 'Course']
    },
    // Optional: Store selected level/format if applicable
    selectedLevel: { type: String },
    selectedFormat: { type: String },
    // Optional: Store image url for easier display in order history
    // image: { type: String } 
});

// --- Main Order Schema ---
const orderSchema = new mongoose.Schema(
    {
        // Link to the user who placed the order (optional but recommended)
        // user: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true, // Make true if users must be logged in to order
        //     ref: 'User', 
        // },

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
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

export default mongoose.models.Order || mongoose.model('Order', orderSchema);