// Annonce de vente (page /vente/annonce).
//
// Les photos de l'espèce, touchées dans l'ordre voulu, font l'image de
// l'annonce : une mosaïque carrée ou en portrait avec un bandeau (nom, prix,
// logo), ou les photos séparées dont la première porte le bandeau. Le texte
// se fait à partir de la fiche de l'espèce et des champs de la page ; modifié
// à la main, il ne change plus tout seul. « Partager » envoie l'image et le
// texte à l'appli choisie (Facebook, Leboncoin...) et copie aussi le texte.
(function () {
  var data = window.isoAnnonce;
  var form = document.querySelector('[data-annonce]');
  if (!data || !form) return;
  var ad = data.ad;

  var COLORS = { ink: '#2c1b0f', muted: '#645142', paper: '#f0e7d6', paperAlt: '#e5d9c5', rust: '#97400d' };
  var DIFFICULTY = ['', 'très facile', 'facile', 'intermédiaire', 'difficile', 'pour éleveurs confirmés'];
  var TAGS = {
    cloporte: '#isopodes #cloportes #isopods', iule: '#myriapodes #iules #millipedes', blatte: '#blattes #roaches',
    cetoine: '#cetoines #coleopteres', coleoptere: '#coleopteres #beetles', escargot: '#escargots #achatines',
    crabe: '#crabes', reduve: '#reduves', mante: '#mantes #mantis', phasme: '#phasmes #stickinsects',
    orthoptere: '#orthopteres', araignee: '#araignees #spiders', scorpion: '#scorpions', arachnide: '#arachnides',
    scolopendre: '#scolopendres'
  };

  var canvas = form.querySelector('[data-annonce-canvas]');
  var text = form.querySelector('[data-annonce-text]');
  var tiles = Array.prototype.slice.call(form.querySelectorAll('[data-pic]'));
  var chosen = [];
  var edited = false;

  function say(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { toast.hidden = true; }, 3500);
  }

  function field(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return String(el.value || '').trim();
  }
  function number(name) {
    var n = parseFloat(String(field(name)).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function euros(n) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  }
  function slug() {
    return 'annonce-' + ad.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // ---------- What it costs ----------

  function price() {
    var p = number('prix');
    if (!p) return null;
    if (field('unite') === 'lot') return { main: euros(p), sub: 'le lot de ' + Math.max(2, Math.round(number('lot')) || 10) };
    return { main: euros(p), sub: "l'unité" };
  }

  // ---------- The text ----------

  function sentences(t, n) {
    var parts = String(t || '').match(/[^.!?]+[.!?]+(\s|$)/g);
    return (parts ? parts.slice(0, n).join('') : String(t || '')).trim();
  }

  function buildText() {
    var social = form.querySelector('[name="style"]:checked').value === 'reseaux';
    var e = function (emoji) { return social ? emoji + ' ' : ''; };
    var lines = [e('🌿') + ad.name + (ad.common ? ' (' + ad.common + ')' : ''), ''];
    var p = price();
    var offer = [];
    if (p) offer.push(p.main + ' ' + p.sub);
    var qty = Math.round(number('quantite'));
    if (qty) offer.push(qty + ' disponible' + (qty > 1 ? 's' : ''));
    if (field('stade')) offer.push(field('stade'));
    if (offer.length) lines.push(e('💶') + offer.join(' · '));
    lines.push(e('🏡') + 'Animaux de mon élevage' + (ad.lineage ? ' (lignée : ' + ad.lineage + ')' : '') + '.');
    lines.push('');
    if (ad.presentation) lines.push(sentences(ad.presentation, 2));
    var climate = [];
    if (ad.temp) climate.push(ad.temp[0] + '–' + ad.temp[1] + ' °C');
    if (ad.humidity) climate.push(ad.humidity[0] + '–' + ad.humidity[1] + ' % d\'humidité');
    if (climate.length) lines.push(e('🌡️') + 'Conditions : ' + climate.join(', ') + '.');
    if (DIFFICULTY[ad.difficulty]) lines.push(e('📈') + 'Difficulté : ' + DIFFICULTY[ad.difficulty] + '.');
    // "Détritivore : feuilles, bois pourri" or just "Végétal + calcium".
    if (ad.diet) {
      lines.push(e('🍂') + (ad.diet.indexOf(' : ') !== -1
        ? ad.diet.replace(' : ', ' — ')
        : 'Alimentation : ' + ad.diet.charAt(0).toLowerCase() + ad.diet.slice(1)).replace(/\.?$/, '.'));
    }
    lines.push(e('📄') + 'Fiche d\'élevage fournie avec les animaux.');
    lines.push('');
    var hand = [];
    if (field('envoi')) hand.push('Envoi possible en colis adapté');
    if (field('main')) hand.push('Remise en main propre' + (field('lieu') ? ' à ' + field('lieu') : ''));
    if (hand.length) lines.push(e('📦') + hand.join(' · ') + '.');
    var sign = [field('breeder'), field('contact')].filter(Boolean).join(' · ');
    if (sign) lines.push(e('✉️') + sign);
    if (social) {
      var genus = ad.name.split(' ')[0].toLowerCase();
      lines.push('', [TAGS[ad.category] || '', '#' + genus, '#terrariophilie', '#elevage'].filter(Boolean).join(' '));
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function writeText() {
    if (!edited) text.value = buildText();
  }
  text.addEventListener('input', function () {
    edited = true;
    form.querySelector('[data-annonce-regen]').hidden = false;
    form.querySelector('[data-annonce-edited]').hidden = false;
  });
  form.querySelector('[data-annonce-regen]').addEventListener('click', function () {
    edited = false;
    this.hidden = true;
    form.querySelector('[data-annonce-edited]').hidden = true;
    writeText();
  });

  // ---------- The photos ----------

  function format() { return form.querySelector('[name="format"]:checked').value; }
  function most() { return format() === 'seules' ? 10 : 4; }

  function numbering() {
    tiles.forEach(function (t) {
      var k = chosen.indexOf(t);
      var badge = t.querySelector('.annonce-pic__n');
      badge.hidden = k === -1;
      badge.textContent = k + 1;
      t.classList.toggle('is-on', k !== -1);
      t.classList.toggle('is-out', k >= most());
      t.setAttribute('aria-pressed', k === -1 ? 'false' : 'true');
    });
    var picked = form.querySelector('[data-annonce-picked]');
    if (picked) {
      var n = chosen.length;
      picked.textContent = !n ? 'Aucune photo choisie : touche celles à mettre dans l\'annonce.'
        : (n > 1 ? n + ' photos choisies' : '1 photo choisie')
          + (n > most() ? ' : seules les ' + most() + ' premières vont dans ce format.' : '.');
    }
    var hint = form.querySelector('[data-annonce-format-hint]');
    hint.textContent = format() === 'seules'
      ? 'Chaque photo part telle quelle ; la première, celle de la vignette, porte le bandeau (aperçu ci-dessous).'
      : 'Jusqu\'à 4 photos en mosaïque, la première en grand.';
  }

  tiles.forEach(function (t) {
    t._pic = JSON.parse(t.dataset.pic);
    t.addEventListener('click', function () {
      var k = chosen.indexOf(t);
      if (k === -1) chosen.push(t);
      else chosen.splice(k, 1);
      numbering();
      draw();
    });
  });
  // The best rated ones to start with (up to 3 of 4 stars or more), else the first.
  chosen = tiles.filter(function (t) { return t._pic.rating >= 4; }).slice(0, 3);
  if (!chosen.length && tiles.length) chosen = [tiles[0]];

  // ---------- The image ----------

  var images = {};
  function load(src) {
    if (!images[src]) {
      images[src] = new Promise(function (resolve, reject) {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = src;
      });
    }
    return images[src];
  }

  function layout(n, a) {
    var g = 6;
    if (n <= 1) return [a];
    if (n === 2) {
      var half = (a.w - g) / 2;
      return [{ x: a.x, y: a.y, w: half, h: a.h }, { x: a.x + half + g, y: a.y, w: half, h: a.h }];
    }
    if (n === 3) {
      var big = Math.round((a.w - g) * 0.62);
      var side = a.w - g - big;
      var hh = (a.h - g) / 2;
      return [{ x: a.x, y: a.y, w: big, h: a.h }, { x: a.x + big + g, y: a.y, w: side, h: hh }, { x: a.x + big + g, y: a.y + hh + g, w: side, h: hh }];
    }
    var w2 = (a.w - g) / 2;
    var h2 = (a.h - g) / 2;
    return [
      { x: a.x, y: a.y, w: w2, h: h2 }, { x: a.x + w2 + g, y: a.y, w: w2, h: h2 },
      { x: a.x, y: a.y + h2 + g, w: w2, h: h2 }, { x: a.x + w2 + g, y: a.y + h2 + g, w: w2, h: h2 }
    ];
  }

  // A photo filling its place, cut at the edges rather than squeezed.
  function cover(ctx, img, r) {
    var s = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
    var sw = r.w / s;
    var sh = r.h / s;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, r.x, r.y, r.w, r.h);
  }

  // A line of text shrunk to fit, then cut with "…" if it still doesn't.
  function fit(ctx, value, font, size, smallest, maxWidth, x, y) {
    var s = size;
    ctx.font = font.replace('{s}', s);
    while (ctx.measureText(value).width > maxWidth && s > smallest) {
      s -= 2;
      ctx.font = font.replace('{s}', s);
    }
    var shown = value;
    while (shown.length > 1 && ctx.measureText(shown).width > maxWidth) shown = shown.slice(0, -2) + '…';
    ctx.fillText(shown, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function banner(ctx, W, H, band, logo) {
    var top = H - band;
    var pad = 44;
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, top, W, band);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, top, W, 5);
    ctx.fillRect(0, top + 11, W, 1.5);

    // The price, as a stamp on the right.
    var p = price();
    var stampW = 0;
    if (p) {
      ctx.font = '600 62px Vollkorn, Georgia, serif';
      var mainW = ctx.measureText(p.main).width;
      ctx.font = '25px "Special Elite", monospace';
      stampW = Math.max(mainW, ctx.measureText(p.sub).width) + 60;
      ctx.save();
      ctx.translate(W - pad - stampW / 2, top + band / 2 + 6);
      ctx.rotate(-0.05);
      ctx.strokeStyle = COLORS.rust;
      ctx.lineWidth = 5;
      roundRect(ctx, -stampW / 2, -64, stampW, 128, 10);
      ctx.stroke();
      ctx.lineWidth = 2;
      roundRect(ctx, -stampW / 2 + 9, -55, stampW - 18, 110, 6);
      ctx.stroke();
      ctx.fillStyle = COLORS.rust;
      ctx.textAlign = 'center';
      ctx.font = '600 62px Vollkorn, Georgia, serif';
      ctx.fillText(p.main, 0, 8);
      ctx.font = '25px "Special Elite", monospace';
      ctx.fillText(p.sub, 0, 42);
      ctx.restore();
    }

    var room = W - pad * 2 - (stampW ? stampW + 28 : 0);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    fit(ctx, ad.name, 'italic 600 {s}px Vollkorn, Georgia, serif', 58, 34, room, pad, top + 80);
    if (ad.common) {
      ctx.fillStyle = COLORS.muted;
      fit(ctx, ad.common, '{s}px Vollkorn, Georgia, serif', 34, 24, room, pad, top + 126);
    }
    // The brand, at the foot.
    var x = pad;
    if (logo) {
      var lh = 50;
      var lw = lh * logo.naturalWidth / logo.naturalHeight;
      ctx.drawImage(logo, x, top + band - lh - 22, lw, lh);
      x += lw + 12;
    }
    ctx.fillStyle = COLORS.ink;
    ctx.font = '30px "IM Fell English SC", Georgia, serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText('ISOTERRA', x, top + band - 34);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  var fonts = document.fonts && document.fonts.load
    ? Promise.all([
      document.fonts.load('italic 600 58px Vollkorn'), document.fonts.load('600 62px Vollkorn'), document.fonts.load('34px Vollkorn'),
      document.fonts.load('30px "IM Fell English SC"'), document.fonts.load('25px "Special Elite"')
    ]).catch(function () {})
    : Promise.resolve();

  var drawn = 0;
  var made = null;
  function draw() {
    var turn = ++drawn;
    made = null;
    var mode = format();
    var W = 1080;
    var H = mode === 'portrait' ? 1350 : 1080;
    var withBand = field('bandeau');
    var band = withBand ? (mode === 'portrait' ? 240 : 222) : 0;
    var pics = chosen.slice(0, mode === 'seules' ? 1 : 4).map(function (t) { return t._pic; });
    var ready = Promise.all(pics.map(function (p) { return load(p.view).catch(function () { return null; }); }))
      .then(function (imgs) { return imgs.filter(Boolean); });
    var logo = withBand ? load('/icons/logo.png').catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([ready, logo, fonts]).then(function (got) {
      if (turn !== drawn) return;
      var imgs = got[0];
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = COLORS.paperAlt;
      ctx.fillRect(0, 0, W, H);
      var area = { x: 0, y: 0, w: W, h: H - band };
      if (imgs.length) {
        layout(imgs.length, area).forEach(function (r, k) { cover(ctx, imgs[k], r); });
      } else {
        ctx.fillStyle = COLORS.muted;
        ctx.textAlign = 'center';
        ctx.font = 'italic 40px Vollkorn, Georgia, serif';
        ctx.fillText('Choisis au moins une photo', W / 2, area.h / 2);
      }
      if (withBand) banner(ctx, W, H, band, got[1]);
      prepare(turn);
    }).catch(function () {
      say('Une photo n\'a pas pu être chargée.');
    });
  }

  // The files to share, made ahead: sharing must start right on the tap.
  function prepare(turn) {
    var mode = format();
    var name = slug();
    made = new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', 0.9); }).then(function (blob) {
      var files = [new File([blob], name + '.jpg', { type: 'image/jpeg' })];
      if (mode !== 'seules') return files;
      // A photo that can't be fetched is left out rather than sent broken.
      return Promise.all(chosen.slice(1, 10).map(function (t, k) {
        return fetch(t._pic.view).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
          return b && /^image\//.test(b.type) ? new File([b], name + '-' + (k + 2) + '.jpg', { type: b.type }) : null;
        }, function () { return null; });
      })).then(function (more) { return files.concat(more.filter(Boolean)); });
    });
    made.turn = turn;
    made.catch(function () {});
  }

  // ---------- Share, copy, save ----------

  function copyText() {
    if (!navigator.clipboard) return Promise.reject(new Error('presse-papiers'));
    return navigator.clipboard.writeText(text.value);
  }

  form.querySelector('[data-annonce-copy]').addEventListener('click', function () {
    copyText().then(function () { say('Texte copié.'); }, function () {
      text.select();
      say('Sélectionne le texte et copie-le.');
    });
  });

  function download(files) {
    files.forEach(function (file, k) {
      setTimeout(function () {
        var url = URL.createObjectURL(file);
        var a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, k * 400);
    });
  }

  form.querySelector('[data-annonce-save]').addEventListener('click', function () {
    if (!made) return say('L\'image se prépare encore…');
    made.then(function (files) {
      download(files);
      say(files.length > 1 ? files.length + ' images enregistrées.' : 'Image enregistrée.');
    });
  });

  form.querySelector('[data-annonce-share]').addEventListener('click', function () {
    if (!chosen.length) return say('Choisis au moins une photo.');
    if (!made) return say('L\'image se prépare encore…');
    var copied = copyText().then(function () { return true; }, function () { return false; });
    made.then(function (files) {
      var payload = { files: files, text: text.value, title: ad.name };
      if (!navigator.canShare || !navigator.canShare({ files: files })) {
        download(files);
        copied.then(function (ok) { say('Partage impossible ici : image enregistrée' + (ok ? ', texte copié.' : '.')); });
        return;
      }
      return navigator.share(payload).then(function () {
        copied.then(function (ok) { if (ok) say('Texte copié aussi : colle-le si l\'appli ne l\'a pas repris.'); });
      }, function (err) {
        if (err && err.name === 'AbortError') return;
        download(files);
        say('Le partage n\'a pas abouti : image enregistrée.');
      });
    });
  });

  // ---------- Kept for the next ad ----------

  var saveTimer;
  function savePrefs() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      fetch('/vente/annonce/reglages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          lieu: field('lieu'), envoi: field('envoi'), main: field('main'),
          style: form.querySelector('[name="style"]:checked').value,
          breeder: field('breeder'), contact: field('contact')
        })
      }).catch(function () {});
    }, 800);
  }

  // ---------- Changes ----------

  form.querySelector('[data-annonce-fiche]').addEventListener('change', function () {
    location.href = '/vente/annonce?fiche=' + encodeURIComponent(this.value);
  });
  function changed(el) {
    var name = el.name;
    if (!name || el === text) return;
    if (name === 'unite') form.querySelector('[data-annonce-lot]').hidden = field('unite') !== 'lot';
    if (['lieu', 'envoi', 'main', 'style', 'breeder', 'contact'].indexOf(name) !== -1) savePrefs();
    writeText();
    if (['prix', 'unite', 'lot', 'format', 'bandeau'].indexOf(name) !== -1) {
      numbering();
      draw();
    }
  }
  // Typing changes things as it goes; boxes, choices and menus once chosen.
  var picked = function (el) { return el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT'; };
  form.addEventListener('input', function (event) { if (!picked(event.target)) changed(event.target); });
  form.addEventListener('change', function (event) { if (picked(event.target)) changed(event.target); });

  numbering();
  writeText();
  draw();
})();
