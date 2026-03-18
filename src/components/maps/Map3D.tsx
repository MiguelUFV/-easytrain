import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EuropeMap } from './EuropeMap';
import { useTrainStore } from '../../store/useTrainStore';
import { Clock, Train, AlertCircle, Share2, Info, X, Plus, Euro, Calendar, Users, Link2, Trash2 } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { BookingButton } from '../ui/BookingButton';
import { routes as mockRoutes } from '../../lib/mockData';
import type { Route } from '../../types';

const formatChainDuration = (dep: string, arr: string): string => {
    const mins = differenceInMinutes(new Date(arr), new Date(dep));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const Map3D = () => {
    const { selectedRouteId, setSelectedRouteId, routes: searchResults, setInterrailRouteMode } = useTrainStore();

    // Express Chain state
    const [expressChain, setExpressChain] = useState<Route[]>([]);
    const [connectionMode, setConnectionMode] = useState(false);
    const [travelDate, setTravelDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [passengers, setPassengers] = useState(1);

    const activeRoute = searchResults.find(r => r.id === selectedRouteId)
        || mockRoutes.find(r => r.id === selectedRouteId)
        || null;

    // When entering the standalone map page, exit interrail route mode
    useEffect(() => {
        setInterrailRouteMode(false);
    }, [setInterrailRouteMode]);

    // Connected routes: routes whose origin matches the last chain destination
    const connectedRouteIds = useMemo(() => {
        if (!connectionMode || expressChain.length === 0) return new Set<string>();
        const lastDest = expressChain[expressChain.length - 1].toStationId;
        return new Set(
            mockRoutes
                .filter(r => r.fromStationId === lastDest && !expressChain.some(c => c.id === r.id))
                .map(r => r.id)
        );
    }, [connectionMode, expressChain]);

    // When a route is selected while in connection mode, add it to the chain
    useEffect(() => {
        if (!connectionMode || !activeRoute) return;
        if (connectedRouteIds.has(activeRoute.id)) {
            setExpressChain(prev => [...prev, activeRoute]);
            setSelectedRouteId(null);
        }
    }, [activeRoute, connectionMode, connectedRouteIds, setSelectedRouteId]);

    const handleAddConnection = useCallback(() => {
        if (!activeRoute) return;
        if (expressChain.length === 0) {
            setExpressChain([activeRoute]);
        }
        setConnectionMode(true);
        setSelectedRouteId(null);
    }, [activeRoute, expressChain.length, setSelectedRouteId]);

    const handleRemoveChainLeg = useCallback((index: number) => {
        // Remove this leg and all subsequent legs (chain breaks)
        setExpressChain(prev => prev.slice(0, index));
        if (index === 0) {
            setConnectionMode(false);
        }
    }, []);

    const handleClearChain = useCallback(() => {
        setExpressChain([]);
        setConnectionMode(false);
    }, []);

    const handleExitConnectionMode = useCallback(() => {
        setConnectionMode(false);
    }, []);

    // Chain totals
    const chainTotal = useMemo(() => {
        if (expressChain.length === 0) return { price: 0, duration: '' };
        const price = expressChain.reduce((sum, r) => sum + (r.price ?? 0), 0);
        const dep = expressChain[0].departureTime;
        const arr = expressChain[expressChain.length - 1].arrivalTime;
        return { price: Math.round(price * 100) / 100, duration: formatChainDuration(dep, arr) };
    }, [expressChain]);

    const isChainMode = expressChain.length > 0;
    const showSidebar = activeRoute || isChainMode;

    return (
        <div className="w-full h-[calc(100vh-5rem)] relative flex overflow-hidden bg-[#0a0a0c]">
            {/* Map Area */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 relative"
                style={{ minHeight: 0 }}
            >
                <div className="absolute inset-0">
                    <EuropeMap
                        connectionMode={connectionMode}
                        connectedRouteIds={connectedRouteIds}
                        expressChain={expressChain}
                    />
                </div>
            </motion.div>

            {/* Sidebar Area */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[400px] max-w-[90vw] h-full glass-card border-l border-white/10 z-[1001] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {isChainMode ? (
                                    <>
                                        <Link2 className="text-[#d4a853]" size={18} />
                                        Express Route ({expressChain.length} tramo{expressChain.length !== 1 ? 's' : ''})
                                    </>
                                ) : (
                                    <>
                                        <Info className="text-[#d4a853]" size={18} />
                                        Resumen del Viaje
                                    </>
                                )}
                            </h2>
                            <div className="flex gap-1.5">
                                {isChainMode && (
                                    <button
                                        onClick={handleClearChain}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                        aria-label="Limpiar ruta"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                {!isChainMode && activeRoute && (
                                    <button onClick={() => {
                                        const text = `${activeRoute.fromStationName ?? activeRoute.fromStationId} → ${activeRoute.toStationName ?? activeRoute.toStationId} · ${activeRoute.operator} · ${activeRoute.price != null ? activeRoute.price + '€' : 'N/A'}`;
                                        if (navigator.share) {
                                            navigator.share({ title: 'EasyTrain Ruta', text });
                                        } else {
                                            navigator.clipboard.writeText(text);
                                        }
                                    }} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                                        <Share2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedRouteId(null);
                                        if (isChainMode) handleClearChain();
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Date & Passengers selector */}
                        <div className="px-5 py-3 border-b border-white/5 flex gap-3">
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Calendar size={10} /> Fecha
                                </label>
                                <input
                                    type="date"
                                    value={travelDate}
                                    onChange={e => setTravelDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-medium focus:border-[#d4a853]/50 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Users size={10} /> Pasajeros
                                </label>
                                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setPassengers(p => Math.max(1, p - 1))}
                                        disabled={passengers <= 1}
                                        className="px-2 py-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                                        aria-label="Reducir pasajeros"
                                    >−</button>
                                    <span className="flex-1 text-center text-xs font-bold text-white">{passengers}</span>
                                    <button
                                        onClick={() => setPassengers(p => Math.min(4, p + 1))}
                                        disabled={passengers >= 4}
                                        className="px-2 py-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                                        aria-label="Aumentar pasajeros"
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                            {/* ═══ EXPRESS CHAIN VIEW ═══ */}
                            {isChainMode ? (
                                <>
                                    {/* Chain summary */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#d4a853]/10 border border-[#d4a853]/20">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-gray-300">
                                                <Clock size={14} />
                                                <span className="text-xs font-bold">{chainTotal.duration}</span>
                                            </div>
                                            <div className="w-px h-4 bg-white/10" />
                                            <div className="text-xs text-gray-400">
                                                {expressChain.length} tramo{expressChain.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-lg font-black text-[#d4a853]">
                                            {chainTotal.price}<Euro size={14} />
                                        </div>
                                    </div>

                                    {/* Chain timeline */}
                                    <div className="relative pl-7">
                                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#d4a853] via-[#d4a853]/30 to-green-500" />

                                        <div className="space-y-1">
                                            {expressChain.map((leg, idx) => {
                                                const isFirst = idx === 0;
                                                const isLast = idx === expressChain.length - 1;
                                                return (
                                                    <div key={`chain-${leg.id}-${idx}`} className="relative group">
                                                        {/* Origin dot */}
                                                        <div className={`absolute -left-[16px] top-3 w-4 h-4 rounded-full border-[3px] border-[#0a0a0c] z-10 ${
                                                            isFirst ? 'bg-[#d4a853] shadow-[0_0_10px_rgba(212,168,83,0.5)]' : 'bg-[#d4a853]/60'
                                                        }`} />

                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-[#d4a853] bg-[#d4a853]/15 px-1.5 py-0.5 rounded">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-gray-400">{leg.operator}</span>
                                                                    <span className="text-[9px] text-gray-600">{leg.type}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    {leg.price != null && (
                                                                        <span className="text-xs font-black text-white">{leg.price}€</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleRemoveChainLeg(idx)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-gray-600 hover:text-red-400 transition-all"
                                                                        aria-label="Eliminar tramo"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <div className="font-bold text-white truncate">{leg.fromStationName ?? leg.fromStationId}</div>
                                                                <span className="text-[#d4a853]">→</span>
                                                                <div className="font-bold text-white truncate">{leg.toStationName ?? leg.toStationId}</div>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                                                                <span>{format(new Date(leg.departureTime), 'HH:mm')} — {format(new Date(leg.arrivalTime), 'HH:mm')}</span>
                                                                <span>{formatChainDuration(leg.departureTime, leg.arrivalTime)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Connection indicator between legs */}
                                                        {!isLast && (
                                                            <div className="flex items-center gap-2 py-1 pl-3">
                                                                <div className="text-[9px] font-bold text-amber-400/60 uppercase tracking-wider flex items-center gap-1">
                                                                    <Link2 size={8} /> Conexión en {leg.toStationName ?? leg.toStationId}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Final destination dot (only on last leg) */}
                                                        {isLast && (
                                                            <div className="absolute -left-[16px] bottom-3 w-4 h-4 rounded-full bg-green-500 border-[3px] border-[#0a0a0c] z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Connection mode status */}
                                    {connectionMode && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-pulse">
                                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                                                Buscando conexión...
                                            </div>
                                            <p className="text-[11px] text-amber-400/70">
                                                Haz clic en una ruta brillante del mapa que salga de{' '}
                                                <strong className="text-amber-300">
                                                    {expressChain[expressChain.length - 1].toStationName ?? expressChain[expressChain.length - 1].toStationId}
                                                </strong>
                                            </p>
                                            <button
                                                onClick={handleExitConnectionMode}
                                                className="mt-2 text-[10px] text-gray-500 hover:text-white transition-colors underline"
                                            >
                                                Cancelar búsqueda
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : activeRoute ? (
                                /* ═══ SINGLE ROUTE VIEW ═══ */
                                <>
                                    {/* Header Info */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                                        <div className="w-12 h-12 rounded-xl bg-[#d4a853]/20 flex items-center justify-center text-[#d4a853]">
                                            <Train size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{activeRoute.operator}</div>
                                            <div className="text-xs text-gray-400">{activeRoute.type} · {activeRoute.lineName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">{activeRoute.price != null ? `${activeRoute.price} €` : 'N/A'}</div>
                                            <div className="text-[10px] text-[#d4a853] font-bold uppercase tracking-wider">Tarifa Base</div>
                                        </div>
                                    </div>

                                    {/* Journey Timeline */}
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <Clock size={14} />
                                            Itinerario del Viaje
                                        </h3>

                                        <div className="relative pl-8">
                                            <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#d4a853] via-[#d4a853]/50 to-[#d4a853] shadow-[0_0_10px_rgba(212,168,83,0.3)]" />

                                            <div className="space-y-10">
                                                {/* Departure */}
                                                <div className="relative">
                                                    <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-[#d4a853] border-4 border-[#0a0a0c] z-10 shadow-[0_0_15px_rgba(212,168,83,0.6)]" />
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-sm font-black text-white">{activeRoute.fromStationName ?? activeRoute.fromStationId}</div>
                                                            <div className="text-[10px] text-gray-400 uppercase font-bold mt-1">Salida · Andén {activeRoute.platform || '--'}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-[#d4a853] bg-[#d4a853]/10 px-2 py-1 rounded-md border border-[#d4a853]/20">
                                                            {format(new Date(activeRoute.departureTime), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Intermediate Stops */}
                                                {activeRoute.stops && activeRoute.stops.length > 0 ? (
                                                    activeRoute.stops.map((stop, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#d4a853]/40 border-2 border-[#0a0a0c] z-10 group-hover:bg-[#d4a853] transition-colors" />
                                                            <div className="flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                                                <div className="text-xs text-gray-300 font-medium">{stop.stationName}</div>
                                                                <div className="text-[11px] font-bold text-gray-500">
                                                                    {stop.arrivalTime ? format(new Date(stop.arrivalTime), 'HH:mm') : '--:--'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="relative py-2">
                                                        <div className="text-[10px] text-gray-500 font-bold italic ml-2">Servicio Directo / Sin paradas adicionales</div>
                                                    </div>
                                                )}

                                                {/* Arrival */}
                                                <div className="relative">
                                                    <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-green-500 border-4 border-[#0a0a0c] z-10 shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-sm font-black text-white">{activeRoute.toStationName ?? activeRoute.toStationId}</div>
                                                            <div className="text-[10px] text-gray-400 uppercase font-bold mt-1">Llegada · Final de trayecto</div>
                                                        </div>
                                                        <div className="text-sm font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-md border border-green-400/20">
                                                            {format(new Date(activeRoute.arrivalTime), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Occupancy Alert */}
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 shadow-inner">
                                        <AlertCircle size={18} className="text-amber-500 shrink-0" />
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Aviso de Ocupación</div>
                                            <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                                                Alta demanda detectada para este trayecto. Se recomienda reservar asiento con antelación para garantizar comodidad.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Footer actions */}
                        <div className="p-5 border-t border-white/5 bg-white/2 space-y-2">
                            {isChainMode ? (
                                <>
                                    {/* Buy all legs */}
                                    <div className="space-y-2">
                                        {expressChain.map((leg, idx) => (
                                            <BookingButton
                                                key={`book-${leg.id}-${idx}`}
                                                route={leg}
                                                date={travelDate}
                                                passengers={passengers}
                                                compact
                                                className="justify-center"
                                            />
                                        ))}
                                    </div>
                                    {/* Add another connection */}
                                    {!connectionMode && (
                                        <button
                                            onClick={() => setConnectionMode(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#d4a853]/10 hover:bg-[#d4a853]/20 border border-[#d4a853]/20 text-[#d4a853] font-bold text-sm transition-all"
                                        >
                                            <Plus size={16} />
                                            Añadir Conexión
                                        </button>
                                    )}
                                </>
                            ) : activeRoute ? (
                                <>
                                    <BookingButton route={activeRoute} date={travelDate} passengers={passengers} />
                                    <button
                                        onClick={handleAddConnection}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#d4a853]/10 hover:bg-[#d4a853]/20 border border-[#d4a853]/20 text-[#d4a853] font-bold text-sm transition-all"
                                    >
                                        <Plus size={16} />
                                        Añadir Conexión
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};
