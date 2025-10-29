import { verifyFirebaseToken } from './auth.js';

// Middleware to check if user is super admin
export const verifySuperAdmin = async (req, res, next) => {
  try {
    // First verify Firebase token
    await verifyFirebaseToken(req, res, () => {});

    // Get super admin email from environment
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    
    if (!superAdminEmail) {
      return res.status(500).json({ 
        success: false, 
        message: 'Super admin email not configured' 
      });
    }

    // Check if the authenticated user's email matches super admin email (case/space insensitive)
    const userEmail = (req.user?.email || '').trim().toLowerCase();
    
    // Allow dev bypass if explicitly configured to dev@local
    const isDevBypassMatch = req.user?.devBypass && superAdminEmail === 'dev@local';

    if (!(userEmail && (userEmail === superAdminEmail || isDevBypassMatch))) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin privileges required.' 
      });
    }

    // Add super admin flag to request
    req.user.isSuperAdmin = true;
    next();

  } catch (error) {
    console.error('Super admin verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Middleware to check if user is admin (verified admin or super admin)
export const verifyAdminAccess = async (req, res, next) => {
  try {
    // First verify Firebase token
    await verifyFirebaseToken(req, res, () => {});

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    
    // If user is super admin, allow access
    if (req.user.email === superAdminEmail) {
      req.user.isSuperAdmin = true;
      return next();
    }

    // For regular admins, check if they exist and are verified
    const Admin = (await import('../models/Admin.js')).default;
    const admin = await Admin.findOne({ 
      email: req.user.email, 
      verified: true 
    });

    if (!admin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin verification required.' 
      });
    }

    req.user.adminRole = admin.role;
    next();

  } catch (error) {
    console.error('Admin access verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};
