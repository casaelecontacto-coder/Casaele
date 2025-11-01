// config/firebaseAdmin.js

import 'dotenv/config'; 
import admin from 'firebase-admin';

let app;

// Get the JSON content directly from the environment variable
const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

function initialize() {
  // Prevent re-initialization
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return;
  }

  if (!serviceAccountJSON) {
    console.error('Firebase Admin Error: FIREBASE_SERVICE_ACCOUNT_JSON is not set in your environment variables.');
    // Exit gracefully if the config is missing
    return;
  }

  try {
    // Parse the JSON content directly
    const serviceAccount = JSON.parse(serviceAccountJSON);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.');
    console.error('This often happens if the FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    console.error(error.message);
    // Stop the server if Firebase Admin can't be initialized
    process.exit(1);
  }
}

// Run the initialization
initialize();

// Export the auth service, checking if the app was initialized
export const auth = app ? admin.auth() : null;