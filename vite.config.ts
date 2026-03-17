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
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['travel', 'transportation'],
        lang: 'es',
        dir: 'ltr',
        icons: [
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
          }
        ]
      },
      workbox: {
        // Cache de páginas navegadas (SPA)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api-/],
        // Runtime caching para APIs externas
        runtimeCaching: [
          {
            // Cache de búsquedas de estaciones (respuestas rápidas)
            urlPattern: /^\/api-(db|ch|irail|oebb|pkp|flixbus|vbb|bvg|rejse)\/.*(locations|stations)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'station-searches',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1h
            },
          },
          {
            // Cache de rutas/conexiones (datos frescos)
            urlPattern: /^\/api-(db|ch|irail|oebb|pkp|flixbus|vbb|bvg|rejse)\/.*(journeys|connections)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'route-searches',
              expiration: { maxEntries: 30, maxAgeSeconds: 5 * 60 }, // 5min
              networkTimeoutSeconds: 8,
            },
          },
          {
            // Cache de imágenes externas
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 días
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      }
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
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          });
        },
      },
      '/api-oebb': {
        target: 'https://v6.oebb.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-oebb/, ''),
      },
      '/api-pkp': {
        target: 'https://v6.pkp.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-pkp/, ''),
      },
      '/api-flixbus': {
        target: 'https://1.flixbus.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-flixbus/, ''),
      },
      '/api-vbb': {
        target: 'https://v6.vbb.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-vbb/, ''),
      },
      '/api-bvg': {
        target: 'https://v6.bvg.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-bvg/, ''),
      },
      '/api-rejse': {
        target: 'https://v6.rejseplanen.transport.rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-rejse/, ''),
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
