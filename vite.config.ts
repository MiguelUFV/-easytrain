import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'zustand'],
        }
      }
    }
  }
})
