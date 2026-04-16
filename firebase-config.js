import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, orderBy, limit, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDrORq3mZHx1tf5qbH-fdt0ScysupK10e0",
    authDomain: "gorwth.firebaseapp.com",
    projectId: "gorwth",
    storageBucket: "gorwth.firebasestorage.app",
    messagingSenderId: "36209213488",
    appId: "1:36209213488:web:a0441fe55e2c771aaaedf5",
    measurementId: "G-ZE7SY6VLVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other modules
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, orderBy, limit, increment };
