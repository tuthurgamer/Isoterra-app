const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { pic } = require('../views/helpers/icons');
const { numTag } = require('../views/helpers/format');
const { allSpecies } = require('../lib/species-list');

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
  const species = allSpecies();
  for (const s of [...species.filter((x) => x.kept), ...species.filter((x) => !x.kept)]) {
    list.push({
      value: 'espece:' + s.id, group: s.kept ? 'Une espèce de mon élevage, sans bac' : 'Une autre espèce du guide',
      pics: pic(s), label: s.scientific_name, back: '/especes/' + s.id + '#photos'
    });
  }
  return list;
}

// The camera: full screen, the photos of the session sent one by one as
// they are taken (public/js/envois.js, routes/envois.js). ?bac=, ?fiche= or ?espece= chooses where they go.
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

module.exports = router;
