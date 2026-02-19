import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; //
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Buranın doğruluğundan emin olalım
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiv782hAcsyMqr4oXANWJ6uQ979Ch7Ydc",
  authDomain: "studentcontrolsystem.firebaseapp.com",
  projectId: "studentcontrolsystem",
  storageBucket: "studentcontrolsystem.firebasestorage.app",
  messagingSenderId: "111427596179",
  appId: "1:111427596179:web:99da2e0d406e00e8434266",
  measurementId: "G-78KN6SEWVG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);