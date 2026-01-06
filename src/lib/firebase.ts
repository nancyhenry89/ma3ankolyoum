// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyAfQbI3s52SlpqX2v_SkvtfYo3TR8pO1io",
    authDomain: "ma3ankolyoum.firebaseapp.com",
    projectId: "ma3ankolyoum",
    storageBucket: "ma3ankolyoum.firebasestorage.app",
    messagingSenderId: "497547591446",
    appId: "1:497547591446:web:7056e59ff94dc0a32dda37",
    measurementId: "G-XCRSJZ6EFT"
}

const app = initializeApp(firebaseConfig)

// ✅ THIS is what your error is asking for
export const db = getFirestore(app)
