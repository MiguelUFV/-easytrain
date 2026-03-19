/**
 * Vercel Edge Function — ResRobot proxy (Suecia / Trafiklab)
 *
 * La key nunca llega al bundle del navegador — solo vive en
 * las variables de entorno del servidor (Vercel dashboard).
 *
 * Endpoints:
 *   GET /api/resrobot?type=stations&q=Stockholm
 *   GET /api/resrobot?type=routes&from=740000001&to=740000007&date=2026-03-20&time=12:00:00
 */

export const config = { runtime: 'edge' };

const BASE = 'https://api.resrobot.se/v2.1';
const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    const STOPS_KEY  = process.env.RESROBOT_STOPS_KEY;
    const ROUTES_KEY = process.env.RESROBOT_ROUTES_KEY;

    if (!STOPS_KEY || !ROUTES_KEY) {
        return new Response(JSON.stringify({ error: 'ResRobot keys not configured' }), { status: 500, headers: HEADERS });
    }

    try {
        let apiUrl: string;

        if (type === 'stations') {
            const q = url.searchParams.get('q') ?? '';
            if (!q) return new Response(JSON.stringify({ stopLocationOrCoordLocation: [] }), { headers: HEADERS });
            apiUrl = `${BASE}/location.name?input=${encodeURIComponent(q)}&format=json&accessId=${STOPS_KEY}&maxNo=10`;

        } else if (type === 'routes') {
            const from = url.searchParams.get('from') ?? '';
            const to   = url.searchParams.get('to')   ?? '';
            const date = url.searchParams.get('date') ?? '';
            const time = url.searchParams.get('time') ?? '12:00:00';
            if (!from || !to) return new Response(JSON.stringify({ Trip: [] }), { headers: HEADERS });
            apiUrl = `${BASE}/trip?originId=${encodeURIComponent(from)}&destId=${encodeURIComponent(to)}&date=${date}&time=${encodeURIComponent(time)}&numF=8&format=json&accessId=${ROUTES_KEY}`;

        } else {
            return new Response(JSON.stringify({ error: 'type must be stations or routes' }), { status: 400, headers: HEADERS });
        }

        const res = await fetch(apiUrl, { headers: { 'User-Agent': 'EasyTrain/2.5 (train-planner)' } });
        const data = await res.json();
        return new Response(JSON.stringify(data), { headers: HEADERS });

    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: HEADERS });
    }
}
