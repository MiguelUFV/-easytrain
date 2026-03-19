import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Train, LayoutDashboard, Calendar, Settings as SettingsIcon,
  Map, Zap, Ticket, Heart, TrendingDown, AlertCircle,
  Bell, History, User, ChevronRight, Loader2, X
} from 'lucide-react';
import { useTrainStore } from './store/useTrainStore';
import { RouteCard } from './components/ui/RouteCard';
import { fetchRoutes, fetchPopularRoutes, isRegionSupported, getOfficialFallback, FALLBACK_STATIONS } from './lib/api';
import { SearchPanel } from './components/features/SearchPanel';
import { RateLimitError } from './lib/rateLimit';
import { SearchHistoryPanel, SearchHistoryPage } from './components/features/SearchHistory';
import { PriceCalendar } from './components/ui/PriceCalendar';
import { RateLimitIndicator } from './components/ui/RateLimitIndicator';
import { ToastContainer, useToastStore } from './components/ui/Toast';
import { OnboardingTour } from './components/ui/OnboardingTour';
import { CookieBanner } from './components/ui/CookieBanner';
import { AuthModal } from './components/ui/AuthModal';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { useTheme } from './lib/theme';
import { useI18n } from './lib/i18n';
import type { Station, PassengerCounts, Station as StationType } from './types';
import { trackPageView, analytics } from './lib/analytics';
import { SEOHead } from './components/ui/SEOHead';
const RenfeAlertsPanel = lazy(() => import('./components/ui/RenfeAlertsPanel').then(m => ({ default: m.RenfeAlertsPanel })));

// Lazy-loaded heavy pages
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Map3D = lazy(() => import('./components/maps/Map3D').then(m => ({ default: m.Map3D })));
const InterrailPlanner = lazy(() => import('./components/features/InterrailPlanner').then(m => ({ default: m.InterrailPlanner })));
const PriceAlertsPage = lazy(() => import('./pages/PriceAlertsPage').then(m => ({ default: m.PriceAlertsPage })));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then(m => ({ default: m.TicketsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const RouteLanding = lazy(() => import('./pages/RouteLanding').then(m => ({ default: m.RouteLanding })));
const PopularRoutesIndex = lazy(() => import('./pages/RouteLanding').then(m => ({ default: m.PopularRoutesIndex })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <Loader2 className="animate-spin text-[#d4a853]" size={32} />
  </div>
);

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { routes: storeRoutes, setRoutes, setError, error, addSearchHistory, setInterrailRouteMode, interrailStops } = useTrainStore();
  const { addToast } = useToastStore();
  const [calendarFrom, setCalendarFrom] = useState<StationType | null>(null);
  const [calendarTo, setCalendarTo] = useState<StationType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'time'>('time');
  const [maintenanceOp, setMaintenanceOp] = useState<{ name: string; url: string } | null>(null);
  const [isSpanishRoute, setIsSpanishRoute] = useState(false);

  // When entering Dashboard, exit interrail route mode
  useEffect(() => {
    setInterrailRouteMode(false);
  }, [setInterrailRouteMode]);

  useEffect(() => {
    // Only load initial data ONCE on mount if store is empty
    const loadInitialData = async () => {
      if (storeRoutes.length > 0) return;
      setIsLoading(true);
      try {
        const fetchedRoutes = await fetchPopularRoutes();
        setRoutes(fetchedRoutes);
        setError(null);
      } catch {
        setError('Error al cargar los datos. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []); // Only run once on mount


  const handleSearch = async (params: {
    from: string;
    fromStation?: StationType;
    to: string;
    toStation?: StationType;
    departureDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    passengers: PassengerCounts;
  }) => {
    setIsSearching(true);
    // Always update calendar context on new search
    setCalendarFrom(params.fromStation ?? null);
    setCalendarTo(params.toStation ?? null);
    // Track search in Google Analytics
    analytics.searchRoute({
      origin: params.fromStation?.name ?? params.from,
      destination: params.toStation?.name ?? params.to,
      trip_type: params.tripType,
      passengers: params.passengers.adults + params.passengers.children + params.passengers.infants,
      departure_date: params.departureDate
    });
    // Check if region is supported
    if (!isRegionSupported(params.from, params.to)) {
      setRoutes([]);
      setMaintenanceOp(getOfficialFallback(params.from, params.to));
      setIsSearching(false);
      return;
    }

    setMaintenanceOp(null);

    // Detectar si la ruta involucra estaciones españolas para mostrar datos RT de Renfe
    const spanishCheck = (id: string) => id.startsWith('renfe-') || id.startsWith('71');
    setIsSpanishRoute(spanishCheck(params.from) || spanishCheck(params.to));

    try {
      const filtered = await fetchRoutes(params.from, params.to, params.departureDate);
      // Single source of truth: store.routes
      setRoutes(filtered);
      // Save to search history
      if (params.fromStation && params.toStation) {
        addSearchHistory({
          id: `sh-${Date.now()}`,
          fromId: params.from,
          fromName: params.fromStation.name,
          toId: params.to,
          toName: params.toStation.name,
          date: params.departureDate,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        addToast(`Demasiadas busquedas. Espera ${err.waitSeconds}s para continuar.`, 'warning');
      } else {
        setError('Error al buscar rutas.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleDestinationClick = async (city: string, country: string, stationId: string) => {
    const fallback = FALLBACK_STATIONS.find(s => s.id === stationId);
    
    const defaultOrigin: StationType = {
      id: '7100000',
      name: 'Madrid-Puerta de Atocha',
      city: 'Madrid',
      country: 'España'
    };

    const destStation: StationType = fallback ? {
      id: fallback.id,
      name: fallback.name,
      city: fallback.city,
      country: fallback.country
    } : {
      id: stationId,
      name: `${city} Central`,
      city: city,
      country: country
    };

    handleSearch({
      from: defaultOrigin.id,
      fromStation: defaultOrigin,
      to: stationId,
      toStation: destStation,
      departureDate: new Date().toISOString().split('T')[0],
      tripType: 'one-way',
      passengers: { adults: 1, children: 0, infants: 0 }
    });
  };

  const sortedResults = [...storeRoutes].sort((a, b) => {
    if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'time') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    if (sortBy === 'duration') {
      const durA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime();
      const durB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime();
      return durA - durB;
    }
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-8 md:p-10 overflow-y-auto"
    >
      <header className="relative mb-12 p-10 md:p-20 rounded-3xl overflow-hidden min-h-[420px] flex items-center border border-[var(--gold)]/[0.08] group">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(212,168,83,0.08)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,_rgba(14,20,37,0.9)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474487022159-5a4ada5942e1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-15 grayscale transition-all duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/60 to-transparent" />
          {/* Top gold accent line */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#d4a853]/30 to-transparent" />
        </div>

        {/* Ambient glow */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 20, 0], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-[#d4a853] rounded-full blur-[140px] z-0"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -40, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-[#d4a853] rounded-full blur-[160px] z-0"
        />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full gap-12">
          <div className="text-center md:text-left max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4a853]/[0.08] border border-[#d4a853]/20 text-[10px] font-bold text-[#d4a853] uppercase tracking-[0.2em] mb-6"
            >
              <Zap size={10} fill="currentColor" /> v2.5 (MULTI-API ENGINE)
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-5xl md:text-[5.5rem] font-bold tracking-tight leading-[0.9] mb-6"
              style={{ color: 'var(--text-main)' }}
            >
              Europa a tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4a853] via-[#f0c674] to-[#d4a853] animate-gradient-x">
                Manera
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[var(--text-muted)] text-base md:text-lg max-w-lg leading-relaxed mx-auto md:mx-0"
            >
              La plataforma definitiva para el viajero moderno. Inteligencia, ahorro y confort ferroviario en una sola app.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mt-10 justify-center md:justify-start"
            >
              <button onClick={() => navigate('/interrail')} className="btn-primary px-8 py-4 text-base font-bold">
                Empezar Aventura
              </button>
              <button onClick={() => navigate('/map')} className="btn-secondary px-8 py-4 text-sm">
                Ver Mapa 3D
              </button>
            </motion.div>
          </div>

          {/* Visual Highlight - Premium Information */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="flex flex-col gap-4">
              <div className="glass-card p-5 flex items-center gap-4 border-[#d4a853]/10">
                <div className="w-11 h-11 rounded-xl bg-[#d4a853]/[0.08] flex items-center justify-center text-[#d4a853]">
                  <Heart size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#d4a853] uppercase tracking-widest">Sostenibilidad</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>90% menos CO2</div>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center gap-4 border-[#d4a853]/10">
                <div className="w-11 h-11 rounded-xl bg-[#d4a853]/[0.08] flex items-center justify-center text-[#d4a853]">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#d4a853] uppercase tracking-widest">Inteligencia</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Precios HAFAS en vivo</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-500/10 text-red-400 px-5 py-3 rounded-xl mb-8 border border-red-500/20"
        >
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <SearchPanel onSearch={handleSearch} isLoading={isSearching} />

      {/* ── Trending Destinations ── */}
      {!calendarFrom && (
        <section className="mb-12 mt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Destinos en Tendencia</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Las rutas más buscadas esta semana en Europa.</p>
            </div>
            <button onClick={() => navigate('/map')} className="px-4 py-2 rounded-xl bg-[#d4a853]/[0.06] border border-[#d4a853]/10 text-xs font-semibold text-[#d4a853] hover:bg-[#d4a853]/10 transition-all">
              Ver todos
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DestinationCard
              city="París"
              country="Francia"
              image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800"
              delay={0}
              onClick={() => handleDestinationClick("París", "Francia", "8727100")}
            />
            <DestinationCard
              city="Amsterdam"
              country="Países Bajos"
              image="https://images.unsplash.com/photo-1534351590666-13e3e96b5571?auto=format&fit=crop&q=80&w=800"
              delay={0.1}
              onClick={() => handleDestinationClick("Amsterdam", "Países Bajos", "8400058")}
            />
            <DestinationCard
              city="Barcelona"
              country="España"
              image="https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800"
              delay={0.2}
              onClick={() => handleDestinationClick("Barcelona", "España", "7100018")}
            />
            <DestinationCard
              city="Roma"
              country="Italia"
              image="https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800"
              delay={0.3}
              onClick={() => handleDestinationClick("Roma", "Italia", "8300259")}
            />
          </div>
        </section>
      )}

      {/* Search History Chips */}
      <SearchHistoryPanel
        onSelect={(fromId, fromName, toId, toName, date) =>
          handleSearch({ from: fromId, fromStation: { id: fromId, name: fromName, city: '', country: '' }, to: toId, toStation: { id: toId, name: toName, city: '', country: '' }, departureDate: date, tripType: 'one-way', passengers: { adults: 1, children: 0, infants: 0 } })
        }
      />

      <RateLimitIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown size={18} className="text-[#d4a853]" />
              <span>Resultados Disponibles</span>
              {sortedResults.length > 0 && (
                <span className="text-xs font-semibold text-[var(--text-muted)] bg-[#d4a853]/[0.06] px-2.5 py-0.5 rounded-full border border-[#d4a853]/10">{sortedResults.length}</span>
              )}
            </h2>
            <div className="flex bg-white/3 p-1 rounded-xl border border-[#d4a853]/[0.06] gap-0.5">
              <FilterButton label="Más Barato" active={sortBy === 'price'} onClick={() => setSortBy('price')} />
              <FilterButton label="Más Rápido" active={sortBy === 'duration'} onClick={() => setSortBy('duration')} />
              <FilterButton label="Más Temprano" active={sortBy === 'time'} onClick={() => setSortBy('time')} />
            </div>
          </div>

          {isSpanishRoute && (
            <Suspense fallback={null}>
              <RenfeAlertsPanel className="mb-6" />
            </Suspense>
          )}

          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-[200px]" />
              ))
            ) : sortedResults.length > 0 ? (
              sortedResults.map((route, idx) => {
                const fromS: Station = calendarFrom ?? {
                  id: route.fromStationId,
                  name: route.fromStationName ?? route.fromStationId,
                  city: '', country: ''
                };
                const toS: Station = calendarTo ?? {
                  id: route.toStationId,
                  name: route.toStationName ?? route.toStationId,
                  city: '', country: ''
                };
                return <RouteCard key={`${route.id}-${idx}`} route={route} fromStation={fromS} toStation={toS} />;
              })
            ) : (
              <div className="glass-card p-16 text-center shadow-2xl border-[#d4a853]/[0.06] relative overflow-hidden group">
                {maintenanceOp ? (
                  <>
                    <div className="absolute inset-0 bg-[#d4a853]/[0.02] transition-colors group-hover:bg-[#d4a853]/[0.04]" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-[#d4a853]/[0.08] flex items-center justify-center text-4xl mx-auto mb-6">
                        ⚠️
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-main)' }}>En Mantenimiento</h3>
                      <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-8 leading-relaxed">
                        Actualmente no disponemos de conexión en tiempo real para trayectos internos en
                        <span className="text-[#d4a853] font-semibold"> {maintenanceOp.name}</span>.
                      </p>
                      <button
                        onClick={() => window.open(maintenanceOp.url, '_blank')}
                        className="btn-primary px-8 py-4 text-sm font-bold"
                      >
                        Consultar en Web Oficial ({maintenanceOp.name})
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-4">🔍</div>
                    <div className="font-bold text-white mb-2">No se han encontrado rutas</div>
                    <div className="text-sm text-[var(--text-muted)]">Prueba cambiando el origen, destino o la fecha.</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Landing features when not searching */}
          {!calendarFrom && (
            <div className="glass-card p-6 border-[#d4a853]/10">
              <div className="flex items-center gap-2 text-[#d4a853] mb-3">
                <Ticket size={16} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ofertas Flash</span>
              </div>
              <h3 className="font-display text-sm font-semibold mb-2" style={{ color: 'var(--text-main)' }}>Madrid — Valencia</h3>
              <div className="text-2xl font-bold text-[#d4a853] mb-1">19,90€</div>
              <p className="text-[10px] text-[var(--text-muted)] mb-4">Solo hoy, billetes de alta velocidad con 60% dto.</p>
              <button
                onClick={() => handleDestinationClick("Valencia", "España", "7100002")}
                className="w-full py-2.5 bg-[#d4a853]/[0.06] hover:bg-[#d4a853]/10 text-xs font-semibold rounded-xl transition-all border border-[#d4a853]/10 text-[#d4a853]"
              >
                Reservar Ahora
              </button>
            </div>
          )}

          <div className="glass-card p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">Tu Plan Interrail</div>
            {interrailStops.length > 0 ? (
              <div className="space-y-0.5">
                {interrailStops.map((stop, i) => (
                  <TimelineStep key={stop.stationId} active={i === 0} location={stop.stationName || stop.stationId} date={`Parada ${i + 1}`} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-[var(--text-muted)] mb-3">Sin ruta planificada</div>
                <button onClick={() => navigate('/interrail')} className="px-4 py-2.5 rounded-xl bg-[#d4a853]/[0.08] border border-[#d4a853]/15 text-xs font-semibold text-[#d4a853] hover:bg-[#d4a853]/15 transition-all">
                  Planificar Ruta
                </button>
              </div>
            )}
          </div>

          {/* Price Calendar — appears after search */}
          {calendarFrom && calendarTo && (
            <PriceCalendar
              fromId={calendarFrom.id}
              toId={calendarTo.id}
              toName={calendarTo.name}
              selectedDate={new Date().toISOString().split('T')[0]}
              onSelectDate={(date) => handleSearch({ from: calendarFrom.id, fromStation: calendarFrom, to: calendarTo.id, toStation: calendarTo, departureDate: date, tripType: 'one-way', passengers: { adults: 1, children: 0, infants: 0 } })}
            />
          )}
        </aside>
      </div>
    </motion.div>
  );
};

const FavoritesPage = () => {
  const { favorites } = useTrainStore();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-6 md:p-8 overflow-y-auto"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Heart className="text-red-500" size={28} fill="currentColor" />
          Tus Favoritos
        </h1>
        <p className="text-gray-400 mt-1">Acceso rápido a tus trayectos guardados.</p>
      </header>

      <div className="flex flex-col gap-4">
        {favorites.length > 0 ? (
          favorites.map((route, idx) => {
            const fromS: Station = { id: route.fromStationId, name: route.fromStationName ?? route.fromStationId, city: '', country: '' };
            const toS: Station = { id: route.toStationId, name: route.toStationName ?? route.toStationId, city: '', country: '' };
            return <RouteCard key={`${route.id}-${idx}`} route={route} fromStation={fromS} toStation={toS} />;
          })
        ) : (
          <div className="glass-card p-12 text-center text-gray-500 font-medium border-dashed border-white/10">
            No tienes rutas guardadas aún. Explora trayectos y pulsa el corazón para guardarlos.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const App = () => {
  const { setOfflineStatus, userProfile, isAnonymousMode, setAuthModalOpen } = useTrainStore();

  useEffect(() => {
    // Show auth modal if not registered and not in anonymous mode
    if (!userProfile.isRegistered && !isAnonymousMode) {
      const timer = setTimeout(() => {
        setAuthModalOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userProfile.isRegistered, isAnonymousMode, setAuthModalOpen]);

  // Initialize theme on mount
  useEffect(() => {
    const theme = useTheme.getState().theme;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return (
    <Router>
      <SEOHead />
      <AnalyticsTracker />
      <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-dark)] text-white">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col pb-20 md:pb-0">
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/map" element={<Map3D />} />
                <Route path="/interrail" element={<InterrailPlanner />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/alerts" element={<PriceAlertsPage />} />
                <Route path="/history" element={<SearchHistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/trenes" element={<PopularRoutesIndex />} />
                <Route path="/trenes/:route" element={<RouteLanding />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </main>
        <BottomNav />
        <ToastContainer />
        <OnboardingTour />
        <CookieBanner />
        <AuthModal />
        <PWAInstallPrompt />
      </div>
    </Router>
  );
};

const DestinationCard = ({ city, country, image, delay, onClick }: { city: string, country: string, image: string, delay: number, onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -6 }}
    onClick={onClick}
    className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-[#d4a853]/[0.08] transition-all border border-white/5"
  >
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-all duration-500 z-10" />
    <img src={image} alt={city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />

    <div className="absolute bottom-6 left-6 right-6 z-30">
      <div className="text-[10px] font-bold text-[#d4a853] uppercase tracking-widest mb-1">{country}</div>
      <div className="font-display text-2xl font-bold text-white tracking-tight">{city}</div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs font-medium text-[#d4a853]/80">Explorar ahora</div>
        <button className="w-8 h-8 rounded-full bg-[#d4a853]/20 backdrop-blur-md flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n();
  return (
    <button
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-2"
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-sm">{language === 'es' ? '🇬🇧' : '🇪🇸'}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {language === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  );
};

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="hidden md:flex w-64 border-r border-white/5 flex-col gap-6 flex-shrink-0" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#d4a853] to-[#c9973f] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4a853]/20 flex-shrink-0">
            <Train size={20} strokeWidth={2.5} className="text-[#0a0f1c]" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">EasyTrain</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === '/'} />
        <NavItem to="/interrail" icon={<Calendar size={18} />} label="Planificador Interrail" active={location.pathname === '/interrail'} badge="New" />
        {useTrainStore.getState().bookingClicks.length > 0 && (
          <NavItem to="/tickets" icon={<Ticket size={18} />} label="Mis Billetes" active={location.pathname === '/tickets'} />
        )}
        <NavItem to="/favorites" icon={<Heart size={18} />} label="Favoritos" active={location.pathname === '/favorites'} />
        <NavItem to="/alerts" icon={<Bell size={18} />} label="Alertas de Precio" active={location.pathname === '/alerts'} />
        <NavItem to="/history" icon={<History size={18} />} label="Historial" active={location.pathname === '/history'} />
        <NavItem to="/map" icon={<Map size={18} />} label="Mapa 3D" active={location.pathname === '/map'} />
        <NavItem to="/trenes" icon={<TrendingDown size={18} />} label="Rutas Populares" active={location.pathname.startsWith('/trenes')} badge="SEO" />
        <div className="my-3 border-t border-white/5" />
        <NavItem to="/profile" icon={<User size={18} />} label="Mi Perfil" active={location.pathname === '/profile'} />
        <NavItem to="/settings" icon={<SettingsIcon size={18} />} label="Configuración" active={location.pathname === '/settings'} />
        
        {useTrainStore.getState().userProfile.isRegistered && (
           <button 
             onClick={() => {
               if (confirm('¿Cerrar sesión?')) {
                 useTrainStore.getState().logout();
               }
             }}
             className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all font-semibold text-sm mt-auto mb-2"
           >
             <X size={18} />
             <span>Cerrar Sesión</span>
           </button>
        )}
      </nav>

      <div className="px-3 pb-6 flex flex-col gap-3">
        {/* Theme & Language toggles */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        {!useTrainStore.getState().userProfile.isRegistered && (
          <button
            onClick={() => useTrainStore.getState().setAuthModalOpen(true)}
            className="w-full py-3 bg-[#d4a853]/[0.08] hover:bg-[#d4a853]/15 text-[#d4a853] text-xs font-bold uppercase tracking-widest rounded-xl border border-[#d4a853]/15 transition-all flex items-center justify-center gap-2"
          >
            <User size={14} />
            Iniciar Sesión
          </button>
        )}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.1)' }}>
          <div className="flex items-center gap-2 text-[#d4a853] mb-2">
            <Zap size={14} fill="currentColor" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Premium</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">Desbloquea ahorros avanzados y sincronización.</p>
          <Link to="/interrail" className="block w-full py-2 text-[12px] font-bold text-[#0a0f1c] rounded-xl transition-colors text-center" style={{ background: 'linear-gradient(135deg, #d4a853, #c9973f)' }}>
            Planificar Viaje
          </Link>
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: string;
}

const NavItem = ({ to, icon, label, active, badge }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all font-medium text-sm ${
      active
        ? 'bg-[#d4a853]/[0.08] border border-[#d4a853]/15'
        : 'text-[var(--text-muted)] hover:bg-[#d4a853]/[0.04] hover:text-[var(--text-main)] border border-transparent'
    }`}
    style={active ? { color: 'var(--text-main)' } : undefined}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-[#d4a853]' : ''}>{icon}</span>
      {label}
    </div>
    {badge && <span className="text-[9px] font-bold uppercase tracking-widest bg-[#d4a853]/10 text-[#d4a853] px-2 py-0.5 rounded-full border border-[#d4a853]/15">{badge}</span>}
  </Link>
);

interface TimelineStepProps {
  location: string;
  date: string;
  active?: boolean;
}

const TimelineStep = ({ location, date, active }: TimelineStepProps) => (
  <div className="flex gap-4 relative">
    <div className="flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full ${active ? 'bg-[#d4a853] shadow-md shadow-[#d4a853]/40' : 'bg-gray-700'} relative z-10`} />
      <div className="w-0.5 flex-1 bg-gray-700/50 my-1" />
    </div>
    <div className="pb-6">
      <div className="font-semibold text-sm leading-none">{location}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{date}</div>
    </div>
  </div>
);

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
      active
        ? 'bg-[#d4a853]/15 text-[#d4a853] border border-[#d4a853]/25'
        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 border border-transparent'
    }`}
  >
    {label}
  </button>
);

const Footer = () => (
  <footer className="px-8 py-14 border-t border-[#d4a853]/[0.06]" style={{ background: 'rgba(0,0,0,0.15)' }}>
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-[#d4a853] to-[#c9973f] rounded-lg flex items-center justify-center">
            <Train size={16} className="text-[#0a0f1c]" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">EasyTrain</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          La plataforma definitiva para el viajero moderno en Europa. Inteligencia, ahorro y confort ferroviario en una sola app.
        </p>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-main)' }}>Explora</h4>
        <ul className="space-y-3">
          <li><Link to="/" className="footer-link">Dashboard</Link></li>
          <li><Link to="/interrail" className="footer-link">Planificador</Link></li>
          <li><Link to="/map" className="footer-link">Mapa 3D</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-main)' }}>Cuenta</h4>
        <ul className="space-y-3">
          <li><Link to="/profile" className="footer-link">Mi Perfil</Link></li>
          <li><Link to="/tickets" className="footer-link">Mis Billetes</Link></li>
          <li><Link to="/alerts" className="footer-link">Alertas</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-main)' }}>Legal</h4>
        <ul className="space-y-3 text-[var(--text-muted)] text-xs">
          <li>Términos y Condiciones</li>
          <li><Link to="/privacy" className="footer-link">Política de Privacidad</Link></li>
          <li>Soporte 24/7</li>
        </ul>
      </div>
    </div>
    <div className="gold-line mt-12 mb-8" />
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
      <div>© 2026 EasyTrain Europa S.L.</div>
      <div className="flex gap-6">
        <span>Hecho con ❤️ en Madrid</span>
        <span className="text-[#d4a853]">v2.4.0 Codename: Orion</span>
      </div>
    </div>
  </footer>
);

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#080c16]/90 backdrop-blur-xl border-t border-[#d4a853]/[0.06] flex items-center justify-around px-6 z-[2000]">
      <MobileNavItem to="/" icon={<LayoutDashboard size={20} />} active={location.pathname === '/'} label="Home" />
      <MobileNavItem to="/interrail" icon={<Calendar size={20} />} active={location.pathname === '/interrail'} label="Plan" />
      {useTrainStore.getState().bookingClicks.length > 0 && (
        <MobileNavItem to="/tickets" icon={<Ticket size={20} />} active={location.pathname === '/tickets'} label="Billetes" />
      )}
      <MobileNavItem to="/map" icon={<Map size={20} />} active={location.pathname === '/map'} label="Mapa" />
      <MobileNavItem to="/profile" icon={<User size={20} />} active={location.pathname === '/profile'} label="Tú" />
    </nav>
  );
};

const MobileNavItem = ({ to, icon, active, label }: { to: string, icon: React.ReactNode, active: boolean, label: string }) => (
  <Link to={to} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#d4a853]' : 'text-gray-500'}`}>
    {icon}
    <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
  </Link>
);

export default App;
