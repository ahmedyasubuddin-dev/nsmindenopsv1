import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Important: This file should not be marked with 'use client'
// It's designed for server-side execution only.

// In a managed environment like Firebase App Hosting, the Admin SDK
// is automatically configured when initializeApp() is called with no arguments.
const app = !getApps().length ? initializeApp() : getApp();

const firestore = getFirestore(app);

export { app, firestore };
