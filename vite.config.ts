import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/doserx/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'DoseRx — Kalkulator Dosis Obat',
        short_name: 'DoseRx',
        description: 'Kalkulator dosis obat berbasis berat badan untuk tenaga medis',
        theme_color: '#2563eb',
        background_color: '#f1f5f9',
        display: 'standalone',
        start_url: '/doserx/',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // The font is same-origin now, so it is picked up by the precache
        // glob below — the two runtimeCaching rules for Google's origins are
        // gone with the origins themselves.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
