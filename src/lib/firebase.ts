import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjSfA_Z7N5vrOrRAqNma6pHBTUGaGFFhw",
  authDomain: "flight-agent-3012.firebaseapp.com",
  projectId: "flight-agent-3012",
  storageBucket: "flight-agent-3012.firebasestorage.app",
  messagingSenderId: "934777690300",
  appId: "1:934777690300:web:6b0e730a7d474c6a5318b9"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db };
