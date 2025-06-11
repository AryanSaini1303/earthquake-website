import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAanpUgpZL9t6YZHdCKwyUJ9zZMuUlobjU",
  authDomain: "realtime-data-test-rym.firebaseapp.com",
  databaseURL: "https://realtime-data-test-rym-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "realtime-data-test-rym",
  storageBucket: "realtime-data-test-rym.firebasestorage.app",
  messagingSenderId: "189556655417",
  appId: "1:189556655417:web:30e772df82fdd2e1df14e8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
