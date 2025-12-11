// config/firebaseAdmin.js

import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let app;

function initialize() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return;
  }

  try {
    let serviceAccount;

    // --- Preferred method: Load from environment variable ---
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        ("🔹 Loaded Firebase credentials from environment variable.");
      } catch (parseError) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", parseError.message);
        throw parseError;
      }
    } 
    
    // --- Fallback: Load from local file (useful for local dev) ---
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const absolutePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Service account file not found at path: ${absolutePath}`);
      }

      serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      (`🔹 Loaded Firebase credentials from file: ${absolutePath}`);
    } 
    
    // --- If neither is set ---
    else {
      throw new Error("No Firebase service account found. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.");
    }

    // --- Initialize Firebase Admin ---
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    ("✅ Firebase Admin SDK initialized successfully.");

  } catch (error) {
    console.error("🔥 CRITICAL: Failed to initialize Firebase Admin SDK.");
    console.error("Reason:", error.message);
    // Optional: don't crash in production, but warn instead
    if (process.env.NODE_ENV === 'production') {
      console.error("⚠️ Continuing without Firebase Admin (local DB fallback will be used).");
    } else {
      process.exit(1);
    }
  }
}

// Initialize once
initialize();

// Export safely
export const auth = app ? admin.auth() : null;
export default admin;
