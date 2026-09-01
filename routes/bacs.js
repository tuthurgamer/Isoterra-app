const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT bs.*, bs.id AS id, b.id AS bac_id, b.substrate,
           s.common_name, s.scientific_name, s.category, s.difficulty, s.vigilance
    FROM bac_species bs
    JOIN bacs b ON b.id = bs.bac_id
    JOIN species s ON s.id = bs.species_id
    ORDER BY bs.id ASC
  `).all();

  const lastLogByFiche = db.prepare(`
    SELECT bac_species_id, MAX(created_at) AS last_at
    FROM log_entries
    GROUP BY bac_species_id
  `).all();
  const lastLogMap = new Map(lastLogByFiche.map(r => [r.bac_species_id, r.last_at]));

  const byBac = new Map();
  for (const row of rows) {
    if (!byBac.has(row.bac_id)) byBac.set(row.bac_id, []);
    byBac.get(row.bac_id).push(row);
  }

  for (const bac of rows) {
    bac.last_log_at = lastLogMap.get(bac.id) || null;
    bac.cohabitants = byBac.get(bac.bac_id).filter(r => r.id !== bac.id).map(r => r.common_name);
  }

  const stats = {
    total: rows.length,
    muesThisWeek: db.prepare(`
      SELECT COUNT(*) AS n FROM log_entries
      WHERE type = 'mue' AND created_at >= datetime('now', '-7 days', 'localtime')
    `).get().n,
    pontesEnCours: rows.filter(b => b.breeding_stage).length,
    aSurveiller: rows.filter(b => {
      if (!b.last_log_at) return true;
      const days = (Date.now() - new Date(b.last_log_at.replace(' ', 'T')).getTime()) / 86400000;
      return days > 10;
    }).length
  };

  res.render('bacs/index', { title: 'Registre des bacs', active: 'bacs', bacs: rows, stats });
});

module.exports = router;
