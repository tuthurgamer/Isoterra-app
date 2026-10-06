const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const db = require('../db/db');
const { evaluateGroup } = require('../lib/compatibility');
const { careStatuses, bacCareStatus, bacsNeedingAttention } = require('../lib/care');
const { moveFiches } = require('../lib/bac-move');
const { numTag } = require('../views/helpers/format');

const publicDir = path.join(__dirname, '..', 'public');

// Deletes fiches — their journal goes with them (ON DELETE CASCADE, and
// linked orders are kept, unlinked) — then the photos those journal entries
// pointed to, and the bac itself if nothing is left in it. A photo shared
// with another species (a note for the whole bac) stays while still used.
function deleteFiches(ficheIds, bacId) {
  const marks = ficheIds.map(() => '?').join(',');
  const photos = new Set(db.prepare(`SELECT photo_path FROM log_entries WHERE photo_path IS NOT NULL AND bac_species_id IN (${marks})`)
    .all(...ficheIds).map((r) => r.photo_path));
  db.exec('BEGIN');
  try {
    db.prepare(`DELETE FROM bac_species WHERE id IN (${marks})`).run(...ficheIds);
    if (db.prepare('SELECT COUNT(*) AS n FROM bac_species WHERE bac_id = ?').get(bacId).n === 0) {
      db.prepare('DELETE FROM bacs WHERE id = ?').run(bacId);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  const stillUsed = db.prepare('SELECT 1 FROM log_entries WHERE photo_path = ? LIMIT 1');
  for (const p of photos) {
    if (!stillUsed.get(p)) fs.unlink(path.join(publicDir, p), () => {});
  }
}

// A rhythm field left empty means "use the species' rhythm".
function rhythm(value) {
  const n = parseInt(value, 10);
  return n > 0 ? n : null;
}

function getSpeciesList() {
  return db.prepare('SELECT * FROM species ORDER BY category, scientific_name').all();
}

function getBacList() {
  return db.prepare(`
    SELECT b.id, b.name, b.substrate,
           GROUP_CONCAT(s.scientific_name, ', ') AS residents, GROUP_CONCAT(s.id) AS species_ids
    FROM bacs b
    LEFT JOIN bac_species bs ON bs.bac_id = b.id
    LEFT JOIN species s ON s.id = bs.species_id
    GROUP BY b.id
    ORDER BY b.id
  `).all();
}

// New bac with one or several species, or species added to an existing bac
// (?bac_id=). ?species=1,2,3 pre-fills the species, e.g. from the comparator.
router.get('/new', (req, res) => {
  const speciesList = getSpeciesList();
  const bac = req.query.bac_id ? db.prepare('SELECT * FROM bacs WHERE id = ?').get(req.query.bac_id) : null;
  const occupants = bac
    ? db.prepare('SELECT s.* FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.bac_id = ?').all(bac.id)
    : [];

  // Species that would fit best alongside what the bac already holds.
  const inBac = new Set(occupants.map((o) => o.id));
  let compatRanked = null;
  if (occupants.length) {
    compatRanked = speciesList
      .filter((sp) => !inBac.has(sp.id))
      .map((sp) => ({ species: sp, group: evaluateGroup([...occupants, sp]) }))
      .filter((r) => r.group.score >= 50)
      .sort((x, y) => y.group.score - x.group.score)
      .slice(0, 8);
  }

  const known = new Set(speciesList.map((s) => s.id));
  const prefill = [...new Set(String(req.query.species || '').split(',').map(Number))]
    .filter((id) => known.has(id) && !inBac.has(id));

  res.render('fiches/new', {
    title: bac ? 'Ajouter des espèces au bac' : 'Nouveau bac', active: 'fiches',
    speciesList, bacList: getBacList(), bac, occupants, compatRanked,
    prefill: prefill.length ? prefill : ['']
  });
});

router.post('/', (req, res) => {
  const b = req.body || {};
  const list = (v) => [].concat(v ?? []);
  const morphs = list(b.morph), lineages = list(b.lineage), populations = list(b.population_estimate);
  const rows = list(b.species_id)
    .map((id, i) => ({ speciesId: Number(id), morph: morphs[i] || null, lineage: lineages[i] || null, population: populations[i] || null }))
    .filter((r) => r.speciesId);
  if (!rows.length) return res.status(400).send('Choisis au moins une espèce.');
  if (new Set(rows.map((r) => r.speciesId)).size !== rows.length) return res.status(400).send('Une même espèce est choisie deux fois.');

  let bacId = Number(b.bac_id) || null;
  if (bacId) {
    if (!db.prepare('SELECT id FROM bacs WHERE id = ?').get(bacId)) return res.status(400).send('Bac introuvable.');
    const inBac = new Set(db.prepare('SELECT species_id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.species_id));
    if (rows.some((r) => inBac.has(r.speciesId))) return res.status(400).send('Une de ces espèces est déjà dans ce bac.');
  }
  const newBac = !bacId;
  const ids = [];

  db.exec('BEGIN');
  try {
    if (newBac) {
      bacId = db.prepare('INSERT INTO bacs (name, substrate) VALUES (?, ?)')
        .run((b.bac_name || '').trim() || null, b.substrate || null).lastInsertRowid;
    }
    const insert = db.prepare(`
      INSERT INTO bac_species (bac_id, species_id, morph, lineage, population_estimate, acquisition_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of rows) {
      ids.push(insert.run(bacId, r.speciesId, r.morph, r.lineage, r.population, b.acquisition_date || null, b.status || 'actif').lastInsertRowid);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  if (ids.length === 1) return res.redirect('/fiches/' + ids[0]);
  const notice = newBac
    ? `Bac ${numTag(bacId)} créé avec ${ids.length} espèces`
    : `${ids.length} espèces ajoutées au bac ${numTag(bacId)}`;
  res.redirect('/?notice=' + encodeURIComponent(notice));
});

// A fiche lives on its bac's page now: everything about a bac is done
// there. These keep old links (journal, pontes, ventes…) working.
router.get('/:id', (req, res) => {
  const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!fiche) return res.status(404).render('404', { path: req.path });
  res.redirect(`/bacs/${fiche.bac_id}#fiche-${fiche.id}`);
});

router.get('/:id/edit', (req, res) => {
  const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!fiche) return res.status(404).render('404', { path: req.path });
  res.redirect(`/bacs/${fiche.bac_id}#modifier-${fiche.id}`);
});

// Saves one species of a bac (its "Modifier" panel on the bac's page).
router.post('/:id', (req, res) => {
  const b = req.body || {};
  const current = db.prepare('SELECT bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).render('404', { path: req.path });

  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE bac_species SET species_id = ?, morph = ?, lineage = ?, population_estimate = ?,
        acquisition_date = ?, status = ?, breeding_stage = ?, for_sale_quantity = ?, unit_price = ?,
        feed_every_days = ?, mist_every_days = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      b.species_id, b.morph || null, b.lineage || null, b.population_estimate || null,
      b.acquisition_date || null, b.status || 'actif', b.breeding_stage || null,
      b.for_sale_quantity || 0, b.unit_price || null,
      rhythm(b.feed_every_days), rhythm(b.mist_every_days), req.params.id
    );
    // Only a form that carries the bac's own fields may change them.
    if (b.bac_name !== undefined || b.substrate !== undefined) {
      db.prepare("UPDATE bacs SET name = ?, substrate = ?, updated_at = datetime('now', 'localtime') WHERE id = ?")
        .run((b.bac_name || '').trim() || null, b.substrate || null, current.bac_id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.redirect(`/bacs/${current.bac_id}?notice=${encodeURIComponent('Modifications enregistrées')}#fiche-${req.params.id}`);
});

// Removes this species from its bac (the whole bac when it was alone in it).
router.post('/:id/delete', (req, res) => {
  const fiche = db.prepare(`
    SELECT bs.id, bs.bac_id, bs.morph, s.scientific_name
    FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.id = ?
  `).get(req.params.id);
  if (!fiche) return res.redirect('/');
  const shared = db.prepare('SELECT COUNT(*) AS n FROM bac_species WHERE bac_id = ? AND id != ?').get(fiche.bac_id, fiche.id).n > 0;
  deleteFiches([fiche.id], fiche.bac_id);

  const name = fiche.scientific_name + (fiche.morph ? " '" + fiche.morph + "'" : '');
  if (shared) return res.redirect(`/bacs/${fiche.bac_id}?notice=${encodeURIComponent(`${name} retiré du bac`)}`);
  res.redirect('/?notice=' + encodeURIComponent(`Bac ${numTag(fiche.bac_id)} supprimé (${name})`));
});

// Moves this species, journal included, to another bac or to a new bac of
// its own (bac_id=new): out of a mixed bac, or back out of a wrong merge.
router.post('/:id/move', (req, res) => {
  const fiche = db.prepare(`
    SELECT bs.id, bs.bac_id, bs.morph, s.scientific_name
    FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.id = ?
  `).get(req.params.id);
  if (!fiche) return res.status(404).render('404', { path: req.path });
  const target = String((req.body || {}).bac_id || '');
  const toBacId = target === 'new' ? null : Number(target);
  if (toBacId !== null && (!toBacId || toBacId === fiche.bac_id || !db.prepare('SELECT id FROM bacs WHERE id = ?').get(toBacId))) {
    return res.redirect(`/bacs/${fiche.bac_id}?notice=${encodeURIComponent('Choisis le bac où le déplacer')}#modifier-${fiche.id}`);
  }
  const { bacId, placed } = moveFiches([fiche.id], toBacId);
  const name = fiche.scientific_name + (fiche.morph ? " '" + fiche.morph + "'" : '');
  const notice = toBacId ? `${name} déplacé dans ce bac` : `${name} installé seul dans ce nouveau bac`;
  res.redirect(`/bacs/${bacId}?notice=${encodeURIComponent(notice)}#fiche-${placed.get(fiche.id)}`);
});

// Deletes the whole bac, every species in it included.
router.post('/:id/delete-bac', (req, res) => {
  const fiche = db.prepare('SELECT bac_id FROM bac_species WHERE id = ?').get(req.params.id);
  if (!fiche) return res.redirect('/');
  const ids = db.prepare('SELECT id FROM bac_species WHERE bac_id = ?').all(fiche.bac_id).map((r) => r.id);
  deleteFiches(ids, fiche.bac_id);
  res.redirect('/?notice=' + encodeURIComponent(`Bac ${numTag(fiche.bac_id)} supprimé`));
});

router.post('/:id/log/quick', (req, res) => {
  const type = req.query.type || (req.body || {}).type;
  if (!type) return res.status(400).send('Type manquant');
  db.prepare('INSERT INTO log_entries (bac_species_id, type) VALUES (?, ?)').run(req.params.id, type);
  db.prepare("UPDATE bac_species SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(req.params.id);

  // The bacs page updates itself from this: the refreshed status of every
  // fiche sharing the bac (feeding/misting count for the whole bac), the
  // bac's own summary and the new "en retard ou en alerte" total.
  if (req.get('X-Requested-With') === 'fetch') {
    const all = [...careStatuses().values()];
    const bac = all.find((s) => String(s.fiche) === String(req.params.id));
    return res.json({
      statuses: bac ? all.filter((s) => s.bac === bac.bac) : [],
      bacStatus: bac ? bacCareStatus(bac.bac) : null,
      attention: bacsNeedingAttention(all)
    });
  }
  res.redirect(req.get('Referer') || '/fiches/' + req.params.id);
});

module.exports = router;
