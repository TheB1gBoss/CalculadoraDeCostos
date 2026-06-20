import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identificador de build (fecha y hora UTC de compilación) para verificar
// de un vistazo qué versión está cargada en el dispositivo.
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Costos e Importación',
        short_name: 'Costos',
        description: 'Calculadora de costos de importación — Inversiones Aravena SPA',
        theme_color: '#0a0d12',
        background_color: '#0a0d12',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  base: './',
})
