/**
 * firestore-sync.ts — Sincronización bidireccional Zustand ↔ Firestore
 *
 * Para usuarios autenticados, persiste favorites, priceAlerts,
 * searchHistory y settings en Firestore (documento users/{uid}).
 * Los datos se guardan como arrays/objetos embebidos (no subcollections)
 * porque el volumen es pequeño y así minimizamos lecturas.
 */

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Route, PriceAlert, SearchHistoryEntry, UserProfile } from '../types';

// ─── Types ───────────────────────────────────────────────────────────

/** Shape of the synced data in Firestore users/{uid} */
export interface FirestoreUserData {
    // Profile (already saved by auth.ts on register)
    uid: string;
    name: string;
    email: string;
    country: string;
    currency: string;
    avatar: string;
    // Synced app data
    favorites?: Route[];
    priceAlerts?: PriceAlert[];
    searchHistory?: SearchHistoryEntry[];
    settings?: {
        priceAlerts: boolean;
        travelInsurance: boolean;
        quickPay: boolean;
    };
}

// ─── Save functions ──────────────────────────────────────────────────

function getUserDocRef(uid: string) {
    if (!db) throw new Error('Firebase not configured');
    return doc(db, 'users', uid);
}

/** Save favorites to Firestore (merge — doesn't overwrite other fields) */
export async function saveFavorites(uid: string, favorites: Route[]): Promise<void> {
    await setDoc(getUserDocRef(uid), { favorites }, { merge: true });
}

/** Save price alerts to Firestore */
export async function savePriceAlerts(uid: string, priceAlerts: PriceAlert[]): Promise<void> {
    await setDoc(getUserDocRef(uid), { priceAlerts }, { merge: true });
}

/** Save search history to Firestore */
export async function saveSearchHistory(uid: string, searchHistory: SearchHistoryEntry[]): Promise<void> {
    await setDoc(getUserDocRef(uid), { searchHistory }, { merge: true });
}

/** Save settings to Firestore */
export async function saveSettings(uid: string, settings: FirestoreUserData['settings']): Promise<void> {
    await setDoc(getUserDocRef(uid), { settings }, { merge: true });
}

/** Save user profile fields to Firestore */
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    // Don't save isRegistered to Firestore — it's a local-only flag
    const { isRegistered: _, ...rest } = profile;
    if (Object.keys(rest).length > 0) {
        await setDoc(getUserDocRef(uid), rest, { merge: true });
    }
}

// ─── Load function ───────────────────────────────────────────────────

/** Load all synced data from Firestore for a user */
export async function loadUserData(uid: string): Promise<FirestoreUserData | null> {
    const snap = await getDoc(getUserDocRef(uid));
    if (!snap.exists()) return null;
    return snap.data() as FirestoreUserData;
}

// ─── Real-time listener ──────────────────────────────────────────────

/** Subscribe to real-time changes on the user document */
export function subscribeToUserData(
    uid: string,
    callback: (data: FirestoreUserData) => void
): Unsubscribe {
    return onSnapshot(getUserDocRef(uid), (snap) => {
        if (snap.exists()) {
            callback(snap.data() as FirestoreUserData);
        }
    });
}

// ─── Auth state observer ─────────────────────────────────────────────

type AuthCallback = (user: User | null) => void;

/** Listen for auth state changes (login/logout) */
export function onAuthChange(callback: AuthCallback): Unsubscribe {
    if (!auth) return () => {}; // Firebase not configured — no-op
    return onAuthStateChanged(auth, callback);
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Get current authenticated user's UID, or null */
export function getCurrentUid(): string | null {
    return auth?.currentUser?.uid ?? null;
}

/** Merge cloud data with local data, preferring cloud for conflicts */
export function mergeUserData(
    local: {
        favorites: Route[];
        priceAlerts: PriceAlert[];
        searchHistory: SearchHistoryEntry[];
        settings: FirestoreUserData['settings'];
    },
    cloud: FirestoreUserData
): {
    favorites: Route[];
    priceAlerts: PriceAlert[];
    searchHistory: SearchHistoryEntry[];
    settings: NonNullable<FirestoreUserData['settings']>;
} {
    // Merge favorites: union by route id, cloud wins on duplicates
    const cloudFavIds = new Set((cloud.favorites ?? []).map(f => f.id));
    const mergedFavorites = [
        ...(cloud.favorites ?? []),
        ...local.favorites.filter(f => !cloudFavIds.has(f.id)),
    ];

    // Merge alerts: union by id
    const cloudAlertIds = new Set((cloud.priceAlerts ?? []).map(a => a.id));
    const mergedAlerts = [
        ...(cloud.priceAlerts ?? []),
        ...local.priceAlerts.filter(a => !cloudAlertIds.has(a.id)),
    ];

    // Merge history: union by id, cap at 10, most recent first
    const cloudHistoryIds = new Set((cloud.searchHistory ?? []).map(h => h.id));
    const mergedHistory = [
        ...(cloud.searchHistory ?? []),
        ...local.searchHistory.filter(h => !cloudHistoryIds.has(h.id)),
    ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    // Settings: cloud wins
    const mergedSettings = cloud.settings ?? local.settings ?? {
        priceAlerts: true,
        travelInsurance: false,
        quickPay: true,
    };

    return {
        favorites: mergedFavorites,
        priceAlerts: mergedAlerts,
        searchHistory: mergedHistory,
        settings: mergedSettings,
    };
}
