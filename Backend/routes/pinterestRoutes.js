import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { 
  fetchPinterestInfo, 
  savePinterestData, 
  getPinterestData, 
  updatePinterestData, 
  deletePinterestData 
} from '../controllers/pinterestController.js';

const router = express.Router();

// Public read; make fetch public to avoid auth blocking during content creation
router.get('/', getPinterestData);
router.post('/fetch', fetchPinterestInfo);
router.post('/save', verifyFirebaseToken, savePinterestData);
router.put('/:id', verifyFirebaseToken, updatePinterestData);
router.delete('/:id', verifyFirebaseToken, deletePinterestData);

export default router;
