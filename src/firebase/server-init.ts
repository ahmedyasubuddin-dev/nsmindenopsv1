import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Important: This file should not be marked with 'use client'
// It's designed for server-side execution only.

let app: App;

if (!getApps().length) {
  try {
    // In a managed environment like Firebase App Hosting, the Admin SDK
    // is automatically configured when initializeApp() is called with no arguments.
    app = initializeApp();
  } catch (error) {
    console.warn("Automatic Firebase Admin SDK initialization failed, falling back to explicit config:", error);
    // Fallback for local development or other environments where auto-init isn't configured.
    // Explicitly providing the projectId can help resolve credential issues.
    app = initializeApp({
        projectId: firebaseConfig.projectId,
    });
  }
} else {
  app = getApp();
}

const firestore = getFirestore(app);

export { app, firestore };
