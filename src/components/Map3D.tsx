import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EuropeMap } from './EuropeMap';
import { useTrainStore } from '../store/useTrainStore';
import { Clock, Train, AlertCircle, Share2, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { BookingButton } from './BookingButton';

export const Map3D = () => {
    const { selectedRouteId, setSelectedRouteId, routes: searchResults, setInterrailRouteMode } = useTrainStore();
    const activeRoute = searchResults.find(r => r.id === selectedRouteId);

    // When entering the standalone map page, exit interrail route mode
    useEffect(() => {
        setInterrailRouteMode(false);
    }, [setInterrailRouteMode]);

    return (
        <div className="w-full h-full relative flex overflow-hidden bg-[#0a0a0c]">
            {/* Map Area */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 relative h-full"
            >
                <EuropeMap />
            </motion.div>

            {/* Sidebar Area */}
            <AnimatePresence>
                {activeRoute && (
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[400px] h-full glass-card border-l border-white/10 z-[1001] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Info className="text-indigo-400" size={20} />
                                Resumen del Viaje
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={() => setSelectedRouteId(null)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {/* Header Info */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Train size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{activeRoute.operator}</div>
                                    <div className="text-xs text-gray-400">{activeRoute.type} · {activeRoute.lineName}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-white">{activeRoute.price} €</div>
                                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Tarifa Base</div>
                                </div>
                            </div>

                            {/* Unified Journey Timeline */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Clock size={14} />
                                    Itinerario del Viaje
                                </h3>

                                <div className="relative pl-8">
                                    <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-500/50 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />

                                    <div className="space-y-10">
                                        {/* Departure Point */}
                                        <div className="relative">
                                            <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-indigo-500 border-4 border-[#0a0a0c] z-10 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm font-black text-white">{activeRoute.fromStationName ?? activeRoute.fromStationId}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-bold mt-1">Salida · Andén {activeRoute.platform || '--'}</div>
                                                </div>
                                                <div className="text-sm font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md border border-indigo-400/20">
                                                    {format(new Date(activeRoute.departureTime), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Intermediate Stops */}
                                        {activeRoute.stops && activeRoute.stops.length > 0 ? (
                                            activeRoute.stops.map((stop, idx) => (
                                                <div key={idx} className="relative group">
                                                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-500/40 border-2 border-[#0a0a0c] z-10 group-hover:bg-indigo-400 transition-colors" />
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

                                        {/* Final Arrival Point */}
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

                            {/* Alert/Status */}
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 shadow-inner">
                                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Aviso de Ocupación</div>
                                    <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                                        Alta demanda detectada para este trayecto. Se recomienda reservar asiento con antelación para garantizar comodidad.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/2">
                            <BookingButton route={activeRoute} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};
