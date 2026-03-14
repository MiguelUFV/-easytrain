/**
 * rateLimit.ts
 * Limita llamadas a APIs para evitar abusos y errores 429.
 * Patrón: ventana deslizante (sliding window).
 */

function createRateLimiter(limit: number, windowMs: number) {
    const calls: number[] = [];

    return {
        canCall(): boolean {
            const now = Date.now();
            const cutoff = now - windowMs;
            while (calls.length > 0 && calls[0] < cutoff) calls.shift();
            if (calls.length >= limit) return false;
            calls.push(now);
            return true;
        },
        remaining(): number {
            const now = Date.now();
            const cutoff = now - windowMs;
            while (calls.length > 0 && calls[0] < cutoff) calls.shift();
            return Math.max(0, limit - calls.length);
        },
    };
}

// 10 búsquedas de rutas por minuto
export const routeLimiter = createRateLimiter(10, 60_000);

// 20 búsquedas de estaciones por minuto
export const stationLimiter = createRateLimiter(20, 60_000);
