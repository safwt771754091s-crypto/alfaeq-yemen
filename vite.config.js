import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'منصة المعلم الذكية',
        short_name: 'المعلم الذكي',
        description: 'منصة رقمية متكاملة للمعلم اليمني — تحضير الدروس، العروض التقديمية، التصحيح الذكي، والسجلات المدرسية',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff,ttf,ico}'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // الشبكة أولاً لصفحات التنقّل حتى تظهر آخر نسخة فور توفر الإنترنت،
            // مع الرجوع للنسخة المخزّنة عند انقطاعه (عمل دون اتصال).
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'alfaeq-pages', networkTimeoutSeconds: 4 }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    allowedHosts: true
  }
});
