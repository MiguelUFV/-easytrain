// Google Analytics 4 helpers
// Using Measurement ID: G-ZDRML4XKTF

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

/** Track a page view (called on route change) */
export function trackPageView(path: string, title?: string) {
    window.gtag?.('event', 'page_view', {
        page_path: path,
        page_title: title,
    });
}

/** Update Google Analytics consent state */
export function updateConsent(granted: boolean) {
    const status = granted ? 'granted' : 'denied';
    window.gtag?.('consent', 'update', {
        'ad_storage': status,
        'analytics_storage': status,
        'ad_user_data': status,
        'ad_personalization': status
    });
}

/** Track a custom event */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
    window.gtag?.('event', eventName, params);
}

// Pre-built event helpers for EasyTrain
export const analytics = {
    /** 
     * User searched for a route (Professional structured event)
     */
    searchRoute: (params: {
        origin: string;
        destination: string;
        trip_type: string;
        passengers: number;
        departure_date: string;
    }) => trackEvent('search_route', {
        origen: params.origin,
        destino: params.destination,
        tipo_billete: params.trip_type,
        num_pasajeros: params.passengers,
        fecha_salida: params.departure_date
    }),

    /** User clicked a booking button (Professional e-commerce event) */
    clickBooking: (params: {
        operator: string;
        origin: string;
        destination: string;
        price?: number;
        currency?: string;
        platform: string;
    }) => trackEvent('begin_checkout', {
        item_name: `${params.origin} → ${params.destination}`,
        item_brand: params.operator,
        price: params.price,
        currency: params.currency || 'EUR',
        platform_reserva: params.platform,
        items: [{
            item_name: `${params.origin} → ${params.destination}`,
            item_brand: params.operator,
            price: params.price,
            currency: params.currency || 'EUR'
        }]
    }),

    /** User added a route to favorites */
    addFavorite: (routeId: string) =>
        trackEvent('add_to_wishlist', { item_id: routeId }),

    /** User optimized an Interrail route */
    optimizeInterrail: (numStops: number, totalDays: number) =>
        trackEvent('interrail_optimize', { num_stops: numStops, total_days: totalDays }),

    /** User created a price alert */
    createPriceAlert: (from: string, to: string, targetPrice: number) =>
        trackEvent('price_alert_created', { from, to, target_price: targetPrice }),

    /** User completed registration */
    register: (params: { name: string; email: string }) =>
        trackEvent('sign_up', { 
            method: 'email',
            nombre_usuario: params.name,
            email_usuario: params.email
        }),
};
