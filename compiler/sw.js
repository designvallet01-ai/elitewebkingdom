// Elite IDE Progressive Web App Service Worker - v4 Realtime Strategy
const CACHE_NAME = 'elite-ide-v4-realtime';

self.addEventListener('install', (event) => {
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept or cache API, navigation requests, or scripts/styles
  // This guarantees users always get the latest live code without stale SW locks
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    request.mode === 'navigate' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    return;
  }

  // Cache static icons and manifests only
  if (
    request.destination === 'image' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('manifest.json')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});

