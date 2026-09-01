const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const bacs = db.prepare(`
    SELECT b.*, s.common_name, s.scientific_name, s.category, s.difficulty, s.vigilance
    FROM bacs b
    JOIN species s ON s.id = b.species_id
    ORDER BY b.id ASC
  `).all();

  const lastLogByBac = db.prepare(`
    SELECT bac_id, MAX(created_at) AS last_at
    FROM log_entries
    GROUP BY bac_id
  `).all();
  const lastLogMap = new Map(lastLogByBac.map(r => [r.bac_id, r.last_at]));

  for (const bac of bacs) {
    bac.last_log_at = lastLogMap.get(bac.id) || null;
  }

  const stats = {
    total: bacs.length,
    muesThisWeek: db.prepare(`
      SELECT COUNT(*) AS n FROM log_entries
      WHERE type = 'mue' AND created_at >= datetime('now', '-7 days', 'localtime')
    `).get().n,
    pontesEnCours: bacs.filter(b => b.breeding_stage).length,
    aSurveiller: bacs.filter(b => {
      if (!b.last_log_at) return true;
      const days = (Date.now() - new Date(b.last_log_at.replace(' ', 'T')).getTime()) / 86400000;
      return days > 10;
    }).length
  };

  res.render('bacs/index', { title: 'Registre des bacs', active: 'bacs', bacs, stats });
});

module.exports = router;
