import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDC6wrJJiY319t2QsLOEyS2-BjeywSgjUM",
  authDomain: "meta-ads-f02c6.firebaseapp.com",
  projectId: "meta-ads-f02c6",
  storageBucket: "meta-ads-f02c6.firebasestorage.app",
  messagingSenderId: "250987006056",
  appId: "1:250987006056:web:fd74d0b5a8d5a4e00353dd",
  measurementId: "G-CC4108028D"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
