import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CreditCard, ChevronDown, Check, Globe } from 'lucide-react';
import type { Route, BookingPlatform } from '../../types';
import {
    getBestPlatform, openBooking, openOfficialBooking,
    routeToBookingParams, detectOperatorKey, getOfficialUrl
} from '../../lib/booking';
import { useTrainStore } from '../../store/useTrainStore';
import { useToastStore } from './Toast';
import { analytics } from '../../lib/analytics';

interface BookingButtonProps {
    route: Route;
    date?: string;
    passengers?: number;
    compact?: boolean;
    className?: string;
}

/** Nombres amigables para cada operador */
const OPERATOR_LABELS: Record<string, string> = {
    db: 'Deutsche Bahn', sncf: 'SNCF', tgv: 'SNCF TGV', ouigo: 'Ouigo',
    renfe: 'Renfe', ave: 'Renfe AVE', trenitalia: 'Trenitalia', italo: 'Italo',
    oebb: 'ÖBB', obb: 'ÖBB', sbb: 'SBB', cff: 'SBB', ffs: 'SBB',
    nmbs: 'NMBS/SNCB', sncb: 'NMBS/SNCB', ns: 'NS', eurostar: 'Eurostar',
    flixtrain: 'FlixTrain', flix: 'FlixTrain', cd: 'ČD', pkp: 'PKP',
    regiojet: 'RegioJet', sj: 'SJ', cp: 'CP', hellenic: 'Hellenic Train',
};

export const BookingButton: React.FC<BookingButtonProps> = ({
    route,
    date,
    passengers = 1,
    compact = false,
    className = '',
}) => {
    const { trackBookingClick } = useTrainStore();
    const { addToast } = useToastStore();
    const [showDropdown, setShowDropdown] = useState(false);

    const defaultPlatform = getBestPlatform(route.operator);
    const [selectedPlatform, setSelectedPlatform] = useState<BookingPlatform>(defaultPlatform);

    const params = routeToBookingParams(route, date);
    params.passengers = passengers;

    // Detectar si hay web oficial del operador
    const operatorKey = detectOperatorKey(route.operator);
    const officialUrl = getOfficialUrl(params);
    const operatorLabel = operatorKey ? (OPERATOR_LABELS[operatorKey] ?? route.operator) : null;

    const track = (platform: string) => {
        trackBookingClick({
            routeId: route.id,
            platform: platform as BookingPlatform,
            fromCity: params.fromCity,
            toCity: params.toCity,
        });
        analytics.clickBooking({
            platform: platform,
            origin: params.fromCity,
            destination: params.toCity,
            operator: route.operator,
            price: route.price,
            currency: 'EUR'
        });
    };

    const handleOfficial = () => {
        track(operatorKey ?? 'official');
        const opened = openOfficialBooking(params);
        if (opened) {
            addToast(`Abriendo ${operatorLabel ?? 'web oficial'}...`, 'success');
        } else {
            addToast('No se encontró web oficial. Usando plataforma alternativa.', 'info');
            handlePlatform(selectedPlatform);
        }
        setShowDropdown(false);
    };

    const handlePlatform = (platform: BookingPlatform = selectedPlatform) => {
        track(platform);
        openBooking(params, platform);
        addToast(`Abriendo ${platform === 'trainline' ? 'Trainline' : 'Omio'}...`, 'success');
        setShowDropdown(false);
    };

    const platforms: { id: BookingPlatform; name: string; color: string }[] = [
        { id: 'trainline', name: 'Trainline', color: '#00a550' },
        { id: 'omio',      name: 'Omio',      color: '#1a2d8f' },
    ];

    // ─── Modo compacto ───────────────────────────────────────────────────────

    if (compact) {
        return (
            <div className={`relative flex items-center gap-1.5 ${className}`} onClick={e => e.stopPropagation()}>
                {officialUrl && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOfficial}
                        title={`Reservar en ${operatorLabel}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                    >
                        <Globe size={12} />
                        <span>{operatorLabel}</span>
                        <ExternalLink size={10} className="opacity-60" />
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlatform()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                    <CreditCard size={12} />
                    <span>{officialUrl ? 'Alternativa' : 'Reservar'}</span>
                    <ExternalLink size={10} className="opacity-60" />
                </motion.button>
            </div>
        );
    }

    // ─── Modo completo ───────────────────────────────────────────────────────

    return (
        <div className={`space-y-2 ${className}`} onClick={e => e.stopPropagation()}>

            {/* Botón oficial del operador (si existe) */}
            {officialUrl && (
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOfficial}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-500/20 border border-blue-400/20"
                >
                    <Globe size={18} />
                    <span>RESERVAR EN {(operatorLabel ?? route.operator).toUpperCase()}</span>
                    <ExternalLink size={16} className="opacity-60" />
                </motion.button>
            )}

            {/* Plataformas intermediarias */}
            <div className="relative flex items-stretch gap-0.5">
                <motion.button
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlatform()}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-white font-black text-sm transition-all shadow-xl ${
                        officialUrl
                            ? 'bg-white/5 hover:bg-white/10 rounded-l-2xl border border-white/10 shadow-none'
                            : 'bg-emerald-500 hover:bg-emerald-600 rounded-l-2xl shadow-emerald-500/20'
                    }`}
                >
                    <CreditCard size={18} />
                    <span className={officialUrl ? 'text-gray-300' : ''}>
                        {officialUrl ? `También en ${selectedPlatform === 'trainline' ? 'Trainline' : 'Omio'}` : `RESERVAR EN ${selectedPlatform.toUpperCase()}`}
                    </span>
                    <ExternalLink size={16} className="opacity-60" />
                </motion.button>

                <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Elegir plataforma de reserva"
                    aria-expanded={showDropdown}
                    className={`px-3 text-white rounded-r-2xl border-l border-white/10 transition-all flex items-center justify-center ${
                        officialUrl
                            ? 'bg-white/5 hover:bg-white/10'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                >
                    <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
                    />
                </motion.button>

                {/* Dropdown de plataformas */}
                <AnimatePresence>
                    {showDropdown && (
                        <>
                            <div className="fixed inset-0 z-[1001]" onClick={() => setShowDropdown(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full mb-3 right-0 w-60 z-[1002] glass-card p-2 overflow-hidden"
                                style={{ background: 'rgba(10, 15, 12, 0.97)', backdropFilter: 'blur(20px)' }}
                            >
                                <div className="px-3 py-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 mb-1">
                                    Elige plataforma
                                </div>

                                {/* Opción oficial si existe */}
                                {officialUrl && (
                                    <button
                                        onClick={handleOfficial}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-all mb-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Globe size={12} />
                                            {operatorLabel ?? 'Web oficial'}
                                        </div>
                                        <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full">Recomendado</span>
                                    </button>
                                )}

                                {platforms.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPlatform(p.id); handlePlatform(p.id); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            selectedPlatform === p.id
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full border border-white/20" style={{ background: p.color }} />
                                            {p.name}
                                        </div>
                                        {selectedPlatform === p.id && <Check size={14} />}
                                    </button>
                                ))}

                                <div className="mt-2 px-3 py-2 bg-emerald-500/5 rounded-xl">
                                    <p className="text-[10px] text-emerald-500/60 leading-tight">
                                        Serás redirigido para completar el pago de forma segura en la web oficial.
                                    </p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
