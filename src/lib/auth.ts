/**
 * auth.ts — Sistema de autenticación con Firebase Auth + Firestore
 *
 * Usa Firebase Authentication para registro/login real y persiste
 * perfiles de usuario en Firestore (colección 'users'), visible
 * desde Firebase Console.
 *
 * Mantiene cache local de emails para hints instantáneos en la UI.
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserResult {
    name: string;
    email: string;
    avatar: string;
    country: string;
    currency: string;
}

const EMAILS_CACHE_KEY = 'easytrain-registered-emails';

/** Cachea email localmente para hints instantáneos */
function trackEmailLocally(email: string): void {
    try {
        const raw = localStorage.getItem(EMAILS_CACHE_KEY);
        const emails: string[] = raw ? JSON.parse(raw) : [];
        const normalized = email.toLowerCase().trim();
        if (!emails.includes(normalized)) {
            emails.push(normalized);
            localStorage.setItem(EMAILS_CACHE_KEY, JSON.stringify(emails));
        }
    } catch { /* ignore */ }
}

/** Comprueba si un email ya está registrado (cache local para hint rápido) */
export function isEmailRegistered(email: string): boolean {
    try {
        const raw = localStorage.getItem(EMAILS_CACHE_KEY);
        if (!raw) return false;
        const emails: string[] = JSON.parse(raw);
        return emails.some(e => e === email.toLowerCase().trim());
    } catch {
        return false;
    }
}

/** Registra un nuevo usuario con Firebase Auth + Firestore */
export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    if (!name.trim() || name.trim().length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, error: 'Introduce un email válido' };
    }

    if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;

        await updateProfile(user, { displayName: name.trim() });

        // Guardar perfil en Firestore (visible en Firebase Console)
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            country: 'España',
            currency: 'EUR',
            avatar: '🧳',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });

        trackEmailLocally(email);
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('email-already-in-use')) {
            trackEmailLocally(email);
            return { success: false, error: 'Este email ya está registrado. Inicia sesión.' };
        }
        if (message.includes('weak-password')) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        }
        if (message.includes('invalid-email')) {
            return { success: false, error: 'Introduce un email válido' };
        }
        return { success: false, error: 'Error al registrarse. Inténtalo de nuevo.' };
    }
}

/** Intenta iniciar sesión con Firebase Auth */
export async function loginUser(
    email: string,
    password: string
): Promise<{ success: boolean; user?: UserResult; error?: string }> {
    if (!email.trim() || !password) {
        return { success: false, error: 'Introduce email y contraseña' };
    }

    try {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;

        // Actualizar último login en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp(),
        }, { merge: true });

        trackEmailLocally(email);

        return {
            success: true,
            user: {
                name: user.displayName || 'Usuario',
                email: user.email || email,
                avatar: '🧳',
                country: 'España',
                currency: 'EUR',
            },
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('user-not-found') || message.includes('invalid-credential')) {
            return { success: false, error: 'Email o contraseña incorrectos.' };
        }
        if (message.includes('wrong-password')) {
            return { success: false, error: 'Contraseña incorrecta' };
        }
        if (message.includes('too-many-requests')) {
            return { success: false, error: 'Demasiados intentos. Espera un momento.' };
        }
        return { success: false, error: 'Error al iniciar sesión. Inténtalo de nuevo.' };
    }
}

/** Cierra la sesión de Firebase */
export async function logoutUser(): Promise<void> {
    await signOut(auth);
}

/** Devuelve el número de emails cacheados localmente */
export function getRegisteredUserCount(): number {
    try {
        const raw = localStorage.getItem(EMAILS_CACHE_KEY);
        if (!raw) return 0;
        return JSON.parse(raw).length;
    } catch {
        return 0;
    }
}

/** Obtiene todos los emails cacheados (para debug) */
export function getAllRegisteredEmails(): string[] {
    try {
        const raw = localStorage.getItem(EMAILS_CACHE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}
