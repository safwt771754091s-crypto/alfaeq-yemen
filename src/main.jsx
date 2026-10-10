import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './state/store.jsx';
import { OwnerProvider } from './state/owner.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <OwnerProvider>
        <App />
      </OwnerProvider>
    </AppProvider>
  </React.StrictMode>
);
