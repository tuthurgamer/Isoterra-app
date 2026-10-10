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
    Array.prototype.forEach.call(files, function (file, i) {
      var item = {
        id: uuid(), blob: file, name: file.name || 'photo.jpg', time: file.lastModified || Date.now(),
        dest: opts.dest, type: opts.type || 'observation', note: opts.note || '', batch: batch,
        kind: isVideo(file) ? 'video' : 'photo', hash: (opts.hashes || [])[i] || null
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
    // Its fingerprint goes with it, to tell later if the same file comes again.
    var fingerprinted = item.hash ? Promise.resolve() : window.isoPhotoPrep.fingerprint(item.blob).then(function (h) { item.hash = h; }, function () {});
    var prepare = fingerprinted.then(function () {
      if (entry.prepared) return entry.prepared;
      return item.kind === 'video' ? window.isoPhotoPrep.prepareVideo(new File([item.blob], item.name, { type: item.blob.type, lastModified: item.time }))
        : window.isoPhotoPrep.preparePhoto(new File([item.blob], item.name, { type: item.blob.type || 'image/jpeg', lastModified: item.time }));
    });
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
      dest: item.dest, type: item.type, note: item.note, at: batches[item.batch || item.session] || '', hash: item.hash || ''
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

  // ---------- Before sending: files already in the app ----------

  // Which of these files are already in the app (the very same file, or
  // probably the same photo: shot at the same second), twice in this choice
  // (kept once) or already on their way? For those, the person chooses.
  // Resolves to { files, hashes, repeated, skipped }, or null if cancelled.
  function screen(files, onProgress) {
    files = Array.prototype.slice.call(files);
    var prep = window.isoPhotoPrep;
    var info = [];
    var chain = Promise.resolve();
    files.forEach(function (file, i) {
      chain = chain.then(function () {
        if (onProgress) onProgress(i + 1, files.length);
        var video = isVideo(file);
        return Promise.all([
          prep.fingerprint(file),
          // As stored on the Pi (without its GPS position), when different.
          video ? null : prep.withoutGps(file).then(function (clean) { return clean === file ? null : prep.fingerprint(clean); }),
          video ? null : prep.cameraDate(file)
        ]).then(function (r) { info.push({ key: String(i), file: file, hash: r[0], stored: r[1], taken: r[2] }); });
      });
    });
    return chain.then(function () {
      var seen = {}, unique = [], repeated = 0;
      info.forEach(function (x) { if (seen[x.hash]) repeated++; else { seen[x.hash] = true; unique.push(x); } });
      var onTheirWay = {};
      entries.forEach(function (e) { if (e.item.hash && e.status !== 'refus' && e.status !== 'ok') onTheirWay[e.item.hash] = true; });
      return call('/photos/doublons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: unique.map(function (x) { return { key: x.key, hashes: [x.hash, x.stored].filter(Boolean), taken: x.taken }; }) })
      }).then(function (r) { return r.ok ? r.body.results || {} : {}; }, function () { return {}; }).then(function (results) {
        var doubts = [];
        unique.forEach(function (x) {
          if (results[x.key]) { x.match = results[x.key].match; x.photo = results[x.key].photo; doubts.push(x); }
          else if (onTheirWay[x.hash]) { x.match = 'envoi'; doubts.push(x); }
        });
        var fresh = unique.filter(function (x) { return !x.match; });
        var result = function (again) {
          var chosen = fresh.concat(again);
          return { files: chosen.map(function (x) { return x.file; }), hashes: chosen.map(function (x) { return x.hash; }), repeated: repeated, skipped: doubts.length - again.length };
        };
        if (!doubts.length) return result([]);
        return ask(doubts, fresh.length).then(function (again) { return again === null ? null : result(again); });
      });
    });
  }

  // The files already in the app, each next to the one in the app, to tick
  // those to send all the same. Resolves to the ticked ones, or null.
  function ask(doubts, freshCount) {
    return new Promise(function (resolve) {
      var urls = [];
      var box = document.createElement('div');
      box.className = 'doublons';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      var exact = doubts.filter(function (x) { return x.match === 'exact'; }).length;
      var title = doubts.length > 1 ? doubts.length + ' fichiers sont déjà là' : 'Ce fichier est déjà là';
      box.innerHTML = '<div class="doublons__card"><h2></h2><p class="doublons__intro"></p><ul class="doublons__list"></ul>'
        + '<div class="doublons__tick"><button type="button" class="btn-quiet" data-all>Tout cocher</button></div>'
        + '<div class="doublons__actions"><button type="button" class="btn-quiet" data-cancel>Annuler</button><button type="button" class="btn" data-go></button></div></div>';
      box.querySelector('h2').textContent = title;
      box.querySelector('.doublons__intro').textContent = (exact ? (exact > 1 ? exact + ' sont exactement' : '1 est exactement') + ' le même fichier que dans l’app. ' : '')
        + 'Coche ceux à envoyer quand même ; les autres ne seront pas renvoyés.';
      var list = box.querySelector('.doublons__list');
      doubts.forEach(function (x) {
        var li = document.createElement('li');
        li.innerHTML = '<label><input type="checkbox"><span class="doublons__pair"><span class="doublons__new"></span><span class="doublons__arrow">=</span><span class="doublons__old"></span></span>'
          + '<span class="doublons__text"><b></b><small></small></span></label>';
        var mine = li.querySelector('.doublons__new');
        if (isVideo(x.file)) mine.textContent = '▶';
        else {
          var url = URL.createObjectURL(x.file);
          urls.push(url);
          var img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.decoding = 'async';
          mine.appendChild(img);
        }
        var theirs = li.querySelector('.doublons__old');
        if (x.photo && x.photo.thumb && !(x.photo.video && x.photo.thumb === x.photo.full)) {
          var old = document.createElement('img');
          old.src = x.photo.thumb;
          old.alt = '';
          theirs.appendChild(old);
        } else {
          theirs.textContent = x.match === 'envoi' ? '↑' : '▶';
        }
        li.querySelector('b').textContent = x.match === 'exact' ? 'Exactement le même fichier, déjà dans l’app'
          : x.match === 'probable' ? 'Sans doute la même photo : prise à la même seconde'
            : 'Déjà en cours d’envoi';
        var where = [];
        if (x.photo) {
          var place = x.photo.bacLabel || x.photo.species.map(function (s) { return s.name; }).join(', ');
          if (place) where.push(place);
          if (x.photo.taken) where.push('prise le ' + x.photo.taken);
        }
        li.querySelector('small').textContent = x.file.name + (where.length ? ' · ' + where.join(' · ') : '');
        list.appendChild(li);
      });
      var boxes = function () { return Array.prototype.slice.call(list.querySelectorAll('input')); };
      var go = box.querySelector('[data-go]');
      var count = function () {
        var n = freshCount + boxes().filter(function (b) { return b.checked; }).length;
        go.textContent = n ? 'Envoyer ' + (n > 1 ? 'les ' + n + ' fichiers' : 'le fichier') : 'Ne rien envoyer';
      };
      list.addEventListener('change', count);
      box.querySelector('[data-all]').addEventListener('click', function () { boxes().forEach(function (b) { b.checked = true; }); count(); });
      var close = function (value) {
        urls.forEach(URL.revokeObjectURL);
        box.remove();
        resolve(value);
      };
      box.querySelector('[data-cancel]').addEventListener('click', function () { close(null); });
      go.addEventListener('click', function () {
        close(doubts.filter(function (x, k) { return boxes()[k].checked; }));
      });
      count();
      document.body.appendChild(box);
      go.focus();
    });
  }

  window.isoEnvois = {
    screen: screen,
    add: add,
    entries: function () { return entries; },
    on: function (fn) { listeners.push(fn); },
    retry: retryNow,
    remove: remove,
    preview: preview
  };
})();
