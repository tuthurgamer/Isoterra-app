const db = require('../db/db');

// Moves species, with their journal and orders, into another bac — or into
// a new bac of their own when toBacId is null. The usual case is two bacs
// that turn out to be one: the species of the first join the second, which
// keeps its number. A species the target bac already holds is folded into
// it rather than listed twice: its journal and orders join that fiche,
// whose blank fields it fills in, and the numbers for sale add up. A bac
// left with nothing in it is deleted.
// Returns the target bac's id and, for each fiche moved, the fiche it now is.
function moveFiches(ficheIds, toBacId) {
  const getFiche = db.prepare('SELECT * FROM bac_species WHERE id = ?');
  const fiches = ficheIds.map((id) => getFiche.get(id)).filter(Boolean);
  const placed = new Map();

  db.exec('BEGIN');
  try {
    if (!toBacId) toBacId = Number(db.prepare('INSERT INTO bacs DEFAULT VALUES').run().lastInsertRowid);
    const held = new Map(db.prepare('SELECT species_id, id FROM bac_species WHERE bac_id = ?').all(toBacId)
      .map((r) => [r.species_id, r.id]));
    const move = db.prepare("UPDATE bac_species SET bac_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?");
    const fill = db.prepare(`
      UPDATE bac_species SET
        morph = COALESCE(morph, ?), lineage = COALESCE(lineage, ?),
        population_estimate = COALESCE(population_estimate, ?), acquisition_date = COALESCE(acquisition_date, ?),
        breeding_stage = COALESCE(breeding_stage, ?), unit_price = COALESCE(unit_price, ?),
        feed_every_days = COALESCE(feed_every_days, ?), mist_every_days = COALESCE(mist_every_days, ?),
        for_sale_quantity = for_sale_quantity + ?,
        last_checked_at = CASE WHEN last_checked_at IS NULL OR ? > last_checked_at THEN ? ELSE last_checked_at END,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    for (const f of fiches) {
      if (f.bac_id === toBacId) {
        placed.set(f.id, f.id);
        continue;
      }
      const twin = held.get(f.species_id);
      if (!twin) {
        move.run(toBacId, f.id);
        held.set(f.species_id, f.id);
        placed.set(f.id, f.id);
        continue;
      }
      db.prepare('UPDATE log_entries SET bac_species_id = ? WHERE bac_species_id = ?').run(twin, f.id);
      db.prepare('UPDATE orders SET bac_species_id = ? WHERE bac_species_id = ?').run(twin, f.id);
      fill.run(f.morph, f.lineage, f.population_estimate, f.acquisition_date, f.breeding_stage, f.unit_price,
        f.feed_every_days, f.mist_every_days, f.for_sale_quantity || 0, f.last_checked_at, f.last_checked_at, twin);
      db.prepare('DELETE FROM bac_species WHERE id = ?').run(f.id);
      placed.set(f.id, twin);
    }

    const dropIfEmpty = db.prepare('DELETE FROM bacs WHERE id = ? AND NOT EXISTS (SELECT 1 FROM bac_species WHERE bac_id = bacs.id)');
    for (const bacId of new Set(fiches.map((f) => f.bac_id))) {
      if (bacId !== toBacId) dropIfEmpty.run(bacId);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { bacId: toBacId, placed };
}

module.exports = { moveFiches };
