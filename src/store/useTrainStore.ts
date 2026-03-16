import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, BookingClick, InterrailPlan, InterrailStop, PriceAlert, Route, SearchHistoryEntry, Station, UserProfile } from '../types';

interface TrainActions {
    setStations: (stations: Station[]) => void;
    // Sets routes AND clears selectedRouteId atomically (single source of truth)
    setRoutes: (routes: Route[]) => void;
    setCurrentPlan: (plan: InterrailPlan | null) => void;
    addSearchHistory: (entry: SearchHistoryEntry) => void;
    setOfflineStatus: (status: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    toggleFavorite: (route: Route) => void;
    setSelectedRouteId: (routeId: string | null) => void;
    cacheStations: (stations: Station[]) => void;
    resolveStationName: (id: string) => string;
    // Price Alerts
    addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
    removePriceAlert: (id: string) => void;
    triggerPriceAlert: (id: string) => void;
    // User Profile
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    // Interrail Route Builder (map-planner sync)
    addInterrailStop: (stop: InterrailStop) => void;
    removeInterrailStop: (stationId: string) => void;
    reorderInterrailStops: (fromIndex: number, toIndex: number) => void;
    setInterrailStops: (stops: InterrailStop[]) => void;
    clearInterrailStops: () => void;
    setInterrailRouteMode: (mode: boolean) => void;
    toggleInterrailRouteMode: () => void;
    // Affiliate Booking
    trackBookingClick: (click: Omit<BookingClick, 'id' | 'timestamp'>) => void;
    // Settings
    updateSettings: (newSettings: Partial<AppState['settings']>) => void;
    // Onboarding
    completeOnboarding: () => void;
    // Auth Modal & Anonymous logic
    setAuthModalOpen: (isOpen: boolean) => void;
    setAnonymousMode: (isAnonymous: boolean) => void;
    logout: () => void;
}

export const useTrainStore = create<AppState & TrainActions>()(
    persist(
        (set, get) => ({
            stations: [],
            routes: [],
            favorites: [],
            selectedRouteId: null,
            currentPlan: null,
            searchHistory: [],
            priceAlerts: [],
            userProfile: {
                name: 'Viajero',
                email: '',
                avatar: '🧳',
                country: 'España',
                currency: 'EUR',
                isRegistered: false,
            },
            stationCache: {},
            interrailStops: [],
            interrailRouteMode: false,
            bookingClicks: [],
            hasSeenOnboarding: false,
            settings: { priceAlerts: true, travelInsurance: false, quickPay: true },
            isOffline: !navigator.onLine,
            isLoading: false,
            error: null,
            isAuthModalOpen: false,
            isAnonymousMode: false,

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),

            setStations: (stations) => set({ stations }),

            // When routes change, clear selectedRouteId if the selected route
            // no longer exists in the new set
            setRoutes: (routes) => set((state) => {
                const selectedStillExists = routes.some(r => r.id === state.selectedRouteId);
                return {
                    routes,
                    selectedRouteId: selectedStillExists ? state.selectedRouteId : null,
                };
            }),

            cacheStations: (stations) => set((state) => {
                const updated = { ...state.stationCache };
                for (const s of stations) {
                    updated[s.id] = s;
                }
                return { stationCache: updated };
            }),

            resolveStationName: (id: string): string => {
                return get().stationCache[id]?.name ?? id;
            },
            setCurrentPlan: (plan) => set({ currentPlan: plan }),

            addSearchHistory: (entry) => set((state) => ({
                searchHistory: [
                    entry,
                    ...state.searchHistory.filter(e => !(e.fromId === entry.fromId && e.toId === entry.toId))
                ].slice(0, 10)
            })),

            setOfflineStatus: (isOffline) => set({ isOffline }),

            toggleFavorite: (route) => set((state) => {
                const isFav = state.favorites.some(r => r.id === route.id);
                return {
                    favorites: isFav
                        ? state.favorites.filter(r => r.id !== route.id)
                        : [...state.favorites, route]
                };
            }),

            setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),

            addPriceAlert: (alertData) => set((state) => ({
                priceAlerts: [...state.priceAlerts, {
                    ...alertData,
                    id: `alert-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    triggered: false,
                }]
            })),

            removePriceAlert: (id) => set((state) => ({
                priceAlerts: state.priceAlerts.filter(a => a.id !== id)
            })),

            triggerPriceAlert: (id) => set((state) => ({
                priceAlerts: state.priceAlerts.map(a => a.id === id ? { ...a, triggered: true } : a)
            })),

            updateUserProfile: (profile) => set((state) => ({
                userProfile: { ...state.userProfile, ...profile }
            })),


            // Interrail Route Builder
            addInterrailStop: (stop) => set((state) => {
                if (state.interrailStops.some(s => s.stationId === stop.stationId)) return state;
                return { interrailStops: [...state.interrailStops, stop] };
            }),

            removeInterrailStop: (stationId) => set((state) => ({
                interrailStops: state.interrailStops.filter(s => s.stationId !== stationId)
            })),

            reorderInterrailStops: (fromIndex, toIndex) => set((state) => {
                const arr = [...state.interrailStops];
                const [item] = arr.splice(fromIndex, 1);
                arr.splice(toIndex, 0, item);
                return { interrailStops: arr };
            }),

            setInterrailStops: (stops) => set({ interrailStops: stops }),

            clearInterrailStops: () => set({ interrailStops: [], interrailRouteMode: false }),

            setInterrailRouteMode: (mode) => set({ interrailRouteMode: mode }),

            toggleInterrailRouteMode: () => set((state) => ({
                interrailRouteMode: !state.interrailRouteMode
            })),

            trackBookingClick: (clickData) => set((state) => ({
                bookingClicks: [
                    {
                        ...clickData,
                        id: `bc-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                    },
                    ...state.bookingClicks
                ].slice(0, 50)
            })),
            updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
            setAnonymousMode: (isAnonymous) => set({ isAnonymousMode: isAnonymous }),
            logout: () => set({
                userProfile: {
                    name: 'Viajero',
                    email: '',
                    avatar: '🧳',
                    country: 'España',
                    currency: 'EUR',
                    isRegistered: false,
                },
                isAnonymousMode: false,
                isAuthModalOpen: false,
                bookingClicks: [],
                favorites: [],
                priceAlerts: [],
            }),
        }),
        {
            name: 'easytrain-storage-v2',
            storage: createJSONStorage(() => localStorage),
            // Don't persist transient UI state
            partialize: (state) => ({
                favorites: state.favorites,
                searchHistory: state.searchHistory,
                priceAlerts: state.priceAlerts,
                userProfile: state.userProfile,
                stationCache: state.stationCache,
                bookingClicks: state.bookingClicks,
                hasSeenOnboarding: state.hasSeenOnboarding,
                settings: state.settings,
                isAnonymousMode: state.isAnonymousMode,
                // DON'T persist: routes, selectedRouteId, interrailStops,
                // interrailRouteMode, isLoading, error, isOffline, stations,
                // isAuthModalOpen
            }),
        }
    )
);
