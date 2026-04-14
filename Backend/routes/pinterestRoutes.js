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
router.patch('/:id/toggle-active', verifyFirebaseToken, async (req, res) => {
  try {
    const PinterestEmbed = (await import('../models/PinterestEmbed.js')).default;
    const newActive = req.body.isActive;
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' });
    const updated = await PinterestEmbed.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ _id: updated._id, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling visibility' });
  }
});
router.delete('/:id', verifyFirebaseToken, deletePinterestData);

export default router;
