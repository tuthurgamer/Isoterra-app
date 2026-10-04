const db = require('../db/db');

// Something done to a bac (fed, misted, cleaned, checked) goes into the
// journal of every species in it, all stamped with one shared time so the
// journal page shows it as a single line. Returns how many fiches the bac
// holds (0: no such bac, nothing written).
function logForBac(bacId, types) {
  const fiches = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.id);
  if (!fiches.length || !types.length) return fiches.length;

  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO log_entries (bac_species_id, type, created_at) VALUES (?, ?, ?)');
    for (const type of types) {
      for (const ficheId of fiches) insert.run(ficheId, type, now);
    }
    db.prepare('UPDATE bac_species SET last_checked_at = ? WHERE bac_id = ?').run(now, bacId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return fiches.length;
}

// A journal entry written from a bac's page: for one species of the bac
// (ficheId), or for all of them with one shared time, note and photo so it
// stays a single line in the journal. Returns how many fiches got it (0: no
// such bac, or a fiche from another bac).
function noteForBac(bacId, { type, note = null, photoPath = null, ficheId = null }) {
  const inBac = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.id);
  const fiches = ficheId ? inBac.filter((id) => id === ficheId) : inBac;
  if (!fiches.length) return 0;

  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO log_entries (bac_species_id, type, note, photo_path, created_at) VALUES (?, ?, ?, ?, ?)');
    const checked = db.prepare('UPDATE bac_species SET last_checked_at = ? WHERE id = ?');
    for (const id of fiches) {
      insert.run(id, type, note, photoPath, now);
      checked.run(now, id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return fiches.length;
}

module.exports = { logForBac, noteForBac };
