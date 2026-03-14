import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    fromName: string;
    toName: string;
    fromId: string;
    toId: string;
    onSelectDate: (date: string) => void;
    selectedDate: string;
}

// Simulate price data for the week around a date
const simulatePrices = (fromId: string, toId: string, baseDate: Date): Record<string, number> => {
    const prices: Record<string, number> = {};
    const baseSeed = (fromId.length + toId.length) * 7;
    for (let i = -3; i <= 10; i++) {
        const day = addDays(baseDate, i);
        const key = format(day, 'yyyy-MM-dd');
        // Create pseudo-random but stable prices
        const dayOfWeek = day.getDay();
        const weekendMult = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
        const noise = ((baseSeed + i * 13) % 40) - 20;
        prices[key] = Math.max(25, Math.round((60 + noise) * weekendMult));
    }
    return prices;
};

export const PriceCalendar = ({ fromName, toName, fromId, toId, onSelectDate, selectedDate }: Props) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const today = useMemo(() => new Date(), []);
    const weekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
    // Memoizar: solo recalcular si cambian origen/destino
    const prices = useMemo(() => simulatePrices(fromId, toId, today), [fromId, toId, today]);

    const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));
    const priceValues = Object.values(prices);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Comparador de Precios</div>
                    <h3 className="font-black text-white">{fromName} → {toName}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekOffset(w => w - 1)}
                        disabled={weekOffset <= 0}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all disabled:opacity-30 border border-transparent hover:border-white/5"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-semibold text-[var(--text-muted)] w-28 text-center">
                        {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 13), "d MMM", { locale: es })}
                    </span>
                    <button
                        onClick={() => setWeekOffset(w => w + 1)}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/5"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pb-2">{d}</div>
                ))}
                {/* First week */}
                {days.slice(0, 7).map(day => {
                    const key = format(day, 'yyyy-MM-dd');
                    const price = prices[key];
                    const isMin = price === minPrice;
                    const isSelected = key === selectedDate;
                    const isPast = day < today;
                    const priceRange = maxPrice - minPrice;
                    const heatLevel = priceRange > 0 ? (price - minPrice) / priceRange : 0;
                    return (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => !isPast && onSelectDate(key)}
                            disabled={isPast}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all aspect-square border text-xs ${
                                isSelected
                                    ? 'bg-indigo-500/20 border-indigo-400/50 ring-1 ring-indigo-400/30'
                                    : isMin
                                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                                        : isPast
                                            ? 'opacity-25 cursor-not-allowed border-transparent'
                                            : heatLevel > 0.6
                                                ? 'bg-red-500/5 border-red-500/10 hover:bg-white/5'
                                                : 'border-transparent hover:bg-white/5'
                            }`}
                        >
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                {format(day, 'dd', { locale: es })}
                            </span>
                            {price && !isPast ? (
                                <span className={`text-[11px] font-black mt-0.5 ${isMin ? 'text-green-400' : isSelected ? 'text-indigo-300' : heatLevel > 0.6 ? 'text-red-400' : 'text-white'}`}>
                                    {price}€
                                </span>
                            ) : null}
                            {isMin && !isPast && (
                                <TrendingDown size={8} className="text-green-400 mt-0.5" />
                            )}
                        </motion.button>
                    );
                })}
                {/* Spacer for second row start */}
                {Array.from({ length: days.slice(0, 7)[0].getDay() === 0 ? 6 : days.slice(0, 7)[0].getDay() - 1 === -1 ? 0 : 0 }).map((_, i) => <div key={`sp-${i}`} />)}
                {/* Second week */}
                {days.slice(7, 14).map(day => {
                    const key = format(day, 'yyyy-MM-dd');
                    const price = prices[key];
                    const isMin = price === minPrice;
                    const isSelected = key === selectedDate;
                    const isPast = day < today;
                    const priceRange = maxPrice - minPrice;
                    const heatLevel = priceRange > 0 ? (price - minPrice) / priceRange : 0;
                    return (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => !isPast && onSelectDate(key)}
                            disabled={isPast}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all aspect-square border text-xs ${
                                isSelected
                                    ? 'bg-indigo-500/20 border-indigo-400/50 ring-1 ring-indigo-400/30'
                                    : isMin
                                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                                        : isPast
                                            ? 'opacity-25 cursor-not-allowed border-transparent'
                                            : heatLevel > 0.6
                                                ? 'bg-red-500/5 border-red-500/10 hover:bg-white/5'
                                                : 'border-transparent hover:bg-white/5'
                            }`}
                        >
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                {format(day, 'dd', { locale: es })}
                            </span>
                            {price && !isPast ? (
                                <span className={`text-[11px] font-black mt-0.5 ${isMin ? 'text-green-400' : isSelected ? 'text-indigo-300' : heatLevel > 0.6 ? 'text-red-400' : 'text-white'}`}>
                                    {price}€
                                </span>
                            ) : null}
                            {isMin && !isPast && (
                                <TrendingDown size={8} className="text-green-400 mt-0.5" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-[10px] font-semibold text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60 inline-block" /> Más barato
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40 inline-block" /> Más caro
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/60 inline-block" /> Seleccionado
                </span>
            </div>
        </div>
    );
};
