// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyCRAQPmuhwlbE7JqzShW_EReuP0MZxDXZk",
    authDomain: "prepwise-2f3a0.firebaseapp.com",
    projectId: "prepwise-2f3a0",
    storageBucket: "prepwise-2f3a0.firebasestorage.app",
    messagingSenderId: "188826932827",
    appId: "1:188826932827:web:7fd9474d4387379627d17e",
    measurementId: "G-9QHE06BNWF"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
