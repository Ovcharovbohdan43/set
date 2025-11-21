import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './app/App';
import { AppProviders } from './app/providers';
import './styles/global.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element not found. Ensure index.html defines <div id=\"root\" />.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <HashRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </HashRouter>
  </React.StrictMode>
);

