import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Zap, Train, Loader2 } from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';
import { useToastStore } from './Toast';
import { analytics } from '../../lib/analytics';
import { registerUser, loginUser, isEmailRegistered } from '../../lib/auth';
import { sendWelcomeEmail, sendMarketingEmail } from '../../lib/email';

export const AuthModal = () => {
    const { isAuthModalOpen, setAuthModalOpen, setAnonymousMode, updateUserProfile } = useTrainStore();
    const { addToast } = useToastStore();
    const [isLogin, setIsLogin] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Auto-detectar si el email ya está registrado → cambiar a login
    useEffect(() => {
        if (!form.email || form.email.length < 5) return;
        const timer = setTimeout(() => {
            const registered = isEmailRegistered(form.email);
            if (registered && !isLogin) {
                setIsLogin(true);
                addToast('¡Ya tienes cuenta! Introduce tu contraseña para acceder.', 'info');
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [form.email, isLogin, addToast]);

    if (!isAuthModalOpen) return null;

    const clearErrors = () => setFieldErrors({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            if (isLogin) {
                // ── LOGIN ──
                const result = await loginUser(form.email, form.password);
                if (!result.success) {
                    setFieldErrors({ general: result.error ?? 'Error al iniciar sesión' });
                    setIsSubmitting(false);
                    return;
                }

                updateUserProfile({
                    name: result.user!.name,
                    email: result.user!.email,
                    avatar: result.user!.avatar,
                    country: result.user!.country,
                    currency: result.user!.currency,
                    isRegistered: true,
                });

                addToast(`¡Bienvenido de nuevo, ${result.user!.name}!`, 'success');
                setAuthModalOpen(false);
            } else {
                // ── REGISTRO ──
                const result = await registerUser(form.name, form.email, form.password);
                if (!result.success) {
                    setFieldErrors({ general: result.error ?? 'Error al registrarse' });
                    setIsSubmitting(false);
                    return;
                }

                // Actualizar perfil en la app
                updateUserProfile({
                    name: form.name.trim(),
                    email: form.email.toLowerCase().trim(),
                    isRegistered: true,
                    country: 'España',
                    currency: 'EUR',
                    avatar: '🧳',
                });

                // Enviar evento a GA4 (sin PII — solo método)
                analytics.register();

                // Enviar email de bienvenida + marketing en paralelo
                const [welcomeOk] = await Promise.allSettled([
                    sendWelcomeEmail(form.name.trim(), form.email.trim()),
                    sendMarketingEmail(form.name.trim(), form.email.trim()),
                ]);

                if (welcomeOk.status === 'fulfilled' && welcomeOk.value) {
                    addToast('¡Cuenta creada! Revisa tu email para el mensaje de bienvenida.', 'success');
                } else {
                    addToast('¡Cuenta creada con éxito!', 'success');
                }

                setAuthModalOpen(false);
            }
        } catch {
            setFieldErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
        } finally {
            setIsSubmitting(false);
        }
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
                        aria-label="Cerrar modal"
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

                        {/* Error general */}
                        {fieldErrors.general && (
                            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
                                {fieldErrors.general}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => { setForm({...form, name: e.target.value}); clearErrors(); }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="Tu nombre completo"
                                            minLength={2}
                                            maxLength={50}
                                            autoComplete="name"
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
                                        onChange={e => { setForm({...form, email: e.target.value}); clearErrors(); }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder="tu@email.com"
                                        required
                                        autoComplete="email"
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
                                        onChange={e => { setForm({...form, password: e.target.value}); clearErrors(); }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                                        minLength={6}
                                        required
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-3 text-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{isLogin ? 'Accediendo...' : 'Creando cuenta...'}</span>
                                    </>
                                ) : (
                                    <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={() => { setIsLogin(!isLogin); clearErrors(); }}
                                className="text-xs text-gray-500 hover:text-white transition-colors text-center font-bold"
                            >
                                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
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
