import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Zap, Train } from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';
import { useToastStore } from './Toast';
import { analytics } from '../../lib/analytics';

export const AuthModal = () => {
    const { isAuthModalOpen, setAuthModalOpen, setAnonymousMode, updateUserProfile } = useTrainStore();
    const { addToast } = useToastStore();
    const [isLogin, setIsLogin] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    if (!isAuthModalOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password || (!isLogin && !form.name)) {
            addToast('Por favor, completa todos los campos', 'error');
            return;
        }

        // Simulación de registro/login con nube
        const userData = {
            name: form.name || 'Usuario',
            email: form.email,
            isRegistered: true,
            country: 'España',
            currency: 'EUR',
            avatar: '🧳'
        };

        updateUserProfile(userData);
        analytics.register({ name: userData.name, email: userData.email });
        
        addToast(isLogin ? '¡Bienvenido de nuevo!' : '¡Cuenta creada con éxito!', 'success');
        setAuthModalOpen(false);
    };

    const handleGuest = () => {
        setAnonymousMode(true);
        setAuthModalOpen(false);
        addToast('Entrando como invitado', 'info');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setAuthModalOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md glass-card overflow-hidden border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
                >
                    {/* Header bg decoration */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                    
                    <button 
                        onClick={() => setAuthModalOpen(false)}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                                <Train size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {isLogin ? 'Bienvenido de nuevo' : 'Únete a EasyTrain'}
                            </h2>
                            <p className="text-sm text-gray-400 mt-2">
                                {isLogin 
                                    ? 'Accede a tus billetes y preferencias guardadas.' 
                                    : 'Crea una cuenta para reservar viajes y gestionar tus trayectos.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input 
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({...form, name: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input 
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input 
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({...form, password: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full btn-primary py-3 text-sm mt-4">
                                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-3">
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-xs text-gray-500 hover:text-white transition-colors text-center font-bold"
                            >
                                {isLogin ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Inicia sesión'}
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink mx-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">o</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>

                            <button 
                                onClick={handleGuest}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 group"
                            >
                                <Zap size={14} className="text-indigo-400 group-hover:fill-current" />
                                Continuar como Invitado
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
