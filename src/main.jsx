import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './state/store.jsx';
import { AuthProvider } from './state/auth.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppProvider>
  </React.StrictMode>
);

// تسجيل عامل الخدمة (PWA) — للتثبيت والعمل دون اتصال في النسخة المنشورة فقط.
// لا نُسجّله في بيئة التطوير ولا داخل إطار المعاينة ولا على مضيفات المعاينة.
const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const host = window.location.hostname;
const isDevHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(host) || host.endsWith('.all-hands.dev') || host.endsWith('.prod-runtime.all-hands.dev');
const canRegisterSW = import.meta.env.PROD && 'serviceWorker' in navigator && !inIframe && !isDevHost;

if (canRegisterSW) {
  // تحديث تلقائي: عند توفّر نسخة جديدة نُعيد التحميل مرة واحدة ليظهر آخر تصميم.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__swReloaded) return;
    window.__swReloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}
