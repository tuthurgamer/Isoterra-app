const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { bacCareStatus } = require('../lib/care');
const { logForBac } = require('../lib/bac-log');

// One step per bac: a mixed bac is fed, misted and cleaned in one go, so its
// species are visited together. Bacs looked at longest ago come first.
function buildQueue() {
  return db.prepare(`
    SELECT bac_id FROM bac_species
    GROUP BY bac_id
    ORDER BY MAX(last_checked_at) IS NOT NULL, MAX(last_checked_at) ASC, bac_id ASC
  `).all().map((r) => r.bac_id);
}

function parseIds(value) {
  return String(value || '').split(',').filter(Boolean).map(Number);
}

function stepUrl(bacs, i) {
  return `/tournee/step?bacs=${bacs.join(',')}&i=${i}`;
}

// Tournées started before the switch to one step per bac carry fiche ids in
// `queue`. They are turned into bac ids (bacs already done first, then the
// ones still ahead), so a page left open on the phone neither revisits a bac
// nor logs to the wrong one: `bacId` is the bac of the fiche that page showed.
function readQueue(query) {
  const i = parseInt(query.i, 10) || 0;
  if (query.bacs !== undefined || query.queue === undefined) {
    const bacs = parseIds(query.bacs);
    return { bacs, i, bacId: bacs[i], legacy: false };
  }
  const fiches = parseIds(query.queue);
  const bacOf = new Map(db.prepare('SELECT id, bac_id FROM bac_species').all().map((r) => [r.id, r.bac_id]));
  const distinctBacs = (ids) => [...new Set(ids.map((id) => bacOf.get(id)).filter((b) => b !== undefined))];
  const ahead = distinctBacs(fiches.slice(i));
  const done = distinctBacs(fiches.slice(0, i)).filter((b) => !ahead.includes(b));
  return { bacs: [...done, ...ahead], i: done.length, bacId: bacOf.get(fiches[i]), legacy: true };
}

router.get('/', (req, res) => {
  const queue = buildQueue();
  if (queue.length === 0) return res.render('tournee/done', { title: 'Tournée', empty: true, total: 0 });
  res.redirect(stepUrl(queue, 0));
});

router.get('/step', (req, res) => {
  const { bacs, i, legacy } = readQueue(req.query);
  if (legacy) return res.redirect(stepUrl(bacs, i));
  const total = bacs.length;

  if (i >= total) {
    return res.render('tournee/done', { title: 'Tournée terminée', empty: false, total });
  }

  const fiches = db.prepare(`
    SELECT bs.*, b.name AS bac_name, s.scientific_name, s.category, s.icon_path, bs.id AS id
    FROM bac_species bs
    JOIN bacs b ON b.id = bs.bac_id
    JOIN species s ON s.id = bs.species_id
    WHERE bs.bac_id = ?
    ORDER BY bs.id
  `).all(bacs[i]);

  if (!fiches.length) {
    // bac deleted mid-tournée — skip to the next one
    return res.redirect(stepUrl(bacs, i + 1));
  }

  const lastChecked = fiches.map((f) => f.last_checked_at).filter(Boolean).sort().pop() || null;
  res.render('tournee/step', {
    title: 'Tournée', fiches, position: i + 1, total,
    bac: { id: bacs[i], name: fiches[0].bac_name, lastChecked, care: bacCareStatus(bacs[i]) },
    queue: bacs.join(','), i, nextUrl: stepUrl(bacs, i + 1)
  });
});

const ACTION_TYPES = ['nourrissage', 'nettoyage', 'pulverisation', 'observation'];

// Several actions can be ticked for one bac: each goes into the journal of
// every species in the bac (they were all fed, misted...). Nothing ticked
// simply skips the bac. The single-value `type` parameter is still accepted
// (older pages).
router.post('/step/log', (req, res) => {
  const { bacs, i, bacId, legacy } = readQueue(req.query);
  const body = req.body || {}; // Express 5 leaves req.body undefined when nothing was ticked
  const requested = [].concat(body.types || req.query.type || body.type || []);
  const types = ACTION_TYPES.filter((t) => requested.includes(t));
  if (bacId) logForBac(bacId, types);

  // An old page whose fiche has since been deleted hasn't shown bacs[i] yet.
  res.redirect(stepUrl(bacs, legacy && bacId === undefined ? i : i + 1));
});

module.exports = router;
