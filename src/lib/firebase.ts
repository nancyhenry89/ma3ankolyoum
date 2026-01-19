// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// ✅ App Check (put your SITE KEY here)
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LfvO08sAAAAAIx9lpKcVbANYxkndbHRVqQg1QYv"),
  isTokenAutoRefreshEnabled: true,
});

export const db = getFirestore(app);
