import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getSubscribers, getSubscriberById, createSubscriber, updateSubscriber, deleteSubscriber, unsubscribeUser, subscribePublic } from '../controllers/subscriberController.js';

const router = express.Router();

router.route('/')
  .get(verifyFirebaseToken, getSubscribers)
  .post(verifyFirebaseToken, createSubscriber);

router.route('/:id')
  .get(verifyFirebaseToken, getSubscriberById)
  .put(verifyFirebaseToken, updateSubscriber)
  .delete(verifyFirebaseToken, deleteSubscriber);

router.put('/:id/unsubscribe', verifyFirebaseToken, unsubscribeUser);

// Public subscribe endpoint
router.post('/public', subscribePublic);

export default router;
