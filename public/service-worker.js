const CACHE_NAME = 'isoterra-shell-v5';
const SHELL_ASSETS = [
  '/css/style.css',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png'
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

// Shell assets: network first, cache as a fallback. That way a style change
// shows up on the next load instead of being hidden behind a stale copy.
// Copies are stored under the bare path so "?v=..." cache-busting parameters
// on the stylesheet URL never pile up extra entries.
// Everything else (pages, forms, uploads) goes straight to the network, since
// the data changes constantly and staleness would be misleading in a log.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!SHELL_ASSETS.includes(url.pathname)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy));
        }
        return response;
      })
      .catch(() => caches.match(url.pathname))
  );
});
