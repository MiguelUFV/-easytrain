import type { Station, Route } from '../types';
import { routeLimiter, stationLimiter } from './rateLimit';

/**
 * api.ts — Capa de datos multi-API para trenes europeos
 *
 * APIs gratuitas integradas:
 *  1. DB (Deutsche Bahn) v6   → /api-db  — Alemania, Austria, conexiones internacionales
 *  2. SBB (Suiza)             → /api-ch  — Suiza completa (transport.opendata.ch)
 *  3. iRail (Bélgica)         → /api-irail — Bélgica completa (NMBS/SNCB)
 *
 * Fallback: mock data + deep-link a web oficial del operador
 */

// ─── Caché de nombres y coordenadas ──────────────────────────────────────────

const stationNameCache = new Map<string, string>([
    ['8011160', 'Berlin Hbf'],
    ['8010159', 'Hamburg Hbf'],
    ['7100000', 'Madrid-Puerta de Atocha'],
    ['7100018', 'Barcelona-Sants'],
    ['8727100', 'Paris Gare du Nord'],
    ['8400058', 'Amsterdam Centraal'],
    ['8000261', 'München Hbf'],
    ['8503000', 'Zürich HB'],
    ['8000105', 'Köln Hbf'],
    ['8000050', 'Frankfurt(Main)Hbf'],
    ['8507000', 'Bern'],
    ['8505000', 'Basel SBB'],
    ['8501008', 'Genève'],
    ['8505300', 'Lausanne'],
    ['8892007', 'Gent-Sint-Pieters'],
    ['8814001', 'Bruxelles-Midi'],
    ['8821006', 'Antwerpen-Centraal'],
    ['8813003', 'Brugge'],
]);

const stationCoordsCache = new Map<string, { lat: number; lng: number }>();

export const cacheStationName = (id: string, name: string) => stationNameCache.set(id, name);
export const resolveStationName = (id: string): string => stationNameCache.get(id) ?? id;
export const cacheStationCoords = (id: string, location: { latitude?: number; longitude?: number } | null | undefined) => {
    if (location?.latitude && location?.longitude) {
        stationCoordsCache.set(id, { lat: location.latitude, lng: location.longitude });
    }
};
export const resolveStationCoords = (id: string): { lat: number; lng: number } | undefined =>
    stationCoordsCache.get(id);

// ─── Hash determinista (evita Math.random en campos de datos) ─────────────────

function stableHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

// ─── Sanitización de inputs ───────────────────────────────────────────────────

function sanitizeQuery(q: string): string {
    return q.replace(/[<>"'`]/g, '').trim().slice(0, 100);
}

function isValidDate(d: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

// ─── Detección de país/API por ID de estación ─────────────────────────────────

/** Swiss SBB station IDs start with 85 */
const isSwissStation = (id: string) => id.startsWith('85') || id.startsWith('8500') || id.startsWith('8501') || id.startsWith('8503') || id.startsWith('8505') || id.startsWith('8507');

/** Belgian iRail IDs contain "irail" or start with 88 */
const isBelgianStation = (id: string) => id.includes('irail') || id.startsWith('88') || id.startsWith('008');

// ─── Estaciones fallback (siempre disponibles) ────────────────────────────────

export const FALLBACK_STATIONS: Station[] = [
    // España
    { id: '7100000', name: 'Madrid-Puerta de Atocha', city: 'Madrid',    country: 'España',       coordinates: { lat: 40.4068, lng: -3.6921 }, tier: 1 },
    { id: '7100018', name: 'Barcelona-Sants',          city: 'Barcelona', country: 'España',       coordinates: { lat: 41.3789, lng:  2.1402 }, tier: 1 },
    // Alemania
    { id: '8011160', name: 'Berlin Hbf',               city: 'Berlin',    country: 'Alemania',     coordinates: { lat: 52.5251, lng: 13.3694 }, tier: 1 },
    { id: '8000261', name: 'München Hbf',              city: 'München',   country: 'Alemania',     coordinates: { lat: 48.1402, lng: 11.5583 }, tier: 1 },
    { id: '8000105', name: 'Köln Hbf',                 city: 'Köln',      country: 'Alemania',     coordinates: { lat: 50.9433, lng:  6.9586 }, tier: 2 },
    { id: '8000050', name: 'Frankfurt(Main)Hbf',       city: 'Frankfurt', country: 'Alemania',     coordinates: { lat: 50.1072, lng:  8.6637 }, tier: 1 },
    { id: '8010159', name: 'Hamburg Hbf',              city: 'Hamburg',   country: 'Alemania',     coordinates: { lat: 53.5527, lng: 10.0064 }, tier: 1 },
    // Francia
    { id: '8727100', name: 'Paris Gare du Nord',       city: 'Paris',     country: 'Francia',      coordinates: { lat: 48.8828, lng:  2.3556 }, tier: 1 },
    // Países Bajos
    { id: '8400058', name: 'Amsterdam Centraal',       city: 'Amsterdam', country: 'Países Bajos', coordinates: { lat: 52.3791, lng:  4.9003 }, tier: 1 },
    // Suiza
    { id: '8503000', name: 'Zürich HB',                city: 'Zürich',    country: 'Suiza',        coordinates: { lat: 47.3782, lng:  8.5402 }, tier: 1 },
    { id: '8507000', name: 'Bern',                     city: 'Bern',      country: 'Suiza',        coordinates: { lat: 46.9490, lng:  7.4390 }, tier: 2 },
    { id: '8505000', name: 'Basel SBB',                city: 'Basel',     country: 'Suiza',        coordinates: { lat: 47.5476, lng:  7.5897 }, tier: 2 },
    { id: '8501008', name: 'Genève',                   city: 'Ginebra',   country: 'Suiza',        coordinates: { lat: 46.2100, lng:  6.1430 }, tier: 1 },
    // Bélgica
    { id: '8814001', name: 'Bruxelles-Midi',           city: 'Bruselas',  country: 'Bélgica',      coordinates: { lat: 50.8364, lng:  4.3364 }, tier: 1 },
    { id: '8821006', name: 'Antwerpen-Centraal',       city: 'Amberes',   country: 'Bélgica',      coordinates: { lat: 51.2170, lng:  4.4213 }, tier: 2 },
    { id: '8813003', name: 'Brugge',                   city: 'Brujas',    country: 'Bélgica',      coordinates: { lat: 51.1973, lng:  3.2162 }, tier: 2 },
    // Italia
    { id: '8300011', name: 'Roma Termini',             city: 'Roma',      country: 'Italia',       coordinates: { lat: 41.9009, lng: 12.5012 }, tier: 1 },
    { id: '8300003', name: 'Milano Centrale',          city: 'Milán',     country: 'Italia',       coordinates: { lat: 45.4855, lng:  9.2045 }, tier: 1 },
];

// ─── API DB (Deutsche Bahn) ───────────────────────────────────────────────────

async function fetchStationsFromDB(query: string): Promise<Station[]> {
    const res = await fetch(`/api-db/locations?query=${encodeURIComponent(query)}&results=8&fuzzy=true`);
    if (!res.ok) throw new Error(`DB API ${res.status}`);
    const data: any[] = await res.json();
    return data
        .filter((loc: any) => loc.type === 'station')
        .map((loc: any) => {
            const station: Station = {
                id: String(loc.id),
                name: loc.name,
                city: loc.address?.city ?? loc.name.split(',')[0],
                country: loc.address?.country ?? 'Europa',
                coordinates: loc.location
                    ? { lat: loc.location.latitude, lng: loc.location.longitude }
                    : undefined,
            };
            cacheStationName(station.id, station.name);
            return station;
        });
}

async function fetchRoutesFromDB(fromId: string, toId: string, date?: string): Promise<Route[]> {
    let url = `/api-db/journeys?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&results=6&stopovers=true`;
    if (date && isValidDate(date)) url += `&departure=${encodeURIComponent(date + 'T00:00:00')}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`DB API ${res.status}`);
    const data = await res.json();
    if (!data?.journeys?.length) return [];

    return data.journeys.map((j: any) => {
        const legs = j.legs.filter((l: any) => l.origin && l.destination);
        const first = legs[0];
        const last = legs[legs.length - 1];

        const stops = buildStopsFromLegs(legs);
        const operators = [...new Set<string>(legs.map((l: any) => l.line?.operator?.name || l.line?.name).filter(Boolean))];
        const lineNames = legs.map((l: any) => l.line?.name || l.line?.id).filter(Boolean);

        const stableId = j.refreshToken || `db-${first.origin.id}-${last.destination.id}-${first.departure}`;
        cacheStationName(first.origin.id, first.origin.name);
        cacheStationName(last.destination.id, last.destination.name);

        return buildRoute({
            id: stableId,
            fromStationId: first.origin.id,
            toStationId: last.destination.id,
            fromStationName: first.origin.name,
            toStationName: last.destination.name,
            fromCoords: first.origin.location,
            toCoords: last.destination.location,
            departureTime: first.departure,
            arrivalTime: last.arrival,
            price: j.price?.amount,
            operator: operators.join(' → ') || 'DB',
            type: legs.length > 1 ? `${legs.length} tramos` : (first.line?.product || 'Train'),
            platform: first.departurePlatform,
            delay: first.departureDelay ? Math.floor(first.departureDelay / 60) : 0,
            lineName: lineNames.join(' → '),
            legs: legs.length,
            stops,
        });
    });
}

// ─── API SBB (Suiza — transport.opendata.ch) ──────────────────────────────────

async function fetchStationsFromSBB(query: string): Promise<Station[]> {
    const res = await fetch(`/api-ch/locations?query=${encodeURIComponent(query)}&type=station`);
    if (!res.ok) throw new Error(`SBB API ${res.status}`);
    const data = await res.json();
    return (data.stations ?? []).map((s: any) => {
        const station: Station = {
            id: String(s.id ?? s.name),
            name: s.name,
            city: s.name,
            country: 'Suiza',
            coordinates: s.coordinate ? { lat: s.coordinate.x, lng: s.coordinate.y } : undefined,
        };
        cacheStationName(station.id, station.name);
        return station;
    });
}

async function fetchRoutesFromSBB(from: string, to: string, date?: string): Promise<Route[]> {
    // opendata.ch acepta nombre o ID de estación
    let url = `/api-ch/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=5`;
    if (date && isValidDate(date)) {
        url += `&date=${encodeURIComponent(date)}&time=06%3A00`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SBB API ${res.status}`);
    const data = await res.json();
    if (!data?.connections?.length) return [];

    return data.connections.map((c: any) => {
        const fromStation = c.from?.station;
        const toStation = c.to?.station;
        const sections: any[] = c.sections ?? [];
        const operators = [...new Set<string>(sections.map((s: any) => s.journey?.operator).filter(Boolean))];
        const categories = [...new Set<string>(sections.map((s: any) => s.journey?.category).filter(Boolean))];
        const stableId = `ch-${fromStation?.id}-${toStation?.id}-${c.from?.departure}`;

        return buildRoute({
            id: stableId,
            fromStationId: String(fromStation?.id ?? from),
            toStationId: String(toStation?.id ?? to),
            fromStationName: fromStation?.name ?? from,
            toStationName: toStation?.name ?? to,
            fromCoords: fromStation?.coordinate ? { latitude: fromStation.coordinate.x, longitude: fromStation.coordinate.y } : null,
            toCoords: toStation?.coordinate ? { latitude: toStation.coordinate.x, longitude: toStation.coordinate.y } : null,
            departureTime: c.from?.departure,
            arrivalTime: c.to?.arrival,
            price: undefined, // SBB API no devuelve precios
            operator: operators.join(' → ') || 'SBB',
            type: categories.join('/') || 'Train',
            platform: c.from?.platform,
            delay: 0,
            lineName: categories.join('/'),
            legs: sections.length || 1,
            stops: sections.map((s: any) => ({
                stationId: String(s.departure?.station?.id ?? ''),
                stationName: s.departure?.station?.name ?? '',
                departureTime: s.departure?.departure,
                arrivalTime: s.arrival?.arrival,
                platform: s.departure?.platform,
                delay: 0,
                coordinates: s.departure?.station?.coordinate
                    ? { lat: s.departure.station.coordinate.x, lng: s.departure.station.coordinate.y }
                    : undefined,
            })),
        });
    });
}

// ─── API iRail (Bélgica) ──────────────────────────────────────────────────────

let irailStationCache: Station[] | null = null;

async function fetchAllIrailStations(): Promise<Station[]> {
    if (irailStationCache) return irailStationCache;
    const res = await fetch('/api-irail/stations/?lang=es&format=json');
    if (!res.ok) throw new Error(`iRail stations ${res.status}`);
    const data = await res.json();
    const list: Station[] = (data['@graph'] ?? []).map((s: any) => {
        const id = String(s['@id']).split('/').pop() ?? s.name;
        const station: Station = {
            id,
            name: s.name,
            city: s.name,
            country: 'Bélgica',
            coordinates: s.latitude && s.longitude
                ? { lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }
                : undefined,
        };
        cacheStationName(id, s.name);
        return station;
    });
    irailStationCache = list;
    return list;
}

async function fetchStationsFromIrail(query: string): Promise<Station[]> {
    const all = await fetchAllIrailStations();
    const q = query.toLowerCase();
    return all.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
}

async function fetchRoutesFromIrail(from: string, to: string, date?: string): Promise<Route[]> {
    // iRail espera nombres de estación
    const fromName = stationNameCache.get(from) ?? from;
    const toName = stationNameCache.get(to) ?? to;

    // Formato de fecha: DDMMYY, hora: HHMM
    let dateParam = '';
    let timeParam = '0600';
    if (date && isValidDate(date)) {
        const [y, m, d] = date.split('-');
        dateParam = `${d}${m}${y.slice(2)}`;
    } else {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear()).slice(2);
        dateParam = `${d}${m}${y}`;
    }

    const url = `/api-irail/connections/?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}&date=${dateParam}&time=${timeParam}&format=json&lang=es`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`iRail connections ${res.status}`);
    const data = await res.json();
    if (!data?.connection?.length) return [];

    return data.connection.slice(0, 6).map((c: any) => {
        const depTime = new Date(parseInt(c.departure.time) * 1000).toISOString();
        const arrTime = new Date(parseInt(c.arrival.time) * 1000).toISOString();
        const stableId = `irail-${c.departure.stationinfo?.['@id']}-${c.arrival.stationinfo?.['@id']}-${c.departure.time}`;
        const vias: any[] = c.vias?.via ?? [];

        return buildRoute({
            id: stableId,
            fromStationId: String(c.departure.stationinfo?.['@id'] ?? from).split('/').pop() ?? from,
            toStationId: String(c.arrival.stationinfo?.['@id'] ?? to).split('/').pop() ?? to,
            fromStationName: c.departure.station,
            toStationName: c.arrival.station,
            fromCoords: c.departure.stationinfo
                ? { latitude: parseFloat(c.departure.stationinfo.locationY), longitude: parseFloat(c.departure.stationinfo.locationX) }
                : null,
            toCoords: c.arrival.stationinfo
                ? { latitude: parseFloat(c.arrival.stationinfo.locationY), longitude: parseFloat(c.arrival.stationinfo.locationX) }
                : null,
            departureTime: depTime,
            arrivalTime: arrTime,
            price: undefined,
            operator: 'NMBS/SNCB',
            type: vias.length > 0 ? `${vias.length + 1} tramos` : 'Train',
            platform: c.departure.platform,
            delay: parseInt(c.departure.delay ?? '0') / 60,
            lineName: c.departure.vehicle ?? '',
            legs: vias.length + 1,
            stops: vias.map((v: any) => ({
                stationId: String(v.stationinfo?.['@id'] ?? '').split('/').pop() ?? v.station,
                stationName: v.station,
                arrivalTime: v.arrival ? new Date(parseInt(v.arrival.time) * 1000).toISOString() : undefined,
                departureTime: v.departure ? new Date(parseInt(v.departure.time) * 1000).toISOString() : undefined,
                platform: v.departure?.platform,
                delay: parseInt(v.departure?.delay ?? '0') / 60,
                coordinates: v.stationinfo
                    ? { lat: parseFloat(v.stationinfo.locationY), lng: parseFloat(v.stationinfo.locationX) }
                    : undefined,
                isTransfer: true,
            })),
        });
    });
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function buildStopsFromLegs(legs: any[]) {
    const stops: Route['stops'] = [];
    for (let li = 0; li < legs.length; li++) {
        const leg = legs[li];
        if (leg.origin?.name) cacheStationName(leg.origin.id, leg.origin.name);
        if (leg.destination?.name) cacheStationName(leg.destination.id, leg.destination.name);

        for (const s of leg.stopovers ?? []) {
            if (!s.stop) continue;
            stops.push({
                stationId: s.stop.id,
                stationName: s.stop.name,
                arrivalTime: s.arrival,
                departureTime: s.departure,
                platform: s.departurePlatform || s.arrivalPlatform,
                delay: s.departureDelay ? Math.floor(s.departureDelay / 60) : 0,
                coordinates: s.stop.location
                    ? { lat: s.stop.location.latitude, lng: s.stop.location.longitude }
                    : undefined,
            });
        }

        if (li < legs.length - 1) {
            const next = legs[li + 1];
            stops.push({
                stationId: leg.destination.id,
                stationName: `🔄 Transbordo: ${leg.destination.name}`,
                arrivalTime: leg.arrival,
                departureTime: next.departure,
                platform: next.departurePlatform,
                isTransfer: true,
            });
        }
    }
    return stops;
}

interface RouteParams {
    id: string;
    fromStationId: string;
    toStationId: string;
    fromStationName: string;
    toStationName: string;
    fromCoords?: { latitude?: number; longitude?: number } | null;
    toCoords?: { latitude?: number; longitude?: number } | null;
    departureTime: string;
    arrivalTime: string;
    price?: number;
    operator: string;
    type: string;
    platform?: string;
    delay?: number;
    lineName?: string;
    legs?: number;
    stops?: Route['stops'];
}

function buildRoute(p: RouteParams): Route {
    const occupancy = (stableHash(p.id) % 100) / 100;
    return {
        id: p.id,
        fromStationId: p.fromStationId,
        toStationId: p.toStationId,
        fromStationName: p.fromStationName,
        toStationName: p.toStationName,
        fromCoordinates: p.fromCoords?.latitude != null && p.fromCoords?.longitude != null
            ? { lat: p.fromCoords.latitude, lng: p.fromCoords.longitude }
            : undefined,
        toCoordinates: p.toCoords?.latitude != null && p.toCoords?.longitude != null
            ? { lat: p.toCoords.latitude, lng: p.toCoords.longitude }
            : undefined,
        departureTime: p.departureTime,
        arrivalTime: p.arrivalTime,
        price: p.price,
        operator: p.operator,
        type: p.type,
        platform: p.platform,
        delay: p.delay ?? 0,
        lineName: p.lineName,
        legs: p.legs ?? 1,
        occupancy,
        stops: p.stops ?? [],
    };
}

// ─── Rutas mock (último recurso) ─────────────────────────────────────────────

function getMockRoutes(fromId: string, toId: string): Route[] {
    if (fromId.includes('7100000') && toId.includes('8727100')) {
        return [{
            id: `mock-mad-par-${fromId}-${toId}`,
            fromStationId: '7100000',
            toStationId: '8727100',
            fromStationName: 'Madrid-Puerta de Atocha',
            toStationName: 'Paris Gare du Nord',
            departureTime: new Date().toISOString(),
            arrivalTime: new Date(Date.now() + 3_600_000 * 11).toISOString(),
            price: 124.50,
            operator: 'Renfe AVE + SNCF TGV',
            type: '2 transbordos',
            legs: 3,
            occupancy: 0.85,
            stops: [
                { stationId: '7100600', stationName: 'Zaragoza-Delicias',                 coordinates: { lat: 41.6592, lng: -0.9123 } },
                { stationId: '7100018', stationName: '🔄 Transbordo: Barcelona-Sants',     coordinates: { lat: 41.3789, lng:  2.1402 }, isTransfer: true },
                { stationId: '8775000', stationName: '🔄 Transbordo: Marseille St-Charles',coordinates: { lat: 43.3026, lng:  5.3804 }, isTransfer: true },
                { stationId: '8768600', stationName: 'Lyon Part-Dieu',                     coordinates: { lat: 45.7606, lng:  4.8597 } },
            ],
        }];
    }
    return [{
        id: `mock-${stableHash(fromId + toId)}`,
        fromStationId: fromId,
        toStationId: toId,
        fromStationName: resolveStationName(fromId),
        toStationName: resolveStationName(toId),
        departureTime: new Date().toISOString(),
        arrivalTime: new Date(Date.now() + 3_600_000 * 2).toISOString(),
        price: 45.50,
        operator: 'Rail Express',
        type: 'Alta Velocidad',
        platform: '4',
        delay: 0,
        lineName: 'RE 123',
        occupancy: 0.3,
        stops: [],
    }];
}

// ─── API Pública ──────────────────────────────────────────────────────────────

export async function fetchStations(query: string = ''): Promise<Station[]> {
    if (!query.trim()) return FALLBACK_STATIONS;

    if (!stationLimiter.canCall()) {
        console.warn('Rate limit: demasiadas búsquedas de estaciones');
        return FALLBACK_STATIONS.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.city.toLowerCase().includes(query.toLowerCase())
        );
    }

    const safe = sanitizeQuery(query);
    if (safe.length < 2) return FALLBACK_STATIONS;

    // Lanzar las 3 APIs en paralelo; usar las que respondan
    const [dbResult, chResult, irailResult] = await Promise.allSettled([
        fetchStationsFromDB(safe),
        fetchStationsFromSBB(safe),
        fetchStationsFromIrail(safe),
    ]);

    const results: Station[] = [];
    const seen = new Set<string>();

    for (const r of [dbResult, chResult, irailResult]) {
        if (r.status === 'fulfilled') {
            for (const s of r.value) {
                const key = s.name.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push(s);
                }
            }
        }
    }

    if (results.length > 0) return results;

    // Fallback local
    return FALLBACK_STATIONS.filter(s =>
        s.name.toLowerCase().includes(safe.toLowerCase()) ||
        s.city.toLowerCase().includes(safe.toLowerCase())
    );
}

export async function fetchRoutes(fromId?: string, toId?: string, date?: string): Promise<Route[]> {
    if (!fromId || !toId) return [];

    if (!routeLimiter.canCall()) {
        console.warn('Rate limit: demasiadas búsquedas de rutas');
        return getMockRoutes(fromId, toId);
    }

    const validDate = date && isValidDate(date) ? date : undefined;

    // Determinar qué APIs usar según el origen/destino
    const useDB    = true; // siempre intentamos DB
    const useSBB   = isSwissStation(fromId) || isSwissStation(toId);
    const useIrail = isBelgianStation(fromId) || isBelgianStation(toId);

    const promises: Promise<Route[]>[] = [];
    if (useDB)    promises.push(fetchRoutesFromDB(fromId, toId, validDate).catch(() => []));
    if (useSBB)   promises.push(fetchRoutesFromSBB(stationNameCache.get(fromId) ?? fromId, stationNameCache.get(toId) ?? toId, validDate).catch(() => []));
    if (useIrail) promises.push(fetchRoutesFromIrail(fromId, toId, validDate).catch(() => []));

    const results = await Promise.all(promises);
    const merged = results.flat();

    // Deduplicar por (origen, destino, hora salida)
    const seen = new Set<string>();
    const unique = merged.filter(r => {
        const key = `${r.fromStationId}-${r.toStationId}-${r.departureTime}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Ordenar por hora de salida
    unique.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    return unique.length > 0 ? unique : getMockRoutes(fromId, toId);
}

export async function fetchPopularRoutes(): Promise<Route[]> {
    try {
        return await fetchRoutes('8011160', '8010159'); // Berlin → Hamburg (ruta popular real)
    } catch {
        return getMockRoutes('8011160', '8010159');
    }
}
