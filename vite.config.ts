import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // CSP is script-src 'self': register from main.tsx, never inline
      manifest: {
        id: '/',
        name: 'Haraya: Davao Coffee and Study Spots',
        short_name: 'Haraya',
        description: 'Find great coffee, study spots with plugs and Wi-Fi, and hidden gems across the Davao Region.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FAF5EB',
        theme_color: '#FAF5EB',
        icons: [
          { src: '/brand/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/brand/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/[^/?]+\.[a-z0-9]+$/i], // real files (images, robots.txt) are not the app shell
        cleanupOutdatedCaches: true,
        runtimeCaching: [], // app shell only; Supabase, tiles, routing and weather always go to the network
      },
    }),
  ],
  server: {
    port: 5174,
  },
})
