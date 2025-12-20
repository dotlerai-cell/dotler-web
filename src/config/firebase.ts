import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAE_AHtNFEsnpWl-A1U_oDsfOU6l-YU7xU",
  authDomain: "dotler-prod.firebaseapp.com",
  projectId: "dotler-prod",
  storageBucket: "dotler-prod.firebasestorage.app",
  messagingSenderId: "467424984046",
  appId: "1:467424984046:web:e2512da6a5a2bbccaaecff",
  measurementId: "G-D1X9DXTDP0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
