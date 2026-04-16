import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const FIREBASE_CONFIG = {
  projectId: "aegis-align-ecoverse",
  appId: "1:427917311914:web:dfde4cf1d3e3e7623735d3",
  storageBucket: "aegis-align-ecoverse.firebasestorage.app",
  apiKey: "AIzaSyD8lRAniLnlr-k5Cf883YR9kk9RiHezHbo",
  authDomain: "aegis-align-ecoverse.firebaseapp.com",
  messagingSenderId: "427917311914",
  measurementId: "G-2XD7KJLRMN",
};

let appInstance;
let firestoreInstance;

export function getFirebaseApp() {
  if (!appInstance) {
    appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  }
  return appInstance;
}

export function getAegisFirestore() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
  }
  return firestoreInstance;
}
