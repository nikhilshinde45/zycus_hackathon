import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { Inventory } from './pages/Inventory';
import { Suggestions } from './pages/Suggestions';
import { Analytics } from './pages/Analytics';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="suggestions" element={<Suggestions />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="activity" element={<Activity />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
