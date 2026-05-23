import { useEffect } from 'react';
import { toast } from 'sonner';

export function usePWA() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope);

            // Check for updates every hour
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (!newWorker) return;

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  toast.info('New version available!', {
                    description: 'Click to update and get the latest features',
                    action: {
                      label: 'Update',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      },
                    },
                    duration: 10000,
                  });
                }
              });
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
      });
      });
    }

    // Handle online/offline status
    const handleOnline = () => {
      toast.success('You are back online!', {
        description: 'Your connection has been restored',
      });
    };

    const handleOffline = () => {
      toast.warning('You are offline', {
        description: 'Some features may be limited',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
