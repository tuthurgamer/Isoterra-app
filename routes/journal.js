const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { uploadPhoto } = require('../lib/uploads');
const { groupEntries } = require('../lib/journal');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, bs.bac_id, bs.morph, s.scientific_name, s.category
    FROM log_entries l
    JOIN bac_species bs ON bs.id = l.bac_species_id
    JOIN species s ON s.id = bs.species_id
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 200
  `).all();
  res.render('journal/index', { title: 'Journal', active: 'journal', logs: groupEntries(rows) });
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

router.post('/', uploadPhoto.single('photo'), (req, res) => {
  const { fiche_id, type, note } = req.body || {};
  if (!fiche_id || !type) return res.status(400).send('Fiche et type requis');
  const photoPath = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO log_entries (bac_species_id, type, note, photo_path) VALUES (?, ?, ?, ?)')
    .run(fiche_id, type, note || null, photoPath);
  db.prepare("UPDATE bac_species SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(fiche_id);
  res.redirect('/fiches/' + fiche_id);
});

module.exports = router;
