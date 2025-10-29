import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js'; 
// *** FIX: Import all the functions that are actually exported ***
import { 
    createOrder, 
    verifyPayment, 
    getOrders, 
    getOrderById,
    updateOrder,  // Now exists
    deleteOrder   // Now exists
} from '../controllers/orderController.js';

const router = express.Router();

// Public routes for creating order and verifying payment
router.post('/', createOrder); 
router.post('/verify', verifyPayment);

// Admin routes for managing orders
router.get('/', verifyFirebaseToken, getOrders); 
router.get('/:id', verifyFirebaseToken, getOrderById); 
router.put('/:id', verifyFirebaseToken, updateOrder); // *** FIX: Link to updateOrder ***
router.delete('/:id', verifyFirebaseToken, deleteOrder); // *** FIX: Link to deleteOrder ***

export default router;