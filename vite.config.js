import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// مسارات الدخول ومصادقة OAuth — تُستثنى من التخزين ومن الرجوع إلى index.html
// حتى لا تُخزَّن صفحات الحساب مؤقتاً ولا تُقدَّم نسخة قديمة منها.
const AUTH_PATH = /(?:^|\/)(?:login|signin|sign-in|signup|auth|oauth|callback|logout)(?:\/|$|\?)/i;

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // التسجيل يدوي في src/main.jsx (مع حراسة للتطوير وإطار المعاينة)،
      // لذا نُعطّل حقن سكربت التسجيل التلقائي.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'منصة المعلم الذكية — للمعلم اليمني',
        short_name: 'المعلم الذكي',
        description: 'منصة رقمية متكاملة للمعلم اليمني — تحضير الدروس، العروض التقديمية، التصحيح الذكي، والسجلات المدرسية',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf,webmanifest}'],
        navigateFallback: 'index.html',
        // لا تُقدَّم نسخة index المخزّنة لمسارات الدخول/OAuth
        navigateFallbackDenylist: [AUTH_PATH],
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // مسارات الدخول/OAuth: الشبكة فقط بلا أي تخزين
            urlPattern: AUTH_PATH,
            handler: 'NetworkOnly'
          },
          {
            // الصفحات: الشبكة أولاً حتى تظهر آخر نسخة فور توفّر الإنترنت،
            // مع الرجوع للنسخة المخزّنة عند انقطاعه.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'alfaeq-pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            // الملفات ذات الأسماء المتغيّرة (مُجزّأة بالبصمة): التخزين أولاً
            urlPattern: /\/assets\/.+\.[A-Za-z0-9_-]{6,}\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'alfaeq-assets',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // الخطوط والأيقونات والصور: التخزين أولاً
            urlPattern: /\.(?:png|svg|ico|woff2?|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'alfaeq-static',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: {
        // لا يُسجَّل عامل الخدمة في بيئة التطوير
        enabled: false
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
