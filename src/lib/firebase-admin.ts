import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;

export async function initFirebaseAdmin() {
  if (getApps().length === 0) {
    adminApp = initializeApp();
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}
