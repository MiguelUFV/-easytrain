/**
 * Vercel Edge Function — Digitransit proxy (Finlandia / VR)
 *
 * Geocoding:      GET /api/digitransit?type=stations&q=Helsinki
 * Journey planner: GET /api/digitransit?type=routes&fromLat=...&fromLon=...&toLat=...&toLon=...&date=...&time=...
 *
 * La key vive solo en el servidor — nunca en el bundle del navegador.
 */

export const config = { runtime: 'edge' };

const GEOCODER = 'https://api.digitransit.fi/geocoding/v1/autocomplete';
const ROUTER   = 'https://api.digitransit.fi/routing/v2/finland/gtfs/v1';
const CORS     = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export default async function handler(req: Request): Promise<Response> {
    const url  = new URL(req.url);
    const type = url.searchParams.get('type');
    const KEY  = process.env.DIGITRANSIT_KEY;

    if (!KEY) {
        return new Response(JSON.stringify({ error: 'Digitransit key not configured' }), { status: 500, headers: CORS });
    }

    const headers = { 'digitransit-subscription-key': KEY, 'Content-Type': 'application/json' };

    try {
        if (type === 'stations') {
            const q = url.searchParams.get('q') ?? '';
            if (!q) return new Response(JSON.stringify({ features: [] }), { headers: CORS });
            // sources=gtfsvr → solo estaciones de tren VR (filtra autobuses, metro, tranvía)
            const apiUrl = `${GEOCODER}?text=${encodeURIComponent(q)}&size=10&sources=gtfsvr&layers=stop,station&lang=fi`;
            const res  = await fetch(apiUrl, { headers });
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: CORS });

        } else if (type === 'routes') {
            const fromLat = url.searchParams.get('fromLat') ?? '0';
            const fromLon = url.searchParams.get('fromLon') ?? '0';
            const toLat   = url.searchParams.get('toLat')   ?? '0';
            const toLon   = url.searchParams.get('toLon')   ?? '0';
            const date    = url.searchParams.get('date')    ?? '';
            const time    = url.searchParams.get('time')    ?? '12:00:00';

            if (fromLat === '0' || toLat === '0') {
                return new Response(JSON.stringify({ data: { plan: { itineraries: [] } } }), { headers: CORS });
            }

            const query = `{
                plan(
                    from: { lat: ${fromLat}, lon: ${fromLon} }
                    to:   { lat: ${toLat},   lon: ${toLon}   }
                    numItineraries: 6
                    date: "${date}"
                    time: "${time}"
                    transportModes: [{ mode: RAIL }]
                ) {
                    itineraries {
                        duration startTime endTime
                        legs {
                            mode startTime endTime
                            from { name stop { gtfsId } }
                            to   { name stop { gtfsId } }
                            route { shortName longName agency { name } }
                            intermediateStops {
                                name arrivalTime departureTime
                                stop { gtfsId }
                            }
                        }
                    }
                }
            }`;

            const res  = await fetch(ROUTER, { method: 'POST', headers, body: JSON.stringify({ query }) });
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: CORS });

        } else {
            return new Response(JSON.stringify({ error: 'type must be stations or routes' }), { status: 400, headers: CORS });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
    }
}
