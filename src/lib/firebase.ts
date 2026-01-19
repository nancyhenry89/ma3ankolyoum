// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: "AIzaSyAfQbI3s52SlpqX2v_SkvtfYo3TR8pO1io",
  authDomain: "ma3ankolyoum.firebaseapp.com",
  projectId: "ma3ankolyoum",
  storageBucket: "ma3ankolyoum.firebasestorage.app",
  messagingSenderId: "497547591446",
  appId: "1:497547591446:web:7056e59ff94dc0a32dda37",
  measurementId: "G-XCRSJZ6EFT",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);

/**
 * ✅ Ensure we always have request.auth (anonymous) before Firestore rules that require isAuthed()
 * Call ensureAnonAuth() once on app start (main.ts or App.vue) قبل أي listeners/transactions.
 */
let _authReady: Promise<void> | null = null;

export function ensureAnonAuth() {
  if (_authReady) return _authReady;

  _authReady = new Promise<void>((resolve) => {
    // if already signed in
    if (auth.currentUser) return resolve();

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve();
      }
    });

    signInAnonymously(auth).catch((e) => {
      console.error("Anonymous sign-in failed:", e);
      // still resolve so app doesn't hang; Firestore will show permission errors if rules require auth
      resolve();
    });
  });

  return _authReady;
}

/**
 * ✅ App Check (WEB only)
 * - reCAPTCHA v3 is for web sites
 * - Native apps need different providers (Play Integrity / App Attest)
 */
export function initAppCheckWeb() {
  if (Capacitor.isNativePlatform()) return;

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6LfvO08sAAAAAIx9lpKcVbANYxkndbHRVqQg1QYv"),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("AppCheck init skipped/failed:", e);
  }
}
