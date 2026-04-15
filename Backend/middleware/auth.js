// middleware/auth.js

import { auth } from '../config/firebaseAdmin.js'; // <-- Import auth directly

export async function verifyFirebaseToken(req, res, next) {
  try {
    if (!auth) {
      return res.status(503).json({ message: 'Authentication service is unavailable.' });
    }

    // Dev bypass
    if (process.env.DEV_AUTH_DISABLED === 'true') {
      req.user = { email: 'dev@local', role: 'admin', devBypass: true };
      return next();
    }

    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized: missing Bearer token' });
    }

    const decoded = await auth.verifyIdToken(token);

    const claimsRole = decoded?.role || decoded?.roles || decoded?.customClaims?.role;
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isWhitelisted = decoded?.email && adminEmails.includes(decoded.email.toLowerCase());
    req.user = { ...decoded, role: isWhitelisted ? 'admin' : (claimsRole || 'user') };
    return next();

  } catch (err) {
    console.error('verifyFirebaseToken error:', err?.message || err);
    const message = err?.errorInfo?.message || err?.message || 'invalid token';
    return res.status(401).json({ message: `Unauthorized: ${message}` });
  }
}

export function verifyAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: requires admin privileges' });
}

// Middleware to check if user is verified admin (for admin panel access)
export async function verifyVerifiedAdmin(req, res, next) {
    try {
        // Step 1: Verify Firebase token inline (same logic as verifyFirebaseToken)
        if (!auth) {
            return res.status(503).json({ message: 'Authentication service is unavailable.' });
        }
        if (process.env.DEV_AUTH_DISABLED === 'true') {
            req.user = { email: 'dev@local', role: 'admin', devBypass: true, isSuperAdmin: true };
            return next();
        }
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Unauthorized: missing Bearer token' });
        }
        const decoded = await auth.verifyIdToken(token);
        req.user = { ...decoded };

        // Step 2: Check super admin
        const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
        const userEmail = (req.user.email || '').trim().toLowerCase();
        if (userEmail && userEmail === superAdminEmail) {
            req.user.isSuperAdmin = true;
            return next();
        }

        // Step 3: Check verified admin in DB
        const { getCachedAdmin, setCachedAdmin } = await import('./adminCache.js');
        let admin = getCachedAdmin(userEmail);

        if (admin === null || admin === undefined) {
            const Admin = (await import('../models/Admin.js')).default;
            admin = await Admin.findOne({
                email: { $regex: new RegExp(`^${userEmail}$`, 'i') },
                verified: true
            });
            setCachedAdmin(userEmail, admin || false);
        }

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin verification required.'
            });
        }

        req.user.adminRole = admin.role;
        next();
    } catch (error) {
        console.error('Verified admin verification error:', error?.message || error);
        if (!res.headersSent) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}