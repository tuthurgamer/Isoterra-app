const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { computeCompatibility } = require('../views/helpers/compatibility');

const CATEGORY_LABELS = { iule: 'Iules', cloporte: 'Cloportes', cetoine: 'Cétoines', autre: 'Autres espèces' };
const CATEGORY_ORDER = ['iule', 'cloporte', 'cetoine', 'autre'];

router.get('/', (req, res) => {
  const all = db.prepare('SELECT * FROM species ORDER BY common_name').all();
  const byCategory = CATEGORY_ORDER.map(cat => ({
    key: cat,
    label: CATEGORY_LABELS[cat],
    items: all.filter(s => s.category === cat)
  })).filter(g => g.items.length > 0);

  res.render('especes/index', { title: 'Guide des espèces', active: 'especes', byCategory, total: all.length });
});

router.get('/new', (req, res) => {
  res.render('especes/form', { title: 'Nouvelle espèce', active: 'especes', sp: {}, isNew: true });
});

router.get('/compatibilite', (req, res) => {
  const speciesList = db.prepare('SELECT id, category, common_name, scientific_name FROM species ORDER BY category, common_name').all();
  const aId = req.query.a;
  const bId = req.query.b;
  let result = null;
  let spA = null, spB = null;
  if (aId && bId && aId !== bId) {
    spA = db.prepare('SELECT * FROM species WHERE id = ?').get(aId);
    spB = db.prepare('SELECT * FROM species WHERE id = ?').get(bId);
    if (spA && spB) result = computeCompatibility(spA, spB);
  }
  res.render('especes/compatibilite', {
    title: 'Compatibilité entre espèces', active: 'especes',
    speciesList, aId: aId || '', bId: bId || '', spA, spB, result
  });
});

router.post('/', (req, res) => {
  const info = insertOrUpdate(req.body);
  res.redirect('/especes/' + info.id);
});

router.get('/:id', (req, res) => {
  const sp = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!sp) return res.status(404).render('404', { path: req.path });
  const bacs = db.prepare('SELECT id, bac_id, morph FROM bac_species WHERE species_id = ?').all(req.params.id);
  res.render('especes/show', { title: sp.common_name, active: 'especes', sp, bacs });
});

router.get('/:id/edit', (req, res) => {
  const sp = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!sp) return res.status(404).render('404', { path: req.path });
  res.render('especes/form', { title: 'Modifier ' + sp.common_name, active: 'especes', sp, isNew: false });
});

router.post('/:id', (req, res) => {
  insertOrUpdate(req.body, req.params.id);
  res.redirect('/especes/' + req.params.id);
});

function insertOrUpdate(b, id) {
  const fields = {
    category: b.category, common_name: b.common_name, scientific_name: b.scientific_name,
    difficulty: Number(b.difficulty) || 3,
    humidity_min: Number(b.humidity_min) || null, humidity_max: Number(b.humidity_max) || null,
    temp_min: Number(b.temp_min) || null, temp_max: Number(b.temp_max) || null,
    sociability: b.sociability || null, diet_summary: b.diet_summary || null, vigilance: b.vigilance || null,
    presentation: b.presentation || null, habitat: b.habitat || null, feeding_detail: b.feeding_detail || null,
    repro_sexing: b.repro_sexing || null, repro_conditions: b.repro_conditions || null,
    repro_mating: b.repro_mating || null, repro_incubation: b.repro_incubation || null,
    repro_juveniles: b.repro_juveniles || null, repro_pitfalls: b.repro_pitfalls || null,
    is_draft: b.is_draft ? 1 : 0
  };
  if (id) {
    db.prepare(`
      UPDATE species SET category=:category, common_name=:common_name, scientific_name=:scientific_name,
        difficulty=:difficulty, humidity_min=:humidity_min, humidity_max=:humidity_max,
        temp_min=:temp_min, temp_max=:temp_max, sociability=:sociability, diet_summary=:diet_summary,
        vigilance=:vigilance, presentation=:presentation, habitat=:habitat, feeding_detail=:feeding_detail,
        repro_sexing=:repro_sexing, repro_conditions=:repro_conditions, repro_mating=:repro_mating,
        repro_incubation=:repro_incubation, repro_juveniles=:repro_juveniles, repro_pitfalls=:repro_pitfalls,
        is_draft=:is_draft, updated_at=datetime('now','localtime')
      WHERE id=:id
    `).run({ ...fields, id });
    return { id };
  }
  const info = db.prepare(`
    INSERT INTO species (category, common_name, scientific_name, difficulty, humidity_min, humidity_max,
      temp_min, temp_max, sociability, diet_summary, vigilance, presentation, habitat, feeding_detail,
      repro_sexing, repro_conditions, repro_mating, repro_incubation, repro_juveniles, repro_pitfalls, is_draft)
    VALUES (:category, :common_name, :scientific_name, :difficulty, :humidity_min, :humidity_max,
      :temp_min, :temp_max, :sociability, :diet_summary, :vigilance, :presentation, :habitat, :feeding_detail,
      :repro_sexing, :repro_conditions, :repro_mating, :repro_incubation, :repro_juveniles, :repro_pitfalls, :is_draft)
  `).run(fields);
  return { id: info.lastInsertRowid };
}

module.exports = router;
