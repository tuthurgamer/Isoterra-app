// The photo gallery. A photo is a row of `photos` (file, thumbnail, size,
// when it was shot, its 0-5 stars) and appears in the journal of the
// species it was sent for, through log_entries.photo_path, which gives its
// bac. The species seen on it (photo_species) start as those, then are
// chosen photo by photo.

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

// Photos just received: multer's "photo" files, the originals, kept
// untouched, and, in the body, one "photo_meta" per photo (size, shooting
// date, whether its viewing copy and its thumbnail came along). The copies
// ("photo_view", "photo_thumb", made on the phone) come in the same order,
// one for each photo whose meta says so; each is renamed after its photo.
// Sent without the page's script, a photo stands in for both. Returns the
// photos' public paths.
function savePhotos(files = {}, body = {}) {
  const photos = files.photo || [];
  const copies = { view: files.photo_view || [], thumb: files.photo_thumb || [] };
  const next = { view: 0, thumb: 0 };
  const metas = [].concat(body.photo_meta ?? []);
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  const insert = db.prepare('INSERT INTO photos (path, view_path, thumb_path, width, height, taken_at) VALUES (?, ?, ?, ?, ?, ?)');
  const paths = photos.map((file, i) => {
    let meta = {};
    try { meta = JSON.parse(metas[i] || '{}'); } catch { /* sent without details */ }
    const photoPath = '/uploads/photos/' + file.filename;
    const copy = (kind, suffix) => {
      const made = meta[kind] ? copies[kind][next[kind]++] : null;
      if (!made) return photoPath;
      const name = file.filename.replace(/\.[^.]+$/, '') + suffix + (path.extname(made.filename) || '.jpg');
      fs.renameSync(made.path, path.join(photoDir, name));
      return '/uploads/photos/' + name;
    };
    const viewPath = copy('view', '-v');
    const thumbPath = copy('thumb', '-sm');
    insert.run(photoPath, viewPath, thumbPath, toInt(meta.w), toInt(meta.h), validTaken(meta.taken) || now);
    return photoPath;
  });
  for (const kind of ['view', 'thumb']) {
    for (const extra of copies[kind].slice(next[kind])) fs.unlink(extra.path, () => {});
  }
  return paths;
}

// Photos no journal entry uses any more lose their row, their files and
// their place on a customer sheet.
function removeUnusedPhotos(paths) {
  const used = db.prepare('SELECT 1 FROM log_entries WHERE photo_path = ? LIMIT 1');
  const getRow = db.prepare('SELECT thumb_path, view_path FROM photos WHERE path = ?');
  for (const p of new Set(paths)) {
    if (!p || used.get(p)) continue;
    const row = getRow.get(p);
    db.prepare('DELETE FROM photos WHERE path = ?').run(p);
    db.prepare('UPDATE species SET showcase_photo = NULL WHERE showcase_photo = ?').run(p);
    for (const f of new Set([p, row && row.thumb_path, row && row.view_path].filter(Boolean))) {
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

// 1 to 5 stars (0: not rated). The best photos come first everywhere.
function setRating(id, rating) {
  const stars = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return db.prepare('UPDATE photos SET rating = ? WHERE id = ?').run(stars, id).changes ? stars : null;
}

// A photo's species start as those of the entries it was sent with.
function tagFromEntries(paths) {
  if (!paths.length) return;
  db.prepare(`
    INSERT OR IGNORE INTO photo_species (photo_id, species_id)
    SELECT DISTINCT p.id, bs.species_id FROM photos p
    JOIN log_entries l ON l.photo_path = p.path JOIN bac_species bs ON bs.id = l.bac_species_id
    WHERE p.path IN (${paths.map(() => '?').join(',')})
  `).run(...paths);
}

// Photos added from a species' page without choosing a bac: no journal
// entry, just the species and, if any, their note.
function photosOfSpecies(paths, speciesId, caption = null) {
  const setCaption = db.prepare('UPDATE photos SET caption = ? WHERE path = ?');
  const tag = db.prepare('INSERT OR IGNORE INTO photo_species (photo_id, species_id) SELECT id, ? FROM photos WHERE path = ?');
  for (const p of paths) {
    setCaption.run(caption, p);
    tag.run(speciesId, p);
  }
}

// Adds or removes a species seen on a photo. A species taken off a photo
// also loses it from its customer sheet.
function setSpecies(photoId, speciesId, on) {
  const photo = db.prepare('SELECT path FROM photos WHERE id = ?').get(photoId);
  if (!photo || !db.prepare('SELECT 1 FROM species WHERE id = ?').get(speciesId)) return false;
  if (on) {
    db.prepare('INSERT OR IGNORE INTO photo_species (photo_id, species_id) VALUES (?, ?)').run(photoId, speciesId);
  } else {
    db.prepare('DELETE FROM photo_species WHERE photo_id = ? AND species_id = ?').run(photoId, speciesId);
    db.prepare('UPDATE species SET showcase_photo = NULL WHERE id = ? AND showcase_photo = ?').run(speciesId, photo.path);
  }
  return true;
}

// The photo shown on a species' customer sheet; choosing it again removes it.
function toggleShowcase(id, speciesId) {
  const photo = db.prepare("SELECT path FROM photos WHERE id = ? AND kind = 'photo'").get(id);
  const sp = db.prepare('SELECT showcase_photo FROM species WHERE id = ?').get(speciesId);
  if (!photo || !sp) return null;
  const next = sp.showcase_photo === photo.path ? null : photo.path;
  db.prepare('UPDATE species SET showcase_photo = ? WHERE id = ?').run(next, speciesId);
  return Boolean(next);
}

// Puts on each photo row (with its id) the species seen on it.
function attachSpecies(rows) {
  const ids = [...new Set(rows.map((r) => r.id).filter(Boolean))];
  const tags = ids.length ? db.prepare(`
    SELECT ps.photo_id, s.id, s.scientific_name, s.category, s.icon_path, s.showcase_photo
    FROM photo_species ps JOIN species s ON s.id = ps.species_id
    WHERE ps.photo_id IN (${ids.map(() => '?').join(',')})
    ORDER BY s.scientific_name
  `).all(...ids) : [];
  for (const r of rows) r.species = tags.filter((t) => t.photo_id === r.id);
  return rows;
}

function dateLabel(value) {
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// What the viewer needs to show one photo (stored in the thumbnail's
// data-photo attribute). The row needs its species (attachSpecies).
function card(row) {
  return {
    id: row.id,
    full: row.path,
    view: row.view_path || row.path,
    thumb: row.thumb_path || row.path,
    w: row.width,
    h: row.height,
    taken: dateLabel(row.taken_at || row.created_at),
    bac: row.bac_id,
    bacLabel: row.bac_id ? 'Bac ' + numTag(row.bac_id) : '',
    species: (row.species || []).map((s) => ({ id: s.id, name: s.scientific_name, pic: pic(s), showcase: s.showcase_photo === row.path })),
    note: row.note || row.caption || '',
    type: row.type && row.type !== 'observation' ? LOG_TYPE_LABELS[row.type] || row.type : '',
    rating: row.rating || 0,
    video: row.kind === 'video',
    length: row.kind === 'video' && row.duration ? lengthLabel(row.duration) : ''
  };
}

// A video's length: "0:42", "12:05".
function lengthLabel(seconds) {
  const s = Math.round(seconds);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// Gallery photos: all of them, or those taken in a bac, showing a species,
// or rated at least `minRating` stars; the latest shot first, or the best
// rated first (`best`). Each comes with its species.
function listPhotos({ bacId = null, speciesId = null, photoId = null, minRating = 0, best = false, limit = 500 } = {}) {
  const where = [];
  const params = [];
  if (bacId) { where.push('bs.bac_id = ?'); params.push(bacId); }
  if (speciesId) { where.push('p.id IN (SELECT photo_id FROM photo_species WHERE species_id = ?)'); params.push(speciesId); }
  if (photoId) { where.push('p.id = ?'); params.push(photoId); }
  if (minRating) { where.push('p.rating >= ?'); params.push(minRating); }
  const rows = db.prepare(`
    SELECT p.*, MIN(bs.bac_id) AS bac_id, MAX(l.type) AS type, MAX(l.note) AS note
    FROM photos p
    LEFT JOIN log_entries l ON l.photo_path = p.path
    LEFT JOIN bac_species bs ON bs.id = l.bac_species_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY p.id
    ORDER BY ${best ? 'p.rating DESC, ' : ''}COALESCE(p.taken_at, p.created_at) DESC, p.id DESC
    LIMIT ?
  `).all(...params, limit);
  return attachSpecies(rows);
}

function photoCard(id) {
  const row = listPhotos({ photoId: id })[0];
  return row ? card(row) : null;
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

// Photos grouped by their stars, best first (rows sorted with `best`).
function byRating(rows) {
  const groups = [];
  for (const r of rows) {
    const label = r.rating ? `${'★'.repeat(r.rating)} ${r.rating} étoile${r.rating > 1 ? 's' : ''}` : 'Pas encore notées';
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.photos.push(r);
    else groups.push({ label, photos: [r] });
  }
  return groups;
}

module.exports = {
  savePhotos, removeUnusedPhotos, deletePhoto, setRating, tagFromEntries, photosOfSpecies, setSpecies, toggleShowcase,
  attachSpecies, listPhotos, photoCard, byMonth, byRating, card, validTaken
};
