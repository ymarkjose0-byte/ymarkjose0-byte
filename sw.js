// LifoxTech · Service worker v5
// - Páginas: primero internet (siempre la versión nueva), sin internet usa la copia guardada.
// - Base de modelos (tac-db.json), lector de códigos, lector del número escrito, Excel, PDF y los generadores de QR y código de barras
//   (recibos, notas y etiquetas del stock): se guardan para abrir rápido y funcionar sin internet.
const CACHE_NAME = 'lifoxtech-cache-v4';
const RECURSOS = /\/tac-db\.json|cdn\.jsdelivr\.net\/npm\/zxing-wasm@|fastly\.jsdelivr\.net\/npm\/zxing-wasm@|unpkg\.com\/@zxing\/library@|(cdn|fastly)\.jsdelivr\.net\/npm\/(tesseract\.js|tesseract\.js-core|@tesseract\.js-data)|tessdata\.projectnaptha\.com|cdnjs\.cloudflare\.com\/ajax\/libs\/(xlsx|jspdf|jspdf-autotable)\/|(cdn|fastly)\.jsdelivr\.net\/npm\/(qrcode-generator|jsbarcode)@/;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  if (RECURSOS.test(req.url)) {
    // Usa la copia guardada al instante y la actualiza en segundo plano.
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(req).then(guardada => {
          const red = fetch(req).then(resp => {
            if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
            return resp;
          }).catch(() => guardada || Response.error());
          if (guardada) { event.waitUntil(red.catch(() => {})); return guardada; }
          return red;
        })
      )
    );
  }
});
