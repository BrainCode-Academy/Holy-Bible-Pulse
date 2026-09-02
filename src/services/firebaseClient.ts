import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Client-Side Firebase Configuration for Holy Bible+
 * Reads from Vite environment variables during build time,
 * with standard project fallbacks.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAOjFNqFIUbR3JfgLSBJ877JD0a9g_ztnw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'holy-bible-plus-60534.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'holy-bible-plus-60534',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'holy-bible-plus-60534.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '453373691889',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:453373691889:web:27545762e33ef53bbae650',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-F7VWYS3WPV',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth Instance
export const auth = getAuth(app);

// Firestore Database Instance
export const db = getFirestore(app);

// Firebase Storage Instance
export const storage = getStorage(app);

// Optional Analytics (only supported in standard browser contexts)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}
