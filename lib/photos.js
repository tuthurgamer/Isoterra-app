// The photo gallery. A photo is a row of `photos` (file, thumbnail, size,
// when it was shot, favourite) and appears in the journal of the species it
// was taken for, through log_entries.photo_path: its bac and its species are
// those of these entries.

const fs = require('node:fs');
const path = require('node:path');
const db = require('../db/db');
const { photoDir } = require('./uploads');
const { pic } = require('../views/helpers/icons');
const { numTag, LOG_TYPE_LABELS } = require('../views/helpers/format');

const publicDir = path.join(__dirname, '..', 'public');
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const toInt = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);

// A shooting date sent by the phone, kept only if it is plausible.
function validTaken(value) {
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value || '')) return null;
  const d = new Date(value.replace(' ', 'T'));
  return d.getFullYear() >= 2000 && d.getTime() < Date.now() + 86400000 ? value : null;
}

// Photos just received: multer's "photo" files and, in the body, one
// "photo_meta" per photo (size, shooting date, whether its thumbnail came
// along). The thumbnails ("photo_thumb", made on the phone) come in the same
// order, one for each photo whose meta says so; each is renamed after its
// photo. Sent without the page's script, a photo is its own thumbnail.
// Returns the photos' public paths.
function savePhotos(files = {}, body = {}) {
  const photos = files.photo || [];
  const thumbs = files.photo_thumb || [];
  const metas = [].concat(body.photo_meta ?? []);
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  const insert = db.prepare('INSERT INTO photos (path, thumb_path, width, height, taken_at) VALUES (?, ?, ?, ?, ?)');
  let nextThumb = 0;
  const paths = photos.map((file, i) => {
    let meta = {};
    try { meta = JSON.parse(metas[i] || '{}'); } catch { /* sent without details */ }
    const photoPath = '/uploads/photos/' + file.filename;
    let thumbPath = photoPath;
    const thumb = meta.thumb ? thumbs[nextThumb++] : null;
    if (thumb) {
      const name = file.filename.replace(/\.[^.]+$/, '') + '-sm' + (path.extname(thumb.filename) || '.jpg');
      fs.renameSync(thumb.path, path.join(photoDir, name));
      thumbPath = '/uploads/photos/' + name;
    }
    insert.run(photoPath, thumbPath, toInt(meta.w), toInt(meta.h), validTaken(meta.taken) || now);
    return photoPath;
  });
  for (const extra of thumbs.slice(nextThumb)) fs.unlink(extra.path, () => {});
  return paths;
}

// Photos no journal entry uses any more lose their row, their files and
// their place on a customer sheet.
function removeUnusedPhotos(paths) {
  const used = db.prepare('SELECT 1 FROM log_entries WHERE photo_path = ? LIMIT 1');
  const getRow = db.prepare('SELECT thumb_path FROM photos WHERE path = ?');
  for (const p of new Set(paths)) {
    if (!p || used.get(p)) continue;
    const row = getRow.get(p);
    db.prepare('DELETE FROM photos WHERE path = ?').run(p);
    db.prepare('UPDATE species SET showcase_photo = NULL WHERE showcase_photo = ?').run(p);
    for (const f of new Set([p, row && row.thumb_path].filter(Boolean))) {
      fs.unlink(path.join(publicDir, f), () => {});
    }
  }
}

// Deleting a photo from the gallery: an entry that was only this photo goes
// with it, as does one doubling a sibling entry (the same note sent with
// several photos); any other entry stays, without its photo.
function deletePhoto(id) {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!photo) return false;
  db.exec('BEGIN');
  try {
    db.prepare(`
      DELETE FROM log_entries WHERE photo_path = :p AND (
        (type = 'observation' AND COALESCE(note, '') = '')
        OR EXISTS (SELECT 1 FROM log_entries o WHERE o.id != log_entries.id
          AND o.bac_species_id = log_entries.bac_species_id AND o.created_at = log_entries.created_at
          AND o.type = log_entries.type AND COALESCE(o.note, '') = COALESCE(log_entries.note, ''))
      )
    `).run({ p: photo.path });
    db.prepare('UPDATE log_entries SET photo_path = NULL WHERE photo_path = ?').run(photo.path);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  removeUnusedPhotos([photo.path]);
  return true;
}

function toggleFavorite(id) {
  db.prepare('UPDATE photos SET favorite = 1 - favorite WHERE id = ?').run(id);
  const row = db.prepare('SELECT favorite FROM photos WHERE id = ?').get(id);
  return row ? Boolean(row.favorite) : null;
}

// The photo shown on a species' customer sheet; choosing it again removes it.
function toggleShowcase(id, speciesId) {
  const photo = db.prepare('SELECT path FROM photos WHERE id = ?').get(id);
  const sp = db.prepare('SELECT showcase_photo FROM species WHERE id = ?').get(speciesId);
  if (!photo || !sp) return null;
  const next = sp.showcase_photo === photo.path ? null : photo.path;
  db.prepare('UPDATE species SET showcase_photo = ? WHERE id = ?').run(next, speciesId);
  return Boolean(next);
}

function dateLabel(value) {
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// What the viewer needs to show one photo (stored in the thumbnail's
// data-photo attribute).
function card(row) {
  return {
    id: row.id,
    full: row.path,
    thumb: row.thumb_path || row.path,
    w: row.width,
    h: row.height,
    taken: dateLabel(row.taken_at || row.created_at),
    bac: row.bac_id,
    bacLabel: row.bac_id ? 'Bac ' + numTag(row.bac_id) : '',
    species: (row.species || []).map((s) => ({
      id: s.id, name: s.scientific_name + (s.morph ? " '" + s.morph + "'" : ''), pic: pic(s), showcase: s.showcase_photo === row.path
    })),
    note: row.note || '',
    type: row.type && row.type !== 'observation' ? LOG_TYPE_LABELS[row.type] || row.type : '',
    favorite: Boolean(row.favorite)
  };
}

// Gallery photos, latest shot first: all of them, or those of a bac, of a
// species, or the favourites. Each comes with its species.
function listPhotos({ bacId = null, speciesId = null, favorite = false, limit = 500 } = {}) {
  const where = [];
  const params = [];
  if (bacId) { where.push('bs.bac_id = ?'); params.push(bacId); }
  if (speciesId) { where.push('bs.species_id = ?'); params.push(speciesId); }
  if (favorite) where.push('p.favorite = 1');
  const rows = db.prepare(`
    SELECT p.*, MIN(bs.bac_id) AS bac_id, MAX(l.type) AS type, MAX(l.note) AS note
    FROM photos p
    JOIN log_entries l ON l.photo_path = p.path
    JOIN bac_species bs ON bs.id = l.bac_species_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY p.id
    ORDER BY COALESCE(p.taken_at, p.created_at) DESC, p.id DESC
    LIMIT ?
  `).all(...params, limit);
  if (!rows.length) return rows;

  const species = db.prepare(`
    SELECT DISTINCT l.photo_path, s.id, s.scientific_name, s.category, s.icon_path, s.showcase_photo, bs.morph
    FROM log_entries l JOIN bac_species bs ON bs.id = l.bac_species_id JOIN species s ON s.id = bs.species_id
    WHERE l.photo_path IN (${rows.map(() => '?').join(',')})
    ORDER BY bs.id
  `).all(...rows.map((r) => r.path));
  for (const r of rows) r.species = species.filter((s) => s.photo_path === r.path);
  return rows;
}

// Photos grouped by the month they were shot: [{ label: 'Octobre 2026', photos }].
function byMonth(rows) {
  const groups = [];
  for (const r of rows) {
    const d = new Date(String(r.taken_at || r.created_at).replace(' ', 'T'));
    const label = Number.isNaN(d.getTime()) ? 'Sans date' : `${MONTHS[d.getMonth()][0].toUpperCase()}${MONTHS[d.getMonth()].slice(1)} ${d.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.photos.push(r);
    else groups.push({ label, photos: [r] });
  }
  return groups;
}

module.exports = { savePhotos, removeUnusedPhotos, deletePhoto, toggleFavorite, toggleShowcase, listPhotos, byMonth, card };
