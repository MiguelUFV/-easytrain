import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Carga .env.local sin prefijo — solo disponible en vite.config (servidor dev)
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
    tailwindcss(),
    // Dev proxy para Digitransit — necesita POST GraphQL para rutas,
    // por eso usamos middleware manual en vez del proxy estándar de Vite
    {
      name: 'digitransit-dev-proxy',
      configureServer(server: any) {
        server.middlewares.use('/api/digitransit', async (req: any, res: any, next: any) => {
          const KEY = env.DIGITRANSIT_KEY ?? '';
          if (!KEY) { next(); return; }
          const url  = new URL(`http://localhost${req.url}`);
          const type = url.searchParams.get('type');
          const dtHeaders = { 'digitransit-subscription-key': KEY, 'Content-Type': 'application/json' };
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          try {
            if (type === 'stations') {
              const q = url.searchParams.get('q') ?? '';
              const r = await fetch(
                `https://api.digitransit.fi/geocoding/v1/autocomplete?text=${encodeURIComponent(q)}&size=10&sources=gtfsvr&layers=stop,station`,
                { headers: dtHeaders }
              );
              res.end(await r.text());
            } else if (type === 'routes') {
              const fromLat = url.searchParams.get('fromLat') ?? '0';
              const fromLon = url.searchParams.get('fromLon') ?? '0';
              const toLat   = url.searchParams.get('toLat')   ?? '0';
              const toLon   = url.searchParams.get('toLon')   ?? '0';
              const date    = url.searchParams.get('date')    ?? '';
              const time    = url.searchParams.get('time')    ?? '12:00:00';
              const query = `{ plan(from:{lat:${fromLat},lon:${fromLon}} to:{lat:${toLat},lon:${toLon}} numItineraries:6 date:"${date}" time:"${time}" transportModes:[{mode:RAIL}]) { itineraries { duration startTime endTime legs { mode startTime endTime from { name stop { gtfsId } } to { name stop { gtfsId } } route { shortName longName agency { name } } intermediateStops { name arrivalTime departureTime stop { gtfsId } } } } } }`;
              const r = await fetch('https://api.digitransit.fi/routing/v2/finland/gtfs/v1', {
                method: 'POST', headers: dtHeaders, body: JSON.stringify({ query }),
              });
              res.end(await r.text());
            } else { next(); }
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })); }
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'EasyTrain — Rutas de Tren por Europa',
        short_name: 'EasyTrain',
        description: 'Descubre y reserva las mejores rutas de tren por Europa con ahorro inteligente.',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['travel', 'transportation'],
        lang: 'es',
        dir: 'ltr',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'og-image.png',
            sizes: '1200x630',
            type: 'image/png',
            form_factor: 'wide',
            label: 'EasyTrain - Búsqueda de trenes por Europa'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'EasyTrain Mobile'
          }
        ],
        shortcuts: [
          {
            name: 'Planificador Interrail',
            short_name: 'Interrail',
            url: '/interrail',
            icons: [{ src: 'favicon.svg', sizes: 'any' }]
          },
          {
            name: 'Mapa de Europa',
            short_name: 'Mapa',
            url: '/map',
            icons: [{ src: 'favicon.svg', sizes: 'any' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache de búsquedas de estaciones (respuestas rápidas)
            urlPattern: /^\/api-(db|ch|irail|oebb|pkp|flixbus|vbb|bvg|rejse|renfe-ckan)\/.*(locations|stations|connections|datastore_search)|https:\/\/(v6\.db\.transport\.rest|transport\.opendata\.ch|api\.irail\.be|data\.renfe\.com|ressources\.data\.sncf\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'station-searches',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1h
            },
          },
          {
            // Cache de datos en tiempo real de Renfe (corta duración)
            urlPattern: /^\/api-renfe-rt\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'renfe-realtime-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 }, // 30 segundos
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache de rutas/conexiones (datos frescos)
            urlPattern: /^\/api-(db|ch|irail)\/.*(journeys|connections)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'train-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 30, // 30 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    })
  ],
  server: {
    proxy: {
      '/api-db': {
        target: 'https://v6.db.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-db/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (DB)', err);
          });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          });
        },
      },
      '/api-ch': {
        target: 'https://transport.opendata.ch/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-ch/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (SBB)', err);
          });
        },
      },
      '/api-irail': {
        target: 'https://api.irail.be',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-irail/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (iRail)', err);
          });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'EasyTrain/2.5 (train-planner)');
          });
        },
      },
      '/api-oebb': {
        target: 'https://v6.oebb.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-oebb/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => { console.log('proxy error (ÖBB)', err); });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'EasyTrain/2.5 (train-planner)');
          });
        },
      },
      '/api-pkp': {
        target: 'https://v6.pkp.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-pkp/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => { console.log('proxy error (PKP)', err); });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'EasyTrain/2.5 (train-planner)');
          });
        },
      },
      '/api-rejse': {
        target: 'https://v6.rejseplansen.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-rejse/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => { console.log('proxy error (Rejse)', err); });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'EasyTrain/2.5 (train-planner)');
          });
        },
      },
      '/api-renfe-rt': {
        target: 'https://gtfsrt.renfe.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-renfe-rt/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (Renfe RT)', err);
          });
        },
      },
      '/api-renfe-ckan': {
        target: 'https://data.renfe.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-renfe-ckan/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (Renfe CKAN)', err);
          });
        },
      },
      '/api-renfe-gtfs': {
        target: 'https://ssl.renfe.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-renfe-gtfs/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error (Renfe GTFS)', err);
          });
        },
      },
      // ResRobot dev proxy — transforma /api/resrobot?type=...&q=...
      // a la URL real de ResRobot inyectando la key desde .env.local
      '/api/resrobot': {
        target: 'https://api.resrobot.se',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => { console.log('proxy error (ResRobot)', err); });
          proxy.on('proxyReq', (proxyReq, req) => {
            const parsed = new URL(req.url!, `http://${req.headers.host}`);
            const type   = parsed.searchParams.get('type');
            if (type === 'stations') {
              const q = parsed.searchParams.get('q') ?? '';
              proxyReq.path = `/v2.1/location.name?input=${encodeURIComponent(q)}&format=json&accessId=${env.RESROBOT_STOPS_KEY}&maxNo=10`;
            } else if (type === 'routes') {
              const from = parsed.searchParams.get('from') ?? '';
              const to   = parsed.searchParams.get('to')   ?? '';
              const date = parsed.searchParams.get('date') ?? '';
              const time = parsed.searchParams.get('time') ?? '12:00:00';
              proxyReq.path = `/v2.1/trip?originId=${encodeURIComponent(from)}&destId=${encodeURIComponent(to)}&date=${date}&time=${encodeURIComponent(time)}&numF=8&format=json&accessId=${env.RESROBOT_ROUTES_KEY}`;
            }
            proxyReq.setHeader('User-Agent', 'EasyTrain/2.5 (train-planner)');
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase — heavy SDK, separate chunk que carga en paralelo al main
          if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
            return 'firebase';
          }
          // date-fns — librería de fechas, ~25 KB gzip
          if (id.includes('/node_modules/date-fns/')) {
            return 'date-fns';
          }
          // Three.js — solo se usa en /map (lazy)
          if (id.includes('/node_modules/three') || id.includes('/node_modules/@react-three/')) {
            return 'three';
          }
          // Vendor — librerías UI core
          if (
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/framer-motion/') ||
            id.includes('/node_modules/zustand/')
          ) {
            return 'vendor';
          }
        }
      }
    }
  }
  } // end return
}) // end defineConfig
