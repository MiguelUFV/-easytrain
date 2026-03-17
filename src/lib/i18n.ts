import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'es' | 'en';

const translations: Record<Language, Record<string, string>> = {
    es: {
        // Nav
        'nav.home': 'Home',
        'nav.plan': 'Plan',
        'nav.map': 'Mapa',
        'nav.you': 'Tú',
        'nav.tickets': 'Billetes',
        'nav.favorites': 'Favoritos',
        'nav.alerts': 'Alertas de Precio',
        'nav.history': 'Historial',
        'nav.settings': 'Configuración',
        'nav.profile': 'Mi Perfil',
        'nav.logout': 'Cerrar Sesión',
        'nav.login': 'Iniciar Sesión',
        // Search
        'search.from': 'Origen',
        'search.to': 'Destino',
        'search.fromPlaceholder': '¿Desde dónde?',
        'search.toPlaceholder': '¿A dónde vas?',
        'search.date': 'Fecha',
        'search.return': 'Regreso',
        'search.passengers': 'Pasajeros',
        'search.search': 'Buscar',
        'search.oneWay': 'Solo Ida',
        'search.roundTrip': 'Ida y Vuelta',
        'search.recentSearches': 'Búsquedas recientes',
        // Results
        'results.title': 'Resultados Disponibles',
        'results.cheapest': 'Más Barato',
        'results.fastest': 'Más Rápido',
        'results.earliest': 'Más Temprano',
        'results.noResults': 'No se encontraron rutas',
        // Booking
        'booking.book': 'Reservar',
        'booking.official': 'Web Oficial',
        'booking.compare': 'Comparar Precios',
        'booking.from': 'desde',
        // Share
        'share.title': 'Compartir',
        'share.whatsapp': 'WhatsApp',
        'share.telegram': 'Telegram',
        'share.copy': 'Copiar enlace',
        'share.copied': '¡Enlace copiado!',
        'share.message': 'Mira este viaje en tren',
        // Auth
        'auth.register': 'Crear Cuenta',
        'auth.login': 'Iniciar Sesión',
        'auth.guest': 'Continuar como Invitado',
        'auth.name': 'Nombre',
        'auth.email': 'Email',
        'auth.password': 'Contraseña',
        'auth.registerFree': 'Crear Cuenta Gratis',
        // Theme
        'theme.dark': 'Oscuro',
        'theme.light': 'Claro',
        'theme.system': 'Sistema',
        // General
        'general.trending': 'Destinos en Tendencia',
        'general.trendingDesc': 'Las rutas más buscadas esta semana en Europa.',
        'general.viewAll': 'Ver todos',
        'general.hero': 'Europa a tu Manera',
        'general.heroDesc': 'La plataforma definitiva para el viajero moderno. Inteligencia, ahorro y confort ferroviario en una sola app.',
        'general.startAdventure': 'Empezar Aventura',
        'general.viewMap': 'Ver Mapa 3D',
        // Landing
        'landing.trains': 'Trenes',
        'landing.from': 'desde',
        'landing.bestPrices': 'Los mejores precios para tu viaje en tren',
        'landing.compare': 'Compara precios entre operadores oficiales, Trainline y Omio.',
        'landing.searchNow': 'Buscar ahora',
    },
    en: {
        // Nav
        'nav.home': 'Home',
        'nav.plan': 'Plan',
        'nav.map': 'Map',
        'nav.you': 'You',
        'nav.tickets': 'Tickets',
        'nav.favorites': 'Favorites',
        'nav.alerts': 'Price Alerts',
        'nav.history': 'History',
        'nav.settings': 'Settings',
        'nav.profile': 'My Profile',
        'nav.logout': 'Log Out',
        'nav.login': 'Log In',
        // Search
        'search.from': 'From',
        'search.to': 'To',
        'search.fromPlaceholder': 'Where from?',
        'search.toPlaceholder': 'Where to?',
        'search.date': 'Date',
        'search.return': 'Return',
        'search.passengers': 'Passengers',
        'search.search': 'Search',
        'search.oneWay': 'One Way',
        'search.roundTrip': 'Round Trip',
        'search.recentSearches': 'Recent searches',
        // Results
        'results.title': 'Available Results',
        'results.cheapest': 'Cheapest',
        'results.fastest': 'Fastest',
        'results.earliest': 'Earliest',
        'results.noResults': 'No routes found',
        // Booking
        'booking.book': 'Book',
        'booking.official': 'Official Website',
        'booking.compare': 'Compare Prices',
        'booking.from': 'from',
        // Share
        'share.title': 'Share',
        'share.whatsapp': 'WhatsApp',
        'share.telegram': 'Telegram',
        'share.copy': 'Copy link',
        'share.copied': 'Link copied!',
        'share.message': 'Check out this train trip',
        // Auth
        'auth.register': 'Sign Up',
        'auth.login': 'Log In',
        'auth.guest': 'Continue as Guest',
        'auth.name': 'Name',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.registerFree': 'Create Free Account',
        // Theme
        'theme.dark': 'Dark',
        'theme.light': 'Light',
        'theme.system': 'System',
        // General
        'general.trending': 'Trending Destinations',
        'general.trendingDesc': 'The most searched routes this week in Europe.',
        'general.viewAll': 'View all',
        'general.hero': 'Europe Your Way',
        'general.heroDesc': 'The ultimate platform for the modern traveler. Intelligence, savings and rail comfort in one app.',
        'general.startAdventure': 'Start Adventure',
        'general.viewMap': 'View 3D Map',
        // Landing
        'landing.trains': 'Trains',
        'landing.from': 'from',
        'landing.bestPrices': 'The best prices for your train trip',
        'landing.compare': 'Compare prices between official operators, Trainline and Omio.',
        'landing.searchNow': 'Search now',
    },
};

interface I18nState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const useI18n = create<I18nState>()(
    persist(
        (set, get) => ({
            language: 'es',
            setLanguage: (language) => set({ language }),
            t: (key: string) => {
                const lang = get().language;
                return translations[lang][key] ?? translations['es'][key] ?? key;
            },
        }),
        {
            name: 'easytrain-i18n',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ language: state.language }),
        }
    )
);
