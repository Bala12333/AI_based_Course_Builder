import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console: Project Settings > General > Your apps > SDk setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0hEtqBUWYXH-O0IcGXRJpFDQ-6cURRbE",
  authDomain: "aibasedcourse.firebaseapp.com",
  projectId: "aibasedcourse",
  storageBucket: "aibasedcourse.firebasestorage.app",
  messagingSenderId: "1058932878710",
  appId: "1:1058932878710:web:eb85dd00c847e70009de57",
  measurementId: "G-X9LTLPKXSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
