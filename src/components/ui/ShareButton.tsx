import { useState } from 'react';
import { Share2, MessageCircle, Send, Link, Check } from 'lucide-react';
import type { Route } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    route: Route;
}

export const ShareButton = ({ route }: Props) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const dep = route.departureTime ? format(new Date(route.departureTime), "d MMM HH:mm", { locale: es }) : '';
    const price = route.price ? `${route.price.toFixed(2)}€` : '';
    const text = `🚄 ${route.fromStationName} → ${route.toStationName}\n📅 ${dep}${price ? `\n💰 ${price}` : ''}\n🔗 Busca en EasyTrain: https://easytrain.vercel.app`;

    const shareNative = async () => {
        if (navigator.share) {
            await navigator.share({ title: `Tren ${route.fromStationName} → ${route.toStationName}`, text, url: 'https://easytrain.vercel.app' });
        } else {
            setOpen(!open);
        }
    };

    const shareWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setOpen(false);
    };

    const shareTelegram = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent('https://easytrain.vercel.app')}&text=${encodeURIComponent(text)}`, '_blank');
        setOpen(false);
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    };

    return (
        <div className="relative">
            <button
                onClick={shareNative}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-400 transition-colors"
                title="Compartir"
            >
                <Share2 size={16} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-50 p-2 min-w-[160px]">
                    <button onClick={shareWhatsApp} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors">
                        <MessageCircle size={14} />
                        WhatsApp
                    </button>
                    <button onClick={shareTelegram} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg hover:bg-blue-500/10 text-gray-300 hover:text-blue-400 transition-colors">
                        <Send size={14} />
                        Telegram
                    </button>
                    <button onClick={copyLink} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg hover:bg-indigo-500/10 text-gray-300 hover:text-indigo-400 transition-colors">
                        {copied ? <Check size={14} className="text-green-400" /> : <Link size={14} />}
                        {copied ? '¡Copiado!' : 'Copiar enlace'}
                    </button>
                </div>
            )}
        </div>
    );
};
