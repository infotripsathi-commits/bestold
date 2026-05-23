// Service Worker for BESTOLD PWA
const CACHE_NAME = 'bestold-v1';
const RUNTIME_CACHE = 'bestold-runtime-v1';
const IMAGE_CACHE = 'bestold-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests - Network first, cache fallback
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
        })
    );
    return;
  }

  // Handle image requests - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle navigation requests - Network first, cache fallback
  // SPA fix: any route that fails network+exact-cache falls back to /index.html
  // so React Router renders the correct client-side page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try exact URL cache first
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // SPA fallback: serve index.html so React Router handles the route
            return caches.match('/index.html').then((spaFallback) => {
              if (spaFallback) {
                return spaFallback;
              }
              // Last resort: offline page
              return caches.match('/offline.html');
            });
          });
        })
    );
    return;
  }

  // Default: Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// ─── Push notification handler ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'BESTOLD', body: event.data.text() };
  }

  const title   = data.title  || 'BESTOLD';
  const body    = data.body   || 'You have a new notification';
  const url     = data.url    || '/';
  const icon    = data.icon   || '/icon-192x192.png';
  const badge   = data.badge  || '/icon-72x72.png';
  const tag     = data.tag    || 'bestold-notification';

  const options = {
    body,
    icon,
    badge,
    tag,
    data: { url },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'open',  title: 'Open'    },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if already open
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Helper function to sync messages
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();
    
    // Send each message
    for (const message of pendingMessages) {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    }
    
    // Clear pending messages
    await clearPendingMessages();
    console.log('[Service Worker] Messages synced successfully');
  } catch (error) {
    console.error('[Service Worker] Failed to sync messages:', error);
  }
}

// Helper function to sync favorites
async function syncFavorites() {
  try {
    // Get pending favorites from IndexedDB
    const pendingFavorites = await getPendingFavorites();
    
    // Sync each favorite
    for (const favorite of pendingFavorites) {
      await fetch('/api/favorites', {
        method: favorite.action === 'add' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: favorite.productId })
      });
    }
    
    // Clear pending favorites
    await clearPendingFavorites();
    console.log('[Service Worker] Favorites synced successfully');
  } catch (error) {
    console.error('[Service Worker] Failed to sync favorites:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingMessages() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function clearPendingMessages() {
  // TODO: Implement IndexedDB clearing
}

async function getPendingFavorites() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function clearPendingFavorites() {
  // TODO: Implement IndexedDB clearing
}
