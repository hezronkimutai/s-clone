import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration - using environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA2MOailKWC3twyYL9zgEvLV81HvCuobW0",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "hkgroup-5e357.firebaseapp.com",
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://hkgroup-5e357-default-rtdb.firebaseio.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "hkgroup-5e357",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "hkgroup-5e357.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "666174502563",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:666174502563:web:347281452bf18b4e697116",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-5BVC79DJYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
