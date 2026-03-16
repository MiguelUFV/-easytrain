/**
 * auth.ts — Sistema de autenticación local con persistencia
 *
 * Almacena usuarios registrados en localStorage con contraseñas hasheadas.
 * Si un usuario ya está registrado, el modal muestra "Iniciar Sesión".
 */

interface StoredUser {
    name: string;
    email: string;
    passwordHash: string;
    registeredAt: string;
    avatar: string;
    country: string;
    currency: string;
}

const USERS_STORAGE_KEY = 'easytrain-registered-users';

/** Hash simple pero suficiente para app cliente (SHA-256 via Web Crypto) */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'easytrain-salt-2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Lee todos los usuarios registrados del localStorage */
function getStoredUsers(): StoredUser[] {
    try {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as StoredUser[];
    } catch {
        return [];
    }
}

/** Guarda la lista de usuarios en localStorage */
function saveStoredUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/** Comprueba si un email ya está registrado */
export function isEmailRegistered(email: string): boolean {
    const users = getStoredUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

/** Obtiene los datos del usuario por email (sin password) */
export function getUserByEmail(email: string): Omit<StoredUser, 'passwordHash'> | null {
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
}

/** Registra un nuevo usuario. Devuelve error string o null si OK. */
export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    // Validaciones
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

    if (isEmailRegistered(email)) {
        return { success: false, error: 'Este email ya está registrado. Inicia sesión.' };
    }

    const passwordHash = await hashPassword(password);

    const users = getStoredUsers();
    users.push({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        registeredAt: new Date().toISOString(),
        avatar: '🧳',
        country: 'España',
        currency: 'EUR',
    });

    saveStoredUsers(users);
    return { success: true };
}

/** Intenta iniciar sesión. Devuelve datos de usuario o error. */
export async function loginUser(
    email: string,
    password: string
): Promise<{ success: boolean; user?: Omit<StoredUser, 'passwordHash'>; error?: string }> {
    if (!email.trim() || !password) {
        return { success: false, error: 'Introduce email y contraseña' };
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
        return { success: false, error: 'No existe una cuenta con este email. Regístrate primero.' };
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Contraseña incorrecta' };
    }

    const { passwordHash: _, ...safe } = user;
    return { success: true, user: safe };
}

/** Devuelve el número de usuarios registrados */
export function getRegisteredUserCount(): number {
    return getStoredUsers().length;
}

/** Obtiene todos los emails registrados (para admin/debug) */
export function getAllRegisteredEmails(): string[] {
    return getStoredUsers().map(u => u.email);
}
