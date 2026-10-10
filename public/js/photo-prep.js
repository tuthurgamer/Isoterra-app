// Préparation des photos avant l'envoi, partagée par les formulaires (pied de
// page) et l'appareil photo : l'original intact (seule la position GPS est
// effacée), une copie légère pour l'affichage, une vignette, et la date de
// prise de vue. Voir lib/photos.js pour ce que le Pi en fait.
(function () {
  function draw(bitmap, max) {
    var scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function toFile(canvas, type, quality, name) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); }).then(function (blob) {
      return blob ? new File([blob], name, { type: type }) : null;
    });
  }

  // An icon to send: PNG (its transparent background is trimmed on the Pi);
  // too large, it is reduced to 2048 px; not a PNG, it is converted.
  function shrinkIcon(file) {
    if (!/^image\//.test(file.type) || !window.createImageBitmap) return Promise.resolve(file);
    var isPng = file.type === 'image/png';
    return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bitmap) {
      var max = isPng ? 2048 : 1024;
      if (isPng && Math.max(bitmap.width, bitmap.height) <= max) return file;
      return toFile(draw(bitmap, max), 'image/png', 1, file.name.replace(/\.[^.]*$/, '') + '.png').then(function (f) { return f || file; });
    }).catch(function () { return file; });
  }

  // When a photo was shot: the date the camera wrote in it (EXIF), else the
  // file's date. "2026-10-08 14:32:05", in the phone's time.
  function shotDate(file) {
    var fallback = function () {
      var d = new Date(file.lastModified || Date.now());
      var p = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    };
    if (file.type !== 'image/jpeg' || !file.slice) return Promise.resolve(fallback());
    return file.slice(0, 256 * 1024).arrayBuffer().then(function (buffer) {
      var v = new DataView(buffer);
      var at = 2;
      if (v.getUint16(0) !== 0xFFD8) return fallback();
      while (at + 10 < v.byteLength) {
        var marker = v.getUint16(at);
        if (marker === 0xFFE1 && v.getUint32(at + 4) === 0x45786966) {
          var tiff = at + 10;
          var little = v.getUint16(tiff) === 0x4949;
          var u16 = function (o) { return v.getUint16(o, little); };
          var u32 = function (o) { return v.getUint32(o, little); };
          var entries = function (start) {
            var found = {};
            for (var i = 0, n = u16(start); i < n; i++) found[u16(start + 2 + i * 12)] = start + 2 + i * 12;
            return found;
          };
          var text = function (entry) {
            var count = u32(entry + 4), from = count > 4 ? tiff + u32(entry + 8) : entry + 8, s = '';
            for (var i = 0; i < count - 1; i++) s += String.fromCharCode(v.getUint8(from + i));
            return s;
          };
          var main = entries(tiff + u32(tiff + 4));
          var value = null;
          if (main[0x8769]) {
            var exif = entries(tiff + u32(main[0x8769] + 8));
            if (exif[0x9003]) value = text(exif[0x9003]);
          }
          if (!value && main[0x0132]) value = text(main[0x0132]);
          var m = value && value.match(/^(\d{4}):(\d\d):(\d\d) (\d\d:\d\d:\d\d)/);
          return m ? m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] : fallback();
        }
        if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        at += 2 + v.getUint16(at + 2);
      }
      return fallback();
    }).catch(fallback);
  }

  // The photo's GPS position (where it was taken: often home) is wiped
  // from it, without touching the image: a photo shared with a customer
  // must not give the address away. Any trouble reading it: kept as it is.
  function withoutGps(file) {
    if (file.type !== 'image/jpeg' || !file.slice) return Promise.resolve(file);
    return file.slice(0, 256 * 1024).arrayBuffer().then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var v = new DataView(buffer);
      var at = 2;
      if (v.getUint16(0) !== 0xFFD8) return file;
      while (at + 10 < v.byteLength) {
        var marker = v.getUint16(at);
        if (marker === 0xFFE1 && v.getUint32(at + 4) === 0x45786966) {
          var tiff = at + 10;
          var little = v.getUint16(tiff) === 0x4949;
          var u16 = function (o) { return v.getUint16(o, little); };
          var u32 = function (o) { return v.getUint32(o, little); };
          var main = tiff + u32(tiff + 4);
          var sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
          for (var i = 0, n = u16(main); i < n; i++) {
            var entry = main + 2 + i * 12;
            if (u16(entry) !== 0x8825) continue;
            var gps = tiff + u32(entry + 8);
            for (var k = 0, m = u16(gps); k < m; k++) {
              var g = gps + 2 + k * 12;
              var length = (sizes[u16(g + 2)] || 1) * u32(g + 4);
              if (length > 4) bytes.fill(0, tiff + u32(g + 8), tiff + u32(g + 8) + length);
              bytes.fill(0, g, g + 12);
            }
            v.setUint16(gps, 0, little);
            return new File([bytes, file.slice(buffer.byteLength)], file.name, { type: file.type, lastModified: file.lastModified });
          }
          return file;
        }
        if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        at += 2 + v.getUint16(at + 2);
      }
      return file;
    }).catch(function () { return file; });
  }

  // A photo to send: the original, untouched (full size and quality; only
  // its GPS position wiped), a copy of 2048 px at most for quick viewing
  // (only when the original is larger or heavy), a 640 px thumbnail for
  // the gallery, and its details. A photo the phone can't read goes alone.
  function preparePhoto(file) {
    return Promise.all([shotDate(file), withoutGps(file)]).then(function (got) {
      var taken = got[0], original = got[1];
      if (!window.createImageBitmap) return { file: original, meta: { taken: taken } };
      // A very large photo (50 Mpx) may not fit in memory decoded whole:
      // then it is decoded straight at 2048 px.
      var whole = true;
      return createImageBitmap(original, { imageOrientation: 'from-image' }).catch(function () {
        whole = false;
        return createImageBitmap(original, { imageOrientation: 'from-image', resizeWidth: 2048, resizeQuality: 'high' });
      }).then(function (bitmap) {
        var needsView = !whole || Math.max(bitmap.width, bitmap.height) > 2048 || original.size > 1500000 || original.type !== 'image/jpeg';
        var base = file.name.replace(/\.[^.]*$/, '');
        return Promise.all([
          needsView ? toFile(draw(bitmap, 2048), 'image/jpeg', 0.9, base + '-v.jpg') : Promise.resolve(null),
          toFile(draw(bitmap, 640), 'image/jpeg', 0.8, base + '-sm.jpg')
        ]).then(function (made) {
          var meta = { taken: taken, view: Boolean(made[0]), thumb: Boolean(made[1]) };
          if (whole) { meta.w = bitmap.width; meta.h = bitmap.height; }
          if (bitmap.close) bitmap.close();
          return { file: original, view: made[0], thumb: made[1], meta: meta };
        });
      }).catch(function () { return { file: original, meta: { taken: taken } }; });
    });
  }

  // A video to send: the file itself, untouched, its thumbnail (a picture
  // from its first second) and its details. A video the phone can't read
  // goes without a thumbnail.
  function prepareVideo(file) {
    var d = new Date(file.lastModified || Date.now());
    var p = function (n) { return String(n).padStart(2, '0'); };
    var taken = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var video = document.createElement('video');
      var finished = false;
      var done = function (result) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(url);
        resolve(result);
      };
      var timer = setTimeout(function () { done({ file: file, meta: { taken: taken } }); }, 20000);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        video.currentTime = Math.min(1, (video.duration || 0) / 3);
      };
      video.onseeked = function () {
        var w = video.videoWidth, h = video.videoHeight;
        var meta = { taken: taken, duration: video.duration || null, w: w || null, h: h || null };
        if (!w || !h) return done({ file: file, meta: meta });
        var scale = Math.min(1, 640 / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        toFile(canvas, 'image/jpeg', 0.8, file.name.replace(/\.[^.]*$/, '') + '-sm.jpg').then(function (thumb) {
          meta.thumb = Boolean(thumb);
          done({ file: file, thumb: thumb, meta: meta });
        });
      };
      video.onerror = function () { done({ file: file, meta: { taken: taken } }); };
      video.src = url;
    });
  }

  window.isoPhotoPrep = { preparePhoto: preparePhoto, prepareVideo: prepareVideo, shrinkIcon: shrinkIcon };
})();
