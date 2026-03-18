import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// Registro de Service Worker para PWA con actualizaciones automáticas
import { registerSW } from 'virtual:pwa-register';
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        // Actualización disponible — aplicar automáticamente
        updateSW(true);
    },
    onOfflineReady() {
        console.log('[PWA] App lista para uso offline');
    },
    onRegisteredSW(swUrl, registration) {
        // Comprobar actualizaciones cada hora
        if (registration) {
            setInterval(() => { registration.update(); }, 60 * 60 * 1000);
        }
        console.log('[PWA] Service Worker registrado:', swUrl);
    },
});

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

createRoot(root).render(
    <StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </HelmetProvider>
    </StrictMode>
);
