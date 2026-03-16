import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, QrCode, ArrowRight, Download, Share2, Train, Info, ExternalLink, ShoppingBag } from 'lucide-react';
import { useTrainStore } from '../store/useTrainStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TicketCard = ({ ticket, index }: { ticket: any, index: number }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative h-[280px] lg:h-[180px] w-full perspective-1000 group"
        >
            <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                className="relative w-full h-full preserve-3d cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden">
                    <div className="glass-card h-full w-full flex flex-col lg:flex-row overflow-hidden border-indigo-500/20 shadow-xl shadow-indigo-500/5 hover:border-indigo-500/40 transition-colors">
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <Train className="text-indigo-400" size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">{ticket.operator}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1 italic opacity-60">#{ticket.id}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-black border border-green-500/20 tracking-tighter">CONFIRMADO</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-gray-500 hover:text-white transition-colors" onClick={(e) => {
                                            e.stopPropagation();
                                            const text = `EasyTrain Billete ${ticket.id}\n${ticket.from} → ${ticket.to}\n${ticket.date} ${ticket.departure}-${ticket.arrival}\n${ticket.operator} · ${ticket.price} EUR`;
                                            const blob = new Blob([text], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `billete-${ticket.id}.txt`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}><Download size={14} /></button>
                                        <button className="p-1.5 text-gray-500 hover:text-white transition-colors" onClick={(e) => {
                                            e.stopPropagation();
                                            const text = `${ticket.from} → ${ticket.to} · ${ticket.date} · ${ticket.price} EUR`;
                                            if (navigator.share) {
                                                navigator.share({ title: `Billete ${ticket.id}`, text });
                                            } else {
                                                navigator.clipboard.writeText(text);
                                            }
                                        }}><Share2 size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-40 mb-1">Dpto.</div>
                                    <div className="text-lg font-black text-white truncate">{ticket.from}</div>
                                    <div className="text-xl font-black text-indigo-400 mt-0.5">{ticket.departure}</div>
                                </div>

                                <div className="flex flex-col items-center gap-1 opacity-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <div className="h-4 w-px bg-gradient-to-b from-indigo-500 to-transparent" />
                                    <ArrowRight size={14} className="text-indigo-400" />
                                </div>

                                <div className="flex-1 text-right">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-40 mb-1">Arr.</div>
                                    <div className="text-lg font-black text-white truncate">{ticket.to}</div>
                                    <div className="text-xl font-black text-indigo-400 mt-0.5">{ticket.arrival}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-2 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-indigo-400/60" />
                                    <span className="text-[10px] font-bold text-gray-300">{ticket.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-indigo-400/60" />
                                    <span className="text-[10px] font-bold text-gray-300">{ticket.seat}</span>
                                </div>
                            </div>
                        </div>

                        {/* Decoration line (Ticket Cut) */}
                        <div className="hidden lg:flex flex-col items-center justify-center px-4 relative bg-white/[0.01]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0a0a0c] -mt-3 border border-white/5" />
                            <div className="h-full border-r border-dashed border-white/10" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0a0a0c] -mb-3 border border-white/5" />
                        </div>

                        <div className="w-full lg:w-44 bg-white/[0.04] p-6 flex flex-col items-center justify-center gap-3 border-t lg:border-t-0 lg:border-l border-white/5 group-hover:bg-indigo-500/10 transition-colors">
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Click para info</div>
                            <div className="relative">
                                <QrCode size={72} className="text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest">{ticket.price} EUR</div>
                        </div>
                    </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="glass-card h-full w-full bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 border-indigo-400/30 p-8 flex flex-col justify-between items-center text-center shadow-2xl shadow-indigo-500/20">
                        <div className="w-full flex justify-between items-start border-b border-white/10 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-white/10">
                                    <Train size={16} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">EasyTrain Pass</div>
                                    <div className="text-[10px] font-black text-white">Socio #8829-X</div>
                                </div>
                            </div>
                            <div className="text-[9px] font-black text-white/50 tracking-[0.3em] mt-1">INFORMACIÓN DE VIAJE</div>
                        </div>

                        <div className="flex justify-between w-full py-2">
                            <div className="bg-white p-3 rounded-2xl shadow-2xl rotate-[-2deg]">
                                <QrCode size={110} className="text-gray-900" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center items-end gap-3 text-right">
                                <div>
                                    <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">WIFI A BORDO</div>
                                    <div className="text-sm font-black text-white">RED: EasyTrain_Free</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">PLATAFORMA</div>
                                    <div className="text-xl font-black text-white">Vía 12</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex justify-around gap-4 pt-4 border-t border-white/10">
                            <div className="flex flex-col items-center">
                                <Info size={14} className="text-indigo-300 mb-1" />
                                <div className="text-[8px] font-black text-indigo-200/50 tracking-widest">REQUISITOS</div>
                                <div className="text-xs font-bold text-white uppercase">DNI Requerido</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <Clock size={14} className="text-indigo-300 mb-1" />
                                <div className="text-[8px] font-black text-indigo-200/50 tracking-widest">EMBARQUE</div>
                                <div className="text-xs font-bold text-white uppercase">15m antes</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <MapPin size={14} className="text-indigo-300 mb-1" />
                                <div className="text-[8px] font-black text-indigo-200/50 tracking-widest">ZONA</div>
                                <div className="text-xs font-bold text-white uppercase">Coche {ticket.seat.split(',')[0].slice(-1)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const safeTime = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), 'HH:mm');
    } catch {
        return '--:--';
    }
};

const safeDate = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), 'd MMM, yyyy', { locale: es });
    } catch {
        return dateStr;
    }
};

export const TicketsPage = () => {
    const { bookingClicks, searchHistory } = useTrainStore();

    const tickets = bookingClicks.map((click, i) => ({
        id: click.id || `T-${i}`,
        from: click.fromCity,
        to: click.toCity,
        date: safeDate(click.timestamp),
        departure: safeTime(click.timestamp),
        arrival: safeTime(new Date(new Date(click.timestamp).getTime() + 2 * 60 * 60 * 1000).toISOString()), // Mock arrival +2h
        seat: `Coche ${(i % 8) + 1}, Asiento ${(i * 3 + 1)}A`,
        operator: click.platform === 'trainline' ? 'The Trainline' : 'Omio',
        type: 'Standard',
        price: 24.90, // Mock price
        status: 'upcoming' as const,
    }));

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex-1 p-8 md:p-12 overflow-y-auto"
        >
            <header className="mb-12 relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full -z-10" />
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Tu Colección de Viajes</div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Ticket className="text-indigo-400" size={24} />
                    </div>
                    Mis Billetes
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-3 max-w-lg leading-relaxed">
                    Gestiona tus reservas activas, visualiza códigos QR de embarque y revisa tu historial de viajes por toda Europa.
                </p>
            </header>

            <div className="space-y-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Próximos Trayectos</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {tickets.length > 0 ? tickets.map((ticket, i) => (
                            <TicketCard key={ticket.id} ticket={ticket} index={i} />
                        )) : (
                            <div className="col-span-full text-center py-10 glass-card border-dashed opacity-40">
                                <Ticket className="mx-auto mb-2 text-gray-600" size={24} />
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Guarda rutas en favoritos para verlas como billetes</p>
                            </div>
                        )}
                    </div>
                </section>
                
                <section className="mt-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Historial de Reservas (Afiliados)</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    {bookingClicks && bookingClicks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookingClicks.map(click => (
                                <div key={click.id} className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5 group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white italic">
                                                {click.fromCity} <ArrowRight size={10} className="inline mx-1 text-emerald-400" /> {click.toCity}
                                            </div>
                                            <div className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-widest mt-1">
                                                {click.platform.toUpperCase()} · {format(new Date(click.timestamp), 'd MMM, HH:mm', { locale: es })}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => window.open(click.platform === 'trainline' ? 'https://www.thetrainline.com' : 'https://www.omio.com', '_blank')}
                                        className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all opacity-40 group-hover:opacity-100"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 glass-card border-dashed opacity-30">
                            <ShoppingBag className="mx-auto mb-2 text-gray-600" size={24} />
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No hay reservas recientes</p>
                        </div>
                    )}
                </section>

                <section className="mt-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Historial</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchHistory.length > 0 ? searchHistory.slice(0, 6).map(entry => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="glass-card p-5 flex items-center justify-between opacity-50 hover:opacity-100 transition-all border-dashed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/5">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white italic">{entry.fromName} <ArrowRight size={10} className="inline mx-1 text-indigo-400" /> {entry.toName}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Buscado · {safeDate(entry.timestamp)}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="col-span-full text-center py-8 glass-card border-dashed opacity-30">
                                <Clock className="mx-auto mb-2 text-gray-600" size={24} />
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Sin historial de búsquedas</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </motion.div>
    );
};
