// Photos and videos sent from the phone, one file at a time and in pieces
// of a few MB: each piece is appended to data/envois/<id>.part (the id is
// the phone's), so an upload cut by the Wi-Fi, a page change or the app
// being closed goes on from the last piece received. Once all of it is
// there, the file joins the gallery with the viewing copy and thumbnail
// made on the phone, and is filed where it was sent (a bac, a species of
// a bac, or a species alone). Any number of files can be sent this way.

const fs = require('node:fs');
const path = require('node:path');
const db = require('../db/db');
const { photoDir } = require('./uploads');
const { noteForBac } = require('./bac-log');
const { removeUnusedPhotos, photosOfSpecies, photoCard, validTaken } = require('./photos');

const TEMP_DIR = path.join(__dirname, '..', 'data', 'envois');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const PIECE_MAX = 16 * 1024 * 1024;
const KEEP_FREE = 1024 * 1024 * 1024;  // never fill the card to the brim
const NOTE_TYPES = ['observation', 'ponte', 'vente', 'nourrissage', 'nettoyage', 'pulverisation'];
const PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];
const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.mkv', '.3gp', '.m4v'];
const EXT_OF = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/x-matroska': '.mkv', 'video/3gpp': '.3gp'
};

const validId = (id) => /^[a-zA-Z0-9-]{8,64}$/.test(String(id || ''));
const partFile = (id) => path.join(TEMP_DIR, id + '.part');
const doneFile = (id) => path.join(TEMP_DIR, id + '.done');

function received(id) {
  try { return fs.statSync(partFile(id)).size; } catch { return 0; }
}

function freeSpace() {
  try {
    const s = fs.statfsSync(photoDir);
    return s.bavail * s.bsize;
  } catch {
    return Infinity;
  }
}

// Room on the Pi's card for a file of this size (checked on its first piece).
function roomFor(size) {
  return !(Number(size) > 0) || Number(size) < freeSpace() - KEEP_FREE;
}

// Where a photo or video goes: a whole bac ("bac:12"), one species of a
// mixed bac ("fiche:34"), or a species alone ("espece:5"). `at`, the time of
// the first file of a batch (given back to the phone), keeps a batch on one
// journal line.
function fileMedia(paths, { dest, type = 'observation', note = null, at = null } = {}) {
  const [kind, rawId] = String(dest || '').split(':');
  const id = Number(rawId);
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  const when = typeof at === 'string' && at.length === 19 && at <= now ? at : now;
  const what = NOTE_TYPES.includes(type) ? type : 'observation';
  const text = String(note || '').trim() || null;
  let done = false;
  if (kind === 'bac') {
    done = noteForBac(id, { type: what, note: text, photos: paths, at: when }) > 0;
  } else if (kind === 'fiche') {
    const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ?').get(id);
    done = Boolean(fiche) && noteForBac(fiche.bac_id, { type: what, note: text, photos: paths, ficheId: fiche.id, at: when }) > 0;
  } else if (kind === 'espece' && db.prepare('SELECT 1 FROM species WHERE id = ?').get(id)) {
    photosOfSpecies(paths, id, text);
    done = true;
  }
  return { done, at: when };
}

function extensionOf(name, mime) {
  const ext = path.extname(String(name || '')).toLowerCase();
  if (PHOTO_EXT.includes(ext) || VIDEO_EXT.includes(ext)) return ext;
  return EXT_OF[String(mime || '').toLowerCase()] || '';
}

// The last piece is in: the file joins the gallery and is filed. `copies`
// are multer's "thumb" and "view" files. Done twice (an answer lost on the
// way), the second time just gives the same photo back.
function finish(id, meta, copies = {}) {
  const dropCopies = () => Object.values(copies).flat().forEach((f) => fs.unlink(f.path, () => {}));
  if (fs.existsSync(doneFile(id))) {
    dropCopies();
    const before = JSON.parse(fs.readFileSync(doneFile(id), 'utf8'));
    const row = db.prepare('SELECT id FROM photos WHERE path = ?').get(before.path);
    return { ok: true, at: before.at, photo: row ? photoCard(row.id) : null };
  }
  if (!fs.existsSync(partFile(id))) {
    dropCopies();
    return { status: 404, message: 'Envoi introuvable sur le Pi : il repart du début.' };
  }
  const size = received(id);
  if (size !== Number(meta.size)) {
    dropCopies();
    return { status: 409, received: size };
  }
  const isVideo = meta.kind === 'video';
  const ext = extensionOf(meta.name, meta.mime);
  if (!ext || (isVideo ? !VIDEO_EXT.includes(ext) : !PHOTO_EXT.includes(ext))) {
    dropCopies();
    fs.unlink(partFile(id), () => {});
    return { status: 400, message: 'Ce type de fichier ne peut pas aller dans la galerie.' };
  }

  const base = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  fs.renameSync(partFile(id), path.join(photoDir, base + ext));
  const photoPath = '/uploads/photos/' + base + ext;
  const place = (field, suffix) => {
    const made = (copies[field] || [])[0];
    if (!made) return null;
    fs.renameSync(made.path, path.join(photoDir, base + suffix + '.jpg'));
    return '/uploads/photos/' + base + suffix + '.jpg';
  };
  const viewPath = isVideo ? null : place('view', '-v');
  const thumbPath = place('thumb', '-sm');
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  db.prepare(`
    INSERT INTO photos (path, view_path, thumb_path, width, height, taken_at, kind, duration, mime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    photoPath, viewPath || (isVideo ? null : photoPath), thumbPath || (isVideo ? null : photoPath),
    num(meta.w) && Math.round(meta.w), num(meta.h) && Math.round(meta.h), validTaken(meta.taken) || now,
    isVideo ? 'video' : 'photo', isVideo ? num(meta.duration) : null, String(meta.mime || '').slice(0, 60) || null
  );

  const filed = fileMedia([photoPath], { dest: meta.dest, type: meta.type, note: meta.note, at: meta.at });
  if (!filed.done) {
    removeUnusedPhotos([photoPath]);
    return { status: 400, message: "Cette destination n'existe plus : choisis-en une autre." };
  }
  fs.writeFileSync(doneFile(id), JSON.stringify({ path: photoPath, at: filed.at }));
  const row = db.prepare('SELECT id FROM photos WHERE path = ?').get(photoPath);
  return { ok: true, at: filed.at, photo: row ? photoCard(row.id) : null };
}

// Pieces of uploads never finished (3 days) and finished-upload markers
// (7 days) are cleared.
function cleanUp() {
  const now = Date.now();
  let names = [];
  try { names = fs.readdirSync(TEMP_DIR); } catch { return; }
  for (const name of names) {
    const file = path.join(TEMP_DIR, name);
    const age = (now - fs.statSync(file).mtimeMs) / 86400000;
    if ((name.endsWith('.part') && age > 3) || (name.endsWith('.done') && age > 7)) fs.unlink(file, () => {});
  }
}
cleanUp();
setInterval(cleanUp, 6 * 3600 * 1000).unref();

module.exports = { PIECE_MAX, validId, partFile, received, roomFor, fileMedia, finish };
