// Appareil photo d'Isoterra.
//
// Il pilote directement le capteur du téléphone (getUserMedia et Image
// Capture) : prise en pleine définition, et tous les réglages que ce
// téléphone accepte, chacun n'étant affiché que s'il est disponible (zoom,
// mise au point manuelle ou au doigt, exposition, ISO, vitesse, balance des
// blancs, lampe, flash, contraste…), avec grille, histogramme, niveau,
// retardateur et rafale. Le traitement propre à l'appareil photo du
// téléphone (HDR, mode nuit) n'est pas accessible à une app : le bouton
// « Appareil du téléphone » l'ouvre pour ça, et sa photo est rangée de même.
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
  var destSelect = $('[data-cam-dest]');
  var shutter = $('[data-cam-shoot]');
  var SESSION = String(Date.now());
  var PREFS_KEY = 'isoterra.appareil.prefs';
  var DEST_KEY = 'isoterra.appareil.dest';
  var AT_KEY = 'isoterra.appareil.seances';

  var state = {
    stream: null, track: null, capture: null, caps: {}, photoCaps: null,
    devices: [], deviceId: null, busy: false, manual: {}, shots: []
  };
  var prefs = { grid: false, histo: false, level: false, timer: 0, burst: 1, flash: 'off', resolution: 'max' };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) {}
  var savePrefs = function () { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {} };

  function say(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function stamp(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function message(text) {
    var box = $('[data-cam-message]');
    box.textContent = text || '';
    box.hidden = !text;
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
    if (destination()) { try { localStorage.setItem(DEST_KEY, destination()); } catch (e) {} }
  }
  if (!cfg.chosen) {
    var last = null;
    try { last = localStorage.getItem(DEST_KEY); } catch (e) {}
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
    var video4x3 = { width: { ideal: 1920 }, height: { ideal: 1440 } };
    var constraints = { audio: false, video: Object.assign(state.deviceId ? { deviceId: { exact: state.deviceId } } : { facingMode: { ideal: 'environment' } }, video4x3) };
    return navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      state.stream = stream;
      state.track = stream.getVideoTracks()[0];
      video.srcObject = stream;
      message('');
      return video.play().catch(function () {});
    }).then(function () {
      if (!state.track) return;
      state.caps = state.track.getCapabilities ? state.track.getCapabilities() : {};
      state.deviceId = state.track.getSettings().deviceId || state.deviceId;
      state.capture = window.ImageCapture ? new ImageCapture(state.track) : null;
      return (state.capture ? state.capture.getPhotoCapabilities().catch(function () { return null; }) : Promise.resolve(null));
    }).then(function (photoCaps) {
      if (!state.track) return;
      state.photoCaps = photoCaps;
      return navigator.mediaDevices.enumerateDevices().then(function (all) {
        // The back lenses (once allowed, the browser gives their names).
        state.devices = all.filter(function (d) { return d.kind === 'videoinput' && !/front|avant|user/i.test(d.label); });
      });
    }).then(function () {
      if (!state.track) return;
      buildZooms();
      buildPanel();
      reapply();
      layout();
    }).catch(function (err) {
      stop();
      if (err && err.name === 'NotAllowedError') message("L'accès à l'appareil photo est refusé. Autorise-le (cadenas à côté de l'adresse, ou réglages du site), puis rouvre l'appareil. « Appareil du téléphone » marche sans.");
      else if (err && err.name === 'NotFoundError') message('Aucun appareil photo trouvé sur cet appareil.');
      else if (err && err.name === 'OverconstrainedError' && state.deviceId) { state.deviceId = null; return start(); }
      else message("L'appareil photo n'a pas pu démarrer (" + (err && err.name || 'erreur') + '). « Appareil du téléphone » reste possible.');
    });
  }

  function apply(settings) {
    if (!state.track || !state.track.applyConstraints) return Promise.resolve(false);
    return state.track.applyConstraints({ advanced: [settings] }).then(function () { return true; }).catch(function () { return false; });
  }

  // The manual settings again (some phones drop them after a photo or a
  // change of lens).
  function reapply() {
    var m = state.manual;
    var steps = [];
    if (m.zoom != null) steps.push({ zoom: m.zoom });
    if (m.focusMode) steps.push(m.focusMode === 'manual' && m.focusDistance != null ? { focusMode: 'manual', focusDistance: m.focusDistance } : { focusMode: m.focusMode });
    if (m.exposureMode === 'manual') {
      var e = { exposureMode: 'manual' };
      if (m.iso != null) e.iso = m.iso;
      if (m.exposureTime != null) e.exposureTime = m.exposureTime;
      steps.push(e);
    } else if (m.exposureCompensation != null) steps.push({ exposureMode: 'continuous', exposureCompensation: m.exposureCompensation });
    if (m.whiteBalanceMode === 'manual' && m.colorTemperature != null) steps.push({ whiteBalanceMode: 'manual', colorTemperature: m.colorTemperature });
    ['brightness', 'contrast', 'saturation', 'sharpness'].forEach(function (k) { if (m[k] != null) { var o = {}; o[k] = m[k]; steps.push(o); } });
    if (m.torch != null) steps.push({ torch: m.torch });
    return steps.reduce(function (p, s) { return p.then(function () { return apply(s); }); }, Promise.resolve());
  }

  // ---------- Pro settings: only what this phone can do ----------

  function range(cap) { return cap && typeof cap.min === 'number' && typeof cap.max === 'number' && cap.max > cap.min ? cap : null; }
  function has(list, value) { return Array.isArray(list) && list.indexOf(value) >= 0; }
  function current(name) {
    var s = state.track && state.track.getSettings ? state.track.getSettings() : {};
    return state.manual[name] != null ? state.manual[name] : s[name];
  }

  function seconds(units) {
    // exposureTime comes in units of 100 microseconds.
    var s = units / 10000;
    return s >= 1 ? (Math.round(s * 10) / 10).toString().replace('.', ',') + ' s' : '1/' + Math.round(1 / s) + ' s';
  }

  function sliderRow(label, cap, value, format, onInput, logScale) {
    var row = document.createElement('div');
    row.className = 'cam-set';
    row.innerHTML = '<div class="cam-set__head"><span></span><output></output></div><input type="range" min="0" max="1000" step="1">';
    row.querySelector('span').textContent = label;
    var input = row.querySelector('input');
    var out = row.querySelector('output');
    var lo = cap.min, hi = cap.max;
    var toValue = function (pos) {
      var t = pos / 1000;
      var v = logScale && lo > 0 ? Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo))) : lo + t * (hi - lo);
      if (cap.step) v = Math.round(v / cap.step) * cap.step;
      return Math.min(hi, Math.max(lo, v));
    };
    var toPos = function (v) {
      v = Math.min(hi, Math.max(lo, v == null ? lo : v));
      var t = logScale && lo > 0 ? (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (v - lo) / (hi - lo);
      return Math.round(t * 1000);
    };
    input.value = toPos(value);
    out.textContent = format(toValue(Number(input.value)));
    var pending = null;
    input.addEventListener('input', function () {
      var v = toValue(Number(input.value));
      out.textContent = format(v);
      // At most one change on its way to the sensor at a time.
      pending = v;
      if (input._busy) return;
      input._busy = true;
      (function send() {
        var next = pending;
        pending = null;
        Promise.resolve(onInput(next)).then(function () {
          if (pending != null) send(); else input._busy = false;
        });
      })();
    });
    row.setValue = function (v) { input.value = toPos(v); out.textContent = format(toValue(Number(input.value))); };
    return row;
  }

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
    var m = state.manual;
    var count = 0;

    if (state.devices.length > 1) {
      var lens = section('Objectif');
      lens.appendChild(choiceRow('Caméra arrière', state.devices.map(function (d, i) { return [d.deviceId, String(i + 1)]; }), state.deviceId, function (id) {
        state.deviceId = id;
        state.manual = {};
        start();
      }));
    }

    if (range(c.zoom)) {
      var z = section('Zoom');
      rows.zoom = sliderRow('Zoom', c.zoom, current('zoom'), function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ',') + '×'; }, function (v) {
        m.zoom = v; markZoom(v); return apply({ zoom: v });
      });
      z.appendChild(rows.zoom);
      count++;
    }

    var canManualFocus = has(c.focusMode, 'manual') && range(c.focusDistance);
    if (canManualFocus || has(c.focusMode, 'continuous')) {
      var f = section('Mise au point');
      var modes = [['continuous', 'Auto']];
      if (canManualFocus) modes.push(['manual', 'Manuelle']);
      f.appendChild(choiceRow('Mode', modes, m.focusMode || 'continuous', function (mode) {
        m.focusMode = mode;
        if (rows.focus) rows.focus.hidden = mode !== 'manual';
        if (mode === 'manual') { m.focusDistance = current('focusDistance'); return apply({ focusMode: 'manual', focusDistance: m.focusDistance }); }
        return apply({ focusMode: 'continuous' });
      }));
      if (canManualFocus) {
        rows.focus = sliderRow('Distance (près ← → loin)', c.focusDistance, current('focusDistance'), function (v) { return (Math.round(v * 100) / 100).toString().replace('.', ',') + ' m'; }, function (v) {
          m.focusMode = 'manual'; m.focusDistance = v; return apply({ focusMode: 'manual', focusDistance: v });
        });
        rows.focus.hidden = m.focusMode !== 'manual';
        f.appendChild(rows.focus);
      }
      var tip = document.createElement('p');
      tip.className = 'cam-panel__tip';
      tip.textContent = 'En auto, touche l’image pour faire la mise au point à cet endroit.';
      f.appendChild(tip);
      count++;
    }

    var canManualExposure = has(c.exposureMode, 'manual') && (range(c.iso) || range(c.exposureTime));
    if (range(c.exposureCompensation) || canManualExposure) {
      var e = section('Exposition');
      if (canManualExposure) {
        e.appendChild(choiceRow('Mode', [['continuous', 'Auto'], ['manual', 'Manuelle']], m.exposureMode || 'continuous', function (mode) {
          m.exposureMode = mode;
          if (rows.ev) rows.ev.hidden = mode === 'manual';
          if (rows.iso) rows.iso.hidden = mode !== 'manual';
          if (rows.speed) rows.speed.hidden = mode !== 'manual';
          if (mode === 'manual') {
            var o = { exposureMode: 'manual' };
            if (range(c.iso)) o.iso = m.iso = current('iso') || c.iso.min;
            if (range(c.exposureTime)) o.exposureTime = m.exposureTime = current('exposureTime') || c.exposureTime.min;
            return apply(o);
          }
          return apply({ exposureMode: 'continuous' });
        }));
      }
      if (range(c.exposureCompensation)) {
        rows.ev = sliderRow('Correction', c.exposureCompensation, current('exposureCompensation') || 0, function (v) {
          var r = Math.round(v * 10) / 10;
          return (r > 0 ? '+' : '') + r.toString().replace('.', ',') + ' EV';
        }, function (v) { m.exposureCompensation = v; return apply({ exposureMode: 'continuous', exposureCompensation: v }); });
        rows.ev.hidden = m.exposureMode === 'manual';
        e.appendChild(rows.ev);
      }
      if (canManualExposure && range(c.iso)) {
        rows.iso = sliderRow('ISO', c.iso, current('iso'), function (v) { return 'ISO ' + Math.round(v); }, function (v) {
          m.exposureMode = 'manual'; m.iso = Math.round(v); return apply({ exposureMode: 'manual', iso: m.iso });
        }, true);
        rows.iso.hidden = m.exposureMode !== 'manual';
        e.appendChild(rows.iso);
      }
      if (canManualExposure && range(c.exposureTime)) {
        rows.speed = sliderRow('Vitesse', c.exposureTime, current('exposureTime'), seconds, function (v) {
          m.exposureMode = 'manual'; m.exposureTime = v; return apply({ exposureMode: 'manual', exposureTime: v });
        }, true);
        rows.speed.hidden = m.exposureMode !== 'manual';
        e.appendChild(rows.speed);
      }
      count++;
    }

    if (range(c.colorTemperature) && has(c.whiteBalanceMode, 'manual')) {
      var wb = section('Balance des blancs');
      var t = c.colorTemperature;
      var presets = [['auto', 'Auto'], [5500, 'Soleil'], [6500, 'Nuageux'], [7500, 'Ombre'], [3200, 'Ampoule'], [4000, 'Néon']]
        .filter(function (p) { return p[0] === 'auto' || (p[0] >= t.min && p[0] <= t.max); });
      wb.appendChild(choiceRow('Lumière', presets, m.whiteBalanceMode === 'manual' ? m.colorTemperature : 'auto', function (v) {
        if (v === 'auto') { m.whiteBalanceMode = 'continuous'; m.colorTemperature = null; return apply({ whiteBalanceMode: 'continuous' }); }
        m.whiteBalanceMode = 'manual'; m.colorTemperature = v;
        if (rows.kelvin) rows.kelvin.setValue(v);
        return apply({ whiteBalanceMode: 'manual', colorTemperature: v });
      }));
      rows.kelvin = sliderRow('Température', t, current('colorTemperature') || 5500, function (v) { return Math.round(v / 50) * 50 + ' K'; }, function (v) {
        m.whiteBalanceMode = 'manual'; m.colorTemperature = Math.round(v); return apply({ whiteBalanceMode: 'manual', colorTemperature: m.colorTemperature });
      });
      wb.appendChild(rows.kelvin);
      count++;
    }

    var flashModes = state.photoCaps && state.photoCaps.fillLightMode;
    if (c.torch || (Array.isArray(flashModes) && flashModes.length > 1)) {
      var l = section('Lumière');
      if (c.torch) {
        l.appendChild(choiceRow('Lampe (lumière continue, idéale en macro)', [[false, 'Éteinte'], [true, 'Allumée']], Boolean(m.torch), function (on) {
          m.torch = on; return apply({ torch: on });
        }));
      }
      if (Array.isArray(flashModes) && flashModes.length > 1) {
        var names = { off: 'Non', auto: 'Auto', flash: 'Oui' };
        l.appendChild(choiceRow('Flash', flashModes.filter(function (x) { return names[x]; }).map(function (x) { return [x, names[x]]; }), prefs.flash, function (v) {
          prefs.flash = v; savePrefs();
        }));
      }
      count++;
    }

    var tuning = [['brightness', 'Luminosité'], ['contrast', 'Contraste'], ['saturation', 'Saturation'], ['sharpness', 'Netteté']].filter(function (k) { return range(c[k[0]]); });
    if (tuning.length) {
      var img = section('Rendu');
      tuning.forEach(function (k) {
        img.appendChild(sliderRow(k[1], c[k[0]], current(k[0]), function (v) { return String(Math.round(v)); }, function (v) {
          m[k[0]] = v; var o = {}; o[k[0]] = v; return apply(o);
        }));
      });
      count++;
    }

    var shot = section('Prise de vue');
    var maxW = state.photoCaps && state.photoCaps.imageWidth && state.photoCaps.imageWidth.max;
    var maxH = state.photoCaps && state.photoCaps.imageHeight && state.photoCaps.imageHeight.max;
    if (maxW && maxH) {
      var mpx = Math.round(maxW * maxH / 1e6);
      var sizes = [['max', 'Max · ' + mpx + ' Mpx']];
      if (mpx > 14) sizes.push(['12', '12 Mpx']);
      shot.appendChild(choiceRow('Définition', sizes, prefs.resolution, function (v) { prefs.resolution = v; savePrefs(); }));
    }
    shot.appendChild(choiceRow('Retardateur', [[0, 'Non'], [2, '2 s'], [5, '5 s'], [10, '10 s']], prefs.timer, function (v) { prefs.timer = v; savePrefs(); }));
    shot.appendChild(choiceRow('Rafale', [[1, '1'], [3, '3'], [5, '5'], [10, '10']], prefs.burst, function (v) { prefs.burst = v; savePrefs(); }));

    var aids = section('Aides');
    aids.appendChild(choiceRow('Grille', [[false, 'Non'], [true, 'Oui']], prefs.grid, function (v) { prefs.grid = v; savePrefs(); showAids(); }));
    aids.appendChild(choiceRow('Histogramme', [[false, 'Non'], [true, 'Oui']], prefs.histo, function (v) { prefs.histo = v; savePrefs(); showAids(); }));
    aids.appendChild(choiceRow('Niveau', [[false, 'Non'], [true, 'Oui']], prefs.level, function (v) { prefs.level = v; savePrefs(); showAids(); }));

    var foot = document.createElement('div');
    foot.className = 'cam-panel__foot';
    foot.innerHTML = '<button type="button" class="cam-chip">Tout remettre en auto</button>';
    foot.firstChild.addEventListener('click', function () {
      state.manual = {};
      var resets = [{ focusMode: 'continuous' }, { exposureMode: 'continuous', exposureCompensation: 0 }, { whiteBalanceMode: 'continuous' }, { torch: false }];
      if (range(c.zoom)) resets.push({ zoom: c.zoom.min <= 1 && c.zoom.max >= 1 ? 1 : c.zoom.min });
      resets.reduce(function (p, s) { return p.then(function () { return apply(s); }); }, Promise.resolve()).then(function () {
        buildPanel();
        buildZooms();
        say('Réglages remis en auto');
      });
    });
    panel.appendChild(foot);
    if (!count) {
      var none = document.createElement('p');
      none.className = 'cam-panel__tip';
      none.textContent = "Ce téléphone ne laisse pas l'app régler le capteur : la mise au point et l'exposition restent automatiques.";
      panel.insertBefore(none, panel.firstChild);
    }
    showAids();
  }

  $('[data-cam-pro]').addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    this.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    this.classList.toggle('is-on', !panel.hidden);
  });

  // ---------- Zoom: quick buttons and two fingers ----------

  function markZoom(v) {
    document.querySelectorAll('[data-cam-zooms] button').forEach(function (b) {
      b.classList.toggle('is-on', Math.abs(Number(b.dataset.zoom) - v) < 0.05);
    });
    if (rows.zoom) rows.zoom.setValue(v);
  }

  function buildZooms() {
    var box = $('[data-cam-zooms]');
    box.innerHTML = '';
    var z = range(state.caps && state.caps.zoom);
    if (!z) return;
    var stops = [z.min < 1 ? z.min : null, 1, 2, 3, 5, 10].filter(function (v, i, a) { return v != null && v >= z.min && v <= z.max && a.indexOf(v) === i; });
    stops.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.zoom = v;
      b.textContent = (Math.round(v * 10) / 10).toString().replace('.', ',') + '×';
      b.addEventListener('click', function () { state.manual.zoom = v; markZoom(v); apply({ zoom: v }); });
      box.appendChild(b);
    });
    markZoom(current('zoom') || 1);
  }

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
    var histo = $('[data-cam-histo]');
    histo.hidden = !prefs.histo;
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
    if (bins[0] / (sample.width * sample.height) > 0.04) c.fillRect(0, 0, 3, canvas.height);
    if (bins[63] / (sample.width * sample.height) > 0.04) c.fillRect(canvas.width - 3, 0, 3, canvas.height);
  }

  // Upright: a line that stays with the horizon. Flat (photo from above, into
  // a bac): a bubble to centre.
  window.addEventListener('devicemotion', function (event) {
    if (!prefs.level) return;
    var a = event.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    var box = $('[data-cam-level]');
    var line = box.querySelector('.cam__level-line');
    var bubble = box.querySelector('.cam__level-bubble');
    var text = box.querySelector('em');
    var flat = Math.abs(a.z) > 8.3;
    box.classList.toggle('is-flat', flat);
    if (flat) {
      var off = Math.hypot(a.x, a.y);
      bubble.style.transform = 'translate(' + Math.max(-40, Math.min(40, a.x * 9)) + 'px,' + Math.max(-40, Math.min(40, -a.y * 9)) + 'px)';
      box.classList.toggle('is-level', off < 0.35);
      text.textContent = (Math.round(Math.asin(Math.min(1, off / 9.81)) * 1800 / Math.PI) / 10).toString().replace('.', ',') + '°';
    } else {
      var angle = Math.atan2(a.x, a.y) * 180 / Math.PI;
      line.style.transform = 'rotate(' + angle + 'deg)';
      box.classList.toggle('is-level', Math.abs(angle) < 1);
      text.textContent = (Math.round(Math.abs(angle) * 10) / 10).toString().replace('.', ',') + '°';
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
      state.manual.zoom = v;
      markZoom(v);
      if (!pinch.busy) { pinch.busy = true; apply({ zoom: v }).then(function () { if (pinch) pinch.busy = false; }); }
    }
  });
  function release(e) {
    var t = touches[e.pointerId];
    delete touches[e.pointerId];
    if (pinch) { if (Object.keys(touches).length < 2) pinch = null; return; }
    if (!t || Date.now() - t.t > 400 || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return;
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
    var mode = has(state.caps.focusMode, 'single-shot') ? 'single-shot' : 'continuous';
    if (state.manual.focusMode === 'manual') mode = null;
    apply(mode ? { pointsOfInterest: [point], focusMode: mode } : { pointsOfInterest: [point] }).then(function () {
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
      if (pc && Array.isArray(pc.fillLightMode) && pc.fillLightMode.indexOf(prefs.flash) >= 0) settings.fillLightMode = prefs.flash;
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

  // The phone's own camera, with all its processing: its photo is ranged the
  // same way.
  $('[data-cam-native]').addEventListener('change', function () {
    if (!destination()) { say("Choisis d'abord où ranger les photos."); this.value = ''; return; }
    Array.prototype.forEach.call(this.files, function (file) { addShot(file, file.name, file.lastModified || Date.now()); });
    this.value = '';
  });

  // ---------- The queue: kept in the phone until the Pi has the photo ----------

  var dbPromise = null;
  function idb() {
    if (!window.indexedDB) return Promise.reject(new Error('pas de stockage'));
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        var r = indexedDB.open('isoterra-appareil', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('envois', { keyPath: 'id' }); };
        r.onsuccess = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
      });
    }
    return dbPromise;
  }
  function store(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('envois', mode);
        var req = fn(tx.objectStore('envois'));
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () { return null; });
  }

  var sessions = {};
  try { sessions = JSON.parse(localStorage.getItem(AT_KEY) || '{}'); } catch (e) {}

  function addShot(blob, name, time) {
    if (!blob) return Promise.resolve();
    var d = new Date(time);
    var item = {
      id: time + '-' + Math.round(Math.random() * 1e6),
      blob: blob,
      name: name || 'isoterra-' + stamp(d).replace(/[-: ]/g, '').slice(0, 8) + '-' + stamp(d).slice(11).replace(/:/g, '') + '.jpg',
      time: time,
      dest: destination(),
      session: SESSION
    };
    var shot = { item: item, status: 'attente', url: URL.createObjectURL(blob) };
    state.shots.push(shot);
    renderRoll();
    return store('readwrite', function (s) { return s.put(item); }).then(function () { pump(); });
  }

  var pumping = false;
  function pump() {
    if (pumping) return;
    var shot = state.shots.find(function (s) { return s.status === 'attente' || (s.status === 'erreur' && s.retryAt <= Date.now()); });
    if (!shot) return;
    pumping = true;
    shot.status = 'envoi';
    renderRoll();
    var item = shot.item;
    var file = new File([item.blob], item.name, { type: item.blob.type || 'image/jpeg', lastModified: item.time });
    window.isoPhotoPrep.preparePhoto(file).then(function (p) {
      var data = new FormData();
      data.append('dest', item.dest);
      data.append('at', sessions[item.session] || '');
      data.append('photo', p.file, p.file.name);
      if (p.view) data.append('photo_view', p.view, p.view.name);
      if (p.thumb) data.append('photo_thumb', p.thumb, p.thumb.name);
      data.append('photo_meta', JSON.stringify(p.meta));
      return fetch('/appareil/envoi', { method: 'POST', headers: { 'X-Requested-With': 'fetch' }, body: data });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (answer) {
        if (r.ok && answer.ok) {
          shot.status = 'ok';
          shot.photo = answer.photo;
          if (answer.at && !sessions[item.session]) {
            sessions[item.session] = answer.at;
            try { localStorage.setItem(AT_KEY, JSON.stringify(sessions)); } catch (e) {}
          }
          return store('readwrite', function (s) { return s.delete(item.id); });
        }
        if (r.status === 400 || r.status === 413) {
          shot.status = 'refus';
          shot.error = answer.message || (r.status === 413 ? 'Photo trop lourde.' : 'Refusée par le Pi.');
          say(shot.error);
          return;
        }
        throw new Error('Erreur ' + r.status);
      });
    }).catch(function () {
      shot.status = 'erreur';
      shot.retryAt = Date.now() + 15000;
      setTimeout(pump, 15500);
    }).then(function () {
      pumping = false;
      renderRoll();
      pump();
    });
  }

  // Photos left waiting by an earlier session (app closed, Pi out of reach).
  store('readonly', function (s) { return s.getAll(); }).then(function (items) {
    (items || []).forEach(function (item) {
      if (state.shots.some(function (s) { return s.item.id === item.id; })) return;
      state.shots.push({ item: item, status: 'attente', url: URL.createObjectURL(item.blob), earlier: true });
    });
    if (items && items.length) {
      say(items.length > 1 ? items.length + ' photos en attente reprennent leur envoi' : 'Une photo en attente reprend son envoi');
      renderRoll();
      pump();
    }
  });

  // ---------- The session's photos ----------

  var sheet = $('[data-cam-sheet]');

  function renderRoll() {
    var shots = state.shots;
    var roll = $('[data-cam-roll]');
    var lastShot = shots[shots.length - 1];
    var img = roll.querySelector('img');
    img.hidden = !lastShot;
    if (lastShot) img.src = lastShot.url;
    var count = roll.querySelector('.cam__roll-count');
    count.hidden = !shots.length;
    count.textContent = shots.length;
    var waiting = shots.filter(function (s) { return s.status !== 'ok'; });
    var badge = roll.querySelector('.cam__roll-state');
    badge.hidden = !waiting.length;
    badge.className = 'cam__roll-state' + (waiting.some(function (s) { return s.status === 'erreur' || s.status === 'refus'; }) ? ' is-error' : '');
    if (!sheet.hidden) renderSheet();
  }

  function renderSheet() {
    var shots = state.shots;
    var sent = shots.filter(function (s) { return s.status === 'ok'; }).length;
    var problems = shots.filter(function (s) { return s.status === 'erreur'; }).length;
    $('[data-cam-sheet-sub]').textContent = shots.length
      ? sent + ' sur ' + shots.length + ' envoyée' + (sent > 1 ? 's' : '') + (problems ? ' · le Pi ne répond pas, nouvel essai bientôt' : '')
      : 'Aucune photo pour l’instant';
    var grid = $('[data-cam-sheet-grid]');
    grid.innerHTML = '';
    shots.slice().reverse().forEach(function (shot) {
      var tile;
      if (shot.status === 'ok' && shot.photo) {
        // Sent: it opens in the viewer (stars, species, delete…).
        tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'photo-thumb cam-roll__tile';
        tile.dataset.photo = JSON.stringify(shot.photo);
        tile.dataset.photoId = shot.photo.id;
      } else {
        tile = document.createElement('div');
        tile.className = 'cam-roll__tile';
      }
      var img = document.createElement('img');
      img.src = shot.url;
      img.alt = '';
      tile.appendChild(img);
      var label = { attente: 'En attente', envoi: 'Envoi…', erreur: 'Nouvel essai bientôt', refus: shot.error || 'Refusée' }[shot.status];
      if (label) {
        var badge = document.createElement('span');
        badge.className = 'cam-roll__badge is-' + shot.status;
        badge.textContent = label;
        tile.appendChild(badge);
      }
      if (shot.status === 'refus' || shot.status === 'erreur' || shot.status === 'attente') {
        var drop = document.createElement('button');
        drop.type = 'button';
        drop.className = 'cam-roll__drop';
        drop.setAttribute('aria-label', 'Retirer cette photo');
        drop.textContent = '×';
        drop.addEventListener('click', function (event) {
          event.stopPropagation();
          if (shot.status === 'envoi') return;
          state.shots.splice(state.shots.indexOf(shot), 1);
          store('readwrite', function (s) { return s.delete(shot.item.id); });
          renderRoll();
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
    var before = state.shots.length;
    state.shots = state.shots.filter(function (s) {
      return !(s.status === 'ok' && s.photo && !document.querySelector('[data-photo-id="' + s.photo.id + '"]') && !sheet.hidden);
    });
    if (state.shots.length !== before) renderRoll();
  }).observe($('[data-cam-sheet-grid]'), { childList: true });

  function pending() { return state.shots.filter(function (s) { return s.status !== 'ok' && s.status !== 'refus'; }).length; }
  function leaving(event) {
    var n = pending();
    if (!n) return;
    if (!confirm(n + (n > 1 ? ' photos ne sont' : ' photo n’est') + " pas encore sur le Pi. Elles restent gardées dans le téléphone et partiront à la prochaine ouverture de l'appareil. Quitter quand même ?")) event.preventDefault();
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
