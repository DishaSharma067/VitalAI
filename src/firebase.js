import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyDxXfpthmRYNzEG-jw93eW8JWen_dJGDNY",
  authDomain: "vitalai-14263.firebaseapp.com",
  projectId: "vitalai-14263",
  storageBucket: "vitalai-14263.firebasestorage.app",
  messagingSenderId: "1065626152339",
  appId: "1:1065626152339:web:2b82a452a6fd9b95f08c66",
  measurementId: "G-VSRDW9N9X8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);