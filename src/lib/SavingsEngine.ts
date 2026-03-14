import type { Route } from '../types';

export interface SavingResult {
    originalPrice: number;
    splitPrice: number;
    savings: number;
    legs: Route[];
}

/**
 * SavingsEngine simulates finding "Split-Ticketing" opportunities.
 * It takes a combined route and looks for cheaper segments.
 */
export const findSplitSavings = (routes: Route[], fromId: string, toId: string): SavingResult | null => {
    const directRoute = routes.find(r => r.fromStationId === fromId && r.toStationId === toId);

    // Look for 2-leg split (Step through a hub)
    for (const stopover of routes) {
        if (stopover.fromStationId === fromId) {
            const secondLeg = routes.find(r => r.fromStationId === stopover.toStationId && r.toStationId === toId);

            if (secondLeg) {
                const combinedPrice = (stopover.price ?? 0) + (secondLeg.price ?? 0);
                const baselinePrice = directRoute ? (directRoute.price ?? combinedPrice * 1.2) : combinedPrice * 1.2;

                if (combinedPrice < (baselinePrice ?? Infinity)) {
                    return {
                        originalPrice: baselinePrice ?? combinedPrice,
                        splitPrice: combinedPrice,
                        savings: (baselinePrice ?? combinedPrice) - combinedPrice,
                        legs: [stopover, secondLeg]
                    };
                }
            }
        }
    }

    return null;
};
