import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCV9AnOPulBSvWEBfBGprBVk7kFLmwDWnk",
  authDomain: "newbee-running-club-website.firebaseapp.com",
  projectId: "newbee-running-club-website",
  storageBucket: "newbee-running-club-website.firebasestorage.app",
  messagingSenderId: "577206570730",
  appId: "1:577206570730:web:169fb9e168168983695193",
  measurementId: "G-YC22KHNK43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);