import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, CheckCircle, TrendingDown, X } from 'lucide-react';
import { useTrainStore } from '../store/useTrainStore';
import { fetchStations } from '../lib/api';
import type { Station } from '../types';

// Simple station search mini-component for the form
const MiniStationSearch = ({ placeholder, onSelect }: { placeholder: string; onSelect: (s: Station) => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Station[]>([]);

    const handleChange = async (val: string) => {
        setQuery(val);
        if (val.length < 2) { setResults([]); return; }
        const stations = await fetchStations(val);
        setResults(stations.slice(0, 5));
    };

    return (
        <div className="relative">
            <input
                value={query}
                onChange={e => handleChange(e.target.value)}
                placeholder={placeholder}
                className="glass-input text-sm"
            />
            {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 shadow-2xl" style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {results.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { onSelect(s); setQuery(s.name); setResults([]); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-500/10 transition-colors border-b border-white/5 last:border-0"
                        >
                            <div className="font-semibold text-white">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.country}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const PriceAlertsPage = () => {
    const { priceAlerts, addPriceAlert, removePriceAlert } = useTrainStore();
    const [from, setFrom] = useState<Station | null>(null);
    const [to, setTo] = useState<Station | null>(null);
    const [targetPrice, setTargetPrice] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleCreate = () => {
        if (!from || !to || !targetPrice) return;
        addPriceAlert({
            fromStationId: from.id,
            fromStationName: from.name,
            toStationId: to.id,
            toStationName: to.name,
            targetPrice: parseFloat(targetPrice),
        });
        setFrom(null);
        setTo(null);
        setTargetPrice('');
        setShowForm(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 md:p-10 overflow-y-auto">
            <header className="flex justify-between items-start mb-10">
                <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Notificaciones</div>
                    <h1 className="text-3xl font-black tracking-tight">Alertas de Precio</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1.5">
                        Te avisaremos cuando el precio baje del umbral que elijas.
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                    <Plus size={16} /> Nueva Alerta
                </button>
            </header>

            {/* Create Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-8 w-full max-w-md mx-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black">Nueva Alerta</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 block mb-1.5">Origen</label>
                                <MiniStationSearch placeholder="Ej: Madrid" onSelect={setFrom} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 block mb-1.5">Destino</label>
                                <MiniStationSearch placeholder="Ej: Paris" onSelect={setTo} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 block mb-1.5">Precio Objetivo (€)</label>
                                <input
                                    type="number"
                                    value={targetPrice}
                                    onChange={e => setTargetPrice(e.target.value)}
                                    placeholder="Ej: 45"
                                    className="glass-input text-sm"
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!from || !to || !targetPrice}
                                className="btn-primary w-full"
                            >
                                <Bell size={16} /> Crear Alerta
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Alerts List */}
            {priceAlerts.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="text-5xl mb-4">🔔</div>
                    <div className="font-bold text-white text-lg mb-2">Sin alertas activas</div>
                    <div className="text-sm text-[var(--text-muted)]">Crea una alerta y te avisaremos cuando el precio caiga.</div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {priceAlerts.map(alert => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass-card p-5 flex items-center justify-between gap-4 ${alert.triggered ? 'border-green-500/30' : 'border-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${alert.triggered ? 'bg-green-500/15 text-green-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                    {alert.triggered ? <CheckCircle size={22} /> : <TrendingDown size={22} />}
                                </div>
                                <div>
                                    <div className="font-black text-white text-sm flex items-center gap-2">
                                        {alert.fromStationName} → {alert.toStationName}
                                        {alert.triggered && (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                                                ¡Bajó!
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                        Objetivo: <span className="text-indigo-400 font-bold">{alert.targetPrice} €</span> · Creada {new Date(alert.createdAt).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removePriceAlert(alert.id)}
                                className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/15"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};
