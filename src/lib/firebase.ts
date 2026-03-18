import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBjNdcjv4U3rw_sLu0N1fIrcmhRpeMB_Co",
    authDomain: "easytrain-4a9c1.firebaseapp.com",
    projectId: "easytrain-4a9c1",
    storageBucket: "easytrain-4a9c1.firebasestorage.app",
    messagingSenderId: "106232010703",
    appId: "1:106232010703:web:b614c999a9c554e72f24ba",
    measurementId: "G-1W0FSTRQCF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
