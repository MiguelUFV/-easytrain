import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, X, ChevronRight } from 'lucide-react';
import { updateConsent } from '../../lib/analytics';

export const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } else if (consent === 'granted') {
      updateConsent(true);
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    localStorage.setItem('cookie-consent', granted ? 'granted' : 'denied');
    updateConsent(granted);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[10000]"
        >
          <div className="glass-card p-6 border-indigo-500/20 shadow-2xl overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Cookie size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight mb-1">Privacidad y Cookies</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Utilizamos cookies para que tu experiencia en EasyTrain sea impecable, analizando el tráfico y personalizando tu viaje.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleConsent(true)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20 group"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span>Aceptar Todo</span>
                  </div>
                  <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleConsent(false)}
                    className="flex items-center justify-center px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                  >
                    Solo necesarias
                  </button>
                  <a
                    href="/privacy"
                    className="flex items-center justify-center px-4 py-3 text-gray-500 hover:text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Ver política
                  </a>
                </div>
              </div>
            </div>

            {/* Close visual only */}
            <button 
              onClick={() => handleConsent(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
