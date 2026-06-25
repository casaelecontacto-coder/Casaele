import express from 'express';
import { verifyFirebaseToken, verifyAdmin } from '../middleware/auth.js';
import { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

// Listing/creating coupons is admin-only — the public list would otherwise leak
// every coupon code. Checkout uses the public /validate endpoint instead.
router.route('/')
  .get(verifyFirebaseToken, verifyAdmin, getCoupons)
  .post(verifyFirebaseToken, verifyAdmin, createCoupon);

router.route('/validate')
  .post(validateCoupon); // public validation endpoint (checkout)

router.route('/:id')
  .get(verifyFirebaseToken, verifyAdmin, getCouponById)
  .put(verifyFirebaseToken, verifyAdmin, updateCoupon)
  .delete(verifyFirebaseToken, verifyAdmin, deleteCoupon);

router.put('/:id/toggle', verifyFirebaseToken, verifyAdmin, toggleCouponStatus);

export default router;
