const SHELL_CACHE = 'isoterra-shell-v6';
const ICON_CACHE = 'isoterra-icones-v1';
const THUMB_CACHE = 'isoterra-vignettes-v1';
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
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, ICON_CACHE, THUMB_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Species icons are kept on the phone: every page sends a message after
// loading, and the icons the phone doesn't have yet are fetched in the
// background (an icon is never changed in place: a new upload gets a new
// file name, and the old one is dropped here).
let lastSync = 0;
let syncing = null;

function syncIcons() {
  if (syncing || Date.now() - lastSync < 60 * 1000) return syncing || Promise.resolve();
  syncing = (async () => {
    const response = await fetch('/especes/icones.json', { cache: 'no-store' });
    if (!response.ok) return;
    const wanted = await response.json();
    const cache = await caches.open(ICON_CACHE);
    const stored = await cache.keys();
    const have = new Set(stored.map((r) => new URL(r.url).pathname));
    for (const path of wanted) {
      if (have.has(path)) continue;
      try {
        await cache.add(path);
      } catch (err) {
        // Pi unreachable or file missing: tried again on the next page.
      }
    }
    for (const r of stored) {
      if (!wanted.includes(new URL(r.url).pathname)) await cache.delete(r);
    }
    lastSync = Date.now();
  })().catch(() => {}).finally(() => { syncing = null; });
  return syncing;
}

self.addEventListener('message', (event) => {
  if (event.data === 'icones') event.waitUntil(syncIcons());
});

// An icon (or a photo's thumbnail) comes from the phone when it has it,
// else from the Pi, and is kept for next time: it never changes.
async function iconResponse(request, path, cacheName = ICON_CACHE) {
  const cache = await caches.open(cacheName);
  const stored = await cache.match(path);
  if (stored) return stored;
  const response = await fetch(request);
  if (response.ok) cache.put(path, response.clone());
  return response;
}

// Stylesheet, manifest and app icons: the stored copy right away, so a page
// never waits for the Pi before it can be drawn, while a fresh copy is
// fetched for next time. Copies are stored with their "?v=..." parameter:
// a stylesheet with a new version number is a new address, fetched from the
// Pi on its first use, and the older version is then dropped.
async function shellResponse(event, url) {
  const cache = await caches.open(SHELL_CACHE);
  const key = url.pathname + url.search;
  const stored = await cache.match(key);
  const fresh = fetch(event.request).then(async (response) => {
    if (response.ok) {
      await cache.put(key, response.clone());
      for (const r of await cache.keys()) {
        const old = new URL(r.url);
        if (old.pathname === url.pathname && old.search !== url.search) await cache.delete(r);
      }
    }
    return response;
  });
  if (stored) {
    event.waitUntil(fresh.catch(() => {}));
    return stored;
  }
  return fresh.catch(() => cache.match(url.pathname, { ignoreSearch: true }));
}

// The daily care reminder sent by the Pi (lib/rappels.js), shown even when
// the app is closed. A tap opens the page it points to, in the app if it is
// already open.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Isoterra', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || 'isoterra',
    renotify: true,
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((w) => w.url.startsWith(self.location.origin));
    if (open) return open.navigate(url).then((w) => (w || open).focus());
    return self.clients.openWindow(url);
  }));
});

// Everything else (pages, forms, full-size photos) goes straight to the
// network, since the data changes constantly and staleness would be
// misleading in a log.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/uploads/species-icons/')) {
    event.respondWith(iconResponse(event.request, url.pathname));
  } else if (url.pathname.startsWith('/uploads/photos/') && /-sm\.\w+$/.test(url.pathname)) {
    event.respondWith(iconResponse(event.request, url.pathname, THUMB_CACHE));
  } else if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(shellResponse(event, url));
  }
});
