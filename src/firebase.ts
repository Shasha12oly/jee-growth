import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  orderBy, 
  limit, 
  increment,
  Timestamp 
} from 'firebase/firestore';

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

// Export Firebase services and types
export {
  app,
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  orderBy,
  limit,
  increment,
  Timestamp,
  type User
};

export type { 
  StudySession,
  PomodoroSession,
  UserProfile 
} from './types';
