import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface FirestoreUser {
    uid: string;
    name: string;
    email: string;
    country: string;
    currency: string;
    createdAt: unknown;
    lastLoginAt: unknown;
}

/** Register a new user with email/password and save profile to Firestore */
export async function registerUser(email: string, password: string, name: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Set display name in Firebase Auth
    await updateProfile(user, { displayName: name });

    // Save user document in Firestore (visible in Firebase Console)
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        country: 'España',
        currency: 'EUR',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
    });

    return user;
}

/** Sign in an existing user and update last login */
export async function loginUser(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Update last login timestamp
    await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return user;
}

/** Sign out the current user */
export async function logoutUser() {
    await signOut(auth);
}

/** Get user profile from Firestore */
export async function getUserProfile(uid: string): Promise<FirestoreUser | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as FirestoreUser) : null;
}

/** Listen to auth state changes */
export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}
