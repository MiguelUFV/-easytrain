import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, ArrowRight, Search } from 'lucide-react';
import { useTrainStore } from '../../store/useTrainStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    onSelect: (fromId: string, fromName: string, toId: string, toName: string, date: string) => void;
}

export const SearchHistoryPanel = ({ onSelect }: Props) => {
    const { searchHistory } = useTrainStore();

    if (searchHistory.length === 0) return null;

    return (
        <div className="glass-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-[var(--text-muted)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Búsquedas Recientes</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                    {searchHistory.slice(0, 6).map(entry => (
                        <motion.button
                            key={entry.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => onSelect(entry.fromId, entry.fromName, entry.toId, entry.toName, entry.date)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group text-sm"
                        >
                            <Clock size={12} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
                            <span className="font-semibold text-white text-xs">{entry.fromName}</span>
                            <ArrowRight size={10} className="text-[var(--text-muted)]" />
                            <span className="font-semibold text-white text-xs">{entry.toName}</span>
                            {entry.date && (
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                    · {format(new Date(entry.date), 'd MMM', { locale: es })}
                                </span>
                            )}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const SearchHistoryPage = () => {
    const { searchHistory } = useTrainStore();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 md:p-10 overflow-y-auto">
            <header className="mb-10">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Actividad</div>
                <h1 className="text-3xl font-black tracking-tight">Historial de Búsquedas</h1>
                <p className="text-[var(--text-muted)] text-sm mt-1.5">Tus últimas rutas buscadas.</p>
            </header>

            {searchHistory.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="text-5xl mb-4">🔎</div>
                    <div className="font-bold text-white text-lg mb-2">Sin historial</div>
                    <div className="text-sm text-[var(--text-muted)]">Cuando busques rutas aparecerán aquí.</div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {searchHistory.map((entry: any, idx: number) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="glass-card p-5 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                                    <Search size={18} />
                                </div>
                                <div>
                                    <div className="font-black text-white flex items-center gap-2 text-sm">
                                        {entry.fromName}
                                        <ArrowRight size={14} className="text-[var(--text-muted)]" />
                                        {entry.toName}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {entry.date && format(new Date(entry.date), 'd MMMM yyyy', { locale: es })} · {format(new Date(entry.timestamp), 'HH:mm', { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};
