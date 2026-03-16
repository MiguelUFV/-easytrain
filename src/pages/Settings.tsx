import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Moon, Globe, CreditCard } from 'lucide-react';
import { useTrainStore } from '../store/useTrainStore';

export const Settings = () => {
    const { settings, updateSettings, userProfile } = useTrainStore();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-6 py-8"
        >
            <h1 className="text-3xl font-black mb-8">Configuración</h1>

            <div className="grid gap-6">
                <section className="glass-card p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Perfil de Usuario</h2>
                            <p className="text-sm text-gray-400">Gestiona tu información personal y preferencias.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SettingItem icon={<User size={18} />} title="Nombre" value={userProfile.name || 'Sin nombre'} />
                        <SettingItem icon={<Globe size={18} />} title="País" value={userProfile.country || 'Sin definir'} />
                        <SettingItem icon={<Moon size={18} />} title="Tema" value="Oscuro (Glassmorphism)" />
                    </div>
                </section>

                <section className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-6">Preferencias de Viaje</h2>
                    <div className="space-y-4">
                        <ToggleItem icon={<Bell size={18} />} title="Alertas de Precio" description="Recibe notificaciones cuando bajen los precios de tus rutas favoritas." checked={settings.priceAlerts} onChange={(v) => updateSettings({ priceAlerts: v })} />
                        <ToggleItem icon={<Shield size={18} />} title="Seguro de Viaje" description="Activar cobertura automática para todos los trayectos Interrail." checked={settings.travelInsurance} onChange={(v) => updateSettings({ travelInsurance: v })} />
                        <ToggleItem icon={<CreditCard size={18} />} title="Pago Rápido" description="Usar Apple Pay o Google Pay por defecto." checked={settings.quickPay} onChange={(v) => updateSettings({ quickPay: v })} />
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

interface SettingItemProps {
    icon: ReactNode;
    title: string;
    value: string;
}

const SettingItem = ({ icon, title, value }: SettingItemProps) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
            <div className="text-indigo-400">{icon}</div>
            <span className="font-semibold">{title}</span>
        </div>
        <span className="text-sm text-gray-400">{value}</span>
    </div>
);

interface ToggleItemProps {
    icon: ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

const ToggleItem = ({ icon, title, description, checked, onChange }: ToggleItemProps) => {
    return (
        <div className="flex items-start justify-between p-4 rounded-xl bg-white/5">
            <div className="flex gap-3">
                <div className="text-indigo-400 mt-1">{icon}</div>
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-xs text-gray-500 max-w-sm">{description}</div>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-500' : 'bg-gray-700'}`}
                aria-label={`${title}: ${checked ? 'activado' : 'desactivado'}`}
            >
                <motion.div
                    animate={{ x: checked ? 26 : 2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                />
            </button>
        </div>
    );
};
