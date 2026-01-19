// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyAfQbI3s52SlpqX2v_SkvtfYo3TR8pO1io",
  authDomain: "ma3ankolyoum.firebaseapp.com",
  projectId: "ma3ankolyoum",
  storageBucket: "ma3ankolyoum.firebasestorage.app",
  messagingSenderId: "497547591446",
  appId: "1:497547591446:web:7056e59ff94dc0a32dda37",
  measurementId: "G-XCRSJZ6EFT",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Web only: AppCheck (reCAPTCHA v3)
export function initAppCheckWeb() {
  const isWeb = !Capacitor.isNativePlatform();
  if (!isWeb) return;

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6LfvO08sAAAAAD1YTZBJUBy4filFNestfSL6QrSg"),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("AppCheck init skipped:", e);
  }
}

// ✅ ensure auth exists
export async function ensureAnonAuth() {
  try {
    if (auth.currentUser) return auth.currentUser;
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (e) {
    console.error("Anonymous sign-in failed:", e);
    return null;
  }
}
