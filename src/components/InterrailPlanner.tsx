import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Plus, X, Play, ArrowRight, Clock, Euro,
    Repeat, ChevronDown, ChevronUp, Sparkles, Route as RouteIcon,
    Minus, Lightbulb, Trash2, Shuffle, Copy,
    Check, Zap, Globe, Sun, Snowflake, CloudRain, Flower2,
    MousePointerClick, RotateCcw, TrendingUp, Award, Leaf, Waves, Trees, Landmark
} from 'lucide-react';
import { EuropeMap } from './EuropeMap';
import { stations } from '../lib/mockData';
import {
    optimizeInterrail,
    generateAlternatives,
    getReachableStations,
    findOptimalRoute,
    type OptimizationWeights,
    type OptimizedItinerary,
} from '../lib/InterrailOptimizer';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTrainStore } from '../store/useTrainStore';
import { useToastStore } from './Toast';
import type { Route } from '../types';
import { BookingButton } from './BookingButton';
import { analytics } from '../lib/analytics';
import { routeToBookingParams, openOfficialBooking, openBooking } from '../lib/booking';

// ═══════════════════════════════════════
// Constantes
// ═══════════════════════════════════════


const WEIGHT_PRESETS: { id: string; label: string; icon: React.ReactNode; desc: string; weights: OptimizationWeights }[] = [
    { id: 'balanced', label: 'Equilibrado', icon: <Sparkles size={14} />, desc: 'Mejor relación calidad-precio', weights: { price: 0.4, duration: 0.4, transfers: 0.2 } },
    { id: 'cheap', label: 'Más Barato', icon: <Euro size={14} />, desc: 'Minimizar coste total', weights: { price: 0.8, duration: 0.1, transfers: 0.1 } },
    { id: 'fast', label: 'Más Rápido', icon: <Zap size={14} />, desc: 'Menos tiempo en tren', weights: { price: 0.1, duration: 0.8, transfers: 0.1 } },
    { id: 'direct', label: 'Directo', icon: <RouteIcon size={14} />, desc: 'Menos transbordos', weights: { price: 0.2, duration: 0.2, transfers: 0.6 } },
];

const POPULAR_ROUTES: { id: string; name: string; emoji: string; stops: string[]; days: number; desc: string }[] = [
    { id: 'mediterranean', name: 'Mediterráneo', emoji: '🌊', stops: ['BCN', 'MRS', 'NIC', 'ROM', 'NAP'], days: 18, desc: 'Costa mediterránea de Barcelona a Nápoles' },
    { id: 'capitals', name: 'Capitales', emoji: '🏛️', stops: ['PAR', 'BRU', 'AMS', 'BER', 'PRA', 'VIE'], days: 21, desc: 'Las grandes capitales de Europa' },
    { id: 'iberian', name: 'Ibérica', emoji: '🇪🇸', stops: ['MAD', 'BCN', 'VAL', 'SEV', 'LIS'], days: 14, desc: 'España y Portugal de punta a punta' },
    { id: 'nordic', name: 'Nórdica', emoji: '❄️', stops: ['CPH', 'STO', 'OSL', 'HEL'], days: 16, desc: 'Capitales escandinavas' },
    { id: 'alpine', name: 'Alpina', emoji: '🏔️', stops: ['MUN', 'INN', 'ZUR', 'MIL', 'VEN'], days: 14, desc: 'A través de los Alpes' },
    { id: 'eastwest', name: 'Este-Oeste', emoji: '🧭', stops: ['LIS', 'MAD', 'PAR', 'BER', 'WAR', 'PRA'], days: 24, desc: 'De Lisboa a Varsovia' },
];

const SEASON_DATA: Record<string, { best: string; icon: React.ReactNode; color: string }> = {
    'España': { best: 'Primavera/Otoño', icon: <Sun size={10} />, color: '#f59e0b' },
    'Francia': { best: 'Jun-Sep', icon: <Flower2 size={10} />, color: '#ec4899' },
    'Italia': { best: 'Abr-Jun / Sep-Oct', icon: <Sun size={10} />, color: '#f59e0b' },
    'Alemania': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Países Bajos': { best: 'Abr-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Suiza': { best: 'Jun-Sep', icon: <Sun size={10} />, color: '#f59e0b' },
    'Austria': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Portugal': { best: 'Abr-Oct', icon: <Sun size={10} />, color: '#f59e0b' },
    'Reino Unido': { best: 'Jun-Aug', icon: <CloudRain size={10} />, color: '#64748b' },
    'Noruega': { best: 'Jun-Aug', icon: <Snowflake size={10} />, color: '#38bdf8' },
    'Suecia': { best: 'Jun-Aug', icon: <Snowflake size={10} />, color: '#38bdf8' },
    'Dinamarca': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Bélgica': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Grecia': { best: 'Abr-Jun / Sep-Oct', icon: <Sun size={10} />, color: '#f59e0b' },
    'Chequia': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Polonia': { best: 'May-Sep', icon: <Flower2 size={10} />, color: '#22c55e' },
    'Hungría': { best: 'Abr-Oct', icon: <Sun size={10} />, color: '#f59e0b' },
    'Croacia': { best: 'May-Sep', icon: <Sun size={10} />, color: '#f59e0b' },
    'Finlandia': { best: 'Jun-Aug', icon: <Snowflake size={10} />, color: '#38bdf8' },
};

// ═══════════════════════════════════════
// Interrail Pass Calculator
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// Interrail Pass Calculator
// ═══════════════════════════════════════

function calculatePassRecommendation(numStops: number, _totalDays: number, totalPrice: number): { name: string; price: number; savings: number; recommended: boolean } {
    const travelDays = numStops - 1;
    const passes = [
        { name: '4 días en 1 mes', price: 246, maxDays: 4 },
        { name: '5 días en 1 mes', price: 276, maxDays: 5 },
        { name: '7 días en 1 mes', price: 324, maxDays: 7 },
        { name: '10 días en 2 meses', price: 384, maxDays: 10 },
        { name: '15 días en 2 meses', price: 444, maxDays: 15 },
        { name: 'Continuo 15 días', price: 414, maxDays: 15 },
        { name: 'Continuo 22 días', price: 474, maxDays: 22 },
        { name: 'Continuo 1 mes', price: 564, maxDays: 31 },
    ];

    const suitable = passes.filter(p => p.maxDays >= travelDays);
    if (suitable.length === 0) return { name: 'Continuo 1 mes', price: 564, savings: totalPrice - 564, recommended: totalPrice > 564 };

    const best = suitable[0];
    return { name: best.name, price: best.price, savings: totalPrice - best.price, recommended: totalPrice > best.price };
}

// ═══════════════════════════════════════
// Componentes de Soporte
// ═══════════════════════════════════════

const MoodTags = ({ stops, legs }: { stops: string[], legs: any[] }) => {
    const tags = useMemo(() => {
        const result = [];
        const hasFerry = legs.some(l => l.route.type === 'Ferry');
        const hasHighSpeed = legs.some(l => l.route.type === 'HighSpeed');
        const numStops = stops.length;
        
        if (hasFerry) result.push({ label: '🚢 Marítima', icon: <Waves size={10} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' });
        if (hasHighSpeed) result.push({ label: '⚡ Ultra Rápida', icon: <Zap size={10} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' });
        if (numStops > 5) result.push({ label: '🏛️ Cultural', icon: <Landmark size={10} />, color: 'text-amber-400', bg: 'bg-amber-500/10' });
        if (numStops < 4 && !hasHighSpeed) result.push({ label: '🌲 Relax', icon: <Trees size={10} />, color: 'text-green-400', bg: 'bg-green-500/10' });
        
        return result;
    }, [stops, legs]);

    return (
        <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${tag.bg} ${tag.color} border border-white/5`}>
                    {tag.icon} {tag.label}
                </div>
            ))}
        </div>
    );
};

const TipsAIPanel = ({ stationIds, totalDays }: { stationIds: string[], totalDays: number }) => {
    const tips = useMemo(() => {
        const result = [];
        const countryCounts: Record<string, number> = {};
        stationIds.forEach(id => {
            const s = stations.find(st => st.id === id);
            if (s?.country) countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
        });

        const mainCountry = Object.entries(countryCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
        
        if (mainCountry && SEASON_DATA[mainCountry]) {
            result.push({
                icon: <Sun size={14} className="text-amber-400" />,
                title: `Clima en ${mainCountry}`,
                text: `La mejor época para recorrer ${mainCountry} es ${SEASON_DATA[mainCountry].best}.`
            });
        }

        if (stationIds.length > 5) {
            result.push({
                icon: <RouteIcon size={14} className="text-indigo-400" />,
                title: "Ruta Intensa",
                text: "Tienes muchas paradas. Considera añadir 1-2 días de descanso para no agotarte."
            });
        }

        if (stationIds.length > 0 && totalDays / stationIds.length < 2) {
             result.push({
                icon: <Clock size={14} className="text-red-400" />,
                title: "Poco tiempo",
                text: "Estás planeando menos de 2 días por ciudad. ¡Es posible que solo veas las estaciones!"
            });
        }

        if (result.length === 0) {
            result.push({
                icon: <Sparkles size={14} className="text-purple-400" />,
                title: "Explora más",
                text: "Añade una ciudad más a tu ruta para ver recomendaciones inteligentes."
            });
        }

        return result;
    }, [stationIds, totalDays]);

    return (
        <div className="flex flex-col gap-2">
            {tips.map((tip, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-3 border-white/5 bg-white/[0.02] relative overflow-hidden group"
                >
                    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                        {tip.icon}
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">{tip.icon}</div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{tip.title}</div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{tip.text}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════
// Componente Principal
// ═══════════════════════════════════════

export const InterrailPlanner = () => {
    const {
        interrailStops, addInterrailStop, removeInterrailStop,
        reorderInterrailStops, setInterrailStops, clearInterrailStops,
        interrailRouteMode: routeMode, toggleInterrailRouteMode: toggleRouteMode,
        setInterrailRouteMode
    } = useTrainStore();
    const { addToast } = useToastStore();

    const selectedStationIds = useMemo(() => interrailStops.map(s => s.stationId), [interrailStops]);

    // State
    const [totalDays, setTotalDays] = useState(14);
    const [activePreset, setActivePreset] = useState('balanced');
    const [customWeights, setCustomWeights] = useState<OptimizationWeights>({ price: 0.4, duration: 0.4, transfers: 0.2 });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [result, setResult] = useState<OptimizedItinerary | null>(null);
    const [alternatives, setAlternatives] = useState<OptimizedItinerary[]>([]);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [stationSearch, setStationSearch] = useState('');
    const [showStationPicker, setShowStationPicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showPresets, setShowPresets] = useState(interrailStops.length === 0);
    const [copiedItinerary, setCopiedItinerary] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'result'>('config');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Track previous stop count to detect changes
    const prevStopCountRef = useRef(selectedStationIds.length);

    // Clear stale optimization result when stops change
    useEffect(() => {
        if (prevStopCountRef.current !== selectedStationIds.length) {
            // Stops changed — invalidate old results
            setResult(null);
            setAlternatives([]);
            setActiveTab('config');
            prevStopCountRef.current = selectedStationIds.length;
        }
    }, [selectedStationIds.length]);

    const currentWeights = useMemo(() => {
        const preset = WEIGHT_PRESETS.find(p => p.id === activePreset);
        return preset ? preset.weights : customWeights;
    }, [activePreset, customWeights]);

    const interrailStopSet = useMemo(() => new Set(selectedStationIds), [selectedStationIds]);

    // Station search
    const filteredStations = useMemo(() => {
        if (!stationSearch.trim()) return stations.filter(s => (s.tier ?? 4) <= 2);
        const q = stationSearch.toLowerCase();
        return stations.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.country.toLowerCase().includes(q)
        ).slice(0, 20);
    }, [stationSearch]);

    // Smart suggestions from last stop
    const suggestions = useMemo(() => {
        if (selectedStationIds.length === 0) return [];
        const lastId = selectedStationIds[selectedStationIds.length - 1];
        const reachable = getReachableStations(lastId, currentWeights);
        return reachable
            .filter(r => !interrailStopSet.has(r.station.id))
            .slice(0, 8);
    }, [selectedStationIds, currentWeights, interrailStopSet]);

    // Live preview: quick cost estimate without full optimization
    const livePreview = useMemo(() => {
        if (selectedStationIds.length < 2) return null;
        let totalPrice = 0;
        let totalDurationMin = 0;
        let segments = 0;
        for (let i = 0; i < selectedStationIds.length - 1; i++) {
            const fromId = selectedStationIds[i];
            const toId = selectedStationIds[i + 1];
            const path = findOptimalRoute(fromId, toId, currentWeights);
            for (const r of path) {
                totalPrice += r.price ?? 50;
                totalDurationMin += differenceInMinutes(new Date(r.arrivalTime), new Date(r.departureTime));
                segments++;
            }
        }
        const transfers = Math.max(0, segments - (selectedStationIds.length - 1));
        return { totalPrice, totalDurationMin, transfers, segments };
    }, [selectedStationIds, currentWeights]);

    // Route difficulty
    const difficulty = useMemo(() => {
        if (!livePreview) return null;
        const { transfers, segments } = livePreview;
        const numStops = selectedStationIds.length;
        const complexityScore = transfers * 2 + segments + numStops;
        if (complexityScore <= 6) return { label: 'Fácil', color: '#22c55e', emoji: '🟢' };
        if (complexityScore <= 12) return { label: 'Moderada', color: '#f59e0b', emoji: '🟡' };
        return { label: 'Avanzada', color: '#ef4444', emoji: '🔴' };
    }, [livePreview, selectedStationIds.length]);

    // Pass recommendation
    const passRec = useMemo(() => {
        if (!livePreview) return null;
        return calculatePassRecommendation(selectedStationIds.length, totalDays, livePreview.totalPrice);
    }, [livePreview, selectedStationIds.length, totalDays]);

    // Actions
    const addStation = useCallback((id: string) => {
        if (!interrailStopSet.has(id)) {
            const s = stations.find(st => st.id === id);
            addInterrailStop({ 
                stationId: id, 
                stationName: s?.city || id,
                addedFrom: 'planner' 
            });
        }
        setShowStationPicker(false);
        setStationSearch('');
    }, [interrailStopSet, addInterrailStop]);

    const removeStation = useCallback((stationId: string) => {
        removeInterrailStop(stationId);
    }, [removeInterrailStop]);

    const handleMapStationClick = useCallback((stationId: string) => {
        if (!routeMode) return;
        if (interrailStopSet.has(stationId)) {
            removeInterrailStop(stationId);
        } else {
            const s = stations.find(st => st.id === stationId);
            addInterrailStop({ 
                stationId, 
                stationName: s?.city || stationId,
                addedFrom: 'map' 
            });
        }
    }, [routeMode, interrailStopSet, addInterrailStop, removeInterrailStop]);

    const optimize = useCallback(() => {
        if (selectedStationIds.length < 2) return;
        analytics.optimizeInterrail(selectedStationIds.length, totalDays);
        const itinerary = optimizeInterrail(selectedStationIds, totalDays, currentWeights);
        setResult(itinerary);
        const alts = generateAlternatives(selectedStationIds, totalDays, 5);
        setAlternatives(alts);
        setActiveTab('result');
        setInterrailRouteMode(true); // activa mapa neon automáticamente
    }, [selectedStationIds, totalDays, currentWeights, setInterrailRouteMode]);

    const loadPreset = useCallback((preset: typeof POPULAR_ROUTES[0]) => {
        const validStops = preset.stops.filter(id => stations.some(s => s.id === id));
        const stopIds = validStops.map(id => id);
        setInterrailStops(validStops.map(id => {
            const s = stations.find(st => st.id === id);
            return { 
                stationId: id, 
                stationName: s?.city || id,
                addedFrom: 'planner' as const 
            };
        }));
        setTotalDays(preset.days);
        setShowPresets(false);
        // Auto-optimizar y activar mapa neon
        if (stopIds.length >= 2) {
            const itinerary = optimizeInterrail(stopIds, preset.days, currentWeights);
            setResult(itinerary);
            const alts = generateAlternatives(stopIds, preset.days, 5);
            setAlternatives(alts);
            setActiveTab('result');
            setInterrailRouteMode(true);
        }
    }, [setInterrailStops, currentWeights, setInterrailRouteMode]);

    const randomizeRoute = useCallback(() => {
        const hubs = stations.filter(s => (s.tier ?? 4) <= 2);
        const count = 3 + Math.floor(Math.random() * 3);
        const picked: string[] = [];
        while (picked.length < count && picked.length < hubs.length) {
            const s = hubs[Math.floor(Math.random() * hubs.length)];
            if (!picked.includes(s.id)) picked.push(s.id);
        }
        setInterrailStops(picked.map(id => {
            const s = stations.find(st => st.id === id);
            return { 
                stationId: id, 
                stationName: s?.city || id,
                addedFrom: 'planner' as const 
            };
        }));
        setResult(null);
    }, [setInterrailStops]);

    const copyItinerary = useCallback(() => {
        if (!result) return;
        const lines = selectedStationIds.map((id, i) => {
            const s = stations.find(st => st.id === id);
            const days = result.stayDays[i] ?? 1;
            return `${i + 1}. ${s?.city || id} (${s?.country}) — ${days} día${days > 1 ? 's' : ''}`;
        });
        const text = `🚂 Mi Ruta Interrail\n${lines.join('\n')}\n\n💰 ${result.totalPrice}€ · ⏱ ${formatMinutes(result.totalDurationMin)} · 🔄 ${result.totalTransfers} transbordos`;
        navigator.clipboard.writeText(text);
        setCopiedItinerary(true);
        setTimeout(() => setCopiedItinerary(false), 2000);
    }, [result, selectedStationIds]);

    const formatMinutes = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        if (h === 0) return `${m}min`;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
            {/* ═══ HEADER ═══ */}
            <header className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2.5">
                            <Calendar className="text-indigo-400" size={24} />
                            Planificador Interrail
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Selecciona ciudades en el mapa o la lista · Optimización con Dijkstra logarítmico
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={randomizeRoute} className="p-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10" title="Ruta aleatoria">
                            <Shuffle size={16} />
                        </button>
                        <button onClick={() => setShowPresets(!showPresets)} className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10 text-xs font-semibold flex items-center gap-1.5" title="Rutas populares">
                            <Globe size={14} /> Plantillas
                        </button>
                    </div>
                </div>

                {/* Popular route presets */}
                <AnimatePresence>
                    {showPresets && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                                {POPULAR_ROUTES.map((route, i) => (
                                    <motion.button
                                        key={route.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => loadPreset(route)}
                                        className="relative overflow-hidden p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all text-left group"
                                    >
                                        <div className="absolute top-0 right-0 p-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                                            {route.emoji}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plantilla</div>
                                            <h3 className="text-sm font-black text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
                                                {route.name}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-3 h-7">
                                                {route.desc}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                    <MapPin size={10} /> {route.stops.length} ciud.
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                    <Calendar size={10} /> {route.days}d
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ═══ MAIN CONTENT: Left panel + Map ═══ */}
            <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-4">
                {/* ── LEFT PANEL ── */}
                <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
                    {/* Live preview stats */}
                    {livePreview && (
                        <motion.div layout className="glass-card p-3 flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-green-400 font-bold">
                                    <Euro size={12} /> ~{livePreview.totalPrice}€
                                </span>
                                <span className="flex items-center gap-1 text-blue-400 font-semibold">
                                    <Clock size={12} /> ~{formatMinutes(livePreview.totalDurationMin)}
                                </span>
                                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                    <Repeat size={12} /> {livePreview.transfers}
                                </span>
                            </div>
                            {difficulty && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: difficulty.color + '15', color: difficulty.color, border: `1px solid ${difficulty.color}30` }}>
                                    {difficulty.emoji} {difficulty.label}
                                </span>
                            )}
                        </motion.div>
                    )}

                    {/* Tab switcher */}
                    <div className="flex bg-white/[0.03] p-0.5 rounded-xl border border-white/5 gap-0.5">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'config' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                            Configurar
                        </button>
                        <button
                            onClick={() => setActiveTab('result')}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'result' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'} ${!result ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={!result}
                        >
                            Resultado
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'config' ? (
                            <motion.div key="config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                                {/* ═══ STOPS LIST ═══ */}
                                <div className="glass-card p-4">
                                    <h3 className="font-bold text-sm mb-3 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-indigo-400" /> Paradas ({selectedStationIds.length})
                                        </span>
                                        {selectedStationIds.length > 0 && (
                                            <button onClick={() => { clearInterrailStops(); setResult(null); }} className="text-[9px] text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1">
                                                <Trash2 size={10} /> Limpiar
                                            </button>
                                        )}
                                    </h3>

                                    <div className="flex flex-col gap-1.5 mb-3">
                                        {selectedStationIds.map((id, i) => {
                                            const station = stations.find(s => s.id === id);
                                            const seasonInfo = station?.country ? SEASON_DATA[station.country] : null;
                                            return (
                                                <motion.div
                                                    key={id}
                                                    layout
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-2 group"
                                                >
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${i === 0 ? 'bg-green-500/20 text-green-400' : i === selectedStationIds.length - 1 ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-semibold truncate">{station?.city || id}</div>
                                                        <div className="text-[9px] text-gray-600 flex items-center gap-1.5 truncate">
                                                            {station?.country}
                                                            {seasonInfo && (
                                                                <span className="flex items-center gap-0.5" style={{ color: seasonInfo.color }}>
                                                                    {seasonInfo.icon} {seasonInfo.best}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {i > 0 && (
                                                            <button onClick={() => reorderInterrailStops(i, i - 1)} className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
                                                                <ChevronUp size={10} />
                                                            </button>
                                                        )}
                                                        {i < selectedStationIds.length - 1 && (
                                                            <button onClick={() => reorderInterrailStops(i, i + 1)} className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
                                                                <ChevronDown size={10} />
                                                            </button>
                                                        )}
                                                        {selectedStationIds.length > 2 && (
                                                            <button onClick={() => removeStation(id)} className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Add station */}
                                    <AnimatePresence>
                                        {showStationPicker ? (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={stationSearch}
                                                    onChange={e => setStationSearch(e.target.value)}
                                                    placeholder="Buscar ciudad..."
                                                    className="glass-input w-full px-3 py-2 text-xs mb-1.5"
                                                    autoFocus
                                                />
                                                <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5">
                                                    {filteredStations.map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => addStation(s.id)}
                                                            disabled={interrailStopSet.has(s.id)}
                                                            className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${interrailStopSet.has(s.id) ? 'opacity-25 cursor-not-allowed' : 'hover:bg-white/5'}`}
                                                        >
                                                            <span className="font-medium">{s.city}</span>
                                                            <span className="text-gray-600 text-[10px] ml-1.5">{s.country}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={() => { setShowStationPicker(false); setStationSearch(''); }} className="mt-1.5 text-[10px] text-gray-600 hover:text-gray-300">Cancelar</button>
                                            </motion.div>
                                        ) : (
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setShowStationPicker(true)}
                                                    className="flex-1 py-2 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={12} /> Añadir
                                                </button>
                                                <button
                                                    onClick={() => { toggleRouteMode(); }}
                                                    className="py-2 px-3 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"
                                                    title="Seleccionar en el mapa"
                                                >
                                                    <MousePointerClick size={12} /> Mapa
                                                </button>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* ═══ SUGGESTIONS ═══ */}
                                {suggestions.length > 0 && !showStationPicker && (
                                    <div className="glass-card p-4">
                                        <button onClick={() => setShowSuggestions(!showSuggestions)} className="w-full flex items-center justify-between mb-2">
                                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                                <Lightbulb size={11} /> Siguiente parada sugerida
                                            </h3>
                                            {showSuggestions ? <ChevronUp size={10} className="text-gray-600" /> : <ChevronDown size={10} className="text-gray-600" />}
                                        </button>
                                        <AnimatePresence>
                                            {showSuggestions && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-0.5">
                                                    {suggestions.slice(0, 5).map((s, i) => {
                                                        return (
                                                            <button
                                                                key={s.station.id}
                                                                onClick={() => addStation(s.station.id)}
                                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 transition-colors text-left"
                                                            >
                                                                <Plus size={10} className="text-amber-400 flex-shrink-0" />
                                                                <span className="font-medium text-gray-300 flex-1 truncate">{s.station.city}</span>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    {i === 0 && <Award size={9} className="text-amber-400" />}
                                                                    <span className="text-[9px] text-gray-600">{s.routes}r</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* ═══ CONFIG ═══ */}
                                <div className="glass-card p-4">
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-indigo-400" /> Configuración
                                    </h3>

                                    <div className="mb-3">
                                        <label className="text-[10px] text-gray-500 mb-1 block">Fecha de inicio</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="glass-input w-full px-3 py-2 text-xs" />
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
                                            <span>Duración total</span>
                                            <span className="text-indigo-400 font-bold">{totalDays} días</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setTotalDays(Math.max(selectedStationIds.length, totalDays - 1))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={12} /></button>
                                            <input type="range" min={selectedStationIds.length} max={60} value={totalDays} onChange={e => setTotalDays(Number(e.target.value))} className="flex-1 accent-indigo-500" />
                                            <button onClick={() => setTotalDays(Math.min(60, totalDays + 1))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><Plus size={12} /></button>
                                        </div>
                                    </div>

                                    {/* Optimization presets */}
                                    <div className="mb-3">
                                        <label className="text-[10px] text-gray-500 mb-1.5 block">Optimización</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {WEIGHT_PRESETS.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => { setActivePreset(preset.id); setResult(null); }}
                                                    className={`px-2.5 py-2 rounded-xl text-[10px] font-semibold flex flex-col items-start transition-all ${activePreset === preset.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    <span className="flex items-center gap-1">{preset.icon} {preset.label}</span>
                                                    <span className={`text-[8px] mt-0.5 ${activePreset === preset.id ? 'text-indigo-200' : 'text-gray-600'}`}>{preset.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Advanced weights */}
                                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1">
                                        {showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />} Pesos avanzados
                                    </button>
                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
                                                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                                                    <p className="text-[9px] text-gray-600 font-mono">C = w<sub>p</sub>·ln(p+1) + w<sub>d</sub>·ln(d+1) + w<sub>t</sub>·ln(2)</p>
                                                    {(['price', 'duration', 'transfers'] as const).map(key => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-500 w-16">{key === 'price' ? 'Precio' : key === 'duration' ? 'Duración' : 'Transb.'}</span>
                                                            <input type="range" min={0} max={100} value={Math.round(currentWeights[key] * 100)} onChange={e => { setActivePreset('custom'); setCustomWeights(prev => ({ ...prev, [key]: Number(e.target.value) / 100 })); setResult(null); }} className="flex-1 accent-indigo-500" />
                                                            <span className="text-[10px] text-indigo-400 font-mono w-6 text-right">{(currentWeights[key] * 100).toFixed(0)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Pass recommendation */}
                                {passRec && passRec.recommended && (
                                    <motion.div layout className="glass-card p-3 border-green-500/20 bg-green-500/5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={12} className="text-green-400" />
                                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Recomendación Interrail Pass</span>
                                        </div>
                                        <div className="text-xs text-gray-300 font-medium">{passRec.name} — {passRec.price}€</div>
                                        <div className="text-[10px] text-green-400 mt-0.5 font-semibold">Ahorrarías ~{passRec.savings}€ vs billetes individuales</div>
                                    </motion.div>
                                )}

                                {/* Tips Panel */}
                                <div className="mt-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                        <Sparkles size={12} className="text-indigo-400" /> Asistente de Viaje
                                    </h3>
                                    <TipsAIPanel stationIds={selectedStationIds} totalDays={totalDays} />
                                </div>
                                {/* Optimize button */}
                                <button
                                    onClick={optimize}
                                    disabled={selectedStationIds.length < 2}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <Play size={18} fill="currentColor" /> Optimizar Ruta
                                </button>
                            </motion.div>
                        ) : (
                            /* ═══ RESULT TAB ═══ */
                            <motion.div key="result" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                                {result && (
                                    <>
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <StatCard label="Precio" value={`${result.totalPrice}€`} icon={<Euro size={14} />} color="text-green-400" />
                                            <StatCard label="Duración" value={formatMinutes(result.totalDurationMin)} icon={<Clock size={14} />} color="text-blue-400" />
                                            <StatCard label="Eco-Score" value={`-${Math.round(result.totalDurationMin * 0.12)}kg CO2`} icon={<Leaf size={14} />} color="text-emerald-400" tooltip="Ahorro vs Avión" />
                                            <StatCard label="Score" value={result.score.toFixed(2)} icon={<Sparkles size={14} />} color="text-indigo-400" />
                                        </div>

                                        <MoodTags stops={selectedStationIds} legs={result.legs} />

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button onClick={copyItinerary} className="flex-1 py-2 rounded-xl bg-white/5 text-xs font-semibold text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5 transition-colors border border-white/5">
                                                {copiedItinerary ? <><Check size={12} className="text-green-400" /> Copiado</> : <><Copy size={12} /> Copiar</>}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!result?.legs) return;
                                                    result.legs.forEach((leg, idx) => {
                                                        setTimeout(() => {
                                                            const params = routeToBookingParams(leg.route, startDate);
                                                            const opened = openOfficialBooking(params);
                                                            if (!opened) openBooking(params, 'trainline');
                                                        }, idx * 800);
                                                    });
                                                    addToast(`Abriendo ${result.legs.length} reservas...`, 'success');
                                                }}
                                                className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/20"
                                            >
                                                <Euro size={12} /> Reservar Todo
                                            </button>
                                        </div>

                                        {/* Timeline */}
                                        <div className="glass-card p-4">
                                            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                                                <RouteIcon size={14} className="text-indigo-400" /> Itinerario
                                            </h3>
                                            <div className="space-y-0">
                                                {selectedStationIds.map((id, i) => {
                                                    const station = stations.find(s => s.id === id);
                                                    const stayDays = result.stayDays[i] ?? 1;
                                                    const dayStart = result.stayDays.slice(0, i).reduce((a, b) => a + b, 0);
                                                    const dateStart = new Date(startDate);
                                                    dateStart.setDate(dateStart.getDate() + dayStart);

                                                    return (
                                                        <div key={id + i}>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full border-2 relative z-10 ${i === 0 ? 'bg-green-500 border-green-400' : i === selectedStationIds.length - 1 ? 'bg-red-500 border-red-400' : 'bg-indigo-500 border-indigo-400'}`} />
                                                                    {i < selectedStationIds.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-indigo-500/30 to-transparent min-h-[40px]" />}
                                                                </div>
                                                                <div className="pb-1.5 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="font-bold text-sm">{station?.city}</h4>
                                                                            <div className="text-[9px] text-gray-600">{station?.country}</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-xs font-semibold text-indigo-400">{stayDays}d</div>
                                                                            <div className="text-[9px] text-gray-600">
                                                                                {format(dateStart, 'd MMM', { locale: es })}
                                                                                {stayDays > 1 && (() => {
                                                                                    const end = new Date(dateStart);
                                                                                    end.setDate(end.getDate() + stayDays - 1);
                                                                                    return `–${format(end, 'd MMM', { locale: es })}`;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {i < selectedStationIds.length - 1 && (
                                                                <div className="flex gap-3 mb-2">
                                                                    <div className="flex flex-col items-center"><div className="w-0.5 flex-1 bg-white/5" /></div>
                                                                    <div className="flex-1 bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                                                                        {(() => {
                                                                            // Find legs for this segment
                                                                            const legs = result.legs.filter((_, li) => {
                                                                                // Very basic segment logic for mock: assuming 2 legs per segment in mock optimization
                                                                                const start = i * 2; 
                                                                                return li >= start && li < (i + 1) * 2;
                                                                            }).filter(l => l !== undefined);
                                                                            
                                                                            if (legs.length === 0) return <div className="text-[10px] text-gray-600 italic">Sin ruta directa</div>;
                                                                            return legs.map((leg, li) => (
                                                                                <div key={li} className={`flex items-center gap-2 ${li > 0 ? 'mt-1.5 pt-1.5 border-t border-white/5' : ''}`}>
                                                                                    <ArrowRight size={10} className="text-indigo-400 flex-shrink-0" />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="text-[10px] font-medium truncate">{leg.from.city} → {leg.to.city}</div>
                                                                                        <div className="text-[8px] text-gray-600">{leg.route.operator} · {formatMinutes(leg.durationMin)}</div>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-1">
                                                                                        <div className="text-[10px] font-bold text-indigo-400">{leg.route.price ?? 0}€</div>
                                                                                        <BookingButton route={leg.route as Route} compact className="scale-[0.8] origin-right" />
                                                                                    </div>
                                                                                </div>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Alternatives */}
                                        {alternatives.length > 1 && (
                                            <div className="glass-card p-4">
                                                <button onClick={() => setShowAlternatives(!showAlternatives)} className="w-full flex items-center justify-between">
                                                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                                                        <Sparkles size={14} className="text-indigo-400" /> {alternatives.length} Alternativas
                                                    </h3>
                                                    {showAlternatives ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </button>
                                                <AnimatePresence>
                                                    {showAlternatives && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 space-y-1.5">
                                                            {alternatives.map((alt, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setResult(alt)}
                                                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors text-xs ${alt === result ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/[0.03] border border-white/5 hover:bg-white/5'}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>#{i + 1}</div>
                                                                        <div>
                                                                            <div className="font-semibold">{alt.totalPrice}€ · {formatMinutes(alt.totalDurationMin)}</div>
                                                                            <div className="text-[9px] text-gray-600">{alt.totalTransfers} transb.</div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-gray-600 font-mono text-[9px]">ln={alt.score.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Back to config */}
                                        <button onClick={() => { setActiveTab('config'); setResult(null); }} className="w-full py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-gray-500 hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5 transition-colors border border-white/5">
                                            <RotateCcw size={12} /> Modificar ruta
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── RIGHT: EMBEDDED MAP ── */}
                <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                    <EuropeMap 
                        plannerMode={routeMode} 
                        onStationClick={handleMapStationClick}
                        onOptimize={optimize}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// ═══════════════════════════════════════
// Sub-componentes
// ═══════════════════════════════════════

const StatCard = ({ label, value, icon, color, tooltip }: { label: string; value: string; icon: React.ReactNode; color: string; tooltip?: string }) => (
    <div className="glass-card p-3 relative group">
        <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
            {icon}
            <span className="text-[9px] uppercase tracking-wider font-bold">{label}</span>
        </div>
        <div className="text-lg font-black">{value}</div>
        {tooltip && (
            <div className="absolute -top-1 px-1.5 py-0.5 bg-black/80 rounded text-[7px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {tooltip}
            </div>
        )}
    </div>
);
