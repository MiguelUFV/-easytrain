import emailjs from '@emailjs/browser';

// ─── EmailJS Configuration ──────────────────────────────────────────────────
// 1. Crea cuenta en https://www.emailjs.com/ (200 emails/mes gratis)
// 2. Crea un servicio Gmail → copia el Service ID
// 3. Crea una plantilla "welcome_template" con las variables:
//    {{user_name}}, {{user_email}}, {{message}}
// 4. Añade tus claves como variables de entorno

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_WELCOME_TEMPLATE = import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE || 'welcome_template';

let initialized = false;

function ensureInit() {
    if (!initialized && EMAILJS_PUBLIC_KEY) {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        initialized = true;
    }
}

/**
 * Envía email de bienvenida/verificación al usuario tras registrarse.
 */
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    ensureInit();
    if (!EMAILJS_PUBLIC_KEY) {
        console.info('[EmailJS] No configurado — email simulado para:', email);
        return true;
    }

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE, {
            user_name: name,
            user_email: email,
            message: `¡Hola ${name}! Tu cuenta en EasyTrain ha sido verificada correctamente. Ya puedes buscar, comparar y reservar billetes de tren por toda Europa. ¡Buen viaje!`,
        });
        return true;
    } catch (err) {
        console.error('[EmailJS] Error enviando email de bienvenida:', err);
        return false;
    }
}
