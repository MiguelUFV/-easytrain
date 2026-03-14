import { motion, AnimatePresence } from 'framer-motion';
import { Train, Clock, ArrowRight, Euro, MapPin, AlertCircle, Heart, ChevronDown } from 'lucide-react';
import type { Route, Station } from '../types';
import { OccupancyIndicator } from './OccupancyIndicator';
import { ItineraryExporter } from './ItineraryExporter';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTrainStore } from '../store/useTrainStore';
import { useToastStore } from './Toast.tsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingButton } from './BookingButton';

interface Props {
    route: Route;
    fromStation: Station;
    toStation: Station;
    isSaving?: boolean;
}

const safeFormat = (dateStr: string | undefined, formatStr: string): string => {
    if (!dateStr) return '--:--';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '--:--';
        return format(date, formatStr, { locale: es });
    } catch {
        return '--:--';
    }
};

const formatDuration = (departureTime: string, arrivalTime: string): string => {
    try {
        const d = new Date(departureTime);
        const a = new Date(arrivalTime);
        if (isNaN(d.getTime()) || isNaN(a.getTime())) return 'Variable';
        const totalMinutes = differenceInMinutes(a, d);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes}m`;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } catch {
        return 'Variable';
    }
};

export const RouteCard = ({ route, fromStation, toStation, isSaving }: Props) => {
    const { favorites, toggleFavorite, selectedRouteId, setSelectedRouteId } = useTrainStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();
    const [showItinerary, setShowItinerary] = useState(false);
    const duration = formatDuration(route.departureTime, route.arrivalTime);
    const isFavorite = favorites.some(r => r.id === route.id);
    const isSelected = selectedRouteId === route.id;

    const handleCardClick = () => {
        setSelectedRouteId(route.id);
        navigate('/map');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.005, y: -1 }}
            onClick={handleCardClick}
            className={`glass-card p-5 cursor-pointer relative overflow-hidden transition-all ${
                isSelected
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                    : 'border-white/5 hover:border-white/10'
            } ${isSaving ? 'border-amber-400/30' : ''}`}
        >
            {isSaving && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 px-3 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest">
                    💰 Mejor Precio
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/15 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Train size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-base text-white">{route.operator}</h4>
                            {route.lineName && (
                                <span className="bg-indigo-500/10 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md font-black border border-indigo-500/15">
                                    {route.lineName}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-[var(--text-muted)] font-medium">{route.type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(route);
                            const wasFavorite = favorites.some(r => r.id === route.id);
                            addToast(wasFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', wasFavorite ? 'info' : 'success');
                        }}
                        className={`p-2 rounded-xl transition-all ${
                            isFavorite ? 'text-red-400 bg-red-400/10 border border-red-400/15' : 'text-gray-600 hover:bg-white/5 hover:text-gray-300 border border-transparent'
                        }`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-2xl font-black">
                            <span className="text-white">{route.price}</span>
                            <Euro size={18} className="text-indigo-400" />
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-semibold">por persona</div>
                    </div>
                </div>
            </div>

            {/* Times */}
            <div className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                        <MapPin size={10} /> {fromStation.name}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-black text-white">{safeFormat(route.departureTime, 'HH:mm')}</div>
                        {route.delay && route.delay > 0 && (
                            <div className="text-xs font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">+{route.delay}m</div>
                        )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {safeFormat(route.departureTime, 'd MMM')}
                        {route.platform && <span className="ml-2 text-indigo-400 font-bold">Andén {route.platform}</span>}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 px-2">
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                        <Clock size={10} /> {duration}
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <div className="w-10 h-px bg-gradient-to-r from-indigo-500 to-indigo-500/30" />
                        <motion.div
                            animate={{ x: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        >
                            <ArrowRight size={10} className="text-indigo-400" />
                        </motion.div>
                        <div className="w-10 h-px bg-gradient-to-r from-indigo-500/30 to-indigo-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                </div>

                <div className="flex-1 text-right">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1 justify-end font-semibold uppercase tracking-wider">
                        {toStation.name} <MapPin size={10} />
                    </div>
                    <div className="text-2xl font-black text-white">{safeFormat(route.arrivalTime, 'HH:mm')}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">{safeFormat(route.arrivalTime, 'd MMM')}</div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <OccupancyIndicator occupancy={route.occupancy || 0.4} />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowItinerary(!showItinerary);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-indigo-400/70 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                    >
                        {showItinerary ? 'Ocultar Paradas' : 'Ver Paradas'}
                        <ChevronDown size={13} className={`transition-transform ${showItinerary ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {route.delay && route.delay > 5 && (
                        <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wider bg-red-400/5 px-2 py-1 rounded-lg border border-red-400/10">
                            <AlertCircle size={11} /> Retraso
                        </div>
                    )}
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Abrir en mapa <ArrowRight size={10} />
                    </div>
                </div>
            </div>

            {/* Export / Booking buttons */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                    <BookingButton route={route} compact />
                </div>
                <ItineraryExporter route={route} fromName={fromStation.name} toName={toStation.name} />
            </div>

            <AnimatePresence>
                {showItinerary && route.stops && route.stops.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Paradas Intermedias</div>
                            {route.stops.map((stop, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
                                        {idx !== route.stops!.length - 1 && <div className="w-px flex-1 bg-white/10" />}
                                    </div>
                                    <div className="flex-1 pb-4 flex justify-between items-start">
                                        <div>
                                            <div className="text-xs font-bold text-white transition-colors group-hover:text-indigo-400">
                                                {stop.stationName}
                                            </div>
                                            {stop.platform && <div className="text-[10px] text-gray-500">Andén {stop.platform}</div>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-white">
                                                {safeFormat(stop.arrivalTime, 'HH:mm')}
                                            </div>
                                            {stop.delay && stop.delay > 0 && (
                                                <div className="text-[10px] text-red-400">+{stop.delay}'</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
