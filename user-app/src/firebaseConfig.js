import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1bxkn1xEyi_cJ0iG-_Lx6uVM5msR2s_0",
  authDomain: "prode-ca423.firebaseapp.com",
  projectId: "prode-ca423",
  storageBucket: "prode-ca423.firebasestorage.app",
  messagingSenderId: "956462580499",
  appId: "1:956462580499:web:9433be34fb31af83c150e6",
  measurementId: "G-WVQJG17HZP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
