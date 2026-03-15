import type { BookingPlatform, Route } from '../types';

export interface BookingParams {
    fromCity: string;
    toCity: string;
    fromStationName: string;
    toStationName: string;
    departureDate: string;   // YYYY-MM-DD
    departureTime?: string;  // HH:MM
    passengers?: number;
    operator?: string;
    trainType?: string;
}

// ─── Plataformas de reserva ───────────────────────────────────────────────────

// Affiliate IDs — reemplazar con los reales tras registro en cada plataforma
const AFFILIATE = {
    trainline: 'EASYTRAIN_AFFILIATE_ID',
    omio:      'EASYTRAIN_OMIO_ID',
};

// ─── Deep-links a webs OFICIALES de cada operador ────────────────────────────
// Cada función recibe BookingParams y devuelve la URL con los datos pre-rellenados.

const OFFICIAL_BOOKING: Record<string, (p: BookingParams) => string> = {

    // 🇩🇪 Alemania — DB (Deutsche Bahn)
    'db': (p) => {
        const params = new URLSearchParams({
            'S': p.fromStationName,
            'Z': p.toStationName,
            'date': p.departureDate,
            'time': p.departureTime ?? '08:00',
            'travellers': String(p.passengers ?? 1),
        });
        return `https://int.bahn.de/en/buchung/fahrplan/suche#?${params}`;
    },

    // 🇫🇷 Francia — SNCF / TGV
    'sncf': (p) => {
        const params = new URLSearchParams({
            origin:      p.fromStationName,
            destination: p.toStationName,
            outwardDate: `${p.departureDate}T${p.departureTime ?? '08:00'}:00`,
            passengers:  String(p.passengers ?? 1),
        });
        return `https://www.sncf-connect.com/app/home/search?${params}`;
    },
    'tgv':   (p) => OFFICIAL_BOOKING['sncf'](p),
    'ouigo': (p) => `https://www.ouigo.com/es/búsqueda?origin=${encodeURIComponent(p.fromStationName)}&destination=${encodeURIComponent(p.toStationName)}&date=${p.departureDate}`,

    // 🇪🇸 España — Renfe / AVE
    'renfe': (p) => {
        const [y, m, d] = p.departureDate.split('-');
        const renfeDate = `${d}/${m}/${y}`;
        return `https://www.renfe.com/es/es/viajar/informacion-util/horarios?O=${encodeURIComponent(p.fromStationName)}&D=${encodeURIComponent(p.toStationName)}&F=${encodeURIComponent(renfeDate)}&A=${p.passengers ?? 1}`;
    },
    'ave': (p) => OFFICIAL_BOOKING['renfe'](p),

    // 🇮🇹 Italia — Trenitalia
    'trenitalia': (p) => {
        const params = new URLSearchParams({
            origin: p.fromStationName,
            destination: p.toStationName,
            aDate: p.departureDate,
            adults: String(p.passengers ?? 1),
        });
        return `https://www.trenitalia.com/en/ticket-booking.html?${params}`;
    },
    'italo': (p) => {
        const params = new URLSearchParams({
            'DepartureStation': p.fromStationName,
            'ArrivalStation': p.toStationName,
            'DepartureDate': p.departureDate,
            'ADT': String(p.passengers ?? 1),
        });
        return `https://www.italotreno.it/en/offers-and-services?${params}`;
    },

    // 🇦🇹 Austria — ÖBB
    'oebb': (p) => {
        const base = 'https://tickets.oebb.at/en/ticket';
        const params = new URLSearchParams({
            from: p.fromStationName,
            to:   p.toStationName,
            date: p.departureDate,
            pax:  String(p.passengers ?? 1),
        });
        return `${base}?${params}`;
    },
    'obb': (p) => OFFICIAL_BOOKING['oebb'](p),

    // 🇨🇭 Suiza — SBB
    'sbb': (p) => {
        const params = new URLSearchParams({
            'von': p.fromStationName,
            'nach': p.toStationName,
            'datum': p.departureDate,
            'zeit': p.departureTime ?? '08:00',
        });
        return `https://www.sbb.ch/en/timetable.html?${params}`;
    },
    'cff': (p) => OFFICIAL_BOOKING['sbb'](p),
    'ffs': (p) => OFFICIAL_BOOKING['sbb'](p),

    // 🇧🇪 Bélgica — NMBS/SNCB
    'nmbs': (p) => {
        const base = 'https://www.belgiantrain.be/en/train-information/get-a-train-ticket';
        const params = new URLSearchParams({
            from: p.fromStationName,
            to:   p.toStationName,
            date: p.departureDate,
        });
        return `${base}?${params}`;
    },
    'sncb': (p) => OFFICIAL_BOOKING['nmbs'](p),

    // 🇳🇱 Países Bajos — NS
    'ns': (p) => {
        const base = 'https://www.ns.nl/reisplanner/#/';
        const params = new URLSearchParams({
            vertrek:  p.fromStationName,
            aankomst: p.toStationName,
        });
        return `${base}?${params}`;
    },

    // 🚄 Eurostar (UK ↔ Europa)
    'eurostar': (p) => {
        const base = 'https://www.eurostar.com/uk-en/train/search';
        const params = new URLSearchParams({
            origin:        p.fromCity,
            destination:   p.toCity,
            'outbound-date': p.departureDate,
            adults:        String(p.passengers ?? 1),
        });
        return `${base}?${params}`;
    },

    // 🟢 FlixTrain
    'flixtrain': (p) => {
        const params = new URLSearchParams({
            departureCity: p.fromCity,
            arrivalCity:   p.toCity,
            rideDate:      p.departureDate,
            adult:         String(p.passengers ?? 1),
        });
        return `https://shop.flixbus.com/search?${params}`;
    },
    'flix': (p) => OFFICIAL_BOOKING['flixtrain'](p),

    // 🇨🇿 República Checa — ČD
    'cd': (p) => {
        const params = new URLSearchParams({
            from: p.fromStationName,
            to: p.toStationName,
            date: p.departureDate,
        });
        return `https://www.cd.cz/en/timetable/connection-search/?${params}`;
    },

    // 🇵🇱 Polonia — PKP
    'pkp': (p) => {
        const params = new URLSearchParams({
            from: p.fromStationName,
            to:   p.toStationName,
            date: p.departureDate,
        });
        return `https://www.intercity.pl/en/site/for-passengers/information/schedules-and-tickets.html?${params}`;
    },

    // 🟡 RegioJet (Europa Central/Oriental)
    'regiojet': (p) => {
        return `https://www.regiojet.com/en/search?from=${encodeURIComponent(p.fromStationName)}&to=${encodeURIComponent(p.toStationName)}&date=${p.departureDate}`;
    },

    // 🇸🇪 Suecia — SJ
    'sj': (p) => {
        const params = new URLSearchParams({
            from: p.fromStationName,
            to:   p.toStationName,
            date: p.departureDate,
        });
        return `https://www.sj.se/en/find-and-book-journey.html?${params}`;
    },

    // 🇵🇹 Portugal — CP
    'cp': (p) => {
        const params = new URLSearchParams({
            origin: p.fromStationName,
            destination: p.toStationName,
            date: p.departureDate,
        });
        return `https://www.cp.pt/passageiros/en/buy-tickets?${params}`;
    },

    // 🇬🇷 Grecia — Hellenic Train
    'hellenic': (p) => {
        return `https://tickets.hellenictrain.gr/en/?from=${encodeURIComponent(p.fromStationName)}&to=${encodeURIComponent(p.toStationName)}&date=${p.departureDate}`;
    },
    'trainose': (p) => OFFICIAL_BOOKING['hellenic'](p),
};

// ─── Detección de operador ────────────────────────────────────────────────────

/** Devuelve el nombre normalizado del operador desde el campo operator de la ruta */
export function detectOperatorKey(operator?: string): string | null {
    if (!operator) return null;
    const lower = operator.toLowerCase();
    for (const key of Object.keys(OFFICIAL_BOOKING)) {
        if (lower.includes(key)) return key;
    }
    return null;
}

/** URL de reserva en la web OFICIAL del operador (si existe), o null */
export function getOfficialUrl(params: BookingParams): string | null {
    const key = detectOperatorKey(params.operator);
    if (!key) return null;
    try {
        return OFFICIAL_BOOKING[key](params);
    } catch {
        return null;
    }
}

// ─── Plataformas intermediarias (Trainline / Omio) ────────────────────────────

export function buildTrainlineUrl(params: BookingParams): string {
    const base = 'https://www.thetrainline.com/book/results';
    const p = new URLSearchParams();
    p.set('origin', params.fromCity);
    p.set('destination', params.toCity);
    const dt = params.departureTime
        ? `${params.departureDate}T${params.departureTime}:00`
        : `${params.departureDate}T08:00:00`;
    p.set('outwardDate', dt);
    p.set('journeySearchType', 'single');
    const n = params.passengers ?? 1;
    for (let i = 0; i < n; i++) p.append('passengers[]', '1990-01-01|1066');
    p.set('utm_source', AFFILIATE.trainline);
    p.set('utm_medium', 'affiliate');
    p.set('utm_campaign', 'easytrain');
    return `${base}?${p}`;
}

export function buildOmioUrl(params: BookingParams): string {
    const from = encodeURIComponent(params.fromCity);
    const to   = encodeURIComponent(params.toCity);
    const pax  = params.passengers ?? 1;
    let url = `https://www.omio.com/search-frontend/results/train/${from}/${to}/${params.departureDate}/${pax}`;
    if (AFFILIATE.omio !== 'EASYTRAIN_OMIO_ID') url += `?affiliate=${AFFILIATE.omio}`;
    return url;
}

export function getBestPlatform(operator?: string): BookingPlatform {
    const trainlineOps = ['eurostar', 'sncf', 'tgv', 'renfe', 'ave', 'trenitalia', 'italo', 'ouigo'];
    if (operator && trainlineOps.some(op => operator.toLowerCase().includes(op))) return 'trainline';
    return 'omio';
}

export function getBookingUrl(params: BookingParams, platform?: BookingPlatform): string {
    const p = platform ?? getBestPlatform(params.operator);
    return p === 'trainline' ? buildTrainlineUrl(params) : buildOmioUrl(params);
}

export function openBooking(params: BookingParams, platform?: BookingPlatform): void {
    const url = getBookingUrl(params, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function openOfficialBooking(params: BookingParams): boolean {
    const url = getOfficialUrl(params);
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
}

/** Convierte una Route del store en BookingParams */
export function routeToBookingParams(route: Route, date?: string): BookingParams {
    // Extrae la ciudad del nombre de estación (primera palabra antes de espacio/coma/guión)
    const cityFromName = (name?: string, fallback?: string): string => {
        if (!name) return fallback ?? '';
        return name.split(/[\s,\-–]/)[0];
    };

    return {
        fromCity:        cityFromName(route.fromStationName, route.fromStationId),
        toCity:          cityFromName(route.toStationName, route.toStationId),
        fromStationName: route.fromStationName ?? route.fromStationId,
        toStationName:   route.toStationName ?? route.toStationId,
        departureDate:   date ?? new Date().toISOString().split('T')[0],
        departureTime:   route.departureTime?.length > 5
            ? new Date(route.departureTime).toTimeString().slice(0, 5)
            : undefined,
        operator:        route.operator,
        trainType:       route.type,
        passengers:      1,
    };
}
