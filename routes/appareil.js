const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { uploadPhotos } = require('../lib/uploads');
const { noteForBac } = require('../lib/bac-log');
const { savePhotos, removeUnusedPhotos, photosOfSpecies, photoCard } = require('../lib/photos');
const { pic } = require('../views/helpers/icons');
const { numTag, CATEGORY_LABELS } = require('../views/helpers/format');

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

// Where the photos of a camera session go: a whole bac ("bac:12"), one
// species of a mixed bac ("fiche:34"), or a species alone, without a bac
// ("espece:5").
function destinations() {
  const fiches = db.prepare(`
    SELECT bs.id, bs.bac_id, b.name AS bac_name, s.id AS species_id, s.scientific_name, s.category, s.icon_path
    FROM bac_species bs JOIN bacs b ON b.id = bs.bac_id JOIN species s ON s.id = bs.species_id
    ORDER BY bs.bac_id, bs.id
  `).all();
  const bacs = [];
  for (const f of fiches) {
    let bac = bacs.find((b) => b.id === f.bac_id);
    if (!bac) bacs.push(bac = { id: f.bac_id, name: f.bac_name, fiches: [] });
    bac.fiches.push(f);
  }
  const list = [];
  for (const b of bacs) {
    const label = 'Bac ' + numTag(b.id) + (b.name ? ' « ' + b.name + ' »' : '');
    list.push({
      value: 'bac:' + b.id, group: 'Bacs', pics: b.fiches.map(pic).join('|'),
      label: label + ' — ' + b.fiches.map((f) => f.scientific_name).join(', '),
      back: '/bacs/' + b.id + '#photos'
    });
    if (b.fiches.length > 1) {
      for (const f of b.fiches) {
        list.push({ value: 'fiche:' + f.id, group: 'Bacs', pics: pic(f), label: label + ' — seulement ' + f.scientific_name, back: '/bacs/' + b.id + '#photos' });
      }
    }
  }
  const rank = (c) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  db.prepare('SELECT * FROM species').all()
    .sort((a, b) => rank(a.category) - rank(b.category) || a.scientific_name.localeCompare(b.scientific_name, 'fr'))
    .forEach((s) => list.push({
      value: 'espece:' + s.id, group: 'Une espèce, sans bac', pics: pic(s), label: s.scientific_name, back: '/especes/' + s.id + '#photos'
    }));
  return list;
}

// The camera: full screen, the photos of the session sent one by one as
// they are taken. ?bac=, ?fiche= or ?espece= chooses where they go.
router.get('/', (req, res) => {
  let chosen = null;
  if (req.query.fiche) chosen = 'fiche:' + Number(req.query.fiche);
  else if (req.query.bac) chosen = 'bac:' + Number(req.query.bac);
  else if (req.query.espece) {
    // A species in exactly one bac: into that bac's journal.
    const fiches = db.prepare('SELECT id, bac_id FROM bac_species WHERE species_id = ?').all(Number(req.query.espece));
    if (fiches.length === 1) {
      const others = db.prepare('SELECT COUNT(*) AS n FROM bac_species WHERE bac_id = ?').get(fiches[0].bac_id).n;
      chosen = others > 1 ? 'fiche:' + fiches[0].id : 'bac:' + fiches[0].bac_id;
    } else {
      chosen = 'espece:' + Number(req.query.espece);
    }
  }
  const list = destinations();
  res.render('photos/appareil', {
    title: 'Appareil photo',
    destinations: list,
    chosen: list.some((d) => d.value === chosen) ? chosen : null
  });
});

// One photo of a session (sent by the camera's queue): saved, then put
// where the session's photos go, at the session's time so they make one
// line in the journal. Answers with the photo as the viewer shows it.
router.post('/envoi', (req, res, next) => {
  // Sent by the camera's script only (a header another site can't add),
  // checked before any file is written.
  if (req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ ok: false });
  next();
}, uploadPhotos, (req, res) => {
  const b = req.body || {};
  const photos = savePhotos(req.files, b);
  if (!photos.length) return res.status(400).json({ ok: false, message: 'Aucune photo reçue.' });
  const [kind, rawId] = String(b.dest || '').split(':');
  const id = Number(rawId);
  // The session's time is the Pi's, given with the answer to its first
  // photo and sent back with the next ones (the phone's clock may differ).
  const now = db.prepare("SELECT datetime('now', 'localtime') AS t").get().t;
  const at = typeof b.at === 'string' && b.at.length === 19 && b.at <= now ? b.at : now;
  let done = false;
  if (kind === 'bac') {
    done = noteForBac(id, { type: 'observation', photos, at }) > 0;
  } else if (kind === 'fiche') {
    const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ?').get(id);
    done = Boolean(fiche) && noteForBac(fiche.bac_id, { type: 'observation', photos, ficheId: fiche.id, at }) > 0;
  } else if (kind === 'espece' && db.prepare('SELECT 1 FROM species WHERE id = ?').get(id)) {
    photosOfSpecies(photos, id);
    done = true;
  }
  if (!done) {
    removeUnusedPhotos(photos);
    return res.status(400).json({ ok: false, message: "Cette destination n'existe plus : choisis-en une autre." });
  }
  const row = db.prepare('SELECT id FROM photos WHERE path = ?').get(photos[0]);
  res.json({ ok: true, at, photo: row ? photoCard(row.id) : null });
});

module.exports = router;
