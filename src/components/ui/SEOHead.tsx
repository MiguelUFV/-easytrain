import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://easytrain.vercel.app';

interface SEOConfig {
  title: string;
  description: string;
  path: string;
}

const routeSEO: Record<string, SEOConfig> = {
  '/': {
    title: 'EasyTrain — Compara Trenes por Europa | Precios y Rutas',
    description: 'Compara precios de trenes por Europa en tiempo real. Encuentra las mejores ofertas en Renfe, SNCF, Trenitalia, Deutsche Bahn y más. Planifica tu Interrail.',
    path: '/',
  },
  '/interrail': {
    title: 'Planificador Interrail | EasyTrain — Optimiza tu Ruta por Europa',
    description: 'Planifica tu viaje Interrail con inteligencia. Optimiza rutas, calcula ahorros y descubre las mejores conexiones de tren por Europa.',
    path: '/interrail',
  },
  '/map': {
    title: 'Mapa 3D de Trenes en Europa | EasyTrain',
    description: 'Explora las conexiones ferroviarias de Europa en un mapa 3D interactivo. Visualiza rutas, estaciones y planifica tu viaje.',
    path: '/map',
  },
  '/alerts': {
    title: 'Alertas de Precio de Trenes | EasyTrain',
    description: 'Configura alertas de precio para tus rutas de tren favoritas. Te avisamos cuando bajen los precios para que no te pierdas las mejores ofertas.',
    path: '/alerts',
  },
  '/tickets': {
    title: 'Mis Billetes de Tren | EasyTrain',
    description: 'Gestiona tus billetes de tren. Consulta reservas, horarios y detalles de tus viajes por Europa.',
    path: '/tickets',
  },
  '/favorites': {
    title: 'Rutas Favoritas | EasyTrain',
    description: 'Accede rápidamente a tus rutas de tren favoritas por Europa. Compara precios y reserva en un clic.',
    path: '/favorites',
  },
  '/history': {
    title: 'Historial de Búsquedas | EasyTrain',
    description: 'Revisa tu historial de búsquedas de trenes y repite tus consultas anteriores fácilmente.',
    path: '/history',
  },
  '/profile': {
    title: 'Mi Perfil | EasyTrain',
    description: 'Gestiona tu perfil, preferencias de viaje y configuración de tu cuenta EasyTrain.',
    path: '/profile',
  },
  '/settings': {
    title: 'Configuración | EasyTrain',
    description: 'Personaliza tu experiencia en EasyTrain. Ajusta notificaciones, idioma y preferencias de viaje.',
    path: '/settings',
  },
};

const defaultSEO: SEOConfig = {
  title: 'EasyTrain — Compara Trenes por Europa',
  description: 'Compara precios de trenes por Europa en tiempo real. Planifica tu Interrail y encuentra las mejores ofertas.',
  path: '/',
};

export const SEOHead = () => {
  const location = useLocation();
  const seo = routeSEO[location.pathname] || defaultSEO;

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={`${BASE_URL}${seo.path}`} />

      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={`${BASE_URL}${seo.path}`} />

      {/* Twitter */}
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Helmet>
  );
};
