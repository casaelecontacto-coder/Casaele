// controllers/adminController.js

import Admin from '../models/Admin.js';
// CORRECTED: Import the 'auth' object directly
import { auth } from '../config/firebaseAdmin.js';

// @route   POST /api/admins/create
// @desc    Create new admin in Firebase Auth and MongoDB
// @access  Super Admin only
export async function createAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const createdBy = req.user.uid;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    
    // CORRECTED: Add check for auth object
    if (!auth) {
        throw new Error("Firebase Admin SDK not initialized.");
    }

    // Check if admin already exists in MongoDB
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'An admin with this email already exists.' });
    }

    // CORRECTED: Use imported 'auth' object
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true,
    });

    // Create admin in MongoDB
    const newAdmin = new Admin({
      email: userRecord.email.toLowerCase(),
      createdBy: createdBy,
      role: 'admin',
      verified: true
    });
    await newAdmin.save();

    res.status(201).json({ 
      success: true, 
      message: 'Admin created successfully.',
      admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    
    if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ success: false, message: 'This email is already in use by a Firebase user.' });
    }
    if (error.code === 'auth/invalid-password') {
        return res.status(400).json({ success: false, message: 'The password must be at least 6 characters long.' });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
}

// @route   GET /api/admins
// @desc    Get all admins
// @access  Super Admin only
export async function getAllAdmins(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const admins = await Admin.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Admin.countDocuments(query);

    res.status(200).json({
      success: true,
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
}

// @route   DELETE /api/admins/:id
// @desc    Delete admin from MongoDB and Firebase
// @access  Super Admin only
export async function deleteAdmin(req, res) {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'super-admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete super-admin' });
    }
    
    // CORRECTED: Add check for auth object
    if (!auth) {
        throw new Error("Firebase Admin SDK not initialized.");
    }

    // Delete from Firebase Auth
    try {
        // CORRECTED: Use imported 'auth' object
        const user = await auth.getUserByEmail(admin.email);
        await auth.deleteUser(user.uid);
    } catch (error) {
        console.warn(`Could not delete user from Firebase (may not exist): ${admin.email}`);
    }

    // Delete from MongoDB
    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Admin deleted successfully' });

  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
}


export async function promoteToAdmin(req, res) {
  try {
    const { email } = req.body;
    const createdBy = req.user.uid;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Check if they are already an admin
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'This user is already an admin.' });
    }

    // Create the new admin record
    const newAdmin = new Admin({
      email: email.toLowerCase(),
      createdBy: createdBy,
      role: 'admin',
      verified: true // Automatically verified by super admin
    });
    await newAdmin.save();

    res.status(201).json({ success: true, message: `User ${email} has been promoted to admin.` });

  } catch (error) {
    console.error('Error promoting admin:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}
