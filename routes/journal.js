const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { uploadPhotos } = require('../lib/uploads');
const { groupEntries, PHOTO_COLUMNS } = require('../lib/journal');
const { noteForBac } = require('../lib/bac-log');
const { savePhotos, removeUnusedPhotos, card } = require('../lib/photos');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, bs.bac_id, bs.morph, bs.species_id, s.scientific_name, s.category, s.icon_path, s.showcase_photo, ${PHOTO_COLUMNS}
    FROM log_entries l
    JOIN bac_species bs ON bs.id = l.bac_species_id
    JOIN species s ON s.id = bs.species_id
    LEFT JOIN photos p ON p.path = l.photo_path
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 400
  `).all();
  res.render('journal/index', { title: 'Journal', active: 'journal', logs: groupEntries(rows).slice(0, 200), photoCard: card });
});

router.get('/new', (req, res) => {
  const ficheId = req.query.fiche_id;
  if (!ficheId) {
    // ?bac_id= narrows the choice to one bac.
    const bacId = Number(req.query.bac_id) || null;
    const fiches = db.prepare(`
      SELECT bs.id, bs.bac_id, bs.morph, s.scientific_name
      FROM bac_species bs JOIN species s ON s.id = bs.species_id
      ${bacId ? 'WHERE bs.bac_id = ?' : ''}
      ORDER BY s.scientific_name
    `).all(...(bacId ? [bacId] : []));
    if (bacId && fiches.length === 1) return res.redirect('/journal/new?fiche_id=' + fiches[0].id);
    return res.render('journal/pick', { title: 'Nouvelle entrée', active: 'journal', fiches, bacId: bacId && fiches.length ? bacId : null });
  }
  const bacSpecies = db.prepare(`
    SELECT bs.*, s.scientific_name FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.id = ?
  `).get(ficheId);
  if (!bacSpecies) return res.status(404).render('404', { path: req.path });
  res.render('journal/new', { title: 'Nouvelle entrée', active: 'journal', bacSpecies });
});

router.post('/', uploadPhotos, (req, res) => {
  const b = req.body || {};
  const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ?').get(b.fiche_id);
  const photos = savePhotos(req.files, b);
  if (!fiche || !b.type) {
    removeUnusedPhotos(photos);
    return res.status(400).send('Fiche et type requis');
  }
  noteForBac(fiche.bac_id, { type: b.type, note: String(b.note || '').trim() || null, photos, ficheId: fiche.id });
  res.redirect('/fiches/' + fiche.id);
});

module.exports = router;
