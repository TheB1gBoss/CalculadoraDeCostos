import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
        theme_color: '#0b1628',
        background_color: '#050b18',
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
