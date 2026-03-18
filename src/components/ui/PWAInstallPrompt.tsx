import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Wifi, WifiOff } from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const { isOffline } = useTrainStore();

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after 10 seconds of use
            setTimeout(() => setShowBanner(true), 10_000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        // Don't show again for this session
        setDeferredPrompt(null);
    };

    return (
        <>
            {/* Offline indicator */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[6000] flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/90 text-black text-xs font-bold backdrop-blur-md"
                    >
                        <WifiOff size={14} />
                        <span>Sin conexion — Mostrando datos en cache</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Install prompt */}
            <AnimatePresence>
                {showBanner && deferredPrompt && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[5000] glass-card p-5 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                    >
                        <button
                            onClick={handleDismiss}
                            aria-label="Cerrar"
                            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                <Download size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-white mb-1">Instalar EasyTrain</h3>
                                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                                    Acceso directo desde tu pantalla de inicio. Funciona sin conexion.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleInstall}
                                        className="btn-primary px-4 py-2 text-xs"
                                    >
                                        Instalar App
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-4 py-2 text-xs text-gray-500 hover:text-white transition-colors font-bold"
                                    >
                                        Ahora no
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Features chips */}
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
                            {[
                                { icon: <Wifi size={10} />, label: 'Offline' },
                                { icon: <Download size={10} />, label: 'Sin tienda' },
                            ].map(f => (
                                <span key={f.label} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-gray-500 border border-white/5">
                                    {f.icon} {f.label}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
