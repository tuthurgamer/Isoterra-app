const express = require('express');
const router = express.Router();
const db = require('../db/db');

function getSpeciesList() {
  return db.prepare('SELECT id, category, common_name, scientific_name FROM species ORDER BY category, common_name').all();
}

router.get('/new', (req, res) => {
  res.render('fiches/form', {
    title: 'Nouveau bac', active: 'fiches',
    bac: {}, speciesList: getSpeciesList(), isNew: true
  });
});

router.post('/', (req, res) => {
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO bacs (species_id, morph, lineage, population_estimate, substrate, acquisition_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(b.species_id, b.morph || null, b.lineage || null, b.population_estimate || null, b.substrate || null, b.acquisition_date || null, b.status || 'actif');
  res.redirect('/fiches/' + info.lastInsertRowid);
});

router.get('/:id', (req, res) => {
  const bac = db.prepare(`
    SELECT b.*, s.* , b.id AS id, s.id AS species_id
    FROM bacs b JOIN species s ON s.id = b.species_id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!bac) return res.status(404).render('404', { path: req.path });

  const logs = db.prepare('SELECT * FROM log_entries WHERE bac_id = ? ORDER BY created_at DESC').all(req.params.id);
  const lastPhoto = logs.find(l => l.photo_path);

  res.render('fiches/show', { title: bac.morph ? bac.common_name + ' ' + bac.morph : bac.common_name, active: 'bacs', bac, logs, lastPhoto });
});

router.get('/:id/edit', (req, res) => {
  const bac = db.prepare('SELECT * FROM bacs WHERE id = ?').get(req.params.id);
  if (!bac) return res.status(404).render('404', { path: req.path });
  res.render('fiches/form', { title: 'Modifier la fiche', active: 'bacs', bac, speciesList: getSpeciesList(), isNew: false });
});

router.post('/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE bacs SET species_id = ?, morph = ?, lineage = ?, population_estimate = ?, substrate = ?,
      acquisition_date = ?, status = ?, breeding_stage = ?, for_sale_quantity = ?, unit_price = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    b.species_id, b.morph || null, b.lineage || null, b.population_estimate || null, b.substrate || null,
    b.acquisition_date || null, b.status || 'actif', b.breeding_stage || null,
    b.for_sale_quantity || 0, b.unit_price || null, req.params.id
  );
  res.redirect('/fiches/' + req.params.id);
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM bacs WHERE id = ?').run(req.params.id);
  res.redirect('/');
});

router.post('/:id/log/quick', (req, res) => {
  const type = req.query.type || req.body.type;
  if (!type) return res.status(400).send('Type manquant');
  db.prepare('INSERT INTO log_entries (bac_id, type) VALUES (?, ?)').run(req.params.id, type);
  db.prepare("UPDATE bacs SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(req.params.id);
  res.redirect(req.get('Referer') || '/fiches/' + req.params.id);
});

module.exports = router;
