export interface Station {
    id: string;
    name: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    type?: string;
    tier?: 1 | 2 | 3 | 4;
}

export interface Route {
    id: string;
    fromStationId: string;
    toStationId: string;
    fromStationName?: string;
    toStationName?: string;
    fromCoordinates?: { lat: number; lng: number };
    toCoordinates?: { lat: number; lng: number };
    departureTime: string;
    arrivalTime: string;
    price?: number;
    operator: string;
    type: string;
    occupancy?: number;
    platform?: string;
    delay?: number;
    lineName?: string;
    legs?: number;
    stops?: Stop[];
}

export interface Stop {
    stationId: string;
    stationName: string;
    arrivalTime?: string;
    departureTime?: string;
    platform?: string;
    delay?: number;
    isTransfer?: boolean;
    coordinates?: { lat: number; lng: number };
}

export interface PassengerCounts {
    adults: number;
    children: number;
    infants: number;
}

export interface SearchParams {
    fromStationId: string;
    toStationId: string;
    departureDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    passengers: PassengerCounts;
}

export interface Leg {
    routeId: string;
    departureDate: string;
}

export interface InterrailPlan {
    id: string;
    startDate: string;
    startStationId: string;
    legs: Leg[];
    stayDurationDays: number;
}

// NEW: Price Alert
export interface PriceAlert {
    id: string;
    fromStationId: string;
    fromStationName: string;
    toStationId: string;
    toStationName: string;
    targetPrice: number;
    createdAt: string;
    triggered: boolean;
}

// NEW: Search History Entry (richer than a plain string)
export interface SearchHistoryEntry {
    id: string;
    fromName: string;
    toName: string;
    fromId: string;
    toId: string;
    date: string;
    timestamp: string;
}

// NEW: User Profile
export interface UserProfile {
    name: string;
    email: string;
    avatar?: string; // emoji or url
    country: string;
    currency: string;
    isRegistered: boolean;
    bio?: string;
}

// Interrail map-planner sync
export interface InterrailStop {
    stationId: string;
    stationName: string;
    addedFrom: 'map' | 'planner'; // where it was added
}

export type BookingPlatform = 'trainline' | 'omio';

export interface BookingClick {
    id: string;
    routeId: string;
    platform: BookingPlatform;
    timestamp: string;
    fromCity: string;
    toCity: string;
}

export interface AppState {
    stations: Station[];
    routes: Route[];
    favorites: Route[];
    selectedRouteId: string | null;
    currentPlan: InterrailPlan | null;
    searchHistory: SearchHistoryEntry[];
    priceAlerts: PriceAlert[];
    userProfile: UserProfile;
    stationCache: Record<string, Station>;
    isOffline: boolean;
    isLoading: boolean;
    error: string | null;
    // Interrail route builder
    interrailStops: InterrailStop[];
    interrailRouteMode: boolean;
    // Affiliate Booking
    bookingClicks: BookingClick[];
    // Onboarding
    hasSeenOnboarding: boolean;
    // Settings
    settings: {
        priceAlerts: boolean;
        travelInsurance: boolean;
        quickPay: boolean;
    };
    // Auth
    isAuthModalOpen: boolean;
    isAnonymousMode: boolean;
}
