import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Globe, CreditCard, Mail } from 'lucide-react';
import { useTrainStore } from '../store/useTrainStore';
import { useToastStore } from './Toast.tsx';

const AVATARS = ['🧳', '🚆', '🗺️', '✈️', '🎒', '🌍', '🚂', '🧭'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const COUNTRIES = ['España', 'France', 'Deutschland', 'Italia', 'Portugal', 'United Kingdom', 'Nederland'];

const Medal = ({ icon, title, desc, achieved }: { icon: string, title: string, desc: string, achieved?: boolean }) => (
    <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-1 ${achieved ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/5 border-transparent opacity-40'}`}>
        <div className="text-3xl mb-1">{icon}</div>
        <div className="text-xs font-black text-white">{title}</div>
        <div className="text-[9px] text-[var(--text-muted)] font-medium leading-tight">{desc}</div>
    </div>
);

const StatProgress = ({ label, value, max, unit, color }: { label: string, value: number, max: number, unit: string, color: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            <div className="text-sm font-black text-white">{value} <span className="text-gray-500 font-bold">{unit}</span></div>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                className={`h-full ${color} shadow-[0_0_10px_rgba(99,102,241,0.3)]`} 
            />
        </div>
    </div>
);

export const ProfilePage = () => {
    const { userProfile, updateUserProfile, favorites, searchHistory, priceAlerts } = useTrainStore();
    const { addToast } = useToastStore();
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ ...userProfile });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 md:p-10 overflow-y-auto">
            <header className="mb-10">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Cuenta</div>
                <h1 className="text-3xl font-black tracking-tight">Mi Perfil</h1>
                <p className="text-[var(--text-muted)] text-sm mt-1.5">Personaliza tu experiencia en EasyTrain.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Stats */}
                <div className="flex flex-col gap-4">
                    {/* Avatar card */}
                    <div className="glass-card p-8 flex flex-col items-center text-center gap-4">
                        <div className="text-7xl">{form.avatar}</div>
                        <div>
                            <div className="font-black text-xl text-white flex items-center gap-2 justify-center">
                                {form.name || 'Viajero'}
                                {userProfile.isRegistered ? (
                                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center" title="Usuario Registrado">
                                        <Save size={10} className="text-white" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center" title="Registro Pendiente">
                                        <Mail size={10} className="text-amber-500" />
                                    </div>
                                )}
                            </div>
                            <div className="text-sm text-[var(--text-muted)] mt-0.5">{form.email || 'Sin email'}</div>
                            {!userProfile.isRegistered && (
                                <div className="mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                    Registro requerido para reservar
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {AVATARS.map(a => (
                                <button
                                    key={a}
                                    onClick={() => setForm(f => ({ ...f, avatar: a }))}
                                    className={`text-2xl p-2 rounded-xl transition-all ${form.avatar === a ? 'bg-indigo-500/20 ring-1 ring-indigo-400/40' : 'hover:bg-white/5'}`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-card p-6 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-black text-white">{favorites.length}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">Favoritos</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{searchHistory.length}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">Búsquedas</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{priceAlerts.length}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">Alertas</div>
                        </div>
                    </div>
                </div>

                {/* Right: Edit Form & Advanced Stats */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="glass-card p-8 flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
                                    <User size={10} /> Nombre
                                </label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Tu nombre"
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
                                    <Mail size={10} /> Email
                                </label>
                                <input
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="tu@email.com"
                                    type="email"
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
                                    <Globe size={10} /> País
                                </label>
                                <select
                                    value={form.country}
                                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                                    className="glass-input"
                                >
                                    {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#0d0f1a' }}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
                                    <CreditCard size={10} /> Moneda
                                </label>
                                <select
                                    value={form.currency}
                                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                                    className="glass-input"
                                >
                                    {CURRENCIES.map(c => <option key={c} value={c} style={{ background: '#0d0f1a' }}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="text-xs text-[var(--text-muted)]">
                                {userProfile.isRegistered 
                                    ? "Tus datos están sincronizados correctamente." 
                                    : "Completa tu nombre y email para habilitar las reservas."}
                            </div>
                            <motion.button
                                onClick={() => {
                                    const isValid = form.name.trim() !== '' && form.email.trim() !== '';
                                    if (!isValid) {
                                        addToast('Nombre y Email son obligatorios para registrarse', 'error');
                                        return;
                                    }
                                    updateUserProfile({ ...form, isRegistered: true });
                                    setSaved(true);
                                    addToast('¡Registro completado! Ya puedes reservar tus viajes.', 'success');
                                    setTimeout(() => setSaved(false), 2500);
                                }}
                                whileTap={{ scale: 0.97 }}
                                className={`btn-primary text-sm transition-all ${saved ? '!bg-green-600 !shadow-green-500/20' : ''} ${!userProfile.isRegistered ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0d0f1a]' : ''}`}
                            >
                                <Save size={15} />
                                {userProfile.isRegistered ? (saved ? '¡Guardado!' : 'Actualizar') : 'Registrarse Ahora'}
                            </motion.button>
                        </div>
                    </div>

                    <div className="glass-card p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Medallas de Viajero</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Medal icon="🏅" title="Pionero" desc="Primeras 10 rutas" achieved />
                            <Medal icon="🌱" title="Eco-Viajero" desc="100kg CO2 ahorrado" achieved />
                            <Medal icon="⚡" title="Ahorrador" desc="Ahorra >20% en 5 rutas" />
                            <Medal icon="👑" title="Embajador" desc="Invita a 3 amigos" />
                        </div>
                    </div>

                    <div className="glass-card p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Estadísticas de Impacto</h3>
                        <div className="space-y-6">
                            <StatProgress label="Kilómetros Recorridos" value={1240} max={5000} unit="km" color="bg-indigo-500" />
                            <StatProgress label="CO2 Ahorrado" value={45} max={100} unit="kg" color="bg-green-500" />
                            <StatProgress label="Tiempo en Tren" value={18} max={50} unit="h" color="bg-amber-500" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
