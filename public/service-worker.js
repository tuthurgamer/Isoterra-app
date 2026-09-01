const CACHE_NAME = 'isoterra-shell-v1';
const SHELL_ASSETS = [
  '/css/style.css',
  '/manifest.json',
  '/icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Static assets: cache-first. Everything else (pages, forms, uploads):
// network-only, since the data changes constantly and staleness would be
// confusing for an elevage log. This just makes the app installable and
// keeps the visual shell available if the server is briefly unreachable.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
