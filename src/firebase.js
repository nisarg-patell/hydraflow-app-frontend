import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdWknmka2h6MbMnbigek6K6JF7ZDeJ5aE",
  authDomain: "hydraflow-wra.firebaseapp.com",
  projectId: "hydraflow-wra",
  storageBucket: "hydraflow-wra.firebasestorage.app",
  messagingSenderId: "144354743962",
  appId: "1:144354743962:web:86bd4108b586946dfbb123",
  measurementId: "G-P4VQSZNDDS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
