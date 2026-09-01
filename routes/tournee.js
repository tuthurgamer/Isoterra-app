const express = require('express');
const router = express.Router();
const db = require('../db/db');

function buildQueue() {
  const rows = db.prepare(`
    SELECT bs.id FROM bac_species bs
    ORDER BY bs.last_checked_at IS NOT NULL, bs.last_checked_at ASC, bs.id ASC
  `).all();
  return rows.map(r => r.id);
}

function parseQueue(q) {
  return String(q || '').split(',').filter(Boolean).map(Number);
}

router.get('/', (req, res) => {
  const queue = buildQueue();
  if (queue.length === 0) return res.render('tournee/done', { title: 'Tournée', empty: true, total: 0 });
  res.redirect(`/tournee/step?queue=${queue.join(',')}&i=0`);
});

router.get('/step', (req, res) => {
  const queue = parseQueue(req.query.queue);
  const i = parseInt(req.query.i, 10) || 0;
  const total = queue.length;

  if (i >= total) {
    return res.render('tournee/done', { title: 'Tournée terminée', empty: false, total });
  }

  const ficheId = queue[i];
  const fiche = db.prepare(`
    SELECT bs.*, b.id AS bac_id, s.*, s.id AS species_id, bs.id AS id
    FROM bac_species bs
    JOIN bacs b ON b.id = bs.bac_id
    JOIN species s ON s.id = bs.species_id
    WHERE bs.id = ?
  `).get(ficheId);

  if (!fiche) {
    // fiche was deleted mid-tournée — skip to the next one
    return res.redirect(`/tournee/step?queue=${queue.join(',')}&i=${i + 1}`);
  }

  res.render('tournee/step', {
    title: 'Tournée', fiche, position: i + 1, total,
    queue: queue.join(','), i, nextUrl: `/tournee/step?queue=${queue.join(',')}&i=${i + 1}`
  });
});

router.post('/step/log', (req, res) => {
  const queue = parseQueue(req.query.queue);
  const i = parseInt(req.query.i, 10) || 0;
  const ficheId = queue[i];
  const type = req.query.type || req.body.type;

  if (ficheId && type) {
    db.prepare('INSERT INTO log_entries (bac_species_id, type) VALUES (?, ?)').run(ficheId, type);
    db.prepare("UPDATE bac_species SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(ficheId);
  }

  res.redirect(`/tournee/step?queue=${queue.join(',')}&i=${i + 1}`);
});

module.exports = router;
