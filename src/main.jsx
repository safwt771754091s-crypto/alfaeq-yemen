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

// تحديث تلقائي: عند توفّر نسخة جديدة من التطبيق (Service Worker) نُعيد التحميل
// مرة واحدة حتى يرى المعلم آخر تصميم دون أي خطوة يدوية.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__swReloaded) return;
    window.__swReloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
