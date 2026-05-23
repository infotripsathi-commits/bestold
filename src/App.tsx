import React, { Suspense, useEffect } from 'react';
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
import { SiteWideSchemas } from '@/components/common/PageMeta';
import { Skeleton } from '@/components/ui/skeleton';

import routes from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';

// Shown while a lazy page chunk is loading
function PageLoader() {
  return (
    <div className="container max-w-5xl py-10 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-64 w-full mt-4" />
    </div>
  );
}

const App: React.FC = () => {
  usePWA();

  useEffect(() => {
    initWebPDetection();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <SiteWideSchemas />
          <IntersectObserver />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pb-16 md:pb-0">
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
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
