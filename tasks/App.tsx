import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/layouts/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { usePWA } from '@/hooks/usePWA';
import { initWebPDetection } from '@/lib/webpSupport';
import NotFound from '@/pages/NotFound';

import routes from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';

const App: React.FC = () => {
  // Initialize PWA features
  usePWA();

  // Initialize WebP detection on app load
  useEffect(() => {
    initWebPDetection();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <IntersectObserver />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pb-16 md:pb-0">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
          </div>
          <PWAInstallPrompt />
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
