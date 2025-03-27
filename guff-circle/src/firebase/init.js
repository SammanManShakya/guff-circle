// src/Firebase/init.js
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEe0NO3aRDJrSGzdILANWWtIwwaYAdbKU",
  authDomain: "guff-circle.firebaseapp.com",
  projectId: "guff-circle",
  storageBucket: "guff-circle.firebasestorage.app",
  messagingSenderId: "947812911722",
  appId: "1:947812911722:web:ad1bf826292a3048ad5813"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export default db;



