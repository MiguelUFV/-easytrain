import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Zap, Train, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';
import { useToastStore } from './Toast';
import { analytics } from '../../lib/analytics';
import { registerUser, loginUser, isEmailRegistered } from '../../lib/auth';
import { sendWelcomeEmail } from '../../lib/email';

type AuthTab = 'register' | 'login';

export const AuthModal = () => {
    const { isAuthModalOpen, setAuthModalOpen, setAnonymousMode, updateUserProfile } = useTrainStore();
    const { addToast } = useToastStore();
    const [tab, setTab] = useState<AuthTab>('register');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [emailHint, setEmailHint] = useState<'exists' | 'available' | null>(null);

    // Hint sutil: avisa si el email ya existe (sin forzar cambio)
    useEffect(() => {
        if (!form.email || form.email.length < 5 || !form.email.includes('@')) {
            setEmailHint(null);
            return;
        }
        const timer = setTimeout(() => {
            const registered = isEmailRegistered(form.email);
            setEmailHint(registered ? 'exists' : 'available');
        }, 600);
        return () => clearTimeout(timer);
    }, [form.email]);

    // Reset form al cambiar de tab
    useEffect(() => {
        setFieldErrors({});
        setEmailHint(null);
    }, [tab]);

    if (!isAuthModalOpen) return null;

    const clearErrors = () => setFieldErrors({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            if (tab === 'login') {
                const result = await loginUser(form.email, form.password);
                if (!result.success) {
                    setFieldErrors({ general: result.error ?? 'Email o contraseña incorrectos' });
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
                // Verificar si ya existe antes de registrar
                if (isEmailRegistered(form.email)) {
                    setFieldErrors({ email: 'Este email ya tiene cuenta. Usa Iniciar Sesión.' });
                    setIsSubmitting(false);
                    return;
                }

                const result = await registerUser(form.name, form.email, form.password);
                if (!result.success) {
                    setFieldErrors({ general: result.error ?? 'Error al registrarse' });
                    setIsSubmitting(false);
                    return;
                }

                updateUserProfile({
                    name: form.name.trim(),
                    email: form.email.toLowerCase().trim(),
                    isRegistered: true,
                    country: 'España',
                    currency: 'EUR',
                    avatar: '🧳',
                });

                analytics.register();

                const emailOk = await sendWelcomeEmail(form.name.trim(), form.email.trim());

                if (emailOk) {
                    addToast('¡Cuenta creada! Revisa tu email de confirmación.', 'success');
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
                    {/* Barra decorativa superior */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <button
                        onClick={() => setAuthModalOpen(false)}
                        aria-label="Cerrar modal"
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8">
                        {/* Logo */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-3 border border-indigo-500/20">
                                <Train size={24} />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight">EasyTrain</h2>
                        </div>

                        {/* Pestañas */}
                        <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setTab('register')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    tab === 'register'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Crear Cuenta
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('login')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    tab === 'login'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                        </div>

                        {/* Error general */}
                        {fieldErrors.general && (
                            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                {fieldErrors.general}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre — solo en registro */}
                            {tab === 'register' && (
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
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => { setForm({...form, email: e.target.value}); clearErrors(); }}
                                        className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none transition-colors ${
                                            fieldErrors.email
                                                ? 'border-red-500/50 focus:border-red-500/70'
                                                : 'border-white/10 focus:border-indigo-500/50'
                                        }`}
                                        placeholder="tu@email.com"
                                        required
                                        autoComplete="email"
                                    />
                                    {/* Indicador visual de estado del email */}
                                    {tab === 'register' && emailHint === 'exists' && (
                                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                                    )}
                                    {tab === 'register' && emailHint === 'available' && (
                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" size={16} />
                                    )}
                                </div>
                                {/* Mensajes bajo el campo email */}
                                {fieldErrors.email && (
                                    <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {fieldErrors.email}
                                    </p>
                                )}
                                {tab === 'register' && emailHint === 'exists' && !fieldErrors.email && (
                                    <p className="text-xs text-amber-400 ml-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Este email ya tiene cuenta.{' '}
                                        <button type="button" onClick={() => setTab('login')} className="underline hover:text-amber-300 font-bold">
                                            Ir a Iniciar Sesión
                                        </button>
                                    </p>
                                )}
                                {tab === 'register' && emailHint === 'available' && (
                                    <p className="text-xs text-green-400 ml-1 flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        Email disponible
                                    </p>
                                )}
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => { setForm({...form, password: e.target.value}); clearErrors(); }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        placeholder={tab === 'login' ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                                        minLength={6}
                                        required
                                        autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                    />
                                </div>
                            </div>

                            {/* Botón principal */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-3.5 text-sm font-bold mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{tab === 'login' ? 'Accediendo...' : 'Creando cuenta...'}</span>
                                    </>
                                ) : (
                                    <span>{tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Gratis'}</span>
                                )}
                            </button>
                        </form>

                        {/* Separador + Invitado */}
                        <div className="mt-5">
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink mx-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">o</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>

                            <button
                                onClick={handleGuest}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 group mt-2"
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
