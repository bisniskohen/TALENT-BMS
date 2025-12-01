import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2e_NzBhQ7mDLZNMHgLsmj9_TXY0_O3hg",
  authDomain: "talent-bms.firebaseapp.com",
  projectId: "talent-bms",
  storageBucket: "talent-bms.firebasestorage.app",
  messagingSenderId: "742898869478",
  appId: "1:742898869478:web:22341b580d021b44644727",
  measurementId: "G-HJ1W2SJWFN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);