const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { computeCompatibility } = require('../views/helpers/compatibility');

function getSpeciesList() {
  return db.prepare('SELECT * FROM species ORDER BY category, common_name').all();
}

function getBacList() {
  return db.prepare(`
    SELECT b.id, b.substrate, GROUP_CONCAT(s.common_name, ', ') AS residents
    FROM bacs b
    LEFT JOIN bac_species bs ON bs.bac_id = b.id
    LEFT JOIN species s ON s.id = bs.species_id
    GROUP BY b.id
    ORDER BY b.id
  `).all();
}

router.get('/new', (req, res) => {
  const bacId = req.query.bac_id;
  const speciesList = getSpeciesList();
  let occupants = [];
  let compatRanked = null;

  if (bacId) {
    occupants = db.prepare(`
      SELECT s.* FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.bac_id = ?
    `).all(bacId);
    if (occupants.length > 0) {
      const occupantIds = new Set(occupants.map(o => o.id));
      compatRanked = speciesList
        .filter(sp => !occupantIds.has(sp.id))
        .map(sp => {
          let worst = null;
          for (const occ of occupants) {
            const c = computeCompatibility(sp, occ);
            if (worst === null || c.total < worst.total) worst = c;
          }
          return { species: sp, compat: worst };
        })
        .sort((a, b) => b.compat.total - a.compat.total);
    }
  }

  res.render('fiches/form', {
    title: 'Nouveau bac', active: 'fiches',
    bacSpecies: {}, speciesList, bacList: getBacList(),
    preselectBacId: bacId || '', isNew: true, occupants, compatRanked
  });
});

router.post('/', (req, res) => {
  const b = req.body;
  let bacId = b.bac_id;
  if (!bacId) {
    const bacInfo = db.prepare('INSERT INTO bacs (substrate) VALUES (?)').run(b.substrate || null);
    bacId = bacInfo.lastInsertRowid;
  }
  const info = db.prepare(`
    INSERT INTO bac_species (bac_id, species_id, morph, lineage, population_estimate, acquisition_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(bacId, b.species_id, b.morph || null, b.lineage || null, b.population_estimate || null, b.acquisition_date || null, b.status || 'actif');
  res.redirect('/fiches/' + info.lastInsertRowid);
});

router.get('/:id', (req, res) => {
  const bacSpecies = db.prepare(`
    SELECT bs.*, b.substrate, b.id AS bac_id, s.*, bs.id AS id, s.id AS species_id
    FROM bac_species bs
    JOIN bacs b ON b.id = bs.bac_id
    JOIN species s ON s.id = bs.species_id
    WHERE bs.id = ?
  `).get(req.params.id);
  if (!bacSpecies) return res.status(404).render('404', { path: req.path });

  const cohabitants = db.prepare(`
    SELECT s.*, bs.id AS id FROM bac_species bs JOIN species s ON s.id = bs.species_id
    WHERE bs.bac_id = ? AND bs.id != ?
  `).all(bacSpecies.bac_id, bacSpecies.id);
  for (const c of cohabitants) c.compat = computeCompatibility(bacSpecies, c);

  const logs = db.prepare('SELECT * FROM log_entries WHERE bac_species_id = ? ORDER BY created_at DESC').all(req.params.id);
  const lastPhoto = logs.find(l => l.photo_path);

  res.render('fiches/show', {
    title: bacSpecies.morph ? bacSpecies.common_name + ' ' + bacSpecies.morph : bacSpecies.common_name,
    active: 'bacs', bac: bacSpecies, cohabitants, logs, lastPhoto
  });
});

router.get('/:id/edit', (req, res) => {
  const bacSpecies = db.prepare(`
    SELECT bs.*, b.substrate FROM bac_species bs JOIN bacs b ON b.id = bs.bac_id WHERE bs.id = ?
  `).get(req.params.id);
  if (!bacSpecies) return res.status(404).render('404', { path: req.path });
  res.render('fiches/form', { title: 'Modifier la fiche', active: 'bacs', bacSpecies, speciesList: getSpeciesList(), bacList: [], preselectBacId: '', isNew: false, occupants: [], compatRanked: null });
});

router.post('/:id', (req, res) => {
  const b = req.body;
  const current = db.prepare('SELECT bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).render('404', { path: req.path });

  db.prepare(`
    UPDATE bac_species SET species_id = ?, morph = ?, lineage = ?, population_estimate = ?,
      acquisition_date = ?, status = ?, breeding_stage = ?, for_sale_quantity = ?, unit_price = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    b.species_id, b.morph || null, b.lineage || null, b.population_estimate || null,
    b.acquisition_date || null, b.status || 'actif', b.breeding_stage || null,
    b.for_sale_quantity || 0, b.unit_price || null, req.params.id
  );
  db.prepare("UPDATE bacs SET substrate = ?, updated_at = datetime('now', 'localtime') WHERE id = ?")
    .run(b.substrate || null, current.bac_id);

  res.redirect('/fiches/' + req.params.id);
});

router.post('/:id/delete', (req, res) => {
  const current = db.prepare('SELECT bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!current) return res.redirect('/');
  db.prepare('DELETE FROM bac_species WHERE id = ?').run(req.params.id);
  const remaining = db.prepare('SELECT COUNT(*) AS n FROM bac_species WHERE bac_id = ?').get(current.bac_id).n;
  if (remaining === 0) db.prepare('DELETE FROM bacs WHERE id = ?').run(current.bac_id);
  res.redirect('/');
});

router.post('/:id/log/quick', (req, res) => {
  const type = req.query.type || req.body.type;
  if (!type) return res.status(400).send('Type manquant');
  db.prepare('INSERT INTO log_entries (bac_species_id, type) VALUES (?, ?)').run(req.params.id, type);
  db.prepare("UPDATE bac_species SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(req.params.id);
  res.redirect(req.get('Referer') || '/fiches/' + req.params.id);
});

module.exports = router;
