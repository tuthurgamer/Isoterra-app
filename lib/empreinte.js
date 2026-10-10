// The fingerprint of a photo or video file, to tell when the very same file
// is sent twice. Computed the same way on the phone (public/js/photo-prep.js):
// SHA-256 of the whole file up to 16 MB; beyond (videos), of its size and of
// its first and last 4 MB, which is enough to tell two videos apart.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../db/db');

const WHOLE_UP_TO = 16 * 1024 * 1024;
const EDGE = 4 * 1024 * 1024;
const publicDir = path.join(__dirname, '..', 'public');

function fingerprintFile(file) {
  const size = fs.statSync(file).size;
  const hash = crypto.createHash('sha256');
  if (size <= WHOLE_UP_TO) {
    hash.update(fs.readFileSync(file));
  } else {
    const fd = fs.openSync(file, 'r');
    try {
      const head = Buffer.alloc(EDGE);
      const tail = Buffer.alloc(EDGE);
      fs.readSync(fd, head, 0, EDGE, 0);
      fs.readSync(fd, tail, 0, EDGE, size - EDGE);
      hash.update('isoterra-taille:' + size);
      hash.update(head);
      hash.update(tail);
    } finally {
      fs.closeSync(fd);
    }
  }
  return hash.digest('hex');
}

// The fingerprint of a photo stored under public/ (by its public path), or
// null if its file is missing.
function fingerprintOf(publicPath) {
  try { return fingerprintFile(path.join(publicDir, publicPath)); } catch { return null; }
}

const isFingerprint = (value) => /^[0-9a-f]{64}$/.test(String(value || ''));

// Photos stored before fingerprints existed get theirs, a few at a time in
// the background so the app answers meanwhile.
function backfill() {
  const rows = db.prepare('SELECT id, path FROM photos WHERE file_hash IS NULL').all();
  const set = db.prepare('UPDATE photos SET file_hash = ? WHERE id = ?');
  (function next(i) {
    if (i >= rows.length) return;
    set.run(fingerprintOf(rows[i].path) || 'absent', rows[i].id);
    setTimeout(() => next(i + 1), 50);
  })(0);
}

module.exports = { fingerprintOf, isFingerprint, backfill };
