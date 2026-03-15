// Google Analytics 4 helpers
// Replace G-XXXXXXXXXX in index.html with your real Measurement ID

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

/** Track a custom event */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
    window.gtag?.('event', eventName, params);
}

// Pre-built event helpers for EasyTrain
export const analytics = {
    /** User searched for a route */
    searchRoute: (from: string, to: string) =>
        trackEvent('search', { search_term: `${from} → ${to}` }),

    /** User clicked a booking button */
    clickBooking: (operator: string, from: string, to: string) =>
        trackEvent('begin_checkout', { item_name: `${from} → ${to}`, item_brand: operator }),

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
    register: () =>
        trackEvent('sign_up', { method: 'email' }),
};
