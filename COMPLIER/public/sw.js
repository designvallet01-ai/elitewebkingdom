// Elite IDE Progressive Web App Service Worker
const CACHE_NAME = 'elite-ide-cache-v1';
const PRECACHE_URLS = [
  '/compiler/',
  '/compiler/manifest.json',
  '/compiler/favicon.png',
  '/compiler/icon-192.png',
  '/compiler/icon-512.png',
  '/compiler/icon-maskable-192.png',
  '/compiler/icon-maskable-512.png',
  '/compiler/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[Elite IDE SW] Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Ignore non-GET requests or backend execution APIs
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  // Network-first with cache fallback strategy
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/compiler/');
          }
        });
      })
  );
});
