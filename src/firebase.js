// ====================================================
// 🔥 FIREBASE CONFIGURATION
// Replace these values with your own Firebase project config!
// Get them from: https://console.firebase.google.com
// Project Settings → General → Your Apps → Web App Config
// ====================================================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// =================== AUTH FUNCTIONS ===================

/**
 * Sign in with Google — tries popup first, falls back to redirect
 */
export const signInWithGoogle = async () => {
  try {
    // Try popup first (works in most desktop browsers)
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    // If popup is blocked, fall back to redirect flow
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/popup-closed-by-user" ||
      err.code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null; // page will redirect; result handled on return
    }
    throw err; // re-throw all other errors
  }
};

/**
 * Call this once on app load to capture the result of a redirect sign-in
 */
export const handleRedirectResult = async () => {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
};

/**
 * Sign in with Email & Password
 */
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Register with Email & Password
 */
export const registerWithEmail = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Sign out the current user
 */
export const logOut = async () => {
  await signOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default app;
