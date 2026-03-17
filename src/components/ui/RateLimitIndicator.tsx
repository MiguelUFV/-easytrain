import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Gauge } from 'lucide-react';
import { routeLimiter, stationLimiter } from '../../lib/rateLimit';

/**
 * Compact indicator that shows remaining API calls.
 * When rate limited, shows a countdown timer.
 */
export const RateLimitIndicator = () => {
    const [routeRemaining, setRouteRemaining] = useState(routeLimiter.remaining());
    const [stationRemaining, setStationRemaining] = useState(stationLimiter.remaining());
    const [countdown, setCountdown] = useState(0);

    const refresh = useCallback(() => {
        setRouteRemaining(routeLimiter.remaining());
        setStationRemaining(stationLimiter.remaining());
        const routeWait = routeLimiter.secondsUntilNext();
        const stationWait = stationLimiter.secondsUntilNext();
        setCountdown(Math.max(routeWait, stationWait));
    }, []);

    // Poll every second when rate limited, every 5s otherwise
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, countdown > 0 ? 1000 : 5000);
        return () => clearInterval(interval);
    }, [countdown > 0, refresh]);

    const isRouteLimited = routeRemaining === 0;
    const isStationLimited = stationRemaining === 0;
    const isLimited = isRouteLimited || isStationLimited;
    const routeUsed = routeLimiter.limit - routeRemaining;
    const showUsage = routeUsed >= 3; // Only show after 3+ searches

    if (!showUsage && !isLimited) return null;

    return (
        <AnimatePresence>
            {/* Rate limited banner */}
            {isLimited && countdown > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                >
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-amber-400">
                                Limite de busquedas alcanzado
                            </div>
                            <div className="text-xs text-amber-500/70 mt-0.5">
                                {isRouteLimited
                                    ? 'Maximo 10 busquedas de rutas por minuto.'
                                    : 'Maximo 20 busquedas de estaciones por minuto.'}
                                {' '}Espera para continuar.
                            </div>
                        </div>
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="relative w-12 h-12">
                                {/* Countdown circle */}
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(245,158,11,0.1)" strokeWidth="3" />
                                    <circle
                                        cx="24" cy="24" r="20"
                                        fill="none" stroke="#f59e0b" strokeWidth="3"
                                        strokeDasharray={`${(countdown / 60) * 125.6} 125.6`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-black text-amber-400">{countdown}s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Compact usage indicator (non-blocking) */}
            {showUsage && !isLimited && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-3"
                >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/3 border border-white/5 w-fit">
                        <Gauge size={12} className="text-gray-500" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Busquedas</span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: routeLimiter.limit }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                            i < routeUsed
                                                ? routeRemaining <= 2
                                                    ? 'bg-amber-400'
                                                    : 'bg-indigo-400'
                                                : 'bg-white/10'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className={`text-[10px] font-black ${
                                routeRemaining <= 2 ? 'text-amber-400' : 'text-gray-500'
                            }`}>
                                {routeRemaining}/{routeLimiter.limit}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
