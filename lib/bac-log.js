const db = require('../db/db');
const { tagFromEntries } = require('./photos');

// The time an entry is stamped with: now, or `at` (a past "YYYY-MM-DD
// HH:MM:SS" of the last week) for something done earlier and sent only now:
// the photos of one camera session, sent one by one, or an action noted on
// the phone without network.
function stamp(at) {
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(at || '') || at > now) return now;
  return at > db.prepare("SELECT datetime('now', 'localtime', '-7 days') AS t").get().t ? at : now;
}

// A fiche's last check never goes back in time: an action sent late may have
// been done before one already noted.
const LATEST = "MAX(COALESCE(last_checked_at, ''), ?)";

// Something done to a bac (fed, misted, cleaned, checked) goes into the
// journal of every species in it, all stamped with one shared time so the
// journal page shows it as a single line (`at`: see stamp). Returns how many
// fiches the bac holds (0: no such bac, nothing written).
function logForBac(bacId, types, at = null) {
  const fiches = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.id);
  if (!fiches.length || !types.length) return fiches.length;

  const now = stamp(at);
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO log_entries (bac_species_id, type, created_at) VALUES (?, ?, ?)');
    for (const type of types) {
      for (const ficheId of fiches) insert.run(ficheId, type, now);
    }
    db.prepare(`UPDATE bac_species SET last_checked_at = ${LATEST} WHERE bac_id = ?`).run(now, bacId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return fiches.length;
}

// A journal entry written from a bac's page: for one species of the bac
// (ficheId), or for all of them, with one shared time and note so it stays a
// single line in the journal. With several photos, each gets its entry,
// still on that one line. `at` puts it at that time instead of now (see
// stamp): the photos of one camera session, sent one by one, share it and
// stay on one line. Returns how many fiches got it (0: no such bac, or a
// fiche from another bac).
function noteForBac(bacId, { type, note = null, photos = [], ficheId = null, at = null }) {
  const inBac = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.id);
  const fiches = ficheId ? inBac.filter((id) => id === ficheId) : inBac;
  if (!fiches.length) return 0;

  const now = stamp(at);
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO log_entries (bac_species_id, type, note, photo_path, created_at) VALUES (?, ?, ?, ?, ?)');
    const checked = db.prepare(`UPDATE bac_species SET last_checked_at = ${LATEST} WHERE id = ?`);
    for (const id of fiches) {
      for (const photoPath of photos.length ? photos : [null]) insert.run(id, type, note, photoPath, now);
      checked.run(now, id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  tagFromEntries(photos);
  return fiches.length;
}

module.exports = { stamp, LATEST, logForBac, noteForBac };
