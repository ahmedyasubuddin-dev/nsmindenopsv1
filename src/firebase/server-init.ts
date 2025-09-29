import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Important: This file should not be marked with 'use client'
// It's designed for server-side execution only.

const apps = getApps();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (process.env.NODE_ENV === 'development' && !serviceAccount) {
    // In dev mode, you might not have the service account env var.
    // This is a fallback to initialize without it, but some admin features might not work.
    console.warn("FIREBASE_SERVICE_ACCOUNT env var not set. Initializing Firebase Admin SDK without credentials for development. This may limit functionality.")
}


const app = !apps.length
  ? initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined)
  : getApp();

const firestore = getFirestore(app);

export { app, firestore };
