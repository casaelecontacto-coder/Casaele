import User from '../models/User.js'
import { auth } from '../config/firebaseAdmin.js';
// Upsert a user on login
export async function upsertUserOnLogin(req, res) {
  try {
    const { name, email, provider, lastLoginAt } = req.body
    if (!email) return res.status(400).json({ message: 'email is required' })
    const update = {
      name: name || '',
      provider: provider || '',
      lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : new Date(),
    }
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $setOnInsert: { email: email.toLowerCase() }, $set: update },
      { new: true, upsert: true }
    )
    return res.json(user)
  } catch (err) {
    console.error('upsertUserOnLogin error:', err?.message || err)
    return res.status(500).json({ message: 'Failed to sync user' })
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200)
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, provider, lastLoginAt } = req.body
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' })
    }
    const user = await User.create({ name, email, provider: provider || '', lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : new Date() })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: 'Failed to create user' })
  }
}

// List users from Firebase Authentication (Admin SDK)
// @route   GET /api/users
// @desc    Get all users from Firebase Auth (paginated internally)
// @access  Admin (protected by verifyFirebaseToken at route level)
export async function getFirebaseUsers(req, res) {
  try {
    // If dev auth bypass is enabled, serve local users so the UI works in dev
    if (process.env.DEV_AUTH_DISABLED === 'true') {
      const users = await User.find().limit(1000);
      return res.json(users.map(u => ({
        uid: u._id?.toString(),
        email: u.email || '',
        name: u.name || '',
        photoURL: '',
        phoneNumber: '',
        providerIds: [],
        role: u.role || 'user',
        status: 'Active',
        disabled: false,
        creationTime: u.createdAt || '',
        lastSignInTime: u.updatedAt || ''
      })));
    }
    
    // CORRECTED: Add a check to ensure auth is initialized
    if (!auth) {
        throw new Error("Firebase Admin SDK is not initialized.");
    }

    const allUsers = [];
    let nextPageToken = undefined;
    do {
      // CORRECTED: Use the imported 'auth' object directly
      const result = await auth.listUsers(1000, nextPageToken);
      const mapped = result.users.map(u => ({
        uid: u.uid,
        email: u.email || '',
        name: u.displayName || '',
        photoURL: u.photoURL || '',
        phoneNumber: u.phoneNumber || '',
        providerIds: u.providerData?.map(p => p.providerId) || [],
        role: (u.customClaims && (u.customClaims.role || u.customClaims.roles)) || 'user',
        status: u.disabled ? 'Disabled' : 'Active',
        disabled: !!u.disabled,
        creationTime: u.metadata?.creationTime || '',
        lastSignInTime: u.metadata?.lastSignInTime || ''
      }));
      allUsers.push(...mapped);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    return res.json(allUsers);

  } catch (err) {
    console.error('getFirebaseUsers error:', err?.message || err);
    // Fallback to local users to prevent total UI failure
    try {
      const users = await User.find().limit(1000);
      return res.json(users.map(u => ({
        uid: u._id?.toString(),
        email: u.email || '',
        name: u.name || '',
        photoURL: '',
        phoneNumber: '',
        providerIds: [],
        role: u.role || 'user',
        status: 'Active',
        disabled: false,
        creationTime: u.createdAt || '',
        lastSignInTime: u.updatedAt || ''
      })));
    } catch (e) {
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
}

export async function setFirebaseUserRole(req, res) {
  try {
    const { uid, role } = req.body;
    if (!uid || !role) {
      return res.status(400).json({ message: 'UID and role are required' });
    }

    const validRoles = ['admin', 'editor', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // CORRECTED: Add a check to ensure auth is initialized
    if (!auth) {
        throw new Error("Firebase Admin SDK is not initialized.");
    }
    
    // CORRECTED: Use the imported 'auth' object directly
    await auth.setCustomUserClaims(uid, { role: role });
    
    return res.json({ message: `Successfully set role of ${role} for user ${uid}` });

  } catch (err) {
    console.error('setFirebaseUserRole error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to set user role' });
  }
}