/**
 * rateLimit.ts
 * Limita llamadas a APIs para evitar abusos y errores 429.
 * Patrón: ventana deslizante (sliding window).
 */

export interface RateLimiter {
    canCall(): boolean;
    remaining(): number;
    limit: number;
    /** Seconds until the next call slot opens (0 if available now) */
    secondsUntilNext(): number;
}

export class RateLimitError extends Error {
    type: 'route' | 'station';
    waitSeconds: number;
    constructor(type: 'route' | 'station', waitSeconds: number) {
        super(`Rate limit reached for ${type}. Wait ${waitSeconds}s.`);
        this.type = type;
        this.waitSeconds = waitSeconds;
        this.name = 'RateLimitError';
    }
}

function createRateLimiter(limit: number, windowMs: number): RateLimiter {
    const calls: number[] = [];

    const cleanup = () => {
        const cutoff = Date.now() - windowMs;
        while (calls.length > 0 && calls[0] < cutoff) calls.shift();
    };

    return {
        limit,
        canCall(): boolean {
            cleanup();
            if (calls.length >= limit) return false;
            calls.push(Date.now());
            return true;
        },
        remaining(): number {
            cleanup();
            return Math.max(0, limit - calls.length);
        },
        secondsUntilNext(): number {
            cleanup();
            if (calls.length < limit) return 0;
            // The oldest call will expire at calls[0] + windowMs
            const nextSlot = calls[0] + windowMs;
            return Math.max(0, Math.ceil((nextSlot - Date.now()) / 1000));
        },
    };
}

// 10 búsquedas de rutas por minuto
export const routeLimiter = createRateLimiter(10, 60_000);

// 20 búsquedas de estaciones por minuto
export const stationLimiter = createRateLimiter(20, 60_000);
