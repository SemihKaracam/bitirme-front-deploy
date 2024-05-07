// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRN7khm6yWln4IlaUgfH5t50_3JiQQXaM",
  authDomain: "bitirme-c745f.firebaseapp.com",
  projectId: "bitirme-c745f",
  storageBucket: "bitirme-c745f.appspot.com",
  messagingSenderId: "922411906596",
  appId: "1:922411906596:web:5f55986cceb160eb500ab1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)