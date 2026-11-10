const CACHE_NAME = 'lifoxtech-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
