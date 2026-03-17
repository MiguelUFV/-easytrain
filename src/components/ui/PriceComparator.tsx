import { ExternalLink } from 'lucide-react';
import type { Route } from '../../types';
import { routeToBookingParams, getOfficialUrl, buildTrainlineUrl, buildOmioUrl } from '../../lib/booking';

interface Props {
    route: Route;
    date?: string;
}

export const PriceComparator = ({ route, date }: Props) => {
    const params = routeToBookingParams(route, date);
    const officialUrl = getOfficialUrl(params);
    const trainlineUrl = buildTrainlineUrl(params);
    const omioUrl = buildOmioUrl(params);

    const platforms = [
        ...(officialUrl ? [{
            name: params.operator?.split(' → ')[0] || 'Oficial',
            url: officialUrl,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            tag: 'OFICIAL',
        }] : []),
        {
            name: 'Trainline',
            url: trainlineUrl,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
            tag: 'POPULAR',
        },
        {
            name: 'Omio',
            url: omioUrl,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/20',
            tag: 'ALTERNATIVA',
        },
    ];

    return (
        <div className="mt-3 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                Comparar plataformas
            </div>
            {platforms.map((p) => (
                <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${p.bg} hover:bg-white/5 transition-all group`}
                >
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${p.color}`}>{p.name}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${p.color} opacity-60`}>{p.tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Ver precios</span>
                        <ExternalLink size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                </a>
            ))}
        </div>
    );
};
