import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Cookie, MapPin, Bell, Trash2, Mail } from 'lucide-react';

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Header */}
                <Link to="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:text-[#d4a853] transition-colors" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={16} />
                    Volver al inicio
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-[#d4a853]" size={28} />
                    <h1 className="font-display text-3xl md:text-4xl font-bold">Política de Privacidad</h1>
                </div>
                <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
                    Última actualización: 18 de marzo de 2026
                </p>

                {/* Intro */}
                <Section>
                    <p>
                        En <strong>EasyTrain</strong> nos tomamos tu privacidad en serio. Esta política explica qué datos
                        recogemos, cómo los usamos y qué derechos tienes. Nuestra app es un buscador de trenes
                        europeos que consulta APIs públicas — no vendemos ni compartimos tus datos personales con terceros.
                    </p>
                </Section>

                {/* 1. Datos que recogemos */}
                <Section icon={<MapPin size={20} />} title="1. Datos que recogemos">
                    <p className="mb-3">EasyTrain puede recoger los siguientes datos, almacenados <strong>exclusivamente en tu dispositivo</strong> (localStorage):</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Historial de búsquedas</strong> — Origen, destino y fecha de tus búsquedas recientes.</li>
                        <li><strong>Preferencias</strong> — Tema (claro/oscuro), idioma, moneda y ajustes de la app.</li>
                        <li><strong>Rutas favoritas</strong> — Las rutas que guardas como favoritas.</li>
                        <li><strong>Alertas de precio</strong> — Configuraciones de alertas que creas.</li>
                    </ul>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No recogemos nombre, email, ubicación GPS, ni ningún dato de identificación personal
                        a menos que tú lo proporciones voluntariamente (ej: formulario de contacto).
                    </p>
                </Section>

                {/* 2. Cookies */}
                <Section icon={<Cookie size={20} />} title="2. Cookies y almacenamiento local">
                    <p className="mb-3">Utilizamos:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>localStorage</strong> — Para guardar tus preferencias y historial en tu navegador. No se envía a ningún servidor.</li>
                        <li><strong>Service Worker</strong> — Para que la app funcione offline y cargue más rápido (caché de respuestas de APIs).</li>
                    </ul>
                    <p className="mt-3">
                        No utilizamos cookies de rastreo, analytics de terceros, ni píxeles de seguimiento.
                    </p>
                </Section>

                {/* 3. APIs externas */}
                <Section icon={<MapPin size={20} />} title="3. APIs externas">
                    <p className="mb-3">
                        Para buscar estaciones y rutas, EasyTrain consulta APIs públicas de transporte. Estas peticiones
                        se hacen directamente desde tu navegador:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Deutsche Bahn (v6.db.transport.rest)</li>
                        <li>SBB Suiza (transport.opendata.ch)</li>
                        <li>iRail Bélgica (api.irail.be)</li>
                        <li>Entur Noruega (api.entur.io)</li>
                        <li>Renfe España (data.renfe.com)</li>
                        <li>SNCF Francia (ressources.data.sncf.com)</li>
                    </ul>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Cada API tiene su propia política de privacidad. EasyTrain no controla los datos que estas APIs puedan registrar (ej: tu dirección IP).
                    </p>
                </Section>

                {/* 4. Notificaciones */}
                <Section icon={<Bell size={20} />} title="4. Notificaciones">
                    <p>
                        Si activas las notificaciones push, se almacena un token de suscripción en tu dispositivo.
                        Puedes revocar este permiso en cualquier momento desde los ajustes de tu navegador.
                    </p>
                </Section>

                {/* 5. Tus derechos */}
                <Section icon={<Trash2 size={20} />} title="5. Tus derechos (RGPD)">
                    <p className="mb-3">Como usuario europeo, tienes derecho a:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Acceso</strong> — Consultar qué datos almacena la app (todo está en tu navegador).</li>
                        <li><strong>Rectificación</strong> — Modificar tus datos desde Ajustes.</li>
                        <li><strong>Supresión</strong> — Borrar todos tus datos desde Ajustes → "Borrar datos" o limpiando el localStorage del navegador.</li>
                        <li><strong>Portabilidad</strong> — Exportar tus datos (disponible en Ajustes).</li>
                    </ul>
                </Section>

                {/* 6. Contacto */}
                <Section icon={<Mail size={20} />} title="6. Contacto">
                    <p>
                        Si tienes preguntas sobre esta política, puedes escribirnos a:{' '}
                        <a href="mailto:privacidad@easytrain.eu" className="text-[#d4a853] hover:underline">
                            privacidad@easytrain.eu
                        </a>
                    </p>
                </Section>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t text-center text-xs" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
                    © 2026 EasyTrain Europa S.L. — Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title?: string; children: React.ReactNode }) {
    return (
        <section className="mb-10">
            {title && (
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#d4a853]">
                    {icon}
                    {title}
                </h2>
            )}
            <div className="text-sm leading-relaxed" style={{ color: 'var(--text-main)' }}>
                {children}
            </div>
        </section>
    );
}
