import type { Station, Route } from '../types';
import { routeLimiter, stationLimiter, RateLimitError } from './rateLimit';

// ─── Fetch con timeout ──────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * api.ts — Capa de datos multi-API para trenes europeos
 *
 * APIs gratuitas integradas:
 *  1. DB (Deutsche Bahn) v6   → /api-db    — Alemania + conexiones internacionales
 *  2. SBB (Suiza)             → /api-ch    — Suiza completa (transport.opendata.ch)
 *  3. iRail (Bélgica)         → /api-irail — Bélgica completa (NMBS/SNCB)
 *  4. ÖBB (Austria)           → /api-oebb  — Austria completa (HAFAS)
 *  5. PKP (Polonia)           → /api-pkp   — Polonia completa (HAFAS)
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
    ['8300003', 'Milano Centrale'],
    ['8300259', 'Roma Termini'],
    ['8300051', 'Firenze Santa Maria Novella'],
    ['8300150', 'Venezia Santa Lucia'],
    ['7100002', 'Valencia-Joaquín Sorolla'],
    ['8100002', 'Wien Hbf'],
    ['8100173', 'Salzburg Hbf'],
    ['8100108', 'Innsbruck Hbf'],
    ['8774100', 'Lyon Part-Dieu'],
    ['8775100', 'Marseille Saint-Charles'],
    ['8400282', 'Rotterdam Centraal'],
    ['8400561', 'Utrecht Centraal'],
    ['8600626', 'København H'],
    ['7400001', 'Stockholm Central'],
    ['7600100', 'Oslo Sentralstasjon'],
    ['9400006', 'Lisboa Santa Apolónia'],
    ['9400007', 'Porto Campanhã'],
    ['5100028', 'Warszawa Centralna'],
    ['5100075', 'Kraków Główny'],
    ['5400014', 'Praha hlavní nádraží'],
    ['5500017', 'Budapest Keleti'],
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

// ─── Mapeo de Operadores Oficiales por Prefijo de País (UIC) ────────────────
const OFFICIAL_OPERATORS: Record<string, { name: string; url: (from: string, to: string) => string }> = {
    '71': { 
        name: 'Renfe', 
        url: (f, t) => `https://www.renfe.com/es/es/planifica-tu-viaje/buscador-de-billetes.html?origen=${encodeURIComponent(f)}&destino=${encodeURIComponent(t)}` 
    },
    '87': { 
        name: 'SNCF (Francia)', 
        url: (f, t) => `https://www.sncf-connect.com/app/train/search?origin=${encodeURIComponent(f)}&destination=${encodeURIComponent(t)}` 
    },
    '83': { 
        name: 'Trenitalia (Italia)', 
        url: () => 'https://www.trenitalia.com/' 
    },
    '81': { 
        name: 'ÖBB (Austria)', 
        url: (f, t) => `https://tickets.oebb.at/en/ticket?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}` 
    },
    '84': { 
        name: 'NS (Países Bajos)', 
        url: (f, t) => `https://www.ns.nl/reisplanner/#/?vertrek=${encodeURIComponent(f)}&aankomst=${encodeURIComponent(t)}` 
    },
    '94': { 
        name: 'CP (Portugal)', 
        url: () => 'https://www.cp.pt/passageiros/en/buy-tickets' 
    },
    '70': { 
        name: 'National Rail (UK)', 
        url: () => 'https://www.nationalrail.co.uk/' 
    },
    '51': {
        name: 'PKP (Polonia)',
        url: () => 'https://www.intercity.pl/en/'
    },
    '54': {
        name: 'ČD (Rep. Checa)',
        url: (f, t) => `https://www.cd.cz/en/spojeni-a-jizdenka/spojeni-tam?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`
    },
    '55': {
        name: 'MÁV (Hungría)',
        url: () => 'https://jegy.mav.hu/'
    },
    '74': {
        name: 'SJ (Suecia)',
        url: () => 'https://www.sj.se/en/'
    },
    '76': {
        name: 'Vy (Noruega)',
        url: () => 'https://www.vy.no/en'
    },
    '86': {
        name: 'DSB (Dinamarca)',
        url: () => 'https://www.dsb.dk/en/'
    },
    '82': {
        name: 'CFL (Luxemburgo)',
        url: () => 'https://www.cfl.lu/en-gb'
    },
    '10': {
        name: 'VR (Finlandia)',
        url: () => 'https://www.vr.fi/en'
    },
    '53': {
        name: 'CFR (Rumanía)',
        url: () => 'https://www.cfrcalatori.ro/en/'
    },
    '52': {
        name: 'BDZ (Bulgaria)',
        url: () => 'https://bileti.bdz.bg/en/'
    },
    '72': {
        name: 'Srbija Voz (Serbia)',
        url: () => 'https://srbvoz.rs/en/'
    },
    '60': {
        name: 'IE (Irlanda)',
        url: () => 'https://www.irishrail.ie/en-ie/'
    }
};

/** Determina si una ruta tiene soporte de API de tiempo real */
export function isRegionSupported(fromId: string, toId: string): boolean {
    const supportedPrefixes = [
        '80', '85', '88', '81', '84', '83', '87', '71', // DE, CH, BE, AT, NL, IT, FR, ES
        '51', '54', '55', '74', '76', '86', '82', '10', // PL, CZ, HU, SE, NO, DK, LU, FI
        '53', '52', '72', '73', '60', '70'              // RO, BG, XS, GR, IE, UK
    ]; 

    const fromPrefix = fromId.substring(0, 2);
    const toPrefix = toId.substring(0, 2);

    // Necesitamos que AL MENOS una estación esté en un país con API soportada
    // (DB puede resolver rutas internacionales si una estación está en su red)
    const fromSupported = supportedPrefixes.includes(fromPrefix);
    const toSupported = supportedPrefixes.includes(toPrefix);

    return fromSupported || toSupported;
}

/** Obtiene la información del operador oficial fallback para regiones sin API */
export function getOfficialFallback(fromId: string, toId: string) {
    const prefix = fromId.substring(0, 2);
    const op = OFFICIAL_OPERATORS[prefix];
    if (!op) return null;
    
    const fromName = resolveStationName(fromId);
    const toName = resolveStationName(toId);
    
    return {
        name: op.name,
        url: op.url(fromName, toName)
    };
}

// ─── Mapeo de Operadores por nombre de país (para el Diseñador Interrail) ──
const COUNTRY_OPERATORS: Record<string, { name: string; url: string }> = {
    'España': { name: 'Renfe', url: 'https://www.renfe.com/' },
    'Francia': { name: 'SNCF', url: 'https://www.sncf-connect.com/' },
    'Italia': { name: 'Trenitalia', url: 'https://www.trenitalia.com/' },
    'Portugal': { name: 'CP', url: 'https://www.cp.pt/' },
    'Reino Unido': { name: 'National Rail', url: 'https://www.nationalrail.co.uk/' },
    'Irlanda': { name: 'Irish Rail', url: 'https://www.irishrail.ie/' },
    'Países Bajos': { name: 'NS', url: 'https://www.ns.nl/' },
    'Bélgica': { name: 'SNCB/NMBS', url: 'https://www.belgiantrain.be/' },
    'Luxemburgo': { name: 'CFL', url: 'https://www.cfl.lu/' },
    'Polonia': { name: 'PKP', url: 'https://www.intercity.pl/' },
    'Rep. Checa': { name: 'České dráhy', url: 'https://www.cd.cz/' },
    'Hungría': { name: 'MÁV', url: 'https://www.mavcsoport.hu/' },
    'Grecia': { name: 'Hellenic Train', url: 'https://www.hellenictrain.gr/' },
    'Croacia': { name: 'HŽ Putnički prijevoz', url: 'https://www.hzpp.hr/' },
    'Eslovenia': { name: 'Slovenske železnice', url: 'https://potniski.sz.si/' },
    'Rumanía': { name: 'CFR Călători', url: 'https://www.cfrcalatori.ro/' },
    'Bulgaria': { name: 'BDZ', url: 'https://www.bdz.bg/' },
    'Turquía': { name: 'TCDD', url: 'https://www.tcddtasimacilik.gov.tr/' },
    'Noruega': { name: 'Vy', url: 'https://www.vy.no/' },
    'Suecia': { name: 'SJ', url: 'https://www.sj.se/' },
    'Finlandia': { name: 'VR', url: 'https://www.vr.fi/' },
    'Dinamarca': { name: 'DSB', url: 'https://www.dsb.dk/' },
    'Estonia': { name: 'Elron', url: 'https://elron.ee/' },
    'Letonia': { name: 'Pasažieru vilciens', url: 'https://www.pv.lv/' },
    'Lituania': { name: 'LTG Link', url: 'https://ltglink.lt/' },
};

/** Determina si un país tiene soporte de API real completo */
export function isCountrySupported(country: string): boolean {
    const supported = [
        'Alemania', 'Suiza', 'Austria', 'España', 'Francia', 'Italia', 'Países Bajos', 'Portugal',
        'Polonia', 'Rep. Checa', 'Hungría', 'Suecia', 'Noruega', 'Dinamarca', 'Luxemburgo', 'Finlandia',
        'Rumanía', 'Bulgaria', 'Serbia', 'Grecia', 'Irlanda', 'Reino Unido'
    ];

    return supported.includes(country);
}

/** Obtiene el link oficial por nombre de país */
export function getOfficialLinkByCountry(country: string) {
    return COUNTRY_OPERATORS[country] || null;
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

/** Austrian station IDs start with 81 */
const isAustrianStation = (id: string) => id.startsWith('81') || id.startsWith('8100');

/** Polish station IDs start with 51 */
const isPolishStation = (id: string) => id.startsWith('51') || id.startsWith('5100');

/** UIC Country Prefixes */
const UIC_COUNTRIES: Record<string, string> = {
    '80': 'Alemania',
    '85': 'Suiza',
    '88': 'Bélgica',
    '81': 'Austria',
    '84': 'Países Bajos',
    '87': 'Francia',
    '83': 'Italia',
    '71': 'España',
    '94': 'Portugal',
    '70': 'Reino Unido',
    '51': 'Polonia',
    '54': 'Rep. Checa',
    '55': 'Hungría',
    '74': 'Suecia',
    '76': 'Noruega',
    '86': 'Dinamarca',
    '82': 'Luxemburgo',
    '10': 'Finlandia',
    '53': 'Rumanía',
    '52': 'Bulgaria',
    '72': 'Serbia',
    '73': 'Grecia',
    '56': 'Eslovaquia',
    '78': 'Croacia',
    '79': 'Eslovenia',
    '44': 'Turquía',
    '25': 'Lituania',
    '26': 'Letonia',
    '27': 'Estonia',
    '60': 'Irlanda'

};

function getCountryFromId(id: string): string {
    const prefix = id.substring(0, 2);
    return UIC_COUNTRIES[prefix] || 'Europa';
}

// ─── Estaciones fallback (siempre disponibles) ────────────────────────────────

export const FALLBACK_STATIONS: Station[] = [
    // España
    { id: '7100000', name: 'Madrid-Puerta de Atocha', city: 'Madrid',    country: 'España',       coordinates: { lat: 40.4068, lng: -3.6921 }, tier: 1 },
    { id: '7100018', name: 'Barcelona-Sants',          city: 'Barcelona', country: 'España',       coordinates: { lat: 41.3789, lng:  2.1402 }, tier: 1 },
    { id: '7100002', name: 'Valencia-Joaquín Sorolla', city: 'Valencia',  country: 'España',       coordinates: { lat: 39.4589, lng: -0.3813 }, tier: 1 },
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
    { id: '8300259', name: 'Roma Termini',             city: 'Roma',      country: 'Italia',       coordinates: { lat: 41.9009, lng: 12.5012 }, tier: 1 },
    { id: '8300003', name: 'Milano Centrale',          city: 'Milán',     country: 'Italia',       coordinates: { lat: 45.4855, lng:  9.2045 }, tier: 1 },
    { id: '8300051', name: 'Firenze Santa Maria Novella', city: 'Florencia', country: 'Italia',    coordinates: { lat: 43.7764, lng: 11.2481 }, tier: 2 },
    { id: '8300150', name: 'Venezia Santa Lucia',      city: 'Venecia',   country: 'Italia',       coordinates: { lat: 45.4410, lng: 12.3215 }, tier: 2 },
    // Austria
    { id: '8100002', name: 'Wien Hbf',                 city: 'Viena',     country: 'Austria',      coordinates: { lat: 48.1853, lng: 16.3769 }, tier: 1 },
    { id: '8100173', name: 'Salzburg Hbf',             city: 'Salzburgo', country: 'Austria',      coordinates: { lat: 47.8131, lng: 13.0458 }, tier: 2 },
    { id: '8100108', name: 'Innsbruck Hbf',            city: 'Innsbruck', country: 'Austria',      coordinates: { lat: 47.2632, lng: 11.4010 }, tier: 2 },
    // Francia
    { id: '8727100', name: 'Paris Gare de Lyon',       city: 'Paris',     country: 'Francia',      coordinates: { lat: 48.8448, lng:  2.3735 }, tier: 1 },
    { id: '8774100', name: 'Lyon Part-Dieu',           city: 'Lyon',      country: 'Francia',      coordinates: { lat: 45.7606, lng:  4.8598 }, tier: 2 },
    { id: '8775100', name: 'Marseille Saint-Charles',  city: 'Marsella',  country: 'Francia',      coordinates: { lat: 43.3031, lng:  5.3804 }, tier: 2 },
    // Países Bajos
    { id: '8400282', name: 'Rotterdam Centraal',       city: 'Róterdam',  country: 'Países Bajos', coordinates: { lat: 51.9244, lng:  4.4693 }, tier: 2 },
    { id: '8400561', name: 'Utrecht Centraal',         city: 'Utrecht',   country: 'Países Bajos', coordinates: { lat: 52.0893, lng:  5.1101 }, tier: 2 },
    // Dinamarca
    { id: '8600626', name: 'København H',              city: 'Copenhague', country: 'Dinamarca',   coordinates: { lat: 55.6726, lng: 12.5648 }, tier: 1 },
    // Suecia
    { id: '7400001', name: 'Stockholm Central',        city: 'Estocolmo', country: 'Suecia',       coordinates: { lat: 59.3309, lng: 18.0580 }, tier: 1 },
    // Noruega
    { id: '7600100', name: 'Oslo Sentralstasjon',      city: 'Oslo',      country: 'Noruega',      coordinates: { lat: 59.9109, lng: 10.7530 }, tier: 1 },
    // Portugal
    { id: '9400006', name: 'Lisboa Santa Apolónia',    city: 'Lisboa',    country: 'Portugal',     coordinates: { lat: 38.7139, lng: -9.1228 }, tier: 1 },
    { id: '9400007', name: 'Porto Campanhã',           city: 'Oporto',    country: 'Portugal',     coordinates: { lat: 41.1488, lng: -8.5854 }, tier: 2 },
    // Polonia
    { id: '5100028', name: 'Warszawa Centralna',       city: 'Varsovia',  country: 'Polonia',      coordinates: { lat: 52.2288, lng: 21.0032 }, tier: 1 },
    { id: '5100075', name: 'Kraków Główny',            city: 'Cracovia',  country: 'Polonia',      coordinates: { lat: 50.0674, lng: 19.9480 }, tier: 2 },
    // Rep. Checa
    { id: '5400014', name: 'Praha hlavní nádraží',     city: 'Praga',     country: 'Rep. Checa',   coordinates: { lat: 50.0833, lng: 14.4350 }, tier: 1 },
    // Hungría
    { id: '5500017', name: 'Budapest Keleti',          city: 'Budapest',  country: 'Hungría',      coordinates: { lat: 47.5006, lng: 19.0840 }, tier: 1 },
];

// ─── API Renfe (España — CKAN DataStore) ─────────────────────────────────────

const RENFE_STATIONS_RES_ID = '783e0626-6fa8-4ac7-a880-fa53144654ff';

async function fetchStationsFromRenfe(query: string): Promise<Station[]> {
    try {
        const url = `https://data.renfe.com/api/3/action/datastore_search?resource_id=${RENFE_STATIONS_RES_ID}&q=${encodeURIComponent(query)}&limit=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Renfe API ${res.status}`);
        const data = await res.json();
        
        return (data.result?.records ?? []).map((r: any) => {
            const id = String(r.CODIGO);
            const station: Station = {
                id,
                name: r.DESCRIPCION,
                city: r.POBLACION || r.PROVINCIA,
                country: 'España',
                coordinates: r.LATITUD && r.LONGITUD 
                    ? { lat: parseFloat(r.LATITUD), lng: parseFloat(r.LONGITUD) } 
                    : undefined,
            };
            cacheStationName(id, station.name);
            if (station.coordinates) cacheStationCoords(id, { latitude: station.coordinates.lat, longitude: station.coordinates.lng });
            return station;
        });
    } catch (e) {
        console.error('Error fetching Renfe stations:', e);
        return [];
    }
}

// ─── API SNCF (Francia — Opendatasoft) ────────────────────────────────────────

async function fetchStationsFromSNCF(query: string): Promise<Station[]> {
    try {
        const url = `https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/liste-des-gares/records?where=search(libelle%2C%20%22${encodeURIComponent(query)}%22)%20or%20search(commune%2C%20%22${encodeURIComponent(query)}%22)&limit=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`SNCF API ${res.status}`);
        const data = await res.json();
        
        return (data.results ?? [])
            .filter((r: any) => r.voyageurs === 'O') // Solo estaciones de pasajeros
            .map((r: any) => {
                const id = String(r.code_uic);
                const station: Station = {
                    id,
                    name: r.libelle,
                    city: r.commune,
                    country: 'Francia',
                    coordinates: r.c_geo 
                        ? { lat: r.c_geo.lat, lng: r.c_geo.lon } 
                        : undefined,
                };
                cacheStationName(id, station.name);
                if (station.coordinates) cacheStationCoords(id, { latitude: station.coordinates.lat, longitude: station.coordinates.lng });
                return station;
            });
    } catch (e) {
        console.error('Error fetching SNCF stations:', e);
        return [];
    }
}

// ─── API DB (Deutsche Bahn) ───────────────────────────────────────────────────

async function fetchStationsFromDB(query: string): Promise<Station[]> {
    const res = await fetchWithTimeout(`/api-db/locations?query=${encodeURIComponent(query)}&results=8&fuzzy=true`);
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
    const now = new Date();
    const isToday = !date || date === now.toISOString().split('T')[0];
    
    // Si es hoy, buscamos a partir de la hora actual. Si es futuro, a mediodía para pillar más trenes.
    let time = '12:00:00';
    if (isToday) {
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        time = `${h}:${m}:00`;
    }

    const searchDate = date && isValidDate(date) ? date : now.toISOString().split('T')[0];
    let url = `/api-db/journeys?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&results=10&stopovers=true&departure=${encodeURIComponent(searchDate + 'T' + time)}`;

    const res = await fetchWithTimeout(url);
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
    const res = await fetchWithTimeout(`/api-ch/locations?query=${encodeURIComponent(query)}&type=station`);
    if (!res.ok) throw new Error(`SBB API ${res.status}`);
    const data = await res.json();
    return (data.stations ?? []).map((s: any) => {
        const id = String(s.id ?? s.name);
        const station: Station = {
            id,
            name: s.name,
            city: s.name,
            country: getCountryFromId(id),
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
    const res = await fetchWithTimeout(url);
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
    const res = await fetchWithTimeout('/api-irail/stations/?lang=es&format=json');
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
    const res = await fetchWithTimeout(url);
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

// ─── API ÖBB (Austria — HAFAS) ───────────────────────────────────────────────

async function fetchStationsFromOEBB(query: string): Promise<Station[]> {
    const res = await fetchWithTimeout(`/api-oebb/locations?query=${encodeURIComponent(query)}&results=8&fuzzy=true`);
    if (!res.ok) throw new Error(`ÖBB API ${res.status}`);
    const data: any[] = await res.json();
    return data
        .filter((loc: any) => loc.type === 'station')
        .map((loc: any) => {
            const station: Station = {
                id: String(loc.id),
                name: loc.name,
                city: loc.address?.city ?? loc.name.split(',')[0],
                country: getCountryFromId(String(loc.id)),
                coordinates: loc.location
                    ? { lat: loc.location.latitude, lng: loc.location.longitude }
                    : undefined,
            };
            cacheStationName(station.id, station.name);
            return station;
        });
}

async function fetchRoutesFromOEBB(fromId: string, toId: string, date?: string): Promise<Route[]> {
    const now = new Date();
    const isToday = !date || date === now.toISOString().split('T')[0];
    let time = '12:00:00';
    if (isToday) {
        time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    }
    const searchDate = date && isValidDate(date) ? date : now.toISOString().split('T')[0];
    const url = `/api-oebb/journeys?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&results=8&stopovers=true&departure=${encodeURIComponent(searchDate + 'T' + time)}`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`ÖBB API ${res.status}`);
    const data = await res.json();
    if (!data?.journeys?.length) return [];

    return data.journeys.map((j: any) => {
        const legs = j.legs.filter((l: any) => l.origin && l.destination);
        const first = legs[0];
        const last = legs[legs.length - 1];
        const stops = buildStopsFromLegs(legs);
        const operators = [...new Set<string>(legs.map((l: any) => l.line?.operator?.name || l.line?.name).filter(Boolean))];
        const lineNames = legs.map((l: any) => l.line?.name || l.line?.id).filter(Boolean);
        const stableId = j.refreshToken || `oebb-${first.origin.id}-${last.destination.id}-${first.departure}`;
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
            operator: operators.join(' → ') || 'ÖBB',
            type: legs.length > 1 ? `${legs.length} tramos` : (first.line?.product || 'Train'),
            platform: first.departurePlatform,
            delay: first.departureDelay ? Math.floor(first.departureDelay / 60) : 0,
            lineName: lineNames.join(' → '),
            legs: legs.length,
            stops,
        });
    });
}

// ─── API PKP (Polonia — HAFAS) ───────────────────────────────────────────────

async function fetchStationsFromPKP(query: string): Promise<Station[]> {
    const res = await fetchWithTimeout(`/api-pkp/locations?query=${encodeURIComponent(query)}&results=8&fuzzy=true`);
    if (!res.ok) throw new Error(`PKP API ${res.status}`);
    const data: any[] = await res.json();
    return data
        .filter((loc: any) => loc.type === 'station')
        .map((loc: any) => {
            const station: Station = {
                id: String(loc.id),
                name: loc.name,
                city: loc.address?.city ?? loc.name.split(',')[0],
                country: getCountryFromId(String(loc.id)),
                coordinates: loc.location
                    ? { lat: loc.location.latitude, lng: loc.location.longitude }
                    : undefined,
            };
            cacheStationName(station.id, station.name);
            return station;
        });
}

async function fetchRoutesFromPKP(fromId: string, toId: string, date?: string): Promise<Route[]> {
    const now = new Date();
    const isToday = !date || date === now.toISOString().split('T')[0];
    let time = '12:00:00';
    if (isToday) {
        time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    }
    const searchDate = date && isValidDate(date) ? date : now.toISOString().split('T')[0];
    const url = `/api-pkp/journeys?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&results=8&stopovers=true&departure=${encodeURIComponent(searchDate + 'T' + time)}`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`PKP API ${res.status}`);
    const data = await res.json();
    if (!data?.journeys?.length) return [];

    return data.journeys.map((j: any) => {
        const legs = j.legs.filter((l: any) => l.origin && l.destination);
        const first = legs[0];
        const last = legs[legs.length - 1];
        const stops = buildStopsFromLegs(legs);
        const operators = [...new Set<string>(legs.map((l: any) => l.line?.operator?.name || l.line?.name).filter(Boolean))];
        const lineNames = legs.map((l: any) => l.line?.name || l.line?.id).filter(Boolean);
        const stableId = j.refreshToken || `pkp-${first.origin.id}-${last.destination.id}-${first.departure}`;
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
            operator: operators.join(' → ') || 'PKP Intercity',
            type: legs.length > 1 ? `${legs.length} tramos` : (first.line?.product || 'Train'),
            platform: first.departurePlatform,
            delay: first.departureDelay ? Math.floor(first.departureDelay / 60) : 0,
            lineName: lineNames.join(' → '),
            legs: legs.length,
            stops,
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
    const occupancy = (stableHash(p.id) % 100) / 100; // Estimación visual, no dato real
    return {
        id: p.id,
        fromStationId: p.fromStationId,
        toStationId: p.toStationId,
        fromStationName: p.fromStationName,
        toStationName: p.toStationName,
        fromCoordinates: (p.fromCoords?.latitude && p.fromCoords?.longitude)
            ? { lat: p.fromCoords.latitude, lng: p.fromCoords.longitude }
            : undefined,
        toCoordinates: (p.toCoords?.latitude && p.toCoords?.longitude)
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

// ─── Rutas mock (Eliminado por transparencia — Solo links oficiales) ─────────

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

<<<<<<< Updated upstream
    // Lanzar las 5 APIs en paralelo; usar las que respondan
    const [dbResult, chResult, irailResult, oebbResult, pkpResult] = await Promise.allSettled([
        fetchStationsFromDB(safe),
        fetchStationsFromSBB(safe),
        fetchStationsFromIrail(safe),
        fetchStationsFromOEBB(safe),
        fetchStationsFromPKP(safe),
=======
    // Lanzar las APIs en paralelo; usar las que respondan
    const [dbResult, chResult, irailResult, renfeResult, sncfResult] = await Promise.allSettled([
        fetchStationsFromDB(safe),
        fetchStationsFromSBB(safe),
        fetchStationsFromIrail(safe),
        fetchStationsFromRenfe(safe),
        fetchStationsFromSNCF(safe),
>>>>>>> Stashed changes
    ]);

    const results: Station[] = [];
    const seen = new Set<string>();

<<<<<<< Updated upstream
    for (const r of [dbResult, chResult, irailResult, oebbResult, pkpResult]) {
=======
    for (const r of [dbResult, chResult, irailResult, renfeResult, sncfResult]) {
>>>>>>> Stashed changes
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
        throw new RateLimitError('route', routeLimiter.secondsUntilNext());
    }

    const validDate = date && isValidDate(date) ? date : undefined;

    const useDB    = true; // siempre intentamos DB
    const useSBB   = isSwissStation(fromId) || isSwissStation(toId);
    const useIrail = isBelgianStation(fromId) || isBelgianStation(toId);
<<<<<<< Updated upstream
    const useOEBB  = isAustrianStation(fromId) || isAustrianStation(toId);
    const usePKP   = isPolishStation(fromId) || isPolishStation(toId);
=======
    // useRenfe (starts with 71) and useSNCF (starts with 87) logic is currently handled 
    // by the UI fallback since isCountrySupported is true for Spain/France.
>>>>>>> Stashed changes

    const promises: Promise<Route[]>[] = [];
    if (useDB)    promises.push(fetchRoutesFromDB(fromId, toId, validDate).catch(() => []));
    if (useSBB)   promises.push(fetchRoutesFromSBB(stationNameCache.get(fromId) ?? fromId, stationNameCache.get(toId) ?? toId, validDate).catch(() => []));
    if (useIrail) promises.push(fetchRoutesFromIrail(fromId, toId, validDate).catch(() => []));
<<<<<<< Updated upstream
    if (useOEBB)  promises.push(fetchRoutesFromOEBB(fromId, toId, validDate).catch(() => []));
    if (usePKP)   promises.push(fetchRoutesFromPKP(fromId, toId, validDate).catch(() => []));
=======
    
    // Para Renfe, aunque no hayamos implementado un fetcher de rutas directo por API CKAN (que es GTFS),
    // el sistema ya generará el enlace oficial en la UI gracias a que isCountrySupported('España') es true
    // y resolveStationName funciona con la caché poblada por fetchStationsFromRenfe.

>>>>>>> Stashed changes

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

    return unique;
}

export async function fetchPopularRoutes(): Promise<Route[]> {
    try {
        return await fetchRoutes('8011160', '8010159'); // Berlin → Hamburg (ruta popular real)
    } catch {
        return [];
    }
}
