// config/firebaseAdmin.js

import 'dotenv/config'; // <-- This is the main fix!
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

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.error('Firebase Admin Error: FIREBASE_SERVICE_ACCOUNT_PATH is not set in your .env file.');
    // Exit gracefully if the config is missing
    return;
  }

  try {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Service account file not found at path: ${absolutePath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.');
    console.error(error.message);
    // Stop the server if Firebase Admin can't be initialized, as it's a critical dependency.
    process.exit(1);
  }
}

// Run the initialization
initialize();

// Export the auth service, checking if the app was initialized
export const auth = app ? admin.auth() : null;