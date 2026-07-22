import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { initThemeListener } from './store/themeStore.js';
import App from './App.jsx';
import './index.css';

function ThemeBootstrap({ children }) {
  useEffect(() => initThemeListener(), []);
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeBootstrap>
            <App />
          </ThemeBootstrap>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
