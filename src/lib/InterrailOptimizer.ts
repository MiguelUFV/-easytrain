/**
 * InterrailOptimizer — Motor de optimización de rutas Interrail
 *
 * Usa un grafo ponderado de la red ferroviaria europea y Dijkstra
 * con costes logarítmicos para encontrar rutas óptimas.
 *
 * ¿Por qué logaritmos?
 * - log(precio) evita que una ruta cara domine todo el coste
 * - log(duración) penaliza suavemente viajes largos sin eliminarlos
 * - Los logaritmos hacen que la función de coste sea ADITIVA en
 *   factores MULTIPLICATIVOS: log(a*b) = log(a) + log(b),
 *   permitiendo combinar precio y tiempo de forma balanceada
 * - Resultado: rutas que mezclan tramos baratos/lentos con rápidos/caros
 *   de forma natural, en vez de siempre elegir lo más barato o rápido.
 */

import { stations, routes } from './mockData';
import type { Station, Route } from '../types';
import { differenceInMinutes } from 'date-fns';

// ═══════════════════════════════════════
// Tipos
// ═══════════════════════════════════════

export interface OptimizationWeights {
    price: number;      // 0-1: peso del precio
    duration: number;   // 0-1: peso de la duración
    transfers: number;  // 0-1: peso de los transbordos
}

export interface ItineraryLeg {
    route: Route;
    from: Station;
    to: Station;
    durationMin: number;
    dayIndex: number; // día del itinerario
}

export interface OptimizedItinerary {
    legs: ItineraryLeg[];
    totalPrice: number;
    totalDurationMin: number;
    totalTransfers: number;
    score: number; // coste logarítmico total (menor = mejor)
    stayDays: number[];
}

// ═══════════════════════════════════════
// Grafo de la red ferroviaria
// ═══════════════════════════════════════

interface Edge {
    route: Route;
    toId: string;
    cost: number;
}

interface GraphNode {
    stationId: string;
    edges: Edge[];
}

// Caché de grafos por combinación de pesos para evitar reconstruir en cada llamada
const graphCache = new Map<string, Map<string, GraphNode>>();

function getOrBuildGraph(weights: OptimizationWeights): Map<string, GraphNode> {
    const key = `${weights.price.toFixed(2)}-${weights.duration.toFixed(2)}-${weights.transfers.toFixed(2)}`;
    const cached = graphCache.get(key);
    if (cached) return cached;

    const graph = new Map<string, GraphNode>();

    for (const station of stations) {
        graph.set(station.id, { stationId: station.id, edges: [] });
    }

    for (const route of routes) {
        const from = graph.get(route.fromStationId);
        if (!from) continue;

        const durationMin = differenceInMinutes(
            new Date(route.arrivalTime),
            new Date(route.departureTime)
        );
        const price = route.price ?? 50;

        // Coste logarítmico compuesto:
        // C = w_p * ln(price+1) + w_d * ln(duration+1) + w_t * ln(2)
        // ln(2) es el coste fijo por transbordo
        const cost =
            weights.price * Math.log(price + 1) +
            weights.duration * Math.log(durationMin + 1) +
            weights.transfers * Math.log(2);

        from.edges.push({ route, toId: route.toStationId, cost });
    }

    graphCache.set(key, graph);
    return graph;
}

// ═══════════════════════════════════════
// Min-heap binario para Dijkstra (O(log n) vs O(n²) con array.sort)
// ═══════════════════════════════════════

class MinHeap {
    private heap: { id: string; cost: number }[] = [];

    get size() { return this.heap.length; }

    push(item: { id: string; cost: number }) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): { id: string; cost: number } | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return top;
    }

    private bubbleUp(i: number) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.heap[parent].cost <= this.heap[i].cost) break;
            [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
            i = parent;
        }
    }

    private sinkDown(i: number) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.heap[left].cost < this.heap[smallest].cost) smallest = left;
            if (right < n && this.heap[right].cost < this.heap[smallest].cost) smallest = right;
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}

// ═══════════════════════════════════════
// Dijkstra con coste logarítmico
// ═══════════════════════════════════════

interface DijkstraResult {
    dist: Map<string, number>;
    prev: Map<string, { stationId: string; route: Route } | null>;
}

function dijkstra(graph: Map<string, GraphNode>, startId: string): DijkstraResult {
    const dist = new Map<string, number>();
    const prev = new Map<string, { stationId: string; route: Route } | null>();
    const visited = new Set<string>();

    for (const id of graph.keys()) {
        dist.set(id, Infinity);
        prev.set(id, null);
    }
    dist.set(startId, 0);

    const heap = new MinHeap();
    heap.push({ id: startId, cost: 0 });

    while (heap.size > 0) {
        const current = heap.pop()!;

        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const node = graph.get(current.id);
        if (!node) continue;

        for (const edge of node.edges) {
            const newDist = (dist.get(current.id) ?? Infinity) + edge.cost;
            if (newDist < (dist.get(edge.toId) ?? Infinity)) {
                dist.set(edge.toId, newDist);
                prev.set(edge.toId, { stationId: current.id, route: edge.route });
                heap.push({ id: edge.toId, cost: newDist });
            }
        }
    }

    return { dist, prev };
}

function reconstructPath(
    prev: Map<string, { stationId: string; route: Route } | null>,
    startId: string,
    endId: string
): Route[] {
    const path: Route[] = [];
    let current = endId;

    while (current !== startId) {
        const p = prev.get(current);
        if (!p) return []; // no hay camino
        path.unshift(p.route);
        current = p.stationId;
    }

    return path;
}

// ═══════════════════════════════════════
// Optimizador principal
// ═══════════════════════════════════════

/**
 * Encuentra la ruta óptima entre dos estaciones usando Dijkstra
 * con función de coste logarítmica.
 */
export function findOptimalRoute(
    fromId: string,
    toId: string,
    weights: OptimizationWeights = { price: 0.4, duration: 0.4, transfers: 0.2 }
): Route[] {
    const graph = getOrBuildGraph(weights);
    const { prev } = dijkstra(graph, fromId);
    return reconstructPath(prev, fromId, toId);
}

/**
 * Optimiza un itinerario Interrail completo con múltiples paradas.
 *
 * Dado un array de estaciones a visitar en orden, encuentra la ruta
 * óptima entre cada par consecutivo y las combina en un itinerario.
 *
 * Los días de estancia se distribuyen proporcionalmente al logaritmo
 * del "interés" de cada ciudad (tier inverso + conexiones).
 */
export function optimizeInterrail(
    stationIds: string[],
    totalDays: number,
    weights: OptimizationWeights = { price: 0.4, duration: 0.4, transfers: 0.2 }
): OptimizedItinerary {
    const graph = getOrBuildGraph(weights);
    const allLegs: ItineraryLeg[] = [];
    let currentDay = 0;

    // Calcular "interés" de cada parada para distribuir días
    const interests = stationIds.map(id => {
        const station = stations.find(s => s.id === id);
        const tier = station?.tier ?? 2;
        const connectionCount = routes.filter(
            r => r.fromStationId === id || r.toStationId === id
        ).length;
        // Logaritmo del interés: ciudades grandes + bien conectadas = más días
        return Math.log(1 + (5 - tier) * 3 + connectionCount);
    });

    const totalInterest = interests.reduce((a, b) => a + b, 0);
    const travelDays = stationIds.length - 1; // días en tránsito
    const stayableDays = Math.max(totalDays - travelDays, stationIds.length);

    // Distribuir días proporcionalmente al log del interés
    const rawStayDays = interests.map(
        interest => (interest / totalInterest) * stayableDays
    );

    // Redondear asegurando al menos 1 día por parada y total correcto
    const stayDays = rawStayDays.map(d => Math.max(1, Math.round(d)));
    const diff = stayableDays - stayDays.reduce((a, b) => a + b, 0);
    if (diff > 0) {
        // Dar días extra a las ciudades con mayor interés
        const sorted = interests
            .map((v, i) => ({ i, v }))
            .sort((a, b) => b.v - a.v);
        for (let d = 0; d < diff; d++) {
            stayDays[sorted[d % sorted.length].i]++;
        }
    } else if (diff < 0) {
        const sorted = interests
            .map((v, i) => ({ i, v }))
            .sort((a, b) => a.v - b.v);
        for (let d = 0; d < Math.abs(diff); d++) {
            if (stayDays[sorted[d % sorted.length].i] > 1) {
                stayDays[sorted[d % sorted.length].i]--;
            }
        }
    }

    // Encontrar rutas óptimas entre cada par de paradas
    for (let i = 0; i < stationIds.length - 1; i++) {
        const fromId = stationIds[i];
        const toId = stationIds[i + 1];

        currentDay += stayDays[i];

        const { prev } = dijkstra(graph, fromId);
        const routePath = reconstructPath(prev, fromId, toId);

        for (const route of routePath) {
            const from = stations.find(s => s.id === route.fromStationId)!;
            const to = stations.find(s => s.id === route.toStationId)!;
            const durationMin = differenceInMinutes(
                new Date(route.arrivalTime),
                new Date(route.departureTime)
            );

            allLegs.push({
                route,
                from,
                to,
                durationMin,
                dayIndex: currentDay,
            });
        }
    }

    const totalPrice = allLegs.reduce((sum, l) => sum + (l.route.price ?? 0), 0);
    const totalDurationMin = allLegs.reduce((sum, l) => sum + l.durationMin, 0);
    const totalTransfers = Math.max(0, allLegs.length - (stationIds.length - 1));

    // Score final logarítmico
    const score =
        weights.price * Math.log(totalPrice + 1) +
        weights.duration * Math.log(totalDurationMin + 1) +
        weights.transfers * Math.log(totalTransfers + 1);

    return {
        legs: allLegs,
        totalPrice,
        totalDurationMin,
        totalTransfers,
        score,
        stayDays,
    };
}

/**
 * Genera múltiples itinerarios con diferentes pesos y devuelve
 * las mejores opciones (Pareto-optimal).
 */
export function generateAlternatives(
    stationIds: string[],
    totalDays: number,
    count: number = 3
): OptimizedItinerary[] {
    const presets: { name: string; weights: OptimizationWeights }[] = [
        { name: 'balanced', weights: { price: 0.4, duration: 0.4, transfers: 0.2 } },
        { name: 'cheapest', weights: { price: 0.8, duration: 0.1, transfers: 0.1 } },
        { name: 'fastest', weights: { price: 0.1, duration: 0.8, transfers: 0.1 } },
        { name: 'fewest-transfers', weights: { price: 0.2, duration: 0.2, transfers: 0.6 } },
        { name: 'adventure', weights: { price: 0.6, duration: 0.2, transfers: 0.2 } },
    ];

    const results = presets
        .slice(0, count)
        .map(p => optimizeInterrail(stationIds, totalDays, p.weights))
        .filter(r => r.legs.length > 0);

    // Deduplicar y ordenar por score
    const unique = results.filter(
        (r, i, arr) =>
            arr.findIndex(
                o => o.totalPrice === r.totalPrice && o.totalDurationMin === r.totalDurationMin
            ) === i
    );

    return unique.sort((a, b) => a.score - b.score);
}

/**
 * Devuelve todas las estaciones alcanzables desde una estación dada,
 * ordenadas por coste logarítmico ascendente.
 */
export function getReachableStations(
    fromId: string,
    weights: OptimizationWeights = { price: 0.4, duration: 0.4, transfers: 0.2 }
): { station: Station; cost: number; routes: number }[] {
    const graph = getOrBuildGraph(weights);
    const { dist } = dijkstra(graph, fromId);

    return stations
        .filter(s => s.id !== fromId && (dist.get(s.id) ?? Infinity) < Infinity)
        .map(s => ({
            station: s,
            cost: dist.get(s.id)!,
            routes: routes.filter(
                r => r.fromStationId === s.id || r.toStationId === s.id
            ).length,
        }))
        .sort((a, b) => a.cost - b.cost);
}

/**
 * Sugiere la próxima parada más lógica y emocionante.
 * Criterio: Distancia moderada (no excesiva), popularidad de la ciudad (tier),
 * y que no esté ya en el itinerario actual.
 */
export function suggestNextStop(
    currentStationId: string,
    existingIds: string[]
): Station[] {
    const reachable = getReachableStations(currentStationId);
    const filtered = reachable
        .filter(r => !existingIds.includes(r.station.id))
        .map(r => {
            // Factor de recomendación: 
            // - Menor tier (más importante) = mejor
            // - Coste logarítmico razonable (no demasiado cerca, no demasiado lejos)
            const tierPenalty = (r.station.tier ?? 3) * 2;
            const costScore = Math.abs(r.cost - 4); // Buscamos un coste 'medio' para aventuras
            const totalScore = tierPenalty + costScore;
            return { ...r, totalScore };
        })
        .sort((a, b) => a.totalScore - b.totalScore);

    return filtered.slice(0, 5).map(f => f.station);
}

/**
 * Devuelve las ciudades más populares (Tier 1) que no están en el itinerario.
 */
export function getPopularDestinations(existingIds: string[]): Station[] {
    return stations
        .filter(s => (s.tier ?? 4) === 1 && !existingIds.includes(s.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
}
