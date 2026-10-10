// Envois au Pi : photos et vidéos, autant qu'on veut.
//
// Les fichiers choisis sont d'abord gardés dans le téléphone (IndexedDB),
// puis envoyés un par un, chacun en morceaux de 4 Mo : un morceau confirmé
// par le Pi n'est jamais renvoyé. Une coupure du Wi-Fi, un changement de
// page ou l'app fermée ne font rien perdre : l'envoi reprend là où il en
// était, sur la page ouverte ensuite. Une pastille en bas de l'écran montre
// l'avancement ; touchée, elle détaille chaque fichier.
//
// Les fichiers envoyés ensemble (un « lot ») gardent une même heure côté
// Pi, donnée avec la réponse au premier : ils font une seule ligne dans le
// journal. Voir routes/envois.js et lib/envois.js.
(function () {
  var PIECE = 4 * 1024 * 1024;
  var DB_NAME = 'isoterra-appareil';
  var STORE = 'envois';
  var BATCH_KEY = 'isoterra.appareil.seances';
  var entries = [];
  var listeners = [];
  var batches = {};
  try { batches = JSON.parse(localStorage.getItem(BATCH_KEY) || '{}'); } catch (e) {}
  var sentHere = 0;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  var isVideo = function (file) { return /^video\//.test(file.type || '') || /\.(mp4|mov|webm|mkv|3gp|m4v)$/i.test(file.name || ''); };

  // ---------- Kept in the phone until the Pi has them ----------

  var dbPromise = null;
  function idb() {
    if (!window.indexedDB) return Promise.reject(new Error('pas de stockage'));
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        var r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
        r.onsuccess = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
      });
    }
    return dbPromise;
  }
  function store(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var req = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function notify() {
    listeners.forEach(function (fn) { try { fn(entries); } catch (e) {} });
    paint();
  }

  // Files to send to `dest` ("bac:12", "fiche:34", "espece:5"), with the
  // journal entry's type and note, as one batch. Resolves once they are
  // all kept in the phone.
  function add(files, opts) {
    opts = opts || {};
    var batch = opts.batch || uuid();
    var chain = Promise.resolve();
    var warned = false;
    Array.prototype.forEach.call(files, function (file) {
      var item = {
        id: uuid(), blob: file, name: file.name || 'photo.jpg', time: file.lastModified || Date.now(),
        dest: opts.dest, type: opts.type || 'observation', note: opts.note || '', batch: batch,
        kind: isVideo(file) ? 'video' : 'photo'
      };
      var entry = { item: item, status: 'attente', progress: 0 };
      entries.push(entry);
      chain = chain.then(function () {
        return store('readwrite', function (s) { return s.put(item); }).catch(function () {
          // No room to keep it: it is sent all the same, as long as the app stays open.
          entry.memoryOnly = true;
          if (!warned) { warned = true; say("Le téléphone manque de place pour garder les fichiers : laisse l'app ouverte jusqu'à la fin de l'envoi."); }
        });
      });
    });
    notify();
    return chain.then(function () { pump(); return batch; });
  }

  // ---------- Sending, one file at a time ----------

  function call(url, options) {
    options = options || {};
    options.headers = Object.assign({ 'X-Requested-With': 'fetch' }, options.headers || {});
    return fetch(url, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { status: r.status, ok: r.ok, body: body }; });
    });
  }

  function refuse(entry, message) {
    entry.status = 'refus';
    entry.error = message;
    say(message);
  }

  function send(entry) {
    var item = entry.item;
    entry.status = 'envoi';
    notify();
    var prepare = entry.prepared ? Promise.resolve(entry.prepared)
      : item.kind === 'video' ? window.isoPhotoPrep.prepareVideo(new File([item.blob], item.name, { type: item.blob.type, lastModified: item.time }))
        : window.isoPhotoPrep.preparePhoto(new File([item.blob], item.name, { type: item.blob.type || 'image/jpeg', lastModified: item.time }));
    return prepare.then(function (p) {
      entry.prepared = p;
      var body = p.file;
      var size = body.size;
      return call('/envois/' + item.id).then(function (r) {
        var offset = r.body.received || 0;
        if (offset > size) {
          // The Pi holds more than this file: start again under a new name.
          item.id = uuid();
          offset = 0;
          store('readwrite', function (s) { return s.put(item); }).catch(function () {});
        }
        return (function next(at) {
          entry.progress = size ? at / size : 1;
          notify();
          if (at >= size) return finishFile(entry, p, size);
          return call('/envois/' + item.id + '?offset=' + at, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream', 'X-Envoi-Taille': String(size) },
            body: body.slice(at, at + PIECE)
          }).then(function (r) {
            if (r.status === 409) return next(r.body.received || 0);
            if (r.status === 507 || r.status === 413) return refuse(entry, r.body.message || 'Refusé par le Pi.');
            if (!r.ok) throw new Error('Erreur ' + r.status);
            return next(r.body.received);
          });
        })(offset);
      });
    });
  }

  function finishFile(entry, p, size) {
    var item = entry.item;
    var meta = {
      name: item.name, size: size, mime: p.file.type || item.blob.type, kind: item.kind,
      w: p.meta && p.meta.w, h: p.meta && p.meta.h, duration: p.meta && p.meta.duration, taken: p.meta && p.meta.taken,
      dest: item.dest, type: item.type, note: item.note, at: batches[item.batch || item.session] || ''
    };
    var data = new FormData();
    data.append('meta', JSON.stringify(meta));
    if (p.thumb) data.append('thumb', p.thumb, 'vignette.jpg');
    if (p.view) data.append('view', p.view, 'copie.jpg');
    return call('/envois/' + item.id + '/fin', { method: 'POST', body: data }).then(function (r) {
      if (r.ok && r.body.ok) {
        entry.status = 'ok';
        entry.photo = r.body.photo;
        entry.progress = 1;
        sentHere++;
        var batch = item.batch || item.session;
        if (r.body.at && batch && !batches[batch]) {
          batches[batch] = r.body.at;
          try { localStorage.setItem(BATCH_KEY, JSON.stringify(batches)); } catch (e) {}
        }
        return store('readwrite', function (s) { return s.delete(item.id); }).catch(function () {});
      }
      if (r.status === 409) return send(entry);
      if (r.status === 404) {
        item.id = uuid();
        return store('readwrite', function (s) { return s.put(item); }).catch(function () {}).then(function () { return send(entry); });
      }
      if (r.status === 400) return refuse(entry, r.body.message || 'Refusé par le Pi.');
      throw new Error('Erreur ' + r.status);
    });
  }

  var running = false;
  function pick() {
    var now = Date.now();
    return entries.find(function (e) { return e.status === 'attente' || (e.status === 'erreur' && e.retryAt <= now); });
  }
  function loop() {
    var entry = pick();
    if (!entry) return Promise.resolve();
    return send(entry).catch(function () {
      // The Pi out of reach: tried again a little later, then less often.
      entry.attempts = (entry.attempts || 0) + 1;
      entry.status = 'erreur';
      var wait = Math.min(60000, 5000 * entry.attempts);
      entry.retryAt = Date.now() + wait;
      setTimeout(pump, wait + 200);
    }).then(function () { notify(); return loop(); });
  }
  // One sender at a time, even with the app open twice.
  function pump() {
    if (running) return;
    running = true;
    var go = function () { return loop().then(function () { running = false; notify(); }, function () { running = false; }); };
    if (navigator.locks && navigator.locks.request) {
      navigator.locks.request('isoterra-envois', { ifAvailable: true }, function (lock) {
        if (!lock) { running = false; return null; }
        return go();
      });
    } else {
      go();
    }
  }
  window.addEventListener('online', pump);

  function retryNow() {
    entries.forEach(function (e) { if (e.status === 'erreur') { e.retryAt = 0; e.attempts = 0; } });
    pump();
  }

  function remove(entry) {
    if (entry.status === 'envoi') return;
    entries.splice(entries.indexOf(entry), 1);
    store('readwrite', function (s) { return s.delete(entry.item.id); }).catch(function () {});
    notify();
  }

  // Files left waiting by an earlier page (or the app closed): they go on.
  store('readonly', function (s) { return s.getAll(); }).then(function (items) {
    (items || []).forEach(function (item) {
      if (entries.some(function (e) { return e.item.id === item.id; })) return;
      if (!item.kind) item.kind = isVideo(item.blob) ? 'video' : 'photo';
      entries.push({ item: item, status: 'attente', progress: 0 });
    });
    notify();
    pump();
  }).catch(function () {});

  // ---------- The pill and its sheet ----------

  function say(text) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { toast.hidden = true; }, 3500);
  }

  var pill, sheet;
  var urls = new WeakMap();
  function preview(entry) {
    if (urls.has(entry)) return urls.get(entry);
    var source = entry.prepared && entry.prepared.thumb ? entry.prepared.thumb : entry.item.kind === 'photo' ? entry.item.blob : null;
    var url = source ? URL.createObjectURL(source) : null;
    urls.set(entry, url);
    return url;
  }

  function counts() {
    var c = { total: entries.length, ok: 0, waiting: 0, failed: 0, refused: 0, bytes: 0, done: 0 };
    entries.forEach(function (e) {
      var size = e.item.blob.size || 0;
      c.bytes += size;
      c.done += e.status === 'ok' ? size : size * (e.progress || 0);
      if (e.status === 'ok') c.ok++;
      else if (e.status === 'refus') c.refused++;
      else if (e.status === 'erreur') { c.failed++; c.waiting++; }
      else c.waiting++;
    });
    return c;
  }

  function build() {
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'envois-pill';
    pill.hidden = true;
    pill.innerHTML = '<span class="envois-pill__text"></span><span class="envois-pill__bar"><i></i></span>';
    pill.addEventListener('click', function () {
      var c = counts();
      if (!c.waiting && !c.refused && sentHere) {
        // All sent: show the new photos.
        location.reload();
        return;
      }
      sheet.hidden = false;
      paintSheet();
    });
    document.body.appendChild(pill);

    sheet = document.createElement('div');
    sheet.className = 'envois-sheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.innerHTML = '<div class="envois-sheet__head"><div><div class="envois-sheet__title">Envois au Pi</div><div class="envois-sheet__sub"></div></div>'
      + '<button type="button" class="envois-sheet__close" aria-label="Fermer">&times;</button></div>'
      + '<div class="envois-sheet__actions"><button type="button" class="btn-quiet" data-retry>Réessayer maintenant</button><button type="button" class="btn-quiet" data-clear>Effacer les refusés</button></div>'
      + '<ul class="envois-sheet__list"></ul>';
    sheet.querySelector('.envois-sheet__close').addEventListener('click', function () { sheet.hidden = true; });
    sheet.querySelector('[data-retry]').addEventListener('click', retryNow);
    sheet.querySelector('[data-clear]').addEventListener('click', function () {
      entries.filter(function (e) { return e.status === 'refus'; }).forEach(remove);
    });
    document.body.appendChild(sheet);
  }

  var painted = 0;
  function paint() {
    // The camera shows its own roll.
    if (document.querySelector('[data-cam]')) return;
    if (!document.body) return;
    if (!pill) build();
    var c = counts();
    var active = c.waiting || c.refused;
    pill.hidden = !active && !sentHere;
    if (pill.hidden) return;
    var percent = c.bytes ? Math.round(c.done / c.bytes * 100) : 100;
    var text;
    if (c.waiting) {
      text = 'Envoi ' + Math.min(c.ok + 1, c.total) + ' / ' + c.total + ' · ' + percent + ' %' + (c.failed ? ' · Pi injoignable, nouvel essai' : '');
    } else if (c.refused) {
      text = c.refused + (c.refused > 1 ? ' fichiers refusés' : ' fichier refusé') + ' · voir';
    } else {
      text = '✓ ' + sentHere + (sentHere > 1 ? ' fichiers envoyés' : ' fichier envoyé') + ' · actualiser';
    }
    pill.querySelector('.envois-pill__text').textContent = text;
    pill.querySelector('i').style.width = (c.waiting ? percent : 100) + '%';
    pill.classList.toggle('is-done', !c.waiting && !c.refused);
    pill.classList.toggle('is-error', Boolean(c.failed || c.refused));
    // The sheet, when open, at most a few times a second.
    var now = Date.now();
    if (!sheet.hidden && now - painted > 250) { painted = now; paintSheet(); }
  }

  function paintSheet() {
    var c = counts();
    sheet.querySelector('.envois-sheet__sub').textContent = c.ok + ' sur ' + c.total + ' envoyé' + (c.ok > 1 ? 's' : '')
      + (c.failed ? ' · le Pi ne répond pas, nouvel essai bientôt' : '');
    var list = sheet.querySelector('.envois-sheet__list');
    list.innerHTML = '';
    entries.slice().reverse().forEach(function (entry) {
      var li = document.createElement('li');
      var url = preview(entry);
      li.innerHTML = '<span class="envois-sheet__pic"></span><span class="envois-sheet__info"><b></b><small></small><span class="envois-pill__bar"><i></i></span></span>';
      if (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        li.firstChild.appendChild(img);
      } else {
        li.firstChild.textContent = entry.item.kind === 'video' ? '▶' : '◻';
      }
      li.querySelector('b').textContent = entry.item.name;
      var mb = (entry.item.blob.size / 1048576).toFixed(1).replace('.', ',') + ' Mo';
      var label = { attente: 'En attente', envoi: 'Envoi ' + Math.round((entry.progress || 0) * 100) + ' %', ok: 'Envoyé', erreur: 'Nouvel essai bientôt', refus: entry.error || 'Refusé' }[entry.status];
      li.querySelector('small').textContent = mb + ' · ' + label;
      li.querySelector('i').style.width = Math.round((entry.status === 'ok' ? 1 : entry.progress || 0) * 100) + '%';
      li.className = 'is-' + entry.status;
      if (entry.status !== 'envoi' && entry.status !== 'ok') {
        var drop = document.createElement('button');
        drop.type = 'button';
        drop.className = 'envois-sheet__drop';
        drop.setAttribute('aria-label', 'Retirer ce fichier');
        drop.textContent = '×';
        drop.addEventListener('click', function () { remove(entry); });
        li.appendChild(drop);
      }
      list.appendChild(li);
    });
  }

  window.isoEnvois = {
    add: add,
    entries: function () { return entries; },
    on: function (fn) { listeners.push(fn); },
    retry: retryNow,
    remove: remove,
    preview: preview
  };
})();
