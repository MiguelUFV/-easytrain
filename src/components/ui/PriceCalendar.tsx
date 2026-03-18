import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Props {
    toName: string;
    fromId: string;
    toId: string;
    onSelectDate: (date: string) => void;
    selectedDate: string;
}

// Simulación de precios un poco más realista basada en distancia/ruta
const simulatePrices = (fromId: string, toId: string, baseDate: Date): Record<string, number> => {
    const prices: Record<string, number> = {};
    // Semilla basada en la combinación de IDs para que sea estable
    const str = `${fromId}-${toId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    
    const basePrice = Math.abs(hash % 100) + 30; // Precio base entre 30€ y 130€
    
    for (let i = -7; i <= 21; i++) {
        const day = addDays(baseDate, i);
        const key = format(day, 'yyyy-MM-dd');
        
        const dayOfWeek = day.getDay();
        // Fines de semana y lunes son más caros
        const dayMult = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 1.4 : 1;
        
        // Ruido aleatorio estable
        const dayHash = Math.abs((hash + i * 149) % 20);
        const finalPrice = Math.round(basePrice * dayMult + dayHash);
        
        prices[key] = finalPrice;
    }
    return prices;
};

export const PriceCalendar = ({ toName, fromId, toId, onSelectDate, selectedDate }: Props) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const today = useMemo(() => new Date(), []);
    
    // Generar 14 días a partir de hoy + offset de semana
    const prices = useMemo(() => simulatePrices(fromId, toId, today), [fromId, toId]);
    const displayDays = useMemo(() => {
        const start = addDays(today, weekOffset * 7);
        return Array.from({ length: 14 }, (_, i) => addDays(start, i));
    }, [today, weekOffset]);

    const priceValues = displayDays.map(d => prices[format(d, 'yyyy-MM-dd')]).filter(p => p !== undefined);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);

    return (
        <div className="glass-card p-5 border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#d4a853]/10 flex items-center justify-center text-[#d4a853]">
                        <TrendingDown size={14} />
                    </div>
                    <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.1em] text-[#d4a853]/80">Calendario de Precios</div>
                        <h3 className="text-[11px] font-bold text-white leading-tight truncate max-w-[150px]">{toName}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setWeekOffset(w => w - 1)}
                        disabled={weekOffset <= 0}
                        className="p-1 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-all disabled:opacity-20"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => setWeekOffset(w => w + 1)}
                        className="p-1 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-[8px] font-black text-gray-600 pb-1">{d}</div>
                ))}
                {displayDays.map(day => {
                    const key = format(day, 'yyyy-MM-dd');
                    const price = prices[key];
                    const isMin = price === minPrice;
                    const isSelected = key === selectedDate;
                    const isPast = format(day, 'yyyy-MM-dd') < format(today, 'yyyy-MM-dd');
                    
                    const priceRange = maxPrice - minPrice;
                    const heatLevel = priceRange > 0 ? (price - minPrice) / priceRange : 0;

                    return (
                        <motion.button
                            key={key}
                            whileHover={!isPast ? { scale: 1.05, y: -2 } : {}}
                            whileTap={!isPast ? { scale: 0.95 } : {}}
                            onClick={() => !isPast && onSelectDate(key)}
                            disabled={isPast}
                            className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all aspect-square border ${
                                isSelected
                                    ? 'bg-[#d4a853] text-[#0a0f1c] border-[#d4a853] shadow-[0_0_15px_rgba(212,168,83,0.3)] z-10'
                                    : isMin && !isPast
                                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                                        : isPast
                                            ? 'opacity-10 border-transparent grayscale'
                                            : heatLevel > 0.7
                                                ? 'bg-red-500/5 border-red-500/10 hover:border-white/10'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            <span className={`text-[8px] font-bold ${isSelected ? 'text-[#0a0f1c]/70' : 'text-gray-500'}`}>
                                {format(day, 'd')}
                            </span>
                            {price && !isPast && (
                                <span className={`text-[10px] font-black mt-0.5 ${
                                    isSelected ? 'text-[#0a0f1c]' : isMin ? 'text-green-400' : heatLevel > 0.7 ? 'text-red-400/80' : 'text-gray-300'
                                }`}>
                                    {price}€
                                </span>
                            )}
                            {isMin && !isPast && !isSelected && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[var(--bg-dark)] shadow-sm" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 justify-between items-center bg-transparent">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Mejor Precio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4a853]" />
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Seleccionado</span>
                    </div>
                </div>
                <div className="text-[9px] font-bold text-gray-600">
                    Precios estimados orientativos
                </div>
            </div>
        </div>
    );
};
