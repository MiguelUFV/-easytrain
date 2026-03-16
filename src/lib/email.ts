import emailjs from '@emailjs/browser';

// ─── EmailJS Configuration ──────────────────────────────────────────────────
// Para configurar: https://www.emailjs.com/
// 1. Crea cuenta gratuita en EmailJS (200 emails/mes gratis)
// 2. Crea un servicio (Gmail, Outlook, etc.) → Copia el Service ID
// 3. Crea estas plantillas:
//    - "welcome_template" → Email de bienvenida al registrarse
//    - "marketing_template" → Email marketing con ofertas
// 4. Reemplaza las constantes de abajo con tus IDs reales

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_WELCOME_TEMPLATE = import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE || 'welcome_template';
const EMAILJS_MARKETING_TEMPLATE = import.meta.env.VITE_EMAILJS_MARKETING_TEMPLATE || 'marketing_template';

let initialized = false;

function ensureInit() {
    if (!initialized && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        initialized = true;
    }
}

/**
 * Envía email de bienvenida al usuario tras registrarse.
 * Template variables: {{user_name}}, {{user_email}}, {{app_name}}
 */
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    ensureInit();
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.info('[EmailJS] No configurado — email de bienvenida simulado para:', email);
        return true; // Simular éxito en desarrollo
    }

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE, {
            user_name: name,
            user_email: email,
            app_name: 'EasyTrain',
            welcome_message: `¡Hola ${name}! Bienvenido a EasyTrain. Tu cuenta ha sido creada con éxito. Ya puedes buscar, comparar y reservar billetes de tren por toda Europa.`,
            cta_url: 'https://easytrain.vercel.app',
            cta_text: 'Empezar a Explorar',
        });
        return true;
    } catch (err) {
        console.error('[EmailJS] Error enviando email de bienvenida:', err);
        return false;
    }
}

/**
 * Envía email marketing con ofertas y tips al usuario.
 * Template variables: {{user_name}}, {{user_email}}, {{subject}}, {{content_html}}
 */
export async function sendMarketingEmail(name: string, email: string): Promise<boolean> {
    ensureInit();
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.info('[EmailJS] No configurado — email marketing simulado para:', email);
        return true;
    }

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_MARKETING_TEMPLATE, {
            user_name: name,
            user_email: email,
            app_name: 'EasyTrain',
            subject: `${name}, ¡descubre las mejores ofertas de tren en Europa!`,
            content_html: `
                <h2>🚄 Ofertas exclusivas para ti</h2>
                <ul>
                    <li><strong>Madrid → Barcelona</strong> desde 19,90€ (Alta Velocidad)</li>
                    <li><strong>París → Amsterdam</strong> desde 29€ (Thalys)</li>
                    <li><strong>Berlín → Múnich</strong> desde 17,90€ (ICE)</li>
                </ul>
                <p>Además, con EasyTrain puedes:</p>
                <ul>
                    <li>✅ Comparar precios de múltiples operadores</li>
                    <li>✅ Activar alertas de precio automáticas</li>
                    <li>✅ Planificar tu ruta Interrail inteligentemente</li>
                    <li>✅ Ver el mapa 3D interactivo de Europa</li>
                </ul>
                <p>¡Empieza a planificar tu próxima aventura ferroviaria!</p>
            `,
            cta_url: 'https://easytrain.vercel.app',
            cta_text: 'Ver Ofertas',
            unsubscribe_note: 'Puedes desuscribirte en cualquier momento desde tu perfil.',
        });
        return true;
    } catch (err) {
        console.error('[EmailJS] Error enviando email marketing:', err);
        return false;
    }
}
