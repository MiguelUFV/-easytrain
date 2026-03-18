import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, BookingClick, InterrailPlan, InterrailStop, PriceAlert, Route, SearchHistoryEntry, Station, UserProfile } from '../types';
import { logoutUser } from '../lib/auth';
import {
    saveFavorites,
    savePriceAlerts,
    saveSearchHistory,
    saveSettings,
    saveUserProfile,
    getCurrentUid,
    loadUserData,
    mergeUserData,
    onAuthChange,
    type FirestoreUserData,
} from '../lib/firestore-sync';

// ─── Debounced Firestore sync ────────────────────────────────────────
// Batches rapid writes (e.g. toggling multiple favorites) into one Firestore call
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function debouncedSync(key: string, fn: (uid: string) => Promise<void>, delayMs = 800) {
    const uid = getCurrentUid();
    if (!uid) return; // not authenticated — skip cloud sync
    clearTimeout(syncTimers[key]);
    syncTimers[key] = setTimeout(() => {
        fn(uid).catch((err) => console.warn(`[firestore-sync] ${key} failed:`, err));
    }, delayMs);
}

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
    // Firestore sync
    loadCloudData: (cloudData: FirestoreUserData) => void;
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

            addSearchHistory: (entry) => {
                set((state) => ({
                    searchHistory: [
                        entry,
                        ...state.searchHistory.filter(e => !(e.fromId === entry.fromId && e.toId === entry.toId))
                    ].slice(0, 10)
                }));
                debouncedSync('searchHistory', (uid) => saveSearchHistory(uid, get().searchHistory));
            },

            setOfflineStatus: (isOffline) => set({ isOffline }),

            toggleFavorite: (route) => {
                set((state) => {
                    const isFav = state.favorites.some(r => r.id === route.id);
                    return {
                        favorites: isFav
                            ? state.favorites.filter(r => r.id !== route.id)
                            : [...state.favorites, route]
                    };
                });
                debouncedSync('favorites', (uid) => saveFavorites(uid, get().favorites));
            },

            setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),

            addPriceAlert: (alertData) => {
                set((state) => ({
                    priceAlerts: [...state.priceAlerts, {
                        ...alertData,
                        id: `alert-${Date.now()}`,
                        createdAt: new Date().toISOString(),
                        triggered: false,
                    }]
                }));
                debouncedSync('priceAlerts', (uid) => savePriceAlerts(uid, get().priceAlerts));
            },

            removePriceAlert: (id) => {
                set((state) => ({
                    priceAlerts: state.priceAlerts.filter(a => a.id !== id)
                }));
                debouncedSync('priceAlerts', (uid) => savePriceAlerts(uid, get().priceAlerts));
            },

            triggerPriceAlert: (id) => {
                set((state) => ({
                    priceAlerts: state.priceAlerts.map(a => a.id === id ? { ...a, triggered: true } : a)
                }));
                debouncedSync('priceAlerts', (uid) => savePriceAlerts(uid, get().priceAlerts));
            },

            updateUserProfile: (profile) => {
                set((state) => ({
                    userProfile: { ...state.userProfile, ...profile }
                }));
                debouncedSync('userProfile', (uid) => saveUserProfile(uid, get().userProfile));
            },


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
            updateSettings: (newSettings) => {
                set((state) => ({ settings: { ...state.settings, ...newSettings } }));
                debouncedSync('settings', (uid) => saveSettings(uid, get().settings));
            },
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
            setAnonymousMode: (isAnonymous) => set({ isAnonymousMode: isAnonymous }),

            // Load cloud data and merge with local state
            loadCloudData: (cloudData) => set((state) => {
                const merged = mergeUserData(
                    {
                        favorites: state.favorites,
                        priceAlerts: state.priceAlerts,
                        searchHistory: state.searchHistory,
                        settings: state.settings,
                    },
                    cloudData
                );
                return {
                    favorites: merged.favorites,
                    priceAlerts: merged.priceAlerts,
                    searchHistory: merged.searchHistory,
                    settings: merged.settings,
                    userProfile: {
                        ...state.userProfile,
                        name: cloudData.name || state.userProfile.name,
                        email: cloudData.email || state.userProfile.email,
                        avatar: cloudData.avatar || state.userProfile.avatar,
                        country: cloudData.country || state.userProfile.country,
                        currency: cloudData.currency || state.userProfile.currency,
                        isRegistered: true,
                    },
                };
            }),

            logout: () => {
                logoutUser().catch(() => {});
                // Cancel any pending syncs
                Object.keys(syncTimers).forEach(k => clearTimeout(syncTimers[k]));
                set({
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
                    searchHistory: [],
                });
            },
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

// ─── Auth-aware cloud sync initializer ───────────────────────────────
// Call once at app startup (e.g. in main.tsx or App.tsx).
// Listens for Firebase Auth state and loads/merges cloud data on login.

let authSyncInitialized = false;

export function initAuthSync(): void {
    if (authSyncInitialized) return;
    authSyncInitialized = true;

    onAuthChange(async (user) => {
        if (user) {
            // User just logged in (or page refresh with existing session)
            try {
                const cloudData = await loadUserData(user.uid);
                if (cloudData) {
                    useTrainStore.getState().loadCloudData(cloudData);
                }
            } catch (err) {
                console.warn('[firestore-sync] Failed to load cloud data:', err);
            }
        }
    });
}
