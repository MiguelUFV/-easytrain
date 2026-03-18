import { useParams, Link } from 'react-router-dom';
import { Train, ArrowRight, ExternalLink, Search } from 'lucide-react';
import { useEffect } from 'react';
import { buildTrainlineUrl, buildOmioUrl } from '../lib/booking';

const POPULAR_ROUTES: Record<string, { from: string; to: string; emoji: string; operators: string[]; avgPrice: string; duration: string; tip: string }> = {
    'madrid-barcelona': { from: 'Madrid', to: 'Barcelona', emoji: '🇪🇸', operators: ['Renfe AVE', 'Ouigo'], avgPrice: '19-60€', duration: '2h 30m', tip: 'Los billetes Ouigo suelen ser más baratos si reservas con antelación.' },
    'paris-amsterdam': { from: 'París', to: 'Ámsterdam', emoji: '🇫🇷🇳🇱', operators: ['Thalys', 'Eurostar'], avgPrice: '29-89€', duration: '3h 20m', tip: 'Reserva con al menos 2 semanas de antelación para mejores precios.' },
    'berlin-munich': { from: 'Berlín', to: 'Múnich', emoji: '🇩🇪', operators: ['DB ICE', 'FlixTrain'], avgPrice: '17-90€', duration: '4h 00m', tip: 'FlixTrain ofrece precios desde 5€ en rutas seleccionadas.' },
    'roma-milan': { from: 'Roma', to: 'Milán', emoji: '🇮🇹', operators: ['Trenitalia', 'Italo'], avgPrice: '19-75€', duration: '2h 55m', tip: 'Italo tiene descuentos especiales los martes y miércoles.' },
    'london-paris': { from: 'Londres', to: 'París', emoji: '🇬🇧🇫🇷', operators: ['Eurostar'], avgPrice: '39-150€', duration: '2h 16m', tip: 'Busca ofertas "Snap" de Eurostar para precios desde 39€.' },
    'zurich-milan': { from: 'Zúrich', to: 'Milán', emoji: '🇨🇭🇮🇹', operators: ['SBB', 'Trenitalia'], avgPrice: '29-70€', duration: '3h 20m', tip: 'La ruta panorámica por el Gotardo es espectacular.' },
    'barcelona-paris': { from: 'Barcelona', to: 'París', emoji: '🇪🇸🇫🇷', operators: ['Renfe-SNCF', 'TGV'], avgPrice: '39-120€', duration: '6h 30m', tip: 'El tren directo sale por la mañana, reserva en renfe-sncf.com.' },
    'vienna-budapest': { from: 'Viena', to: 'Budapest', emoji: '🇦🇹🇭🇺', operators: ['ÖBB', 'RegioJet'], avgPrice: '15-39€', duration: '2h 40m', tip: 'RegioJet ofrece los precios más bajos y tiene Wi-Fi gratis.' },
    'amsterdam-brussels': { from: 'Ámsterdam', to: 'Bruselas', emoji: '🇳🇱🇧🇪', operators: ['Thalys', 'IC'], avgPrice: '25-55€', duration: '1h 50m', tip: 'El tren IC es más lento pero mucho más económico.' },
    'prague-vienna': { from: 'Praga', to: 'Viena', emoji: '🇨🇿🇦🇹', operators: ['ČD', 'RegioJet', 'ÖBB'], avgPrice: '15-45€', duration: '4h 00m', tip: 'RegioJet tiene billetes desde 7€ si compras con antelación.' },
};

export const RouteLanding = () => {
    const { route: routeSlug } = useParams<{ route: string }>();
    const routeData = routeSlug ? POPULAR_ROUTES[routeSlug] : null;

    useEffect(() => {
        if (routeData) {
            document.title = `Trenes ${routeData.from} → ${routeData.to} | EasyTrain`;
        }
    }, [routeData]);

    if (!routeData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Train size={48} className="text-[#d4a853] mb-4" />
                <h1 className="text-2xl font-black mb-2">Ruta no encontrada</h1>
                <p className="text-gray-500 mb-6">Prueba buscando otra ruta en el dashboard.</p>
                <Link to="/" className="px-6 py-3 bg-[#c9973f] text-[#0a0f1c] font-bold rounded-xl hover:bg-[#a8842e] transition-colors">
                    Ir al Dashboard
                </Link>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const trainlineUrl = buildTrainlineUrl({ fromCity: routeData.from, toCity: routeData.to, fromStationName: routeData.from, toStationName: routeData.to, departureDate: today });
    const omioUrl = buildOmioUrl({ fromCity: routeData.from, toCity: routeData.to, fromStationName: routeData.from, toStationName: routeData.to, departureDate: today });

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Hero */}
            <div className="glass-card p-8 md:p-12 mb-8">
                <div className="flex items-center gap-3 text-4xl mb-4">
                    <span>{routeData.emoji}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">
                    Trenes {routeData.from} <ArrowRight className="inline text-[#d4a853]" size={28} /> {routeData.to}
                </h1>
                <p className="text-gray-400 text-lg">Compara precios y encuentra el mejor billete de tren.</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-6 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Precio medio</div>
                    <div className="text-2xl font-black text-[#d4a853]">{routeData.avgPrice}</div>
                </div>
                <div className="glass-card p-6 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Duración</div>
                    <div className="text-2xl font-black text-white">{routeData.duration}</div>
                </div>
                <div className="glass-card p-6 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Operadores</div>
                    <div className="text-sm font-bold text-white">{routeData.operators.join(', ')}</div>
                </div>
            </div>

            {/* Tip */}
            <div className="glass-card p-6 mb-8 border-l-4 border-[#d4a853]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#d4a853] mb-2">Consejo para ahorrar</div>
                <p className="text-gray-300">{routeData.tip}</p>
            </div>

            {/* Booking Links */}
            <div className="space-y-3 mb-8">
                <h2 className="text-lg font-black mb-4">Reservar ahora</h2>
                <a href={trainlineUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 glass-card hover:border-cyan-500/30 transition-all group">
                    <div>
                        <div className="font-bold text-cyan-400">Trainline</div>
                        <div className="text-xs text-gray-500">La plataforma más popular de Europa</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </a>
                <a href={omioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 glass-card hover:border-orange-500/30 transition-all group">
                    <div>
                        <div className="font-bold text-orange-400">Omio</div>
                        <div className="text-xs text-gray-500">Compara tren, bus y avión</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-500 group-hover:text-orange-400 transition-colors" />
                </a>
            </div>

            {/* CTA */}
            <div className="text-center">
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#c9973f] text-[#0a0f1c] font-black rounded-2xl hover:bg-[#a8842e] transition-colors text-lg">
                    <Search size={20} />
                    Buscar con fecha exacta
                </Link>
            </div>

            {/* SEO text */}
            <div className="mt-12 text-sm text-gray-500 leading-relaxed space-y-3">
                <h2 className="text-lg font-bold text-white">Todo sobre la ruta {routeData.from} — {routeData.to}</h2>
                <p>
                    La ruta en tren de {routeData.from} a {routeData.to} es una de las más populares de Europa.
                    Con una duración aproximada de {routeData.duration} y precios desde {routeData.avgPrice.split('-')[0]},
                    es una excelente alternativa al avión. Los operadores principales son {routeData.operators.join(' y ')}.
                </p>
                <p>
                    En EasyTrain puedes comparar precios entre todos los operadores, ver horarios y reservar directamente.
                    Te recomendamos reservar con antelación para conseguir las mejores ofertas.
                </p>
            </div>

            {/* Other routes */}
            <div className="mt-12">
                <h3 className="text-lg font-black mb-4">Otras rutas populares</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(POPULAR_ROUTES)
                        .filter(([slug]) => slug !== routeSlug)
                        .slice(0, 6)
                        .map(([slug, data]) => (
                            <Link key={slug} to={`/trenes/${slug}`} className="glass-card p-4 hover:border-[#d4a853]/30 transition-all">
                                <div className="text-xs font-bold">{data.emoji} {data.from} → {data.to}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{data.avgPrice} · {data.duration}</div>
                            </Link>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

/** Componente con todas las rutas populares para el index */
export const PopularRoutesIndex = () => {
    useEffect(() => {
        document.title = 'Rutas de Tren Populares en Europa | EasyTrain';
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-black mb-2">Rutas de Tren Populares en Europa</h1>
            <p className="text-gray-400 mb-8">Compara precios y encuentra los mejores billetes de tren.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(POPULAR_ROUTES).map(([slug, data]) => (
                    <Link key={slug} to={`/trenes/${slug}`} className="glass-card p-6 hover:border-[#d4a853]/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-lg">{data.emoji} {data.from} → {data.to}</div>
                                <div className="text-sm text-gray-500 mt-1">{data.operators.join(', ')}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-[#d4a853]">{data.avgPrice}</div>
                                <div className="text-xs text-gray-500">{data.duration}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
