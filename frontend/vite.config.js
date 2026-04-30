import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'JBFitness',
        short_name: 'JBFitness',
        description: 'Track workouts, nutrition, and daily fitness progress',
        theme_color: '#2e7d32',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // SPA: when offline, deep links still load the shell so React Router can run
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      // Set to true if you want to debug the service worker during `npm run dev`
      devOptions: {
        enabled: false,
      },
    })
  ],
})


