// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"; // <-- Agregado

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5WWHk6wdMh8oNoPjwwHGYuPma3pj_gfU",
  authDomain: "dpm-catalogo.firebaseapp.com",
  projectId: "dpm-catalogo",
  storageBucket: "dpm-catalogo.firebasestorage.app",
  messagingSenderId: "556140453510",
  appId: "1:556140453510:web:769366933ae4a95c6b3b07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const db = getFirestore(app);
export const auth = getAuth(app); // <-- Agregado