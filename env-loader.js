// Simple environment variable loader for client-side applications
// This script should be loaded before app.js

// In a production environment, you would use a build tool like Webpack, Vite, or Parcel
// to inject these environment variables at build time.

// For development, you can manually set these values or use a build script
window.process = window.process || {};
window.process.env = window.process.env || {};

// Load environment variables (in production, these would be injected by your build tool)
// For now, you can manually set these or load them from a config file
window.process.env.FIREBASE_API_KEY = 'AIzaSyA2MOailKWC3twyYL9zgEvLV81HvCuobW0';
window.process.env.FIREBASE_AUTH_DOMAIN = 'hkgroup-5e357.firebaseapp.com';
window.process.env.FIREBASE_DATABASE_URL = 'https://hkgroup-5e357-default-rtdb.firebaseio.com';
window.process.env.FIREBASE_PROJECT_ID = 'hkgroup-5e357';
window.process.env.FIREBASE_STORAGE_BUCKET = 'hkgroup-5e357.firebasestorage.app';
window.process.env.FIREBASE_MESSAGING_SENDER_ID = '666174502563';
window.process.env.FIREBASE_APP_ID = '1:666174502563:web:347281452bf18b4e697116';
window.process.env.FIREBASE_MEASUREMENT_ID = 'G-5BVC79DJYQ';
window.process.env.DEFAULT_TIMER_DURATION = '20';

console.log('Environment variables loaded for development');