const SHELL_CACHE = 'isoterra-shell-v8';
const ICON_CACHE = 'isoterra-icones-v1';
const THUMB_CACHE = 'isoterra-vignettes-v1';
const PAGE_CACHE = 'isoterra-pages-v1';
const FONT_CACHE = 'isoterra-polices-v1';
const SHELL_ASSETS = [
  '/css/style.css',
  '/manifest.json',
  '/js/photo-prep.js',
  '/js/envois.js',
  '/js/hors-ligne.js',
  '/js/annonce.js',
  '/icons/favicon-logo-64.png',
  '/icons/logo.png',
  '/icons/logo-192.png',
  '/icons/logo-512.png',
  '/icons/logo-192-maskable.png',
  '/icons/logo-512-maskable.png'
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
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, ICON_CACHE, THUMB_CACHE, PAGE_CACHE, FONT_CACHE].includes(k)).map((k) => caches.delete(k))))
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

// Each page says it's there once loaded: the phone then catches up with the
// Pi (icons, pages kept for no network, actions waiting to be sent).
self.addEventListener('message', (event) => {
  if (event.data === 'icones') event.waitUntil(syncIcons().then(syncPages));
  else if (event.data === 'actions') event.waitUntil(flush());
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
    icon: '/icons/logo-192.png',
    badge: '/icons/badge-logo-96.png',
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

// ---------- Without network ----------
//
// The phone keeps a copy of the pages needed to look after the bacs: the
// home page, each bac's page and its step of the tournée (fetched in the
// background, see syncPages), and the main pages once opened. A page always
// comes from the Pi when it answers; without network, or with no answer
// within a few seconds, its copy is shown instead, marked as one (the page
// says so, public/js/hors-ligne.js). What is noted meanwhile (quick actions,
// the tournée, notes) waits in the phone and goes to the Pi once it answers
// again, each with the time it was done (see flush, lib/hors-ligne.js).

const PAGE_WAIT = 6000;
const SEND_WAIT = 8000;
const PAGES_EVERY = 15 * 60 * 1000;

// Pages kept once opened (the address without its query).
const KEPT_PAGES = [/^\/$/, /^\/bacs\/\d+$/, /^\/especes$/, /^\/especes\/\d+$/, /^\/journal$/, /^\/pontes$/, /^\/vente$/, /^\/photos$/];

function timeout(ms) {
  return new Promise((resolve, reject) => setTimeout(() => reject(new Error('Pas de réponse')), ms));
}

// Where a page's copy is kept. The tournée's steps are kept per bac: a bac's
// step looks the same whatever the order of the tournée (the page sets its
// place in the order from its own address).
function pageKey(url) {
  if (url.pathname === '/tournee/step') {
    const bacs = (url.searchParams.get('bacs') || '').split(',').filter(Boolean);
    const i = parseInt(url.searchParams.get('i'), 10) || 0;
    return i >= bacs.length ? '/tournee/fin' : '/tournee/bac/' + bacs[i];
  }
  return KEPT_PAGES.some((r) => r.test(url.pathname)) ? url.pathname : null;
}

// A page kept with the time it was fetched and the stamp the Pi gave it.
async function keepPage(cache, key, response, stamp) {
  const headers = new Headers({
    'Content-Type': response.headers.get('Content-Type') || 'text/html; charset=utf-8',
    'X-Isoterra-Copie': String(Date.now())
  });
  if (stamp) headers.set('X-Isoterra-Stamp', stamp);
  await cache.put(key, new Response(await response.blob(), { headers }));
}

async function asCopy(stored) {
  const html = await stored.text();
  const mark = '<meta name="isoterra-copie" content="' + (stored.headers.get('X-Isoterra-Copie') || '') + '">';
  return new Response(html.replace('</head>', mark + '</head>'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function noCopy() {
  return new Response('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Pas de réseau — Isoterra</title>'
    + '<link rel="stylesheet" href="/css/style.css"></head><body><div class="offline-page">'
    + '<img src="/icons/logo-192.png" alt="" width="96" height="96"><h1>Pas de réseau</h1>'
    + '<p>Cette page n\'est pas encore gardée dans le téléphone. Le registre, les pages des bacs et la tournée le sont : '
    + 'ce que tu y notes part vers le Pi dès que le réseau revient.</p>'
    + '<p><a class="btn" href="/">Registre des bacs</a> <a class="btn-quiet" href="/tournee">Tournée</a></p>'
    + '</div></body></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// The tournée started without network: in the order the Pi last gave.
async function startTournee(cache) {
  const order = await cache.match('/hors-ligne/ordre');
  const bacs = order ? await order.json() : [];
  if (!bacs.length) return noCopy();
  return Response.redirect('/tournee/step?bacs=' + bacs.join(',') + '&i=0', 302);
}

// The Pi's app restarting (an update) answers through the proxy with 502-504:
// as good as no network.
const away = (response) => response.status >= 502 && response.status <= 504;

async function pageResponse(event, url) {
  const key = pageKey(url);
  const fresh = !url.search || url.pathname === '/tournee/step';
  const network = fetch(event.request).then((response) => {
    if (away(response)) throw new Error('Pi indisponible');
    if (key && fresh && response.ok) {
      const copy = response.clone();
      try { event.waitUntil(caches.open(PAGE_CACHE).then((cache) => keepPage(cache, key, copy))); } catch (err) { /* page already shown */ }
    }
    try { event.waitUntil(flushSoon()); } catch (err) { /* page already shown */ }
    return response;
  });
  event.waitUntil(network.catch(() => {}));
  const cache = await caches.open(PAGE_CACHE);
  const stored = key ? await cache.match(key) : null;
  const fallback = () => (stored ? asCopy(stored) : url.pathname === '/tournee' ? startTournee(cache) : noCopy());
  if (!stored && url.pathname !== '/tournee') return network.catch(fallback);
  return Promise.race([network, timeout(PAGE_WAIT)]).catch(fallback);
}

// The pages for no network, kept up to date in the background (at most every
// quarter of an hour): only those whose stamp changed are fetched again.
let syncingPages = null;
function syncPages() {
  if (syncingPages) return syncingPages;
  syncingPages = (async () => {
    const cache = await caches.open(PAGE_CACHE);
    const last = await cache.match('/hors-ligne/ordre');
    if (last && Date.now() - Number(last.headers.get('X-Isoterra-Copie')) < PAGES_EVERY) return;
    const response = await fetch('/hors-ligne/pages.json', { cache: 'no-store' });
    if (!response.ok) return;
    const plan = await response.json();
    for (const page of plan.pages) {
      const old = await cache.match(page.key);
      if (old && (page.stamp
        ? old.headers.get('X-Isoterra-Stamp') === page.stamp
        : Date.now() - Number(old.headers.get('X-Isoterra-Copie')) < PAGES_EVERY)) continue;
      const copy = await fetch(page.url, { cache: 'no-store' });
      if (copy.ok && !copy.redirected) await keepPage(cache, page.key, copy, page.stamp);
    }
    // Bacs gone since: their pages go too.
    const wanted = new Set(plan.pages.map((p) => p.key));
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if ((/^\/bacs\/\d+$/.test(path) || path.startsWith('/tournee/bac/')) && !wanted.has(path)) await cache.delete(request);
    }
    await cache.put('/hors-ligne/ordre', new Response(JSON.stringify(plan.tournee), {
      headers: { 'Content-Type': 'application/json', 'X-Isoterra-Copie': String(Date.now()) }
    }));
  })().catch(() => {}).finally(() => { syncingPages = null; });
  return syncingPages;
}

// ---------- Actions waiting for the Pi ----------

// What can be noted without network: the tournée, the quick actions, notes.
const QUEUED = [/^\/tournee\/step\/log$/, /^\/bacs\/\d+\/log\/quick$/, /^\/fiches\/\d+\/log\/quick$/, /^\/bacs\/\d+\/note$/, /^\/journal$/];

function actionsDb() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('isoterra-hors-ligne', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('actions', { keyPath: 'ref' });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

async function actions(mode, fn) {
  const db = await actionsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('actions', mode);
    const request = fn(tx.objectStore('actions'));
    tx.oncomplete = () => { db.close(); resolve(request && request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

const DONE_WORDS = { nourrissage: 'nourri', pulverisation: 'pulvérisé', nettoyage: 'nettoyé', observation: 'vérifié' };
const bacName = (id) => 'Bac n° ' + String(id).padStart(3, '0');

// A line for the list of actions waiting, e.g. "Bac n° 003 : nourri, pulvérisé".
function describe(url, body) {
  if (url.pathname === '/tournee/step/log') {
    const bacs = (url.searchParams.get('bacs') || '').split(',');
    const form = new URLSearchParams(new TextDecoder().decode(body));
    const done = form.getAll('types').map((t) => DONE_WORDS[t]).filter(Boolean);
    return bacName(bacs[parseInt(url.searchParams.get('i'), 10) || 0]) + ' : ' + (done.join(', ') || 'rien') + ' (tournée)';
  }
  const quick = url.pathname.match(/^\/(bacs|fiches)\/(\d+)\/log\/quick$/);
  if (quick) return (quick[1] === 'bacs' ? bacName(quick[2]) : 'Action rapide') + ' : ' + (DONE_WORDS[url.searchParams.get('type')] || 'action');
  const note = url.pathname.match(/^\/bacs\/(\d+)\/note$/);
  return note ? bacName(note[1]) + ' : note' : 'Note du journal';
}

function send(action, replay) {
  const headers = { 'X-Isoterra-Ref': action.ref };
  if (action.type) headers['Content-Type'] = action.type;
  if (action.mode) headers['X-Requested-With'] = action.mode;
  if (replay) headers['X-Isoterra-Fait-Le'] = String(action.at);
  return fetch(action.url, { method: 'POST', body: action.body, headers, redirect: 'manual', credentials: 'same-origin' });
}

// Kept for later: the page goes on as if the Pi had taken it (the next step
// of the tournée, back to the bac's page, or "kept" for the quick buttons).
function keptAnswer(action, url) {
  if (action.mode === 'fetch') {
    return new Response(JSON.stringify({ gardee: true }), { status: 202, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.pathname === '/tournee/step/log') {
    const i = parseInt(url.searchParams.get('i'), 10) || 0;
    return Response.redirect('/tournee/step?bacs=' + (url.searchParams.get('bacs') || '') + '&i=' + (i + 1), 303);
  }
  const back = action.back && new URL(action.back).origin === self.location.origin ? action.back : '/';
  return Response.redirect(back, 303);
}

async function sendOrKeep(event) {
  const request = event.request;
  const url = new URL(request.url);
  const body = await request.arrayBuffer();
  const action = {
    ref: self.crypto.randomUUID(),
    at: Date.now(),
    url: request.url,
    body,
    type: request.headers.get('Content-Type') || '',
    mode: request.headers.get('X-Requested-With') || '',
    back: request.referrer || '',
    what: decodeURIComponent(request.headers.get('X-Isoterra-Quoi') || '') || describe(url, body)
  };
  // Sent at once when the Pi answers; its reference makes sure that, kept
  // after an answer too slow to wait for, it isn't written twice.
  try {
    const response = await Promise.race([send(action, false), timeout(SEND_WAIT)]);
    if (!away(response)) {
      event.waitUntil(flushSoon());
      return response;
    }
  } catch (err) { /* no network, or no answer */ }
  await actions('readwrite', (store) => store.put(action));
  waitingCount = Math.max(waitingCount, 0) + 1;
  if (self.registration.sync) self.registration.sync.register('isoterra-actions').catch(() => {});
  event.waitUntil(tell());
  return keptAnswer(action, url);
}

// Actions waiting, sent in the order they were done, as soon as the Pi
// answers. One the Pi refuses (its bac deleted meanwhile...) is dropped and
// the page says which. Returns how many still wait.
let flushing = null;
let waitingCount = -1;
function flush() {
  if (flushing) return flushing;
  flushing = (async () => {
    const waiting = (await actions('readonly', (store) => store.getAll())) || [];
    waiting.sort((a, b) => a.at - b.at);
    let sent = 0;
    const refused = [];
    for (const action of waiting) {
      let response;
      try {
        response = await Promise.race([send(action, true), timeout(20000)]);
      } catch (err) {
        break;
      }
      if (away(response)) break;
      if (response.status < 400) sent++;
      else refused.push(action.what);
      await actions('readwrite', (store) => store.delete(action.ref));
    }
    return tell(sent || refused.length ? { sent, refused } : {});
  })().catch(() => 1).finally(() => { flushing = null; });
  return flushing;
}

// The Pi answered: actions still waiting (if any, or not known yet) go.
function flushSoon() {
  return waitingCount !== 0 ? flush() : Promise.resolve();
}

// The open pages learn how many actions wait (and what just went).
async function tell(news = {}) {
  const waiting = await actions('readonly', (store) => store.count()).catch(() => 0);
  waitingCount = waiting;
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach((w) => w.postMessage({ type: 'isoterra-actions', waiting, ...news }));
  return waiting;
}

// The phone's own signal that the network is back (Android), even with the
// app closed: still waiting afterwards, it tries again later.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'isoterra-actions') return;
  event.waitUntil(flush().then((left) => { if (left) throw new Error(left + ' en attente'); }));
});

// The fonts of the pages (Google Fonts), kept once fetched: the pages look
// the same without network.
async function fontResponse(request) {
  const cache = await caches.open(FONT_CACHE);
  const stored = await cache.match(request);
  if (stored) return stored;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}

// Pages: from the Pi, or their copy without network (see above). Actions:
// sent, or kept until the Pi answers. Full-size photos and the rest go
// straight to the network.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    if (request.method === 'GET') event.respondWith(fontResponse(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.method === 'POST') {
    // Photos (sent by their own queue, public/js/envois.js) are left out.
    if (QUEUED.some((r) => r.test(url.pathname)) && request.headers.get('X-Requested-With') !== 'upload') {
      event.respondWith(sendOrKeep(event));
    }
    return;
  }
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    if (!url.pathname.startsWith('/uploads/') && !/\.\w+$/.test(url.pathname) && url.pathname !== '/serveur/telecharger') {
      event.respondWith(pageResponse(event, url));
    }
  } else if (url.pathname.startsWith('/uploads/species-icons/')) {
    event.respondWith(iconResponse(event.request, url.pathname));
  } else if (url.pathname.startsWith('/uploads/photos/') && /-sm\.\w+$/.test(url.pathname)) {
    event.respondWith(iconResponse(event.request, url.pathname, THUMB_CACHE));
  } else if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(shellResponse(event, url));
  }
});
