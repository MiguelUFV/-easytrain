import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import { fetchRenfeAlerts, type RenfeAlert } from '../../lib/api';

interface Props {
    /** Si se pasa, solo muestra alertas que mencionen alguno de estos IDs de ruta */
    filterRouteIds?: string[];
    className?: string;
}

export function RenfeAlertsPanel({ filterRouteIds, className = '' }: Props) {
    const [alerts, setAlerts] = useState<RenfeAlert[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchRenfeAlerts();
            const filtered = filterRouteIds?.length
                ? data.filter(a =>
                    a.routeIds.length === 0 ||
                    a.routeIds.some(rid =>
                        filterRouteIds.some(f => rid.includes(f) || f.includes(rid))
                    )
                )
                : data;
            setAlerts(filtered.slice(0, 10)); // máximo 10 alertas visibles
            setLastUpdated(new Date());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // Actualizar cada 30 segundos
        const interval = setInterval(load, 30_000);
        return () => clearInterval(interval);
    }, []);

    if (dismissed || alerts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-xl border border-amber-500/20 bg-amber-950/20 backdrop-blur-sm overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-500/10">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span className="text-amber-300 text-sm font-medium flex-1">
                    Avisos Renfe en tiempo real
                    <span className="ml-2 text-amber-500/70 font-normal">
                        ({alerts.length} {alerts.length === 1 ? 'aviso' : 'avisos'})
                    </span>
                </span>
                <div className="flex items-center gap-1">
                    {lastUpdated && (
                        <span className="text-amber-600/50 text-xs">
                            {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        onClick={load}
                        disabled={loading}
                        className="p-1 rounded hover:bg-amber-500/10 transition-colors text-amber-500/60 hover:text-amber-400"
                        title="Actualizar"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-1 rounded hover:bg-amber-500/10 transition-colors text-amber-500/60 hover:text-amber-400"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 rounded hover:bg-amber-500/10 transition-colors text-amber-500/60 hover:text-amber-400"
                        title="Cerrar"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Alerts list */}
            <AnimatePresence>
                {expanded && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="divide-y divide-amber-500/[0.07] max-h-56 overflow-y-auto"
                    >
                        {alerts.map(alert => (
                            <li key={alert.id} className="px-4 py-3">
                                <p className="text-sm text-amber-100/80 leading-relaxed">
                                    {alert.text}
                                </p>
                                {alert.routeIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {alert.routeIds.slice(0, 4).map(rid => (
                                            <span
                                                key={rid}
                                                className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400/70 font-mono"
                                            >
                                                {rid}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
