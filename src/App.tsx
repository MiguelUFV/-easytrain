import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Train, LayoutDashboard, Calendar, Settings as SettingsIcon,
  Map, Zap, Ticket, Heart, TrendingDown, AlertCircle,
  Bell, History, User, ChevronRight, Loader2
} from 'lucide-react';
import { useTrainStore } from './store/useTrainStore';
import { RouteCard } from './components/RouteCard';
import { fetchRoutes, fetchPopularRoutes } from './lib/api';
import { SearchPanel } from './components/SearchPanel';
import { SearchHistoryPanel, SearchHistoryPage } from './components/SearchHistory';
import { PriceCalendar } from './components/PriceCalendar';
import { ToastContainer } from './components/Toast';
import { OnboardingTour } from './components/OnboardingTour';
import type { Station, PassengerCounts, Station as StationType } from './types';

// Lazy-loaded heavy pages
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const Map3D = lazy(() => import('./components/Map3D').then(m => ({ default: m.Map3D })));
const InterrailPlanner = lazy(() => import('./components/InterrailPlanner').then(m => ({ default: m.InterrailPlanner })));
const PriceAlertsPage = lazy(() => import('./components/PriceAlertsPage').then(m => ({ default: m.PriceAlertsPage })));
const TicketsPage = lazy(() => import('./components/TicketsPage').then(m => ({ default: m.TicketsPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <Loader2 className="animate-spin text-indigo-400" size={32} />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { routes: storeRoutes, setRoutes, setError, error, addSearchHistory, setInterrailRouteMode, interrailStops } = useTrainStore();
  const [calendarFrom, setCalendarFrom] = useState<StationType | null>(null);
  const [calendarTo, setCalendarTo] = useState<StationType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'time'>('time');

  // When entering Dashboard, exit interrail route mode
  useEffect(() => {
    setInterrailRouteMode(false);
  }, [setInterrailRouteMode]);

  useEffect(() => {
    // Only load initial data if store has no routes yet
    if (storeRoutes.length > 0) return;
    const loadInitialData = async () => {
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
  }, [storeRoutes.length, setRoutes, setError]);

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
    } catch {
      setError('Error al buscar rutas.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDestinationClick = async (city: string, country: string, stationId: string) => {
    const defaultOrigin: StationType = {
      id: '7100000',
      name: 'Madrid-Puerta de Atocha',
      city: 'Madrid',
      country: 'España'
    };

    const destStation: StationType = {
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
      <header className="relative mb-12 p-10 md:p-20 rounded-[40px] overflow-hidden min-h-[400px] flex items-center border border-white/10 group">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(99,102,241,0.15)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(192,132,252,0.15)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474487022159-5a4ada5942e1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-transparent to-transparent" />
        </div>

        {/* Animated Particles/Blobs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] z-0" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] z-0" 
        />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full gap-12">
          <div className="text-center md:text-left max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6"
            >
              <Zap size={10} fill="currentColor" /> v2.4 (HAFAS ENGINE)
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tight leading-[0.85] mb-6 text-white"
            >
              Europa a tu <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                Manera
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-base md:text-xl max-w-lg leading-relaxed mx-auto md:mx-0 font-medium"
            >
              La plataforma definitiva para el viajero moderno. Inteligencia, ahorro y confort ferroviario en una sola app.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mt-8 justify-center md:justify-start"
            >
              <button onClick={() => navigate('/interrail')} className="btn-primary px-8 py-4 text-base">
                Empezar Aventura
              </button>
              <button onClick={() => navigate('/map')} className="px-8 py-4 text-sm font-bold text-gray-400 hover:text-white transition-colors border border-white/5 rounded-2xl hover:bg-white/5">
                Ver Mapa 3D
              </button>
            </motion.div>
          </div>
          
          {/* Visual Highlight - Premium Information */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="flex items-center gap-6">
              <div className="glass-card p-6 flex items-center gap-4 border-indigo-500/20">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Heart size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sostenibilidad</div>
                  <div className="text-sm font-bold text-white">Viaja con 90% menos CO2</div>
                </div>
              </div>
              <div className="glass-card p-6 flex items-center gap-4 border-purple-500/20">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Inteligencia</div>
                  <div className="text-sm font-bold text-white">Precios Dinámicos HAFAS</div>
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
              <h2 className="text-2xl font-black text-white tracking-tight">Destinos en Tendencia</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Las rutas más buscadas esta semana en Europa.</p>
            </div>
            <button onClick={() => navigate('/map')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-400 hover:text-white transition-all">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingDown size={18} className="text-indigo-400" />
              <span>Resultados Disponibles</span>
              {sortedResults.length > 0 && (
                <span className="text-xs font-semibold text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{sortedResults.length}</span>
              )}
            </h2>
            <div className="flex bg-white/3 p-1 rounded-xl border border-white/5 gap-0.5">
              <FilterButton label="Más Barato" active={sortBy === 'price'} onClick={() => setSortBy('price')} />
              <FilterButton label="Más Rápido" active={sortBy === 'duration'} onClick={() => setSortBy('duration')} />
              <FilterButton label="Más Temprano" active={sortBy === 'time'} onClick={() => setSortBy('time')} />
            </div>
          </div>

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
              <div className="glass-card p-16 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-bold text-white mb-2">No se han encontrado rutas</div>
                <div className="text-sm text-[var(--text-muted)]">Prueba cambiando el origen, destino o la fecha.</div>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Landing features when not searching */}
          {!calendarFrom && (
            <div className="glass-card p-6 border-indigo-500/10">
              <div className="flex items-center gap-2 text-indigo-400 mb-3">
                <Ticket size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ofertas Flash</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Madrid - Valencia</h3>
              <div className="text-2xl font-black text-white mb-1">19,90€</div>
              <p className="text-[10px] text-gray-500 mb-4">Solo hoy, billetes de alta velocidad con 60% dto.</p>
              <button
                onClick={() => handleDestinationClick("Valencia", "España", "7100002")}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all border border-white/5"
              >
                Reservar Ahora
              </button>
            </div>
          )}

          <div className="glass-card p-6">
            <div className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-5">Tu Plan Interrail</div>
            {interrailStops.length > 0 ? (
              <div className="space-y-0.5">
                {interrailStops.map((stop, i) => (
                  <TimelineStep key={stop.stationId} active={i === 0} location={stop.stationName || stop.stationId} date={`Parada ${i + 1}`} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500 mb-3">Sin ruta planificada</div>
                <button onClick={() => navigate('/interrail')} className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all">
                  Planificar Ruta
                </button>
              </div>
            )}
          </div>

          {/* Price Calendar — appears after search */}
          {calendarFrom && calendarTo && (
            <PriceCalendar
              fromId={calendarFrom.id}
              fromName={calendarFrom.name}
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
  const { setOfflineStatus } = useTrainStore();

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
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </main>
        <BottomNav />
        <ToastContainer />
        <OnboardingTour />
      </div>
    </Router>
  );
};

const DestinationCard = ({ city, country, image, delay, onClick }: { city: string, country: string, image: string, delay: number, onClick: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -8 }}
    onClick={onClick}
    className="group relative h-72 rounded-[32px] overflow-hidden cursor-pointer shadow-xl hover:shadow-indigo-500/10 transition-all border border-white/5"
  >
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10" />
    <img src={image} alt={city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20" />
    
    <div className="absolute bottom-6 left-6 right-6 z-30">
      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{country}</div>
      <div className="text-2xl font-black text-white tracking-tight">{city}</div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs font-bold text-indigo-300">Explorar ahora</div>
        <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="hidden md:flex w-64 border-r border-white/5 flex-col gap-6 flex-shrink-0" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <Train size={20} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-black tracking-tight gradient-text">EasyTrain</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === '/'} />
        <NavItem to="/interrail" icon={<Calendar size={18} />} label="Planificador Interrail" active={location.pathname === '/interrail'} badge="New" />
        <NavItem to="/tickets" icon={<Ticket size={18} />} label="Mis Billetes" active={location.pathname === '/tickets'} />
        <NavItem to="/favorites" icon={<Heart size={18} />} label="Favoritos" active={location.pathname === '/favorites'} />
        <NavItem to="/alerts" icon={<Bell size={18} />} label="Alertas de Precio" active={location.pathname === '/alerts'} />
        <NavItem to="/history" icon={<History size={18} />} label="Historial" active={location.pathname === '/history'} />
        <NavItem to="/map" icon={<Map size={18} />} label="Mapa 3D" active={location.pathname === '/map'} />
        <div className="my-3 border-t border-white/5" />
        <NavItem to="/profile" icon={<User size={18} />} label="Mi Perfil" active={location.pathname === '/profile'} />
        <NavItem to="/settings" icon={<SettingsIcon size={18} />} label="Configuración" active={location.pathname === '/settings'} />
      </nav>

      <div className="px-3 pb-6">
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Zap size={14} fill="currentColor" />
            <span className="text-[11px] font-black uppercase tracking-widest">Premium</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Desbloquea ahorros avanzados y sincronización.</p>
          <Link to="/interrail" className="block w-full py-2 text-[12px] font-bold text-white rounded-xl transition-colors text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
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
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all font-semibold text-sm ${
      active
        ? 'bg-indigo-500/15 text-white border border-indigo-500/25'
        : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-gray-200 border border-transparent'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-indigo-400' : ''}>{icon}</span>
      {label}
    </div>
    {badge && <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-400/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-400/20">{badge}</span>}
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
      <div className={`w-3 h-3 rounded-full ${active ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-gray-700'} relative z-10`} />
      <div className="w-0.5 flex-1 bg-gray-700/50 my-1" />
    </div>
    <div className="pb-6">
      <div className="font-bold text-sm leading-none">{location}</div>
      <div className="text-xs text-gray-500 mt-1">{date}</div>
    </div>
  </div>
);

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
      active
        ? 'bg-indigo-600/80 text-white shadow-md shadow-indigo-500/20 border border-indigo-500/40'
        : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {label}
  </button>
);

const Footer = () => (
  <footer className="px-8 py-12 border-t border-white/5 bg-black/20">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Train size={16} />
          </div>
          <span className="text-lg font-black tracking-tight gradient-text">EasyTrain</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          La plataforma definitiva para el viajero moderno en Europa. Inteligencia, ahorro y confort ferroviario en una sola app.
        </p>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Explora</h4>
        <ul className="space-y-3">
          <li><Link to="/" className="footer-link">Dashboard</Link></li>
          <li><Link to="/interrail" className="footer-link">Planificador</Link></li>
          <li><Link to="/map" className="footer-link">Mapa 3D</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Cuenta</h4>
        <ul className="space-y-3">
          <li><Link to="/profile" className="footer-link">Mi Perfil</Link></li>
          <li><Link to="/tickets" className="footer-link">Mis Billetes</Link></li>
          <li><Link to="/alerts" className="footer-link">Alertas</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Legal</h4>
        <ul className="space-y-3 text-slate-500 text-xs">
          <li>Términos y Condiciones</li>
          <li>Política de Privacidad</li>
          <li>Soporte 24/7</li>
        </ul>
      </div>
    </div>
    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
      <div>© 2026 EasyTrain Europa S.L.</div>
      <div className="flex gap-6">
        <span>Hecho con ❤️ en Madrid</span>
        <span className="text-indigo-400">v2.4.0 Codename: Orion</span>
      </div>
    </div>
  </footer>
);

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6 z-[2000]">
      <MobileNavItem to="/" icon={<LayoutDashboard size={20} />} active={location.pathname === '/'} label="Home" />
      <MobileNavItem to="/interrail" icon={<Calendar size={20} />} active={location.pathname === '/interrail'} label="Plan" />
      <MobileNavItem to="/tickets" icon={<Ticket size={20} />} active={location.pathname === '/tickets'} label="Billetes" />
      <MobileNavItem to="/map" icon={<Map size={20} />} active={location.pathname === '/map'} label="Mapa" />
      <MobileNavItem to="/profile" icon={<User size={20} />} active={location.pathname === '/profile'} label="Tú" />
    </nav>
  );
};

const MobileNavItem = ({ to, icon, active, label }: { to: string, icon: React.ReactNode, active: boolean, label: string }) => (
  <Link to={to} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-400' : 'text-gray-500'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </Link>
);

export default App;
