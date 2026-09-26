import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-ss3KaiLaofrzPOlKJ6KwMbV3tr996T0",
  authDomain: "db-am-prem.firebaseapp.com",
  projectId: "db-am-prem",
  storageBucket: "db-am-prem.firebasestorage.app",
  messagingSenderId: "880895084992",
  appId: "1:880895084992:web:8cd83e111a1b5ed5976025"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
};