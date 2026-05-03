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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Pantry2Plate',
        short_name: 'Spinner',
        description: 'A fun meal picker for your family',
        theme_color: '#D97706',
        background_color: '#0C0A09',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/pantry2plate/',
        scope: '/pantry2plate/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Exclude SEO-critical static files from the SPA navigation
        // fallback. Otherwise opening sitemap.xml / robots.txt / llms.txt
        // directly in a browser returns the cached index.html shell,
        // which renders blank. Google's crawler is unaffected (no SW),
        // but humans verifying these files would see nothing.
        navigateFallbackDenylist: [
          /\/sitemap\.xml$/,
          /\/robots\.txt$/,
          /\/llms\.txt$/,
          /\/llms-full\.txt$/,
          /\/og-image\.(png|svg)$/,
          /\/manifest\.webmanifest$/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/pantry2plate/',
})
