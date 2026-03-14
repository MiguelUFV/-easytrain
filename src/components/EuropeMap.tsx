import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { stations, routes } from '../lib/mockData';
import type { Station, Route } from '../types';
import { differenceInMinutes } from 'date-fns';
import { Train, Clock, Euro, Moon, RefreshCw, MapPin, Plus, Trash2, X, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainStore } from '../store/useTrainStore';
import { resolveStationCoords } from '../lib/api';
import { getRouteWaypoints, resolveId } from '../lib/routeWaypoints';
import { getReachableStations } from '../lib/InterrailOptimizer';

const EUROPE_CENTER: [number, number] = [48.5, 10.0];
const EUROPE_ZOOM = 5;

const getTypeColor = (type: string): string => {
    switch (type) {
        case 'HighSpeed': return '#6366f1';
        case 'Intercity': return '#22d3ee';
        case 'Regional': return '#a3e635';
        case 'NightTrain': return '#c084fc';
        case 'Ferry': return '#00f3ff';
        default: return '#6366f1';
    }
};

const getTypeLabel = (type: string): string => {
    switch (type) {
        case 'HighSpeed': return 'Alta Velocidad';
        case 'Intercity': return 'Intercity';
        case 'Regional': return 'Regional';
        case 'NightTrain': return 'Nocturno';
        case 'Ferry': return 'Ferry (Trayecto Marítimo)';
        default: return type;
    }
};

const formatDuration = (dep: string, arr: string): string => {
    const mins = differenceInMinutes(new Date(arr), new Date(dep));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const MovingTrain = ({ path, color, duration = 10, isFerry = false }: { path: [number, number][], color: string, duration?: number, isFerry?: boolean }) => {
    const [pos, setPos] = useState<[number, number] | null>(null);
    
    useEffect(() => {
        if (!path || path.length < 2) return;
        let animationFrame: number;
        const startTime = Date.now();
        
        const update = () => {
            const now = Date.now();
            const elapsed = (now - startTime) % (duration * 1000);
            const progress = elapsed / (duration * 1000);
            
            // Find location on path
            const index = Math.floor(progress * (path.length - 1));
            const nextIndex = Math.min(index + 1, path.length - 1);
            const segmentProgress = (progress * (path.length - 1)) % 1;
            
            const p1 = path[index];
            const p2 = path[nextIndex];
            
            if (p1 && p2) {
                setPos([
                    p1[0] + (p2[0] - p1[0]) * segmentProgress,
                    p1[1] + (p2[1] - p1[1]) * segmentProgress
                ]);
            }
            
            animationFrame = requestAnimationFrame(update);
        };
        
        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [path, duration]);

    if (!pos) return null;

    return (
        <CircleMarker 
            center={pos} 
            radius={isFerry ? 6 : 4} 
            pathOptions={{ 
                color: isFerry ? '#00f3ff' : '#fff', 
                fillColor: isFerry ? '#0e172a' : color, 
                fillOpacity: 1, 
                weight: 2,
                className: isFerry ? 'ferry-pulse' : 'train-pulse'
            }} 
        >
            {isFerry && (
                <Tooltip permanent direction="center" className="ship-tooltip">
                    <span className="text-white text-[10px] drop-shadow-lg">🚢</span>
                </Tooltip>
            )}
        </CircleMarker>
    );
};

const NeonRoute = ({ path, color, isActive, isInterrail = false, isFerry = false }: { 
    path: [number, number][], 
    color: string, 
    isActive?: boolean,
    isInterrail?: boolean,
    isFerry?: boolean
}) => {
    if (!isActive && !isInterrail) {
        return (
            <Polyline 
                positions={path} 
                pathOptions={{ 
                    color, 
                    weight: 1.2, 
                    opacity: 0.2, 
                    lineCap: 'round', 
                    lineJoin: 'round',
                    dashArray: isFerry ? '4, 8' : undefined
                }} 
            />
        );
    }

    return (
        <>
            {/* Extreme Outer Glow */}
            <Polyline positions={path} pathOptions={{ color, weight: isActive ? 35 : 18, opacity: 0.05, lineCap: 'round' }} />
            {/* Outer glow */}
            <Polyline positions={path} pathOptions={{ color, weight: isActive ? 22 : 12, opacity: 0.12, lineCap: 'round' }} />
            {/* Mid glow */}
            <Polyline positions={path} pathOptions={{ color, weight: isActive ? 12 : 7, opacity: 0.25, lineCap: 'round', dashArray: isFerry ? '6, 12' : undefined }} />
            {/* Core neon line */}
            <Polyline positions={path} pathOptions={{ color: '#fff', weight: isActive ? 2.5 : 1.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', dashArray: isFerry ? '3, 6' : undefined }} />
            <Polyline positions={path} pathOptions={{ color, weight: isActive ? 4.5 : 2.5, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: isFerry ? '3, 6' : undefined }} />
            
            {/* Moving Train Pulse */}
            <MovingTrain path={path} color={color} duration={isInterrail ? 15 : 6} isFerry={isFerry} />
        </>
    );
};

// ── NEW: Bridge Icon Component ──
const BridgeMarker = ({ position, name }: { position: [number, number], name: string }) => (
    <CircleMarker 
        center={position} 
        radius={5} 
        pathOptions={{ color: '#fbbf24', fillColor: '#0f172a', fillOpacity: 1, weight: 2 }}
    >
        <Tooltip direction="top" offset={[0, -5]}>
            <div className="flex items-center gap-1.5 font-bold text-[10px] text-amber-400">
                🌉 {name}
            </div>
        </Tooltip>
    </CircleMarker>
);

// ── NEW: Atmospheric Simulation ──
const AtmosphericOverlay = () => {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());
    
    useEffect(() => {
        const h = () => setZoom(map.getZoom());
        map.on('zoomend', h);
        return () => { map.off('zoomend', h); };
    }, [map]);

    // Only show fog/bruma at high zoom out
    if (zoom > 6) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[1001] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 blur-3xl animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-400/10 to-transparent blur-2xl" />
        </div>
    );
};

function resolveRouteCoords(
    route: Route,
    endpoint: 'from' | 'to',
    allStations: Station[]
): { lat: number; lng: number } | undefined {
    const embedded = endpoint === 'from' ? route.fromCoordinates : route.toCoordinates;
    if (embedded) return embedded;
    const stationId = endpoint === 'from' ? route.fromStationId : route.toStationId;
    const cached = resolveStationCoords(stationId);
    if (cached) return cached;
    const normalizedId = resolveId(stationId);
    const mockStation = allStations.find(s => s.id === normalizedId || s.id === stationId);
    return mockStation?.coordinates;
}

function getCurvedPathFromCoords(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    segments = 24
): [number, number][] {
    const lat1 = from.lat, lng1 = from.lng;
    const lat2 = to.lat, lng2 = to.lng;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dx = lat2 - lat1, dy = lng2 - lng1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.0001) return [[lat1, lng1], [lat2, lng2]];
    const curveFactor = Math.min(dist * 0.08, 1.2);
    const offsetLat = midLat + (-dy / dist) * curveFactor;
    const offsetLng = midLng + (dx / dist) * curveFactor;
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * offsetLat + t * t * lat2;
        const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * offsetLng + t * t * lng2;
        points.push([lat, lng]);
    }
    return points;
}

function getPathThroughWaypoints(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    waypoints: { lat: number; lng: number }[]
): [number, number][] {
    const allPts = [from, ...waypoints, to];
    const path: [number, number][] = [];
    for (let i = 0; i < allPts.length - 1; i++) {
        const seg = getCurvedPathFromCoords(allPts[i], allPts[i + 1], 16);
        if (i === 0) {
            path.push(...seg);
        } else {
            path.push(...seg.slice(1));
        }
    }
    return path;
}

function getCurvedPath(from: Station, to: Station): [number, number][] {
    const fromCoords = from.coordinates!;
    const toCoords = to.coordinates!;
    const waypoints = getRouteWaypoints(from.id, to.id);
    if (waypoints && waypoints.length > 0) {
        return getPathThroughWaypoints(fromCoords, toCoords, waypoints);
    }
    return getCurvedPathFromCoords(fromCoords, toCoords);
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
    const map = useMap();
    useEffect(() => {
        const handler = () => onZoomChange(map.getZoom());
        map.on('zoomend', handler);
        onZoomChange(map.getZoom());
        return () => { map.off('zoomend', handler); };
    }, [map, onZoomChange]);
    return null;
}

function FitToActiveRoute({ activeRoute, allStations }: { activeRoute: Route | null, allStations: Station[] }) {
    const map = useMap();
    useEffect(() => {
        if (activeRoute) {
            const fromCoords = resolveRouteCoords(activeRoute, 'from', allStations);
            const toCoords = resolveRouteCoords(activeRoute, 'to', allStations);
            if (fromCoords && toCoords) {
                const bounds = L.latLngBounds(
                    [fromCoords.lat, fromCoords.lng],
                    [toCoords.lat, toCoords.lng]
                );
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
            }
        }
    }, [activeRoute, map, allStations]);
    return null;
}

// Fit map to all interrail stops
function FitToInterrailRoute({ stationIds, allStations, trigger }: { stationIds: string[], allStations: Station[], trigger: number }) {
    const map = useMap();
    useEffect(() => {
        if (trigger === 0 || stationIds.length < 2) return;
        const coords = stationIds
            .map(id => allStations.find(s => s.id === id)?.coordinates)
            .filter(Boolean) as { lat: number; lng: number }[];
        if (coords.length < 2) return;
        const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 7 });
    }, [trigger, stationIds, allStations, map]);
    return null;
}

type FilterType = 'all' | 'HighSpeed' | 'Intercity' | 'Regional' | 'NightTrain';

export const EuropeMap = ({
    plannerMode = false,
    onStationClick,
    onOptimize
}: {
    plannerMode?: boolean;
    onStationClick?: (stationId: string) => void;
    onOptimize?: () => void;
}) => {
    const {
        routes: searchResults,
        selectedRouteId,
        setSelectedRouteId,
        stations: apiStations,
        interrailStops, interrailRouteMode, addInterrailStop, removeInterrailStop,
        toggleInterrailRouteMode, clearInterrailStops,
    } = useTrainStore();
    const [filter, setFilter] = useState<FilterType>('all');
    const [zoom, setZoom] = useState(EUROPE_ZOOM);
    const [fitTrigger, setFitTrigger] = useState(0);

    const onZoomChange = useCallback((z: number) => setZoom(z), []);

    const allStations = useMemo(() => {
        const merged = [...stations];
        apiStations.forEach(apiS => {
            if (!merged.find(s => s.id === apiS.id)) merged.push(apiS);
        });
        return merged;
    }, [apiStations]);

    const activeRoute = useMemo(() => {
        if (selectedRouteId) {
            return searchResults.find(r => r.id === selectedRouteId) || routes.find(r => r.id === selectedRouteId) || null;
        }
        return null;
    }, [selectedRouteId, searchResults]);

    const maxTier = zoom >= 7 ? 4 : zoom >= 6 ? 3 : zoom >= 5 ? 2 : 1;

    const visibleStations = useMemo(() =>
        allStations.filter(s => s.coordinates && (s.tier ?? 1) <= maxTier),
        [maxTier, allStations]
    );

    const visibleStationIds = useMemo(() =>
        new Set(visibleStations.map(s => s.id)),
        [visibleStations]
    );

    const filteredRoutes = useMemo(() => {
        let r = routes;
        if (filter !== 'all') r = r.filter(rt => rt.type === filter);
        return r.filter(rt => visibleStationIds.has(rt.fromStationId) && visibleStationIds.has(rt.toStationId));
    }, [filter, visibleStationIds]);

    const stationRouteCount = useCallback((stationId: string) =>
        filteredRoutes.filter(r => r.fromStationId === stationId || r.toStationId === stationId).length,
        [filteredRoutes]
    );

    // Interrail stop IDs set for quick lookup
    const interrailStopIds = useMemo(() => new Set(interrailStops.map(s => s.stationId)), [interrailStops]);

    // Build the interrail route path segments for visualization
    const interrailPath = useMemo(() => {
        if (interrailStops.length < 2) return [];
        const segments: { from: Station; to: Station; path: [number, number][] }[] = [];
        for (let i = 0; i < interrailStops.length - 1; i++) {
            const fromStation = allStations.find(s => s.id === interrailStops[i].stationId);
            const toStation = allStations.find(s => s.id === interrailStops[i + 1].stationId);
            if (fromStation?.coordinates && toStation?.coordinates) {
                const path = getCurvedPath(fromStation, toStation);
                segments.push({ from: fromStation, to: toStation, path });
            }
        }
        return segments;
    }, [interrailStops, allStations]);

    // Smart suggestions: reachable stations from last stop
    const suggestions = useMemo(() => {
        if (!interrailRouteMode || interrailStops.length === 0) return [];
        const lastStopId = interrailStops[interrailStops.length - 1].stationId;
        const reachable = getReachableStations(lastStopId);
        return reachable
            .filter(r => !interrailStopIds.has(r.station.id))
            .slice(0, 5);
    }, [interrailRouteMode, interrailStops, interrailStopIds]);

    // Handle station click in route mode
    const handleStationClick = useCallback((stationId: string) => {
        if (!interrailRouteMode) return;
        if (interrailStopIds.has(stationId)) {
            removeInterrailStop(stationId);
        } else {
            addInterrailStop({ stationId, addedFrom: 'map' });
        }
    }, [interrailRouteMode, interrailStopIds, addInterrailStop, removeInterrailStop]);

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={EUROPE_CENTER}
                zoom={EUROPE_ZOOM}
                minZoom={3}
                maxZoom={12}
                style={{ width: '100%', height: '100%', background: '#0a0a0c' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" opacity={0.35} />
                <ZoomTracker onZoomChange={onZoomChange} />
                <FitToActiveRoute activeRoute={activeRoute} allStations={allStations} />
                <FitToInterrailRoute stationIds={interrailStops.map(s => s.stationId)} allStations={allStations} trigger={fitTrigger} />

                {/* Route lines */}
                {filteredRoutes.map(route => {
                    const from = allStations.find(s => s.id === route.fromStationId);
                    const to = allStations.find(s => s.id === route.toStationId);
                    if (!from?.coordinates || !to?.coordinates) return null;
                    const isActive = activeRoute?.id === route.id;
                    const color = getTypeColor(route.type);
                    const path = getCurvedPath(from, to);

                    return (
                        <NeonRoute 
                            key={route.id}
                            path={path}
                            color={color}
                            isActive={isActive}
                            isFerry={route.type === 'Ferry'}
                        />
                    );
                })}

                {/* Active route line + glow */}
                {activeRoute && !interrailRouteMode && (() => {
                    const color = getTypeColor(activeRoute.type);
                    const startCoords = resolveRouteCoords(activeRoute, 'from', allStations);
                    const endCoords = resolveRouteCoords(activeRoute, 'to', allStations);
                    if (!startCoords || !endCoords) return null;

                    const allPoints: { id: string, name: string, coords: { lat: number, lng: number }, isTransfer?: boolean }[] = [
                        { id: activeRoute.fromStationId, name: activeRoute.fromStationName || 'Origen', coords: startCoords }
                    ];

                    activeRoute.stops?.forEach(s => {
                        const coords = s.coordinates || resolveStationCoords(s.stationId) || allStations.find(st => st.id === s.stationId)?.coordinates;
                        if (coords) {
                            allPoints.push({ id: s.stationId, name: s.stationName, coords, isTransfer: s.isTransfer });
                        }
                    });

                    allPoints.push({ id: activeRoute.toStationId, name: activeRoute.toStationName || 'Destino', coords: endCoords });

                    const fullPath: [number, number][] = [];
                    for (let i = 0; i < allPoints.length - 1; i++) {
                        const p1 = allPoints[i].coords;
                        const p2 = allPoints[i+1].coords;
                        const waypoints = getRouteWaypoints(allPoints[i].id, allPoints[i+1].id);
                        const segmentPath = waypoints && waypoints.length > 0
                            ? getPathThroughWaypoints(p1, p2, waypoints)
                            : getCurvedPathFromCoords(p1, p2, 12);

                        if (i === 0) fullPath.push(...segmentPath);
                        else fullPath.push(...segmentPath.slice(1));
                    }

                    return (
                        <>
                            <NeonRoute 
                                path={fullPath}
                                color={color}
                                isActive={true}
                                isFerry={activeRoute.type === 'Ferry'}
                            />
                            {allPoints.map((pt, idx) => {
                                const isStart = idx === 0;
                                const isEnd = idx === allPoints.length - 1;
                                const isTransfer = pt.isTransfer;

                                return (
                                    <CircleMarker
                                        key={`point-${idx}-${pt.id}`}
                                        center={[pt.coords.lat, pt.coords.lng]}
                                        radius={isStart || isEnd ? 9 : isTransfer ? 7 : 4.5}
                                        pathOptions={{
                                            color: isStart ? '#a5b4fc' : isEnd ? '#86efac' : isTransfer ? '#fcd34d' : color,
                                            fillColor: isTransfer ? '#f59e0b' : '#0f172a',
                                            fillOpacity: 1,
                                            weight: isStart || isEnd || isTransfer ? 3 : 2,
                                            opacity: 1,
                                        }}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} permanent={zoom >= 7} className="station-tooltip">
                                            <div style={{
                                                background: '#0f172a', color: 'white', padding: '6px 10px', borderRadius: '8px',
                                                border: `1px solid ${isTransfer ? '#f59e0b50' : (isStart ? '#6366f150' : (isEnd ? '#22c55e50' : 'rgba(255,255,255,0.15)'))}`,
                                                fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                            }}>
                                                <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {isTransfer && <RefreshCw size={10} className="text-yellow-500" />}
                                                    {pt.name}
                                                </div>
                                                {(isStart || isEnd || isTransfer) && (
                                                    <div style={{ fontSize: '9px', color: isStart ? '#818cf8' : isEnd ? '#4ade80' : '#fbbf24', fontWeight: 700, marginTop: '2px' }}>
                                                        {isStart ? 'ORIGEN' : isEnd ? 'DESTINO' : 'TRANSBORDO'}
                                                    </div>
                                                )}
                                            </div>
                                        </Tooltip>
                                    </CircleMarker>
                                );
                            })}
                        </>
                    );
                })()}


                {/* ═══ INTERRAIL ROUTE BUILDER PATH (NEON) ═══ */}
                {interrailRouteMode && interrailPath.map((seg, i) => (
                    <NeonRoute 
                        key={`ir-seg-${i}`}
                        path={seg.path}
                        color="#6366f1"
                        isInterrail={true}
                    />
                ))}

                {/* Interrail stop markers */}
                {interrailRouteMode && interrailStops.map((stop, idx) => {
                    const station = allStations.find(s => s.id === stop.stationId);
                    if (!station?.coordinates) return null;
                    const isFirst = idx === 0;
                    const isLast = idx === interrailStops.length - 1;
                    return (
                        <CircleMarker
                            key={`ir-stop-${stop.stationId}`}
                            center={[station.coordinates.lat, station.coordinates.lng]}
                            radius={isFirst || isLast ? 11 : 8}
                            pathOptions={{
                                color: isFirst ? '#22c55e' : isLast ? '#ef4444' : '#a5b4fc',
                                fillColor: isFirst ? '#166534' : isLast ? '#7f1d1d' : '#312e81',
                                fillOpacity: 1,
                                weight: 3,
                                opacity: 1,
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -12]} permanent className="station-tooltip">
                                <div style={{
                                    background: '#0f172a', color: 'white', padding: '6px 10px', borderRadius: '8px',
                                    border: `1px solid ${isFirst ? '#22c55e50' : isLast ? '#ef444450' : '#6366f150'}`,
                                    fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '11px' }}>
                                        <span style={{ color: isFirst ? '#4ade80' : isLast ? '#f87171' : '#00f3ff', marginRight: '4px' }}>
                                            {idx + 1}.
                                        </span>
                                        {station.city}
                                    </div>
                                    <div style={{ fontSize: '9px', color: isFirst ? '#4ade80' : isLast ? '#f87171' : '#00f3ff', fontWeight: 700, marginTop: '1px', textShadow: '0 0 8px currentColor' }}>
                                        {isFirst ? 'INICIO' : isLast ? 'FIN' : `PARADA ${idx}`}
                                    </div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* Suggestion markers (pulsing) */}
                {interrailRouteMode && suggestions.map(s => {
                    if (!s.station.coordinates) return null;
                    return (
                        <CircleMarker
                            key={`suggest-${s.station.id}`}
                            center={[s.station.coordinates.lat, s.station.coordinates.lng]}
                            radius={7}
                            pathOptions={{
                                color: '#fbbf24',
                                fillColor: '#78350f',
                                fillOpacity: 0.8,
                                weight: 2,
                                opacity: 0.9,
                                className: 'suggestion-pulse',
                            }}
                            eventHandlers={{
                                click: () => handleStationClick(s.station.id),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -10]} className="station-tooltip">
                                <div style={{
                                    background: '#1c1917', color: '#fbbf24', padding: '6px 10px', borderRadius: '8px',
                                    border: '1px solid #78350f', fontFamily: 'Inter, system-ui, sans-serif',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Lightbulb size={10} /> {s.station.city}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#a16207', fontWeight: 600, marginTop: '1px' }}>
                                        SUGERENCIA — {s.routes} rutas
                                    </div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* Station markers */}
                {visibleStations.map(station => {
                    if (!station.coordinates) return null;
                    const isActive = activeRoute?.fromStationId === station.id || activeRoute?.toStationId === station.id;
                    const isInterrailStop = interrailStopIds.has(station.id);
                    const count = stationRouteCount(station.id);
                    const tier = station.tier ?? 1;
                    const radius = isActive ? 10 : isInterrailStop ? 0 : tier === 1 ? 5 : tier === 2 ? 4 : tier === 3 ? 3 : 2.5;

                    // Hide marker if already rendered as interrail stop
                    if (isInterrailStop && interrailRouteMode) return null;

                    return (
                        <CircleMarker
                            key={station.id}
                            center={[station.coordinates.lat, station.coordinates.lng]}
                            radius={radius}
                            pathOptions={{
                                color: isActive || interrailStopIds.has(station.id) ? '#00f3ff' : tier === 1 ? '#818cf8' : '#6366f1',
                                fillColor: isActive || interrailStopIds.has(station.id) ? '#00f3ff' : '#0f0f1a',
                                fillOpacity: 1,
                                weight: isActive ? 3 : tier <= 2 ? 2 : 1.5,
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (plannerMode || interrailRouteMode) {
                                        if (onStationClick) onStationClick(station.id);
                                        else handleStationClick(station.id);
                                    }
                                },
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -8]} className="station-tooltip">
                                <div style={{
                                    background: '#0f172a', color: 'white', padding: '8px 12px', borderRadius: '10px',
                                    border: '1px solid rgba(99,102,241,0.3)', fontFamily: 'Inter, system-ui, sans-serif',
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{station.city}</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{station.name}</div>
                                    {interrailRouteMode ? (
                                        <div style={{ fontSize: '10px', color: '#a5b4fc', fontWeight: 600, marginTop: '4px' }}>
                                            Clic para {isInterrailStop ? 'quitar' : 'añadir'}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600, marginTop: '4px' }}>
                                            {count} {count === 1 ? 'ruta' : 'rutas'}
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                            {!interrailRouteMode && (
                                <Popup className="station-popup">
                                    <div style={{
                                        background: '#0f172a', color: 'white', padding: '14px 16px', borderRadius: '12px',
                                        minWidth: '230px', maxHeight: '300px', overflowY: 'auto',
                                        border: '1px solid rgba(99,102,241,0.3)', fontFamily: 'Inter, system-ui, sans-serif',
                                    }}>
                                        <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>{station.city}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                                            {station.name} — {station.country}
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginBottom: '6px' }}>
                                                {count} {count === 1 ? 'ruta disponible' : 'rutas disponibles'}
                                            </div>
                                            {filteredRoutes
                                                .filter(r => r.fromStationId === station.id || r.toStationId === station.id)
                                                .slice(0, 8)
                                                .map(r => {
                                                    const dest = stations.find(s => s.id === (r.fromStationId === station.id ? r.toStationId : r.fromStationId));
                                                    return (
                                                        <div
                                                            key={r.id}
                                                            style={{
                                                                fontSize: '10px', color: '#cbd5e1',
                                                                padding: '3px 0', cursor: 'pointer',
                                                                display: 'flex', justifyContent: 'space-between',
                                                            }}
                                                            onClick={() => setSelectedRouteId(r.id)}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{
                                                                    display: 'inline-block', width: '6px', height: '6px',
                                                                    borderRadius: '50%', backgroundColor: getTypeColor(r.type),
                                                                }} />
                                                                {dest?.city ?? '?'} <span style={{ color: '#64748b' }}>({r.operator})</span>
                                                            </span>
                                                            <span style={{ color: '#818cf8', fontWeight: 600 }}>{r.price ?? '?'}€</span>
                                                        </div>
                                                    );
                                                })}
                                            {count > 8 && (
                                                <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                                                    +{count - 8} más...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            )}
                        </CircleMarker>
                    );
                })}
                {/* Atmospheric & Bridge Effects */}
                <AtmosphericOverlay />
                <BridgeMarker position={[55.5800, 12.7500]} name="Puente de Öresund" />

            </MapContainer>

            {/* Maritime Waves Overlay */}
            <div className="maritime-waves" />

            {/* ═══ OVERLAYS ═══ */}

            {/* Title */}
            <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
                <h1 className="text-3xl font-black mb-1 tracking-tighter text-white drop-shadow-lg">
                    {interrailRouteMode ? 'MODO RUTA' : 'EXPLORAR EUROPA'}
                </h1>
                <p className="text-gray-400 max-w-xs text-xs drop-shadow-md">
                    {interrailRouteMode
                        ? `${interrailStops.length} parada${interrailStops.length !== 1 ? 's' : ''} seleccionada${interrailStops.length !== 1 ? 's' : ''} — haz clic en estaciones para añadir`
                        : `${visibleStations.length} estaciones · ${filteredRoutes.length} rutas — haz zoom para ver más`
                    }
                </p>
            </div>

            {/* Stats */}
            <div className="absolute top-6 right-6 z-[1000]">
                <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(10,10,12,0.85)', borderColor: 'rgba(99,102,241,0.2)' }}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                        <span className="text-[11px] font-semibold text-white">{visibleStations.length}/{stations.length} estaciones</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-[2px] bg-indigo-400 rounded-full" />
                        <span className="text-[11px] font-semibold text-white">{filteredRoutes.length}/{routes.length} rutas</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[10px] text-gray-500">Zoom {Math.round(zoom)}</span>
                </div>
            </div>

            {/* Filters */}
            {!interrailRouteMode && (
                <div className="absolute top-16 left-6 z-[1000] flex flex-wrap gap-1.5 mt-2">
                    {([
                        { key: 'all', label: 'Todas', color: '#fff' },
                        { key: 'HighSpeed', label: 'Alta Velocidad', color: '#6366f1' },
                        { key: 'Intercity', label: 'Intercity', color: '#22d3ee' },
                        { key: 'Regional', label: 'Regional', color: '#a3e635' },
                        { key: 'NightTrain', label: 'Nocturno', color: '#c084fc' },
                    ] as const).map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => { setFilter(key); setSelectedRouteId(null); }}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                                background: filter === key ? color + '20' : 'rgba(10,10,12,0.7)',
                                border: `1px solid ${filter === key ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                                color: filter === key ? color : '#94a3b8',
                                backdropFilter: 'blur(12px)',
                            }}
                        >
                            {key !== 'all' && (
                                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color, verticalAlign: 'middle' }} />
                            )}
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══ ROUTE BUILDER TOGGLE ═══ */}
            <div className="absolute top-16 left-6 z-[1000] mt-2 flex gap-2">
                {interrailRouteMode && (
                    <>
                        <div className="flex flex-wrap gap-1.5">
                            {/* Filters hidden in route mode, show route builder controls */}
                        </div>
                    </>
                )}
            </div>

            {/* Route mode toggle button — only show when map is used in planner or standalone route mode */}
            {(plannerMode || interrailRouteMode) && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
                <button
                    onClick={toggleInterrailRouteMode}
                    className="px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl"
                    style={{
                        background: interrailRouteMode
                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : 'rgba(10,10,12,0.9)',
                        border: `1px solid ${interrailRouteMode ? '#818cf8' : 'rgba(99,102,241,0.3)'}`,
                        color: interrailRouteMode ? 'white' : '#a5b4fc',
                        boxShadow: interrailRouteMode ? '0 8px 32px rgba(99,102,241,0.4)' : '0 4px 16px rgba(0,0,0,0.5)',
                    }}
                >
                    <MapPin size={16} />
                    {interrailRouteMode ? 'Salir Modo Ruta' : 'Construir Ruta Interrail'}
                </button>

                {/* Ver Ruta Completa button */}
                {interrailStops.length >= 2 && (
                    <button
                        onClick={() => {
                            setFitTrigger(prev => prev + 1);
                            if (onOptimize) onOptimize();
                        }}
                        className="px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl"
                        style={{
                            background: 'linear-gradient(135deg, #00f3ff, #0066ff)',
                            border: '1px solid #00f3ff',
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(0,243,255,0.4)',
                        }}
                    >
                        <Sparkles size={16} /> Ver Rutas Reales
                    </button>
                )}

                {/* Clear route */}
                {interrailRouteMode && interrailStops.length > 0 && (
                    <button
                        onClick={clearInterrailStops}
                        className="px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-xl"
                        style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171',
                        }}
                    >
                        <Trash2 size={14} /> Limpiar
                    </button>
                )}
            </div>
            )}

            {/* ═══ INTERRAIL STOPS SIDEBAR ═══ */}
            <AnimatePresence>
                {interrailRouteMode && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute top-20 right-6 z-[1000] w-72"
                    >
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,10,12,0.92)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <MapPin size={14} className="text-indigo-400" />
                                    Tu Ruta ({interrailStops.length})
                                </h3>
                                <button onClick={toggleInterrailRouteMode} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1.5">
                                {interrailStops.length === 0 && (
                                    <div className="text-center py-6 text-gray-500 text-xs">
                                        Haz clic en las estaciones del mapa para construir tu ruta
                                    </div>
                                )}
                                {interrailStops.map((stop, idx) => {
                                    const station = allStations.find(s => s.id === stop.stationId);
                                    const isFirst = idx === 0;
                                    const isLast = idx === interrailStops.length - 1;
                                    return (
                                        <motion.div
                                            key={stop.stationId}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 group"
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isFirst ? 'bg-green-500/20 text-green-400' : isLast ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold truncate">{station?.city || stop.stationId}</div>
                                                <div className="text-[9px] text-gray-600 truncate">{station?.country}</div>
                                            </div>
                                            <button
                                                onClick={() => removeInterrailStop(stop.stationId)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="border-t border-white/5 p-3">
                                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Lightbulb size={10} /> Siguiente parada sugerida
                                    </div>
                                    <div className="space-y-1">
                                        {suggestions.slice(0, 3).map(s => (
                                            <button
                                                key={s.station.id}
                                                onClick={() => addInterrailStop({ stationId: s.station.id, addedFrom: 'map' })}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 transition-colors text-left"
                                            >
                                                <Plus size={10} className="text-amber-400 flex-shrink-0" />
                                                <span className="font-medium text-gray-300 truncate">{s.station.city}</span>
                                                <span className="text-[9px] text-gray-600 ml-auto flex-shrink-0">{s.routes} rutas</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick action: open in planner */}
                            {interrailStops.length >= 2 && (
                                <div className="border-t border-white/5 p-3">
                                    <a
                                        href="/interrail"
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Train size={14} /> Abrir en Planificador
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Network status */}
            <div className="absolute bottom-6 right-6 z-[1000]">
                <div className="glass-card p-3 rounded-xl" style={{ background: 'rgba(10,10,12,0.85)', borderColor: 'rgba(99,102,241,0.15)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-semibold text-white">Red Operativa</span>
                    </div>
                </div>
            </div>

            {/* Active route info (only in normal mode) */}
            {activeRoute && !interrailRouteMode && (() => {
                const from = allStations.find(s => s.id === activeRoute.fromStationId);
                const to = allStations.find(s => s.id === activeRoute.toStationId);
                const fromName = from?.city || activeRoute.fromStationName || activeRoute.fromStationId;
                const toName = to?.city || activeRoute.toStationName || activeRoute.toStationId;
                const fromCountry = from?.country || '';
                const toCountry = to?.country || '';
                const color = getTypeColor(activeRoute.type);
                return (
                    <div className="absolute bottom-6 left-6 z-[1000] w-80">
                        <div className="glass-card p-5 rounded-2xl" style={{ background: 'rgba(10,10,12,0.92)', borderColor: color + '40' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                                        {activeRoute.type === 'NightTrain'
                                            ? <Moon size={18} style={{ color }} />
                                            : <Train size={18} style={{ color }} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{activeRoute.operator}</div>
                                        <div className="text-[10px] font-medium" style={{ color }}>{getTypeLabel(activeRoute.type)}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRouteId(null)}
                                    className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                                >×</button>
                            </div>
                            <div className="flex items-center gap-3 mb-3 py-3 border-y border-white/5">
                                <div className="flex-1">
                                    <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Origen</div>
                                    <div className="text-sm font-bold text-white">{fromName}</div>
                                    {fromCountry && <div className="text-[10px] text-gray-400">{fromCountry}</div>}
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-[1px]" style={{ backgroundColor: color + '50' }} />
                                    <div className="text-[10px]" style={{ color }}>→</div>
                                    <div className="w-8 h-[1px]" style={{ backgroundColor: color + '50' }} />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Destino</div>
                                    <div className="text-sm font-bold text-white">{toName}</div>
                                    {toCountry && <div className="text-[10px] text-gray-400">{toCountry}</div>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock size={12} />
                                        <span className="text-xs font-medium">{formatDuration(activeRoute.departureTime, activeRoute.arrivalTime)}</span>
                                    </div>
                                    {activeRoute.occupancy != null && (
                                        <div className="text-[10px] text-gray-500 px-2 py-0.5 rounded-md bg-white/5">
                                            Ocup. {Math.round(activeRoute.occupancy * 100)}%
                                        </div>
                                    )}
                                </div>
                                {activeRoute.price != null && (
                                    <div className="flex items-center gap-0.5 font-black text-lg" style={{ color }}>
                                        {activeRoute.price}<Euro size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 12px !important; }
                .leaflet-popup-content { margin: 0 !important; }
                .leaflet-popup-tip { background: #0f172a !important; box-shadow: none !important; }
                .leaflet-popup-close-button { display: none !important; }
                .leaflet-container { background: #0a0a0c !important; font-family: 'Inter', system-ui, sans-serif !important; cursor: grab !important; }
                .leaflet-container:active { cursor: grabbing !important; }
                .leaflet-tooltip.station-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
                .leaflet-tooltip.station-tooltip::before { display: none !important; }
                .cursor-pointer { cursor: pointer !important; }
                @keyframes suggestion-pulse-anim {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                .suggestion-pulse { animation: suggestion-pulse-anim 2s ease-in-out infinite; }
                
                @keyframes train-pulse-anim {
                    0%, 100% { filter: drop-shadow(0 0 2px #fff); }
                    50% { filter: drop-shadow(0 0 8px #fff); }
                }
                .train-pulse { animation: train-pulse-anim 1s ease-in-out infinite; }
            `}</style>
        </div>
    );
};
