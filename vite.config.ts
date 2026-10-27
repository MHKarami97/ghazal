import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'fonts/**/*', 'icons/**/*'],
      manifest: {
        name: 'غزل | کتابخانه و آموزش شعر فارسی',
        short_name: 'غزل',
        description: 'کتابخانه جامع شعر فارسی، آموزش ادبی، کاوش تبارشناسی و ابزار حفظ شعر با تکرار فاصله‌دار',
        theme_color: '#b87c2c',
        background_color: '#fdfbf7',
        display: 'standalone',
        start_url: '/',
        dir: 'rtl',
        lang: 'fa',
        icons: [
          {
            src: '/icons/icon-48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // We avoid caching poetry data JSON in Cache API as requested; IndexedDB is used instead.
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  worker: {
    format: 'es'
  }
});
