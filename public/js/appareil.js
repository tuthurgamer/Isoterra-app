// Appareil photo d'Isoterra.
//
// Il pilote directement le capteur du téléphone (getUserMedia et Image
// Capture) : prise en pleine définition, et les réglages que ce téléphone
// accepte, chacun n'étant affiché que s'il est disponible. Les plus utiles
// sont sur l'aperçu même : capteurs et zoom, pastilles MAP, EV, ISO,
// vitesse et balance des blancs (une réglette s'ouvre sur l'image), flash,
// lampe, retardateur et grille. Le panneau PRO garde le reste (rendu,
// définition, rafale, histogramme, niveau, capteurs détectés).
//
// Le traitement propre à l'appareil photo du téléphone (HDR, mode nuit) et
// les Glyph de Nothing ne sont pas accessibles à une app web : le bouton
// « Appareil du téléphone » ouvre l'appareil de base, et sa photo est rangée
// de même.
//
// Chaque photo part tout de suite vers le Pi, à l'endroit choisi en haut,
// une à une. En attendant, elle est gardée dans le téléphone (IndexedDB) :
// une app fermée ou un Pi injoignable ne font rien perdre, l'envoi reprend à
// la prochaine ouverture de l'appareil.
(function () {
  var cfg = window.isoCam || { destinations: [], chosen: null };
  var $ = function (sel) { return document.querySelector(sel); };
  var video = $('.cam__video');
  var stage = $('[data-cam-stage]');
  var frameBox = $('[data-cam-frame]');
  var panel = $('[data-cam-panel]');
  var dial = $('[data-cam-dial]');
  var destSelect = $('[data-cam-dest]');
  var shutter = $('[data-cam-shoot]');
  var SESSION = String(Date.now());
  var KEYS = {
    prefs: 'isoterra.appareil.prefs', dest: 'isoterra.appareil.dest',
    lens: 'isoterra.appareil.capteur', names: 'isoterra.appareil.noms', infos: 'isoterra.appareil.infos'
  };
  var load = function (key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } };
  var save = function (key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

  var state = {
    stream: null, track: null, capture: null, caps: {}, photoCaps: null,
    devices: [], deviceId: load(KEYS.lens, null), busy: false, manual: {}, openDial: null
  };
  var m = state.manual;
  var prefs = Object.assign({ grid: false, histo: false, level: false, timer: 0, burst: 1, flash: 'off', resolution: 'max' }, load(KEYS.prefs, {}));
  var savePrefs = function () { save(KEYS.prefs, prefs); };
  var lensNames = load(KEYS.names, {});
  var lensInfos = load(KEYS.infos, {});

  function say(text) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { toast.hidden = true; }, 2600);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function stamp(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function comma(n) { return String(n).replace('.', ','); }
  function message(text) {
    var box = $('[data-cam-message]');
    box.textContent = text || '';
    box.hidden = !text;
  }
  function range(cap) { return cap && typeof cap.min === 'number' && typeof cap.max === 'number' && cap.max > cap.min ? cap : null; }
  function has(list, value) { return Array.isArray(list) && list.indexOf(value) >= 0; }
  function current(name) {
    var s = state.track && state.track.getSettings ? state.track.getSettings() : {};
    return m[name] != null ? m[name] : s[name];
  }

  // ---------- Where the photos go ----------

  function destination() { return destSelect.value; }
  function backUrl() {
    var d = cfg.destinations.find(function (x) { return x.value === destination(); });
    return d ? d.back : '/photos';
  }
  function syncDestination() {
    shutter.disabled = !destination();
    $('[data-cam-done]').href = backUrl();
    $('[data-cam-close]').href = backUrl();
    if (destination()) save(KEYS.dest, destination());
  }
  if (!cfg.chosen) {
    var last = load(KEYS.dest, null);
    if (last && cfg.destinations.some(function (d) { return d.value === last; })) {
      destSelect.value = last;
      if (destSelect._pickerSync) destSelect._pickerSync();
    }
  }
  destSelect.addEventListener('change', syncDestination);
  syncDestination();

  // ---------- The sensor ----------

  function stop() {
    if (state.stream) state.stream.getTracks().forEach(function (t) { t.stop(); });
    state.stream = null;
    state.track = null;
    state.capture = null;
  }

  function start() {
    stop();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message("Ce navigateur ne donne pas accès à l'appareil photo : utilise « Appareil du téléphone ».");
      return Promise.resolve();
    }
    // 4:3, the sensor's own shape, so the preview frames like the photo.
    var size = { width: { ideal: 1920 }, height: { ideal: 1440 } };
    var which = state.deviceId ? { deviceId: { exact: state.deviceId } } : { facingMode: { ideal: 'environment' } };
    return navigator.mediaDevices.getUserMedia({ audio: false, video: Object.assign(which, size) }).then(function (stream) {
      state.stream = stream;
      state.track = stream.getVideoTracks()[0];
      video.srcObject = stream;
      message('');
      return video.play().catch(function () {});
    }).then(function () {
      if (!state.track) return null;
      state.caps = state.track.getCapabilities ? state.track.getCapabilities() : {};
      state.deviceId = state.track.getSettings().deviceId || state.deviceId;
      save(KEYS.lens, state.deviceId);
      state.capture = window.ImageCapture ? new ImageCapture(state.track) : null;
      return state.capture ? state.capture.getPhotoCapabilities().catch(function () { return null; }) : null;
    }).then(function (photoCaps) {
      if (!state.track) return;
      state.photoCaps = photoCaps;
      // What this lens is, kept to describe it later.
      var info = {};
      if (range(state.caps.zoom)) info.zoom = [state.caps.zoom.min, state.caps.zoom.max];
      if (photoCaps && photoCaps.imageWidth && photoCaps.imageWidth.max) info.mpx = Math.round(photoCaps.imageWidth.max * photoCaps.imageHeight.max / 1e6);
      lensInfos[state.deviceId] = info;
      save(KEYS.infos, lensInfos);
      return navigator.mediaDevices.enumerateDevices().then(function (all) {
        // The back lenses (once allowed, the browser gives their names).
        state.devices = all.filter(function (d) { return d.kind === 'videoinput' && !/front|avant|user/i.test(d.label); });
      });
    }).then(function () {
      if (!state.track) return;
      buildLenses();
      buildPills();
      buildQuick();
      buildPanel();
      reapply();
      layout();
    }).catch(function (err) {
      stop();
      if (err && (err.name === 'OverconstrainedError' || err.name === 'NotReadableError') && state.deviceId) {
        // This lens is gone or busy: back to the default one.
        state.deviceId = null;
        save(KEYS.lens, null);
        return start();
      }
      if (err && err.name === 'NotAllowedError') message("L'accès à l'appareil photo est refusé. Autorise-le (cadenas à côté de l'adresse, ou réglages du site), puis rouvre l'appareil. « Appareil du téléphone » marche sans.");
      else if (err && err.name === 'NotFoundError') message('Aucun appareil photo trouvé sur cet appareil.');
      else message("L'appareil photo n'a pas pu démarrer (" + (err && err.name || 'erreur') + '). « Appareil du téléphone » reste possible.');
    });
  }

  function apply(settings) {
    if (!state.track || !state.track.applyConstraints) return Promise.resolve(false);
    return state.track.applyConstraints({ advanced: [settings] }).then(function () { return true; }).catch(function () { return false; });
  }

  function manualExposure() {
    var c = state.caps;
    var o = { exposureMode: 'manual' };
    if (range(c.iso)) o.iso = m.iso != null ? m.iso : (current('iso') || c.iso.min);
    if (range(c.exposureTime)) o.exposureTime = m.exposureTime != null ? m.exposureTime : (current('exposureTime') || c.exposureTime.min);
    return o;
  }

  // The manual settings again (some phones drop them after a photo or a
  // change of lens).
  function reapply() {
    var steps = [];
    if (m.zoom != null) steps.push({ zoom: m.zoom });
    if (m.focusMode === 'manual' && m.focusDistance != null) steps.push({ focusMode: 'manual', focusDistance: m.focusDistance });
    if (m.exposureMode === 'manual') steps.push(manualExposure());
    else if (m.exposureCompensation) steps.push({ exposureMode: 'continuous', exposureCompensation: m.exposureCompensation });
    if (m.whiteBalanceMode === 'manual' && m.colorTemperature != null) steps.push({ whiteBalanceMode: 'manual', colorTemperature: m.colorTemperature });
    ['brightness', 'contrast', 'saturation', 'sharpness'].forEach(function (k) { if (m[k] != null) { var o = {}; o[k] = m[k]; steps.push(o); } });
    if (m.torch) steps.push({ torch: true });
    return steps.reduce(function (p, s) { return p.then(function () { return apply(s); }); }, Promise.resolve());
  }

  // ---------- Lenses and zoom, above the shutter ----------

  function lensName(d, i) {
    if (lensNames[d.deviceId]) return lensNames[d.deviceId];
    if (/tele/i.test(d.label)) return 'Zoom';
    if (/ultra|wide/i.test(d.label)) return 'Grand-angle';
    return i === 0 ? 'Principal' : 'Capteur ' + (i + 1);
  }

  function rename(d, i) {
    var name = prompt('Nom de ce capteur (ex. Principal, Zoom, Grand-angle) :', lensName(d, i));
    if (name == null) return;
    name = name.trim().slice(0, 20);
    if (name) lensNames[d.deviceId] = name; else delete lensNames[d.deviceId];
    save(KEYS.names, lensNames);
    buildLenses();
    buildPanel();
  }

  function switchLens(id) {
    if (id === state.deviceId) return;
    state.deviceId = id;
    // Zoom and focus belong to a lens; exposure, white balance and light are kept.
    m.zoom = null;
    m.focusMode = null;
    m.focusDistance = null;
    closeDial();
    start();
  }

  function markZoom(v) {
    document.querySelectorAll('[data-cam-lenses] [data-zoom]').forEach(function (b) {
      b.classList.toggle('is-on', Math.abs(Number(b.dataset.zoom) - v) < 0.05);
    });
    if (rows.zoom) rows.zoom.setValue(v);
  }

  function buildLenses() {
    var box = $('[data-cam-lenses]');
    box.innerHTML = '';
    if (state.devices.length > 1) {
      state.devices.forEach(function (d, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cam-lens' + (d.deviceId === state.deviceId ? ' is-on' : '');
        b.textContent = lensName(d, i);
        b.title = 'Appui long pour renommer';
        var held = null;
        b.addEventListener('pointerdown', function () { held = setTimeout(function () { held = 'done'; rename(d, i); }, 600); });
        b.addEventListener('pointerup', function () { if (held !== 'done') { clearTimeout(held); switchLens(d.deviceId); } held = null; });
        b.addEventListener('pointerleave', function () { if (held !== 'done') clearTimeout(held); held = null; });
        b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        box.appendChild(b);
      });
    }
    var z = range(state.caps && state.caps.zoom);
    if (z) {
      if (box.children.length) {
        var gap = document.createElement('span');
        gap.className = 'cam-lenses__gap';
        box.appendChild(gap);
      }
      [z.min < 1 ? z.min : null, 1, 2, 3, 5, 10]
        .filter(function (v, i, a) { return v != null && v >= z.min && v <= z.max && a.indexOf(v) === i; })
        .forEach(function (v) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'cam-zoom';
          b.dataset.zoom = v;
          b.textContent = comma(Math.round(v * 10) / 10) + '×';
          b.addEventListener('click', function () { m.zoom = v; markZoom(v); apply({ zoom: v }); });
          box.appendChild(b);
        });
      markZoom(current('zoom') || 1);
    }
  }

  // ---------- Pills on the preview, each opening its dial ----------

  function fmtDistance(v) { return comma(Math.round(v * 100) / 100) + ' m'; }
  function fmtEv(v) { var r = Math.round(v * 10) / 10; return (r > 0 ? '+' : r < 0 ? '−' : '±') + comma(Math.abs(r)); }
  function fmtSpeed(units) {
    // exposureTime comes in units of 100 microseconds.
    var s = units / 10000;
    return s >= 1 ? comma(Math.round(s * 10) / 10) + ' s' : '1/' + Math.round(1 / s);
  }

  var CONTROLS = [
    {
      key: 'focus', label: 'MAP',
      ok: function (c) { return has(c.focusMode, 'manual') && range(c.focusDistance); },
      cap: function (c) { return c.focusDistance; },
      auto: function () { return m.focusMode !== 'manual'; },
      value: function () { return m.focusDistance != null ? m.focusDistance : current('focusDistance'); },
      format: fmtDistance, hint: 'près ← → loin',
      set: function (v) { m.focusMode = 'manual'; m.focusDistance = v; return apply({ focusMode: 'manual', focusDistance: v }); },
      reset: function () { m.focusMode = null; m.focusDistance = null; return apply({ focusMode: 'continuous' }); }
    },
    {
      key: 'ev', label: 'EV',
      ok: function (c) { return range(c.exposureCompensation); },
      cap: function (c) { return c.exposureCompensation; },
      auto: function () { return !m.exposureCompensation; },
      off: function () { return m.exposureMode === 'manual'; },
      value: function () { return m.exposureCompensation || 0; },
      format: fmtEv,
      set: function (v) { m.exposureCompensation = v; return apply({ exposureMode: 'continuous', exposureCompensation: v }); },
      reset: function () { m.exposureCompensation = 0; return apply({ exposureMode: 'continuous', exposureCompensation: 0 }); }
    },
    {
      key: 'iso', label: 'ISO', log: true,
      ok: function (c) { return has(c.exposureMode, 'manual') && range(c.iso); },
      cap: function (c) { return c.iso; },
      auto: function () { return m.exposureMode !== 'manual' || m.iso == null; },
      value: function () { return m.iso != null ? m.iso : current('iso'); },
      format: function (v) { return String(Math.round(v)); },
      set: function (v) { m.exposureMode = 'manual'; m.iso = Math.round(v); return apply(manualExposure()); },
      reset: function () {
        m.iso = null;
        if (m.exposureTime == null) { m.exposureMode = null; return apply({ exposureMode: 'continuous' }); }
        return apply(manualExposure());
      }
    },
    {
      key: 'speed', label: 'Vitesse', log: true,
      ok: function (c) { return has(c.exposureMode, 'manual') && range(c.exposureTime); },
      cap: function (c) { return c.exposureTime; },
      auto: function () { return m.exposureMode !== 'manual' || m.exposureTime == null; },
      value: function () { return m.exposureTime != null ? m.exposureTime : current('exposureTime'); },
      format: fmtSpeed,
      set: function (v) { m.exposureMode = 'manual'; m.exposureTime = v; return apply(manualExposure()); },
      reset: function () {
        m.exposureTime = null;
        if (m.iso == null) { m.exposureMode = null; return apply({ exposureMode: 'continuous' }); }
        return apply(manualExposure());
      }
    },
    {
      key: 'wb', label: 'BdB',
      ok: function (c) { return has(c.whiteBalanceMode, 'manual') && range(c.colorTemperature); },
      cap: function (c) { return c.colorTemperature; },
      auto: function () { return m.whiteBalanceMode !== 'manual'; },
      value: function () { return m.colorTemperature != null ? m.colorTemperature : (current('colorTemperature') || 5500); },
      format: function (v) { return Math.round(v / 50) * 50 + ' K'; },
      presets: [[5500, 'Soleil'], [6500, 'Nuageux'], [7500, 'Ombre'], [3200, 'Ampoule'], [4000, 'Néon']],
      set: function (v) { m.whiteBalanceMode = 'manual'; m.colorTemperature = Math.round(v); return apply({ whiteBalanceMode: 'manual', colorTemperature: m.colorTemperature }); },
      reset: function () { m.whiteBalanceMode = null; m.colorTemperature = null; return apply({ whiteBalanceMode: 'continuous' }); }
    }
  ];

  function available() { return CONTROLS.filter(function (ctl) { return ctl.ok(state.caps || {}); }); }

  function paintPills() {
    document.querySelectorAll('[data-cam-pills] [data-control]').forEach(function (b) {
      var ctl = CONTROLS.find(function (x) { return x.key === b.dataset.control; });
      var off = ctl.off && ctl.off();
      b.classList.toggle('is-manual', !ctl.auto() && !off);
      b.classList.toggle('is-open', state.openDial === ctl.key);
      b.disabled = Boolean(off);
      b.querySelector('b').textContent = off ? '—' : ctl.auto() ? 'Auto' : ctl.format(ctl.value());
    });
  }

  function buildPills() {
    var box = $('[data-cam-pills]');
    box.innerHTML = '';
    available().forEach(function (ctl) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cam-pill';
      b.dataset.control = ctl.key;
      b.innerHTML = '<span></span><b></b>';
      b.firstChild.textContent = ctl.label;
      b.addEventListener('click', function () {
        if (state.openDial === ctl.key) closeDial(); else openDial(ctl);
      });
      box.appendChild(b);
    });
    box.hidden = !box.children.length;
    paintPills();
  }

  // A slider with its ticks over the bottom of the image, an "Auto" button,
  // and the presets of white balance.
  function openDial(ctl) {
    var cap = ctl.cap(state.caps);
    state.openDial = ctl.key;
    dial.hidden = false;
    dial.innerHTML = '<div class="cam-dial__head"><span class="cam-dial__name"></span><output></output><button type="button" class="cam-chip" data-auto>Auto</button></div>'
      + '<input type="range" min="0" max="1000" step="1">'
      + (ctl.hint ? '<div class="cam-dial__hint"></div>' : '')
      + (ctl.presets ? '<div class="cam-dial__presets"></div>' : '');
    dial.querySelector('.cam-dial__name').textContent = ctl.label;
    if (ctl.hint) dial.querySelector('.cam-dial__hint').textContent = ctl.hint;
    var input = dial.querySelector('input');
    var out = dial.querySelector('output');
    var lo = cap.min, hi = cap.max;
    var useLog = ctl.log && lo > 0;
    var toValue = function (pos) {
      var t = pos / 1000;
      var v = useLog ? Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo))) : lo + t * (hi - lo);
      if (cap.step) v = Math.round(v / cap.step) * cap.step;
      return Math.min(hi, Math.max(lo, v));
    };
    var toPos = function (v) {
      v = Math.min(hi, Math.max(lo, v == null ? lo : v));
      return Math.round((useLog ? (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (v - lo) / (hi - lo)) * 1000);
    };
    var show = function (v) { out.textContent = ctl.auto() && v == null ? 'Auto' : ctl.format(v); };
    input.value = toPos(ctl.value());
    show(ctl.value());
    // At most one change on its way to the sensor at a time.
    var pending = null, busy = false;
    var push = function (v) {
      pending = v;
      if (busy) return;
      busy = true;
      (function send() {
        var next = pending;
        pending = null;
        Promise.resolve(ctl.set(next)).then(function () {
          paintPills();
          if (pending != null) send(); else busy = false;
        });
      })();
    };
    input.addEventListener('input', function () {
      var v = toValue(Number(input.value));
      show(v);
      push(v);
    });
    dial.querySelector('[data-auto]').addEventListener('click', function () {
      Promise.resolve(ctl.reset()).then(function () {
        input.value = toPos(ctl.value());
        out.textContent = 'Auto';
        paintPills();
      });
    });
    if (ctl.presets) {
      var box = dial.querySelector('.cam-dial__presets');
      ctl.presets.filter(function (p) { return p[0] >= lo && p[0] <= hi; }).forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cam-chip';
        b.textContent = p[1];
        b.addEventListener('click', function () { input.value = toPos(p[0]); show(p[0]); push(p[0]); });
        box.appendChild(b);
      });
    }
    paintPills();
  }

  function closeDial() {
    state.openDial = null;
    dial.hidden = true;
    dial.innerHTML = '';
    paintPills();
  }

  // ---------- Quick switches on the preview: flash, torch, timer, grid ----------

  var ICONS = {
    flash: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>',
    torch: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l-1 6H9z"/><path d="M9 9h6v12H9z"/><path d="M12 13v3"/></svg>',
    timer: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg>'
  };
  var FLASH_NAMES = { off: 'Non', auto: 'Auto', flash: 'Oui' };

  function quickButton(icon, label, value, on, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cam-quick' + (on ? ' is-on' : '');
    b.innerHTML = ICONS[icon] + '<span></span>';
    b.lastChild.textContent = value;
    b.setAttribute('aria-label', label + ' : ' + value);
    b.addEventListener('click', onClick);
    return b;
  }

  function buildQuick() {
    var box = $('[data-cam-quick]');
    box.innerHTML = '';
    var flashModes = (state.photoCaps && state.photoCaps.fillLightMode || []).filter(function (x) { return FLASH_NAMES[x]; });
    if (flashModes.length > 1) {
      if (flashModes.indexOf(prefs.flash) < 0) prefs.flash = 'off';
      box.appendChild(quickButton('flash', 'Flash', FLASH_NAMES[prefs.flash], prefs.flash !== 'off', function () {
        prefs.flash = flashModes[(flashModes.indexOf(prefs.flash) + 1) % flashModes.length];
        savePrefs();
        buildQuick();
        say('Flash : ' + FLASH_NAMES[prefs.flash]);
      }));
    }
    if (state.caps && state.caps.torch) {
      box.appendChild(quickButton('torch', 'Lampe', m.torch ? 'Allumée' : 'Lampe', m.torch, function () {
        m.torch = !m.torch;
        apply({ torch: m.torch }).then(function (ok) {
          if (!ok) { m.torch = false; say("La lampe n'a pas pu s'allumer"); }
          buildQuick();
        });
      }));
    }
    box.appendChild(quickButton('timer', 'Retardateur', prefs.timer ? prefs.timer + ' s' : 'Non', Boolean(prefs.timer), function () {
      var steps = [0, 2, 5, 10];
      prefs.timer = steps[(steps.indexOf(Number(prefs.timer)) + 1) % steps.length];
      savePrefs();
      buildQuick();
    }));
    box.appendChild(quickButton('grid', 'Grille', prefs.grid ? 'Grille' : 'Grille', prefs.grid, function () {
      prefs.grid = !prefs.grid;
      savePrefs();
      showAids();
      buildQuick();
    }));
  }

  // ---------- The PRO panel: the rest ----------

  function choiceRow(label, options, selected, onPick) {
    var row = document.createElement('div');
    row.className = 'cam-set';
    row.innerHTML = '<div class="cam-set__head"><span></span></div><div class="cam-set__choices"></div>';
    row.querySelector('span').textContent = label;
    var box = row.querySelector('.cam-set__choices');
    options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o[1];
      b.className = 'cam-chip' + (o[0] === selected ? ' is-on' : '');
      b.addEventListener('click', function () {
        box.querySelectorAll('.cam-chip').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        onPick(o[0]);
      });
      box.appendChild(b);
    });
    return row;
  }

  function sliderRow(label, cap, value, format, onInput) {
    var row = document.createElement('div');
    row.className = 'cam-set';
    row.innerHTML = '<div class="cam-set__head"><span></span><output></output></div><input type="range">';
    row.querySelector('span').textContent = label;
    var input = row.querySelector('input');
    var out = row.querySelector('output');
    input.min = cap.min;
    input.max = cap.max;
    input.step = cap.step || (cap.max - cap.min) / 100;
    input.value = value != null ? value : cap.min;
    out.textContent = format(Number(input.value));
    input.addEventListener('input', function () { out.textContent = format(Number(input.value)); onInput(Number(input.value)); });
    row.setValue = function (v) { input.value = v; out.textContent = format(Number(v)); };
    return row;
  }

  function section(title) {
    var s = document.createElement('section');
    s.className = 'cam-panel__section';
    s.innerHTML = '<h3></h3>';
    s.firstChild.textContent = title;
    panel.appendChild(s);
    return s;
  }

  var rows = {};

  function buildPanel() {
    panel.innerHTML = '';
    rows = {};
    var c = state.caps || {};

    var shot = section('Prise de vue');
    var maxW = state.photoCaps && state.photoCaps.imageWidth && state.photoCaps.imageWidth.max;
    var maxH = state.photoCaps && state.photoCaps.imageHeight && state.photoCaps.imageHeight.max;
    if (maxW && maxH) {
      var mpx = Math.round(maxW * maxH / 1e6);
      var sizes = [['max', 'Max · ' + mpx + ' Mpx']];
      if (mpx > 14) sizes.push(['12', '12 Mpx']);
      shot.appendChild(choiceRow('Définition', sizes, prefs.resolution, function (v) { prefs.resolution = v; savePrefs(); }));
    }
    shot.appendChild(choiceRow('Rafale', [[1, '1 photo'], [3, '3'], [5, '5'], [10, '10']], Number(prefs.burst), function (v) { prefs.burst = v; savePrefs(); }));

    var tuning = [['brightness', 'Luminosité'], ['contrast', 'Contraste'], ['saturation', 'Saturation'], ['sharpness', 'Netteté']].filter(function (k) { return range(c[k[0]]); });
    if (tuning.length) {
      var look = section('Rendu');
      tuning.forEach(function (k) {
        look.appendChild(sliderRow(k[1], c[k[0]], current(k[0]), function (v) { return String(Math.round(v)); }, function (v) {
          m[k[0]] = v; var o = {}; o[k[0]] = v; apply(o);
        }));
      });
    }
    if (range(c.zoom)) {
      var zoom = section('Zoom précis');
      rows.zoom = sliderRow('Zoom', c.zoom, current('zoom'), function (v) { return comma(Math.round(v * 10) / 10) + '×'; }, function (v) {
        m.zoom = v; markZoom(v); apply({ zoom: v });
      });
      zoom.appendChild(rows.zoom);
    }

    var aids = section('Aides');
    aids.appendChild(choiceRow('Histogramme', [[false, 'Non'], [true, 'Oui']], prefs.histo, function (v) { prefs.histo = v; savePrefs(); showAids(); }));
    aids.appendChild(choiceRow('Niveau', [[false, 'Non'], [true, 'Oui']], prefs.level, function (v) { prefs.level = v; savePrefs(); showAids(); }));

    // What the phone lets the app use, to tell why something is missing.
    var lenses = section('Capteurs');
    var list = document.createElement('ul');
    list.className = 'cam-panel__lenses';
    state.devices.forEach(function (d, i) {
      var info = lensInfos[d.deviceId] || {};
      var li = document.createElement('li');
      li.innerHTML = '<div><b></b><small></small></div><button type="button" class="cam-chip">Renommer</button>';
      li.querySelector('b').textContent = lensName(d, i) + (d.deviceId === state.deviceId ? ' (en cours)' : '');
      var details = [];
      if (info.mpx) details.push(info.mpx + ' Mpx');
      if (info.zoom) details.push('zoom ' + comma(Math.round(info.zoom[0] * 10) / 10) + '–' + comma(Math.round(info.zoom[1] * 10) / 10) + '×');
      details.push(d.label || 'sans nom');
      li.querySelector('small').textContent = details.join(' · ');
      li.querySelector('button').addEventListener('click', function () { rename(d, i); });
      list.appendChild(li);
    });
    lenses.appendChild(list);
    var tip = document.createElement('p');
    tip.className = 'cam-panel__tip';
    tip.textContent = state.devices.length > 1
      ? 'Touche un capteur au-dessus du déclencheur pour en changer ; un appui long le renomme.'
      : "Chrome ne laisse voir qu'un capteur arrière : les boutons de zoom (2×, 3×…) peuvent faire basculer le téléphone sur son capteur zoom, selon le modèle. Sinon, « Appareil du téléphone » les a tous.";
    lenses.appendChild(tip);
    var glyph = document.createElement('p');
    glyph.className = 'cam-panel__tip';
    glyph.textContent = "Les Glyph de Nothing ne s'allument que depuis une vraie app Android : une app web comme Isoterra n'y a pas accès.";
    lenses.appendChild(glyph);

    var foot = document.createElement('div');
    foot.className = 'cam-panel__foot';
    foot.innerHTML = '<button type="button" class="cam-chip">Tout remettre en auto</button> <button type="button" class="cam-chip is-on" data-close>Fermer</button>';
    foot.firstChild.addEventListener('click', function () {
      Object.keys(m).forEach(function (k) { delete m[k]; });
      var resets = [{ focusMode: 'continuous' }, { exposureMode: 'continuous', exposureCompensation: 0 }, { whiteBalanceMode: 'continuous' }, { torch: false }];
      if (range(c.zoom)) resets.push({ zoom: c.zoom.min <= 1 && c.zoom.max >= 1 ? 1 : c.zoom.min });
      resets.reduce(function (p, s) { return p.then(function () { return apply(s); }); }, Promise.resolve()).then(function () {
        closeDial();
        buildLenses();
        buildPills();
        buildQuick();
        buildPanel();
        say('Réglages remis en auto');
      });
    });
    foot.querySelector('[data-close]').addEventListener('click', togglePanel);
    panel.appendChild(foot);
    showAids();
  }

  function togglePanel() {
    panel.hidden = !panel.hidden;
    var button = $('[data-cam-pro]');
    button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    button.classList.toggle('is-on', !panel.hidden);
    if (!panel.hidden) closeDial();
  }
  $('[data-cam-pro]').addEventListener('click', togglePanel);

  // ---------- Aids: grid, histogram, level ----------

  // The part of the screen the photo really covers (the preview keeps the
  // photo's shape, with bands around it).
  function layout() {
    var w = video.videoWidth, h = video.videoHeight;
    var box = stage.getBoundingClientRect();
    if (!w || !h) return;
    var scale = Math.min(box.width / w, box.height / h);
    var fw = w * scale, fh = h * scale;
    frameBox.style.width = fw + 'px';
    frameBox.style.height = fh + 'px';
    frameBox.style.left = (box.width - fw) / 2 + 'px';
    frameBox.style.top = (box.height - fh) / 2 + 'px';
  }
  video.addEventListener('loadedmetadata', layout);
  window.addEventListener('resize', layout);

  var histoTimer = null;
  function showAids() {
    $('[data-cam-grid]').hidden = !prefs.grid;
    $('[data-cam-histo]').hidden = !prefs.histo;
    clearInterval(histoTimer);
    if (prefs.histo) histoTimer = setInterval(drawHisto, 300);
    $('[data-cam-level]').hidden = !prefs.level;
  }

  var sample = document.createElement('canvas');
  sample.width = 80;
  sample.height = 60;
  function drawHisto() {
    if (document.hidden || !video.videoWidth) return;
    var g = sample.getContext('2d', { willReadFrequently: true });
    g.drawImage(video, 0, 0, sample.width, sample.height);
    var px = g.getImageData(0, 0, sample.width, sample.height).data;
    var bins = new Array(64).fill(0);
    for (var i = 0; i < px.length; i += 4) bins[Math.min(63, Math.floor((0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 4))]++;
    var peak = Math.max.apply(null, bins) || 1;
    var canvas = $('[data-cam-histo]');
    var c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    bins.forEach(function (n, k) {
      var hgt = Math.round(n / peak * (canvas.height - 4));
      c.fillRect(k * 2, canvas.height - 2 - hgt, 2, hgt);
    });
    // Clipped shadows or highlights in red.
    c.fillStyle = 'rgba(230,60,40,0.9)';
    var total = sample.width * sample.height;
    if (bins[0] / total > 0.04) c.fillRect(0, 0, 3, canvas.height);
    if (bins[63] / total > 0.04) c.fillRect(canvas.width - 3, 0, 3, canvas.height);
  }

  // Upright: a line that stays with the horizon. Flat (photo from above, into
  // a bac): a bubble to centre.
  window.addEventListener('devicemotion', function (event) {
    if (!prefs.level) return;
    var a = event.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    var box = $('[data-cam-level]');
    var flat = Math.abs(a.z) > 8.3;
    box.classList.toggle('is-flat', flat);
    if (flat) {
      var off = Math.hypot(a.x, a.y);
      box.querySelector('.cam__level-bubble').style.transform = 'translate(' + Math.max(-40, Math.min(40, a.x * 9)) + 'px,' + Math.max(-40, Math.min(40, -a.y * 9)) + 'px)';
      box.classList.toggle('is-level', off < 0.35);
      box.querySelector('em').textContent = comma(Math.round(Math.asin(Math.min(1, off / 9.81)) * 1800 / Math.PI) / 10) + '°';
    } else {
      var angle = Math.atan2(a.x, a.y) * 180 / Math.PI;
      box.querySelector('.cam__level-line').style.transform = 'rotate(' + angle + 'deg)';
      box.classList.toggle('is-level', Math.abs(angle) < 1);
      box.querySelector('em').textContent = comma(Math.round(Math.abs(angle) * 10) / 10) + '°';
    }
  });

  // ---------- Focus on a tap, zoom with two fingers ----------

  var touches = {};
  var pinch = null;
  stage.addEventListener('pointerdown', function (e) {
    touches[e.pointerId] = { x: e.clientX, y: e.clientY, t: Date.now() };
    var ids = Object.keys(touches);
    if (ids.length === 2 && range(state.caps.zoom)) {
      var p = touches[ids[0]], q = touches[ids[1]];
      pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), z: current('zoom') || 1 };
    }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!touches[e.pointerId]) return;
    touches[e.pointerId].x = e.clientX;
    touches[e.pointerId].y = e.clientY;
    var ids = Object.keys(touches);
    if (pinch && ids.length >= 2) {
      var p = touches[ids[0]], q = touches[ids[1]];
      var z = state.caps.zoom;
      var v = Math.min(z.max, Math.max(z.min, pinch.z * Math.hypot(p.x - q.x, p.y - q.y) / pinch.d));
      m.zoom = v;
      markZoom(v);
      if (!pinch.busy) { pinch.busy = true; apply({ zoom: v }).then(function () { if (pinch) pinch.busy = false; }); }
    }
  });
  function release(e) {
    var t = touches[e.pointerId];
    delete touches[e.pointerId];
    if (pinch) { if (Object.keys(touches).length < 2) pinch = null; return; }
    if (!t || Date.now() - t.t > 400 || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return;
    // A tap on the image closes an open dial first, then focuses.
    if (state.openDial) { closeDial(); return; }
    focusAt(e.clientX, e.clientY);
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', function (e) { delete touches[e.pointerId]; pinch = null; });

  function focusAt(x, y) {
    var r = frameBox.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom || !state.track) return;
    var ring = $('[data-cam-focus]');
    ring.style.left = (x - r.left) + 'px';
    ring.style.top = (y - r.top) + 'px';
    ring.hidden = false;
    ring.classList.remove('is-done');
    void ring.offsetWidth;
    var supported = navigator.mediaDevices.getSupportedConstraints ? navigator.mediaDevices.getSupportedConstraints() : {};
    if (!supported.pointsOfInterest) {
      setTimeout(function () { ring.hidden = true; }, 700);
      return;
    }
    var point = { x: (x - r.left) / r.width, y: (y - r.top) / r.height };
    var settings = { pointsOfInterest: [point] };
    // In manual focus the tap only sets where exposure is measured.
    if (m.focusMode !== 'manual') settings.focusMode = has(state.caps.focusMode, 'single-shot') ? 'single-shot' : 'continuous';
    apply(settings).then(function () {
      ring.classList.add('is-done');
      setTimeout(function () { ring.hidden = true; }, 900);
    });
  }

  // ---------- Taking photos ----------

  function countdown(n) {
    var box = $('[data-cam-countdown]');
    return new Promise(function (resolve) {
      (function tick(left) {
        if (!left) { box.hidden = true; return resolve(); }
        box.hidden = false;
        box.textContent = left;
        setTimeout(function () { tick(left - 1); }, 1000);
      })(n);
    });
  }

  function takeOne() {
    var pc = state.photoCaps;
    if (state.capture && state.track && state.track.readyState === 'live') {
      var settings = {};
      if (pc && pc.imageWidth && pc.imageWidth.max && pc.imageHeight && pc.imageHeight.max) {
        var w = pc.imageWidth.max, h = pc.imageHeight.max;
        if (prefs.resolution === '12' && w * h > 14e6) { var k = Math.sqrt(12e6 / (w * h)); w = Math.round(w * k); h = Math.round(h * k); }
        settings.imageWidth = w;
        settings.imageHeight = h;
      }
      if (pc && has(pc.fillLightMode, prefs.flash)) settings.fillLightMode = prefs.flash;
      return state.capture.takePhoto(settings).then(function (blob) {
        setTimeout(reapply, 400);
        return blob;
      }).catch(function () { return frameGrab(); });
    }
    return frameGrab();
  }

  // When the phone can't take a real photo: the preview's own picture.
  function frameGrab() {
    if (!video.videoWidth) return Promise.reject(new Error("L'appareil photo n'est pas prêt."));
    var c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    return new Promise(function (resolve) { c.toBlob(resolve, 'image/jpeg', 0.95); });
  }

  function flash() {
    var f = $('[data-cam-flash]');
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
    if (navigator.vibrate) navigator.vibrate(25);
  }

  shutter.addEventListener('click', function () {
    if (state.busy || !destination()) return;
    state.busy = true;
    shutter.classList.add('is-busy');
    closeDial();
    var n = Math.max(1, Number(prefs.burst) || 1);
    var chain = prefs.timer ? countdown(Number(prefs.timer)) : Promise.resolve();
    for (var i = 0; i < n; i++) {
      chain = chain.then(takeOne).then(function (blob) {
        flash();
        return addShot(blob, null, Date.now());
      });
    }
    chain.catch(function (err) { say(err && err.message ? err.message : "La photo n'a pas pu être prise."); })
      .then(function () { state.busy = false; shutter.classList.remove('is-busy'); });
  });

  // The phone's own camera, with all its processing: its photo is filed the
  // same way.
  $('[data-cam-native]').addEventListener('change', function () {
    if (!destination()) { say("Choisis d'abord où ranger les photos."); this.value = ''; return; }
    Array.prototype.forEach.call(this.files, function (file) { addShot(file, file.name, file.lastModified || Date.now()); });
    this.value = '';
  });

  // ---------- Sending: the shared queue (public/js/envois.js) ----------

  // Each photo joins the queue at once, kept in the phone until the Pi has
  // it; the session's photos make one batch, so one line in the journal.
  function addShot(blob, name, time) {
    if (!blob) return Promise.resolve();
    var d = new Date(time);
    var file = new File([blob], name || 'isoterra-' + stamp(d).slice(0, 10).replace(/-/g, '') + '-' + stamp(d).slice(11).replace(/:/g, '') + '.jpg', {
      type: blob.type || 'image/jpeg', lastModified: time
    });
    return window.isoEnvois.add([file], { dest: destination(), type: 'observation', batch: SESSION });
  }

  // This session's photos, and any other still waiting to go.
  function shots() {
    return window.isoEnvois.entries().filter(function (e) {
      return e.item.batch === SESSION || e.item.session === SESSION || e.status !== 'ok';
    });
  }
  window.isoEnvois.on(function () { renderRoll(); });

  // ---------- The session's photos ----------

  var sheet = $('[data-cam-sheet]');

  function renderRoll() {
    var list = shots();
    var roll = $('[data-cam-roll]');
    var lastShot = list[list.length - 1];
    var img = roll.querySelector('img');
    var url = lastShot && window.isoEnvois.preview(lastShot);
    img.hidden = !url;
    if (url) img.src = url;
    var count = roll.querySelector('.cam__roll-count');
    count.hidden = !list.length;
    count.textContent = list.length;
    var waiting = list.filter(function (e) { return e.status !== 'ok'; });
    var badge = roll.querySelector('.cam__roll-state');
    badge.hidden = !waiting.length;
    badge.className = 'cam__roll-state' + (waiting.some(function (e) { return e.status === 'erreur' || e.status === 'refus'; }) ? ' is-error' : '');
    if (!sheet.hidden) renderSheet();
  }

  function renderSheet() {
    var list = shots();
    var sent = list.filter(function (e) { return e.status === 'ok'; }).length;
    var problems = list.filter(function (e) { return e.status === 'erreur'; }).length;
    $('[data-cam-sheet-sub]').textContent = list.length
      ? sent + ' sur ' + list.length + ' envoyée' + (sent > 1 ? 's' : '') + (problems ? ' · le Pi ne répond pas, nouvel essai bientôt' : '')
      : 'Aucune photo pour l’instant';
    var grid = $('[data-cam-sheet-grid]');
    grid.innerHTML = '';
    list.slice().reverse().forEach(function (entry) {
      var tile;
      if (entry.status === 'ok' && entry.photo) {
        // Sent: it opens in the viewer (stars, species, delete…).
        tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'photo-thumb cam-roll__tile';
        tile.dataset.photo = JSON.stringify(entry.photo);
        tile.dataset.photoId = entry.photo.id;
      } else {
        tile = document.createElement('div');
        tile.className = 'cam-roll__tile';
      }
      var url = window.isoEnvois.preview(entry);
      if (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.decoding = 'async';
        tile.appendChild(img);
      }
      var label = {
        attente: 'En attente', envoi: 'Envoi ' + Math.round((entry.progress || 0) * 100) + ' %',
        erreur: 'Nouvel essai bientôt', refus: entry.error || 'Refusée'
      }[entry.status];
      if (label) {
        var badge = document.createElement('span');
        badge.className = 'cam-roll__badge is-' + entry.status;
        badge.textContent = label;
        tile.appendChild(badge);
      }
      if (entry.status === 'refus' || entry.status === 'erreur' || entry.status === 'attente') {
        var drop = document.createElement('button');
        drop.type = 'button';
        drop.className = 'cam-roll__drop';
        drop.setAttribute('aria-label', 'Retirer cette photo');
        drop.textContent = '×';
        drop.addEventListener('click', function (event) {
          event.stopPropagation();
          window.isoEnvois.remove(entry);
        });
        tile.appendChild(drop);
      }
      grid.appendChild(tile);
    });
  }

  $('[data-cam-roll]').addEventListener('click', function () {
    sheet.hidden = false;
    renderSheet();
  });
  $('[data-cam-sheet-close]').addEventListener('click', function () { sheet.hidden = true; });

  // A photo deleted from the viewer leaves the session too.
  new MutationObserver(function () {
    if (sheet.hidden) return;
    shots().forEach(function (e) {
      if (e.status === 'ok' && e.photo && !document.querySelector('[data-photo-id="' + e.photo.id + '"]')) window.isoEnvois.remove(e);
    });
  }).observe($('[data-cam-sheet-grid]'), { childList: true });

  function pending() { return shots().filter(function (e) { return e.status !== 'ok' && e.status !== 'refus'; }).length; }
  function leaving(event) {
    var n = pending();
    if (!n) return;
    if (!confirm(n + (n > 1 ? ' photos ne sont' : ' photo n’est') + " pas encore sur le Pi. Elles restent gardées dans le téléphone et partiront depuis la page que tu ouvres. Quitter quand même ?")) event.preventDefault();
  }
  $('[data-cam-close]').addEventListener('click', leaving);
  $('[data-cam-done]').addEventListener('click', leaving);

  // ---------- Camera on only while the page is shown ----------

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (!state.stream) start();
  });
  window.addEventListener('pagehide', stop);

  start();
})();
