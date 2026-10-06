const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { careStatuses, bacStatusOf, bacCareStatus, bacsNeedingAttention } = require('../lib/care');
const fs = require('node:fs');
const { logForBac, noteForBac } = require('../lib/bac-log');
const { moveFiches } = require('../lib/bac-move');
const { evaluateGroup } = require('../lib/compatibility');
const { groupEntries } = require('../lib/journal');
const { uploadPhoto } = require('../lib/uploads');
const { numTag } = require('../views/helpers/format');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT bs.*, bs.id AS id, b.id AS bac_id, b.name AS bac_name, b.substrate,
           s.scientific_name, s.category, s.difficulty, s.vigilance, s.icon_path,
           s.temp_min, s.temp_max, s.humidity_min, s.humidity_max, s.sociability,
           s.diet_type, s.size_class, s.niche, s.substrate_type
    FROM bac_species bs
    JOIN bacs b ON b.id = bs.bac_id
    JOIN species s ON s.id = bs.species_id
    ORDER BY b.id ASC, bs.id ASC
  `).all();

  const lastLogByFiche = db.prepare(`
    SELECT bac_species_id, MAX(created_at) AS last_at
    FROM log_entries
    GROUP BY bac_species_id
  `).all();
  const lastLogMap = new Map(lastLogByFiche.map(r => [r.bac_species_id, r.last_at]));
  const care = careStatuses();

  for (const bac of rows) {
    bac.last_log_at = lastLogMap.get(bac.id) || null;
    bac.care = care.get(bac.id);
  }

  // One entry per bac. A bac holding several species is shown as one card:
  // its compatibility, the care status of the whole bac, its last entry.
  const byBac = new Map();
  for (const row of rows) {
    if (!byBac.has(row.bac_id)) byBac.set(row.bac_id, { bacId: row.bac_id, name: row.bac_name, fiches: [] });
    byBac.get(row.bac_id).fiches.push(row);
  }
  const groups = [...byBac.values()];
  for (const g of groups) {
    if (g.fiches.length < 2) continue;
    g.compat = evaluateGroup(g.fiches.map((f) => ({ ...f, id: f.species_id })));
    g.care = bacStatusOf(g.fiches.map((f) => f.care));
    g.lastLog = g.fiches.map((f) => f.last_log_at).filter(Boolean).sort().pop() || null;
  }

  const stats = {
    total: groups.length,
    // A mixed bac misted during the tournée has one entry per species, all
    // with the same time: that is still one misting.
    pulverisationsThisWeek: db.prepare(`
      SELECT COUNT(DISTINCT bs.bac_id || ' ' || l.created_at) AS n
      FROM log_entries l JOIN bac_species bs ON bs.id = l.bac_species_id
      WHERE l.type = 'pulverisation' AND l.created_at >= datetime('now', '-7 days', 'localtime')
    `).get().n,
    pontesEnCours: rows.filter(b => b.breeding_stage).length,
    attention: bacsNeedingAttention(care.values())
  };

  res.render('bacs/index', { title: 'Registre des bacs', active: 'bacs', bacs: rows, groups, stats, notice: req.query.notice || null });
});

// A bac's own page: everything about it in one place — care and quick
// actions, a note or a photo, each species (and its settings), its journal,
// the bac's settings.
router.get('/bacs/:id', (req, res) => {
  const bac = db.prepare('SELECT * FROM bacs WHERE id = ?').get(req.params.id);
  if (!bac) return res.status(404).render('404', { path: req.path });

  const fiches = db.prepare(`
    SELECT bs.*, bs.id AS id, s.scientific_name, s.common_name, s.category, s.icon_path, s.vigilance,
           s.temp_min, s.temp_max, s.humidity_min, s.humidity_max, s.sociability,
           s.diet_type, s.size_class, s.niche, s.substrate_type,
           s.feed_every_days AS species_feed, s.mist_every_days AS species_mist
    FROM bac_species bs JOIN species s ON s.id = bs.species_id
    WHERE bs.bac_id = ?
    ORDER BY bs.id
  `).all(bac.id);
  const care = careStatuses({ bacId: bac.id });
  for (const f of fiches) f.care = care.get(f.id);

  const rows = db.prepare(`
    SELECT l.*, bs.bac_id, bs.morph, s.scientific_name
    FROM log_entries l
    JOIN bac_species bs ON bs.id = l.bac_species_id
    JOIN species s ON s.id = bs.species_id
    WHERE bs.bac_id = ?
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 150
  `).all(bac.id);

  res.render('bacs/show', {
    title: fiches.length > 1 ? `Bac mixte ${numTag(bac.id)}` : fiches.length ? fiches[0].scientific_name : `Bac ${numTag(bac.id)}`,
    active: 'bacs', bac, fiches,
    bacCare: bacStatusOf([...care.values()]),
    compat: fiches.length > 1 ? evaluateGroup(fiches.map((f) => ({ ...f, id: f.species_id }))) : null,
    journal: groupEntries(rows).slice(0, 40),
    journalCount: db.prepare(`
      SELECT COUNT(*) AS entries, COUNT(photo_path) AS photos FROM log_entries
      WHERE bac_species_id IN (SELECT id FROM bac_species WHERE bac_id = ?)
    `).get(bac.id),
    speciesList: db.prepare('SELECT * FROM species ORDER BY category, scientific_name').all(),
    // The bacs these animals could join ("Réunir", "Déplacer").
    otherBacs: db.prepare(`
      SELECT b.id, b.name, GROUP_CONCAT(s.scientific_name, ', ') AS residents, GROUP_CONCAT(s.id) AS species_ids
      FROM bacs b JOIN bac_species bs ON bs.bac_id = b.id JOIN species s ON s.id = bs.species_id
      WHERE b.id != ?
      GROUP BY b.id
      ORDER BY b.id
    `).all(bac.id),
    notice: req.query.notice || null
  });
});

// Two bacs that are really one: everything in this bac, journal included,
// joins the chosen bac, which keeps its number; this one disappears.
router.post('/bacs/:id/merge', (req, res) => {
  const fromId = Number(req.params.id);
  const intoId = Number((req.body || {}).into);
  if (!db.prepare('SELECT id FROM bacs WHERE id = ?').get(fromId)) return res.status(404).render('404', { path: req.path });
  if (!intoId || intoId === fromId || !db.prepare('SELECT id FROM bacs WHERE id = ?').get(intoId)) {
    return res.redirect(`/bacs/${fromId}?notice=${encodeURIComponent('Choisis le bac à rejoindre')}#reunir`);
  }
  const ids = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(fromId).map((r) => r.id);
  if (ids.length) moveFiches(ids, intoId);
  else db.prepare('DELETE FROM bacs WHERE id = ?').run(fromId);
  res.redirect(`/bacs/${intoId}?notice=${encodeURIComponent(`Bac ${numTag(fromId)} réuni dans ce bac`)}#animaux`);
});

const NOTE_TYPES = ['observation', 'ponte', 'vente', 'nourrissage', 'nettoyage', 'pulverisation'];

// A note and/or a photo from the bac's page, for one species or the whole bac.
router.post('/bacs/:id/note', uploadPhoto.single('photo'), (req, res) => {
  const b = req.body || {};
  const bacId = Number(req.params.id);
  const note = String(b.note || '').trim() || null;
  const photoPath = req.file ? '/uploads/' + req.file.filename : null;
  if (!note && !photoPath) {
    return res.redirect(`/bacs/${bacId}?notice=${encodeURIComponent('Rien à enregistrer : écris une note ou ajoute une photo')}`);
  }
  const written = noteForBac(bacId, {
    type: NOTE_TYPES.includes(b.type) ? b.type : 'observation',
    note, photoPath, ficheId: Number(b.fiche_id) || null
  });
  if (!written) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).render('404', { path: req.path });
  }
  res.redirect(`/bacs/${bacId}?notice=${encodeURIComponent('Ajouté au journal')}#journal`);
});

// The bac's name and substrate.
router.post('/bacs/:id/settings', (req, res) => {
  const b = req.body || {};
  const info = db.prepare("UPDATE bacs SET name = ?, substrate = ?, updated_at = datetime('now', 'localtime') WHERE id = ?")
    .run(String(b.bac_name || '').trim() || null, String(b.substrate || '').trim() || null, req.params.id);
  if (!info.changes) return res.status(404).render('404', { path: req.path });
  res.redirect(`/bacs/${req.params.id}?notice=${encodeURIComponent('Bac enregistré')}`);
});

const QUICK_TYPES = ['nourrissage', 'nettoyage', 'pulverisation', 'observation'];

// Quick actions of a mixed bac's card or of a bac's page: done to the whole
// bac, so written in every species' journal, as in the tournée.
router.post('/bacs/:id/log/quick', (req, res) => {
  const type = req.query.type || (req.body || {}).type;
  if (!QUICK_TYPES.includes(type)) return res.status(400).send('Type manquant');
  const bacId = Number(req.params.id);
  if (!logForBac(bacId, [type])) return res.status(404).send('Bac introuvable');

  if (req.get('X-Requested-With') === 'fetch') {
    const all = [...careStatuses().values()];
    return res.json({
      statuses: all.filter((s) => s.bac === bacId),
      bacStatus: bacCareStatus(bacId),
      attention: bacsNeedingAttention(all)
    });
  }
  res.redirect(req.get('Referer') || '/');
});

module.exports = router;
