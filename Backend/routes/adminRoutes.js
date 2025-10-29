import express from 'express';
import { verifyVerifiedAdmin } from '../middleware/auth.js';
import { verifySuperAdmin } from '../middleware/superAdminAuth.js';
import { 
  createAdmin, 
  getAllAdmins, 
  deleteAdmin,
  promoteToAdmin // 1. Import the missing function
} from '../controllers/adminController.js';

const router = express.Router();

// Route to check if a logged-in user is a verified admin
router.get('/check-status', verifyVerifiedAdmin, (req, res) => {
  res.status(200).json({ success: true, message: 'Admin verified.' });
});

// Super admin only routes
router.post('/create', verifySuperAdmin, createAdmin);
router.get('/', verifySuperAdmin, getAllAdmins);
router.delete('/:id', verifySuperAdmin, deleteAdmin);

// 2. Add the missing route for promoting users
router.post('/promote', verifySuperAdmin, promoteToAdmin);

export default router;