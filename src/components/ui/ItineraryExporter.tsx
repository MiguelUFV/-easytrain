import { motion } from 'framer-motion';
import { Download, Share2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Route } from '../../types';

interface Props {
    route: Route;
    fromName: string;
    toName: string;
}

const BOOKING_URLS: Record<string, string> = {
    'DB': 'https://www.bahn.de',
    'ICE': 'https://www.bahn.de',
    'RENFE': 'https://www.renfe.com',
    'SNCF': 'https://www.sncf-connect.com',
    'EuroStar': 'https://www.eurostar.com',
    'Thalys': 'https://www.thalys.com',
    'default': 'https://www.trainline.com',
};

const getBookingUrl = (operator: string) => {
    const key = Object.keys(BOOKING_URLS).find(k => operator.toLowerCase().includes(k.toLowerCase()));
    return key ? BOOKING_URLS[key] : BOOKING_URLS['default'];
};

export const ItineraryExporter = ({ route, fromName, toName }: Props) => {
    const dep = new Date(route.departureTime);
    const arr = new Date(route.arrivalTime);
    const durationMs = arr.getTime() - dep.getTime();
    const durationH = Math.floor(durationMs / 3600000);
    const durationM = Math.floor((durationMs % 3600000) / 60000);
    const bookingUrl = getBookingUrl(route.operator);

    const exportText = () => {
        const text = [
            `🚆 ITINERARIO EASYTRAIN`,
            ``,
            `${fromName} → ${toName}`,
            `Fecha: ${format(dep, "d 'de' MMMM yyyy", { locale: es })}`,
            ``,
            `Salida:  ${format(dep, 'HH:mm')} - ${fromName}${route.platform ? ` (Andén ${route.platform})` : ''}`,
            `Llegada: ${format(arr, 'HH:mm')} - ${toName}`,
            `Duración: ${durationH}h ${durationM}m`,
            ``,
            `Operador: ${route.operator}`,
            route.lineName ? `Línea: ${route.lineName}` : '',
            `Tipo: ${route.type}`,
            route.price ? `Precio estimado: ${route.price} €` : '',
            ``,
            route.stops && route.stops.length > 0
                ? [`Paradas:`, ...route.stops.map((s: any) => `  · ${s.stationName} - ${s.arrivalTime ? format(new Date(s.arrivalTime), 'HH:mm') : '--:--'}`)].join('\n')
                : 'Servicio directo',
            ``,
            `Reservar: ${bookingUrl}`,
            ``,
            `Generado con EasyTrain 🚆`,
        ].filter(Boolean).join('\n');

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `easytrain-${fromName.replace(/\s/g, '-')}-${toName.replace(/\s/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const shareItinerary = async () => {
        const text = `🚆 ${fromName} → ${toName}\nSalida: ${format(dep, 'HH:mm')} · Llegada: ${format(arr, 'HH:mm')}\n${route.price ? `Precio: ${route.price}€` : ''}\nReservar: ${bookingUrl}`;
        if (navigator.share) {
            await navigator.share({ title: `Trayecto ${fromName} → ${toName}`, text });
        } else {
            await navigator.clipboard.writeText(text);
            alert('¡Copiado al portapapeles!');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={exportText}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
                <Download size={13} /> Exportar
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={shareItinerary}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
                <Share2 size={13} /> Compartir
            </motion.button>
            <motion.a
                whileTap={{ scale: 0.95 }}
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-xl hover:bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400/30 transition-all"
            >
                <ExternalLink size={13} /> Comprar billete
            </motion.a>
        </div>
    );
};
