const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../db/db');
const { computeCompatibility, evaluateGroup, bestGroups } = require('../lib/compatibility');
const { TRAIT_OPTIONS, defaultTraits, binomial } = require('../db/trait-defaults');
const { getSettings, setSetting } = require('../lib/settings');
const { processIconInBackground, thumbPath } = require('../lib/icon-image');
const { listPhotos, card, savePhotos, photosOfSpecies, removeUnusedPhotos } = require('../lib/photos');
const { uploadPhotos } = require('../lib/uploads');
const { noteForBac } = require('../lib/bac-log');

const CATEGORY_LABELS = { iule: 'Iules', cloporte: 'Cloportes', cetoine: 'Cétoines', escargot: 'Escargots', autre: 'Autres espèces' };
const CATEGORY_ORDER = ['iule', 'cloporte', 'cetoine', 'escargot', 'autre'];

const iconDir = path.join(__dirname, '..', 'public', 'uploads', 'species-icons');
const iconOriginalsDir = path.join(__dirname, '..', 'data', 'icon-originals');
fs.mkdirSync(iconDir, { recursive: true });

const uploadIcon = multer({
  storage: multer.diskStorage({
    destination: iconDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

// Best-effort cleanup when an icon is replaced or removed — never block the
// request on it, a leftover file in uploads/ isn't worth a 500.
function deleteIconFile(iconPath) {
  if (!iconPath) return;
  const file = path.join(__dirname, '..', 'public', iconPath);
  for (const f of [file, thumbPath(file), path.join(iconOriginalsDir, path.basename(file))]) {
    fs.unlink(f, () => {});
  }
}

// Trims and resizes the fresh upload, returning its public path.
async function storeIcon(file) {
  await processIconInBackground(file.path, iconOriginalsDir);
  return '/uploads/species-icons/' + file.filename;
}

router.get('/', (req, res) => {
  const all = db.prepare('SELECT * FROM species ORDER BY scientific_name').all();
  const byCategory = CATEGORY_ORDER.map(cat => ({
    key: cat,
    label: CATEGORY_LABELS[cat],
    items: all.filter(s => s.category === cat)
  })).filter(g => g.items.length > 0);

  res.render('especes/index', { title: 'Guide des espèces', active: 'especes', byCategory, total: all.length });
});

router.get('/new', (req, res) => {
  res.render('especes/form', { title: 'Nouvelle espèce', active: 'especes', sp: {}, isNew: true, traitOptions: TRAIT_OPTIONS });
});

// Comparator, three modes: every partner of one species ranked, the detail
// of one pair, and the best groups for a multi-species bac.
router.get('/compatibilite', (req, res) => {
  const all = db.prepare('SELECT * FROM species ORDER BY category, scientific_name').all();
  const byId = new Map(all.map((s) => [String(s.id), s]));
  const a = byId.get(String(req.query.a || '')) || null;
  const b = byId.get(String(req.query.b || '')) || null;
  let mode = req.query.mode || (a && b ? 'paire' : 'espece');
  if (!['espece', 'paire', 'groupes'].includes(mode)) mode = 'espece';
  const view = { title: "Comparateur d'espèces", active: 'especes', mode, speciesList: all, a, b };

  if (mode === 'espece' && a) {
    view.partners = all
      .filter((s) => s.id !== a.id)
      .map((s) => ({ species: s, result: computeCompatibility(a, s) }))
      .sort((x, y) => y.result.total - x.result.total);
  }
  if (mode === 'paire' && a && b && a.id !== b.id) {
    view.result = computeCompatibility(a, b);
  }
  if (mode === 'groupes') {
    // Checkboxes come with a hidden "0" before them, so unticked is explicit.
    const ticked = (name, byDefault) => (req.query[name] === undefined ? byDefault : [].concat(req.query[name]).includes('1'));
    const size = Math.min(4, Math.max(2, parseInt(req.query.taille, 10) || 3));
    const mustHave = byId.get(String(req.query.inclure || '')) || null;
    const onlyKept = ticked('elevage', false);
    const mixedOnly = ticked('mixte', true);
    let pool = all;
    if (onlyKept) {
      const kept = new Set(db.prepare('SELECT DISTINCT species_id FROM bac_species').all().map((r) => r.species_id));
      pool = all.filter((s) => kept.has(s.id) || (mustHave && s.id === mustHave.id));
    }
    view.groups = bestGroups(pool, { size, mustInclude: mustHave && mustHave.id, mixedOnly, limit: 12 });
    Object.assign(view, { size, mustHave, onlyKept, mixedOnly });
  }
  res.render('especes/comparateur', view);
});

// Live check for the new-bac form: how well a set of species gets along.
router.get('/compatibilite/groupe.json', (req, res) => {
  const ids = String(req.query.ids || '').split(',').map(Number).filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    return res.json({ duplicate: true });
  }
  const rows = ids.length ? db.prepare(`SELECT * FROM species WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) : [];
  const species = ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  const group = species.length >= 2 ? evaluateGroup(species) : null;
  if (!group) return res.json({ group: null });
  res.json({
    group: {
      score: group.score, verdict: group.verdict, verdictClass: group.verdictClass, common: group.common,
      notes: group.notes.slice(0, 4), strengths: group.strengths.slice(0, 2),
      weakest: species.length > 2 ? {
        a: group.weakest.a.scientific_name, b: group.weakest.b.scientific_name,
        aId: group.weakest.a.id, bId: group.weakest.b.id, total: group.weakest.result.total
      } : null
    }
  });
});

// Every species icon, small and large, for the service worker to keep on the
// phone: icons then show up with the page instead of coming from the Pi.
router.get('/icones.json', (req, res) => {
  const paths = db.prepare('SELECT icon_path FROM species WHERE icon_path IS NOT NULL ORDER BY id').all()
    .flatMap((r) => [thumbPath(r.icon_path), r.icon_path]);
  res.set('Cache-Control', 'no-store').json(paths);
});

router.post('/', uploadIcon.single('icon'), async (req, res) => {
  const iconPath = req.file ? await storeIcon(req.file) : null;
  const info = insertOrUpdate(req.body, null, iconPath);
  res.redirect('/especes/' + info.id);
});

router.get('/:id', (req, res) => {
  const sp = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!sp) return res.status(404).render('404', { path: req.path });
  const bacs = db.prepare(`
    SELECT bs.id, bs.bac_id, bs.morph, b.name AS bac_name FROM bac_species bs JOIN bacs b ON b.id = bs.bac_id
    WHERE bs.species_id = ? ORDER BY bs.bac_id
  `).all(req.params.id);
  // The photos where this species is seen, the best rated first.
  const photos = listPhotos({ speciesId: sp.id, best: true, limit: 12 }).map(card);
  const photoCount = listPhotos({ speciesId: sp.id }).length;
  res.render('especes/show', {
    title: sp.scientific_name, active: 'especes', sp, bacs, photos, photoCount, traitOptions: TRAIT_OPTIONS, notice: req.query.notice || null
  });
});

// Photos added from a species' page: into the journal of one of its bacs
// (fiche_id), or, with no bac chosen, kept with the species alone.
router.post('/:id/photos', uploadPhotos, (req, res) => {
  const b = req.body || {};
  const sp = db.prepare('SELECT id FROM species WHERE id = ?').get(req.params.id);
  const photos = savePhotos(req.files, b);
  if (!sp) {
    removeUnusedPhotos(photos);
    return res.status(404).render('404', { path: req.path });
  }
  if (!photos.length) return res.redirect(`/especes/${sp.id}?notice=${encodeURIComponent('Choisis au moins une photo')}#photos`);
  const note = String(b.note || '').trim() || null;
  const fiche = db.prepare('SELECT id, bac_id FROM bac_species WHERE id = ? AND species_id = ?').get(Number(b.fiche_id) || 0, sp.id);
  if (fiche) noteForBac(fiche.bac_id, { type: 'observation', note, photos, ficheId: fiche.id });
  else photosOfSpecies(photos, sp.id, note);
  const notice = photos.length > 1 ? `${photos.length} photos ajoutées` : 'Photo ajoutée';
  res.redirect(`/especes/${sp.id}?notice=${encodeURIComponent(notice)}#photos`);
});

router.get('/:id/edit', (req, res) => {
  const sp = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!sp) return res.status(404).render('404', { path: req.path });
  res.render('especes/form', { title: 'Modifier ' + sp.scientific_name, active: 'especes', sp, isNew: false, traitOptions: TRAIT_OPTIONS });
});

// Good tankmates named on a customer sheet: the guide's best matches, one per
// species (morphs merged), leaving out predators and anything below 85 %.
function goodPartners(sp, others) {
  const best = new Map();
  for (const other of others) {
    const name = binomial(other.scientific_name);
    if (other.diet_type === 'predateur' || name === binomial(sp.scientific_name)) continue;
    const total = computeCompatibility(sp, other).total;
    if (total >= 85 && total > (best.get(name) || 0)) best.set(name, total);
  }
  return [...best.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([name]) => name);
}

// Care sheet for a buyer: the guide's fiche on one printable page, to print
// or save as PDF and send. ?fiche= adds that bac's lineage.
router.get('/:id/fiche-client', (req, res) => {
  const sp = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!sp) return res.status(404).render('404', { path: req.path });
  const fiche = req.query.fiche
    ? db.prepare('SELECT id, bac_id, lineage FROM bac_species WHERE id = ? AND species_id = ?').get(req.query.fiche, sp.id) || null
    : null;
  const others = db.prepare('SELECT * FROM species WHERE id != ?').all(sp.id);
  res.render('especes/fiche-client', {
    title: 'Fiche élevage - ' + sp.scientific_name.replace(/"/g, ''),
    sp, fiche, traitOptions: TRAIT_OPTIONS, settings: getSettings(),
    partners: sp.diet_type === 'predateur' ? null : goodPartners(sp, others),
    selfUrl: '/especes/' + sp.id + '/fiche-client' + (fiche ? '?fiche=' + fiche.id : ''),
    backUrl: fiche ? '/fiches/' + fiche.id : '/especes/' + sp.id
  });
});

// The breeder's name and contact printed at the foot of every customer sheet.
router.post('/fiche-client/eleveur', (req, res) => {
  const b = req.body || {};
  setSetting('breeder_name', String(b.breeder_name || '').trim().slice(0, 80));
  setSetting('breeder_contact', String(b.breeder_contact || '').trim().slice(0, 160));
  const back = String(b.back || '');
  res.redirect(/^\/especes\/\d+\/fiche-client(\?fiche=\d+)?$/.test(back) ? back : '/especes');
});

router.post('/:id', uploadIcon.single('icon'), async (req, res) => {
  const current = db.prepare('SELECT icon_path FROM species WHERE id = ?').get(req.params.id);
  let iconPath = current ? current.icon_path : null;
  if (req.file) {
    const fresh = await storeIcon(req.file);
    deleteIconFile(iconPath);
    iconPath = fresh;
  } else if (req.body && req.body.remove_icon) {
    deleteIconFile(iconPath);
    iconPath = null;
  }
  insertOrUpdate(req.body, req.params.id, iconPath);
  res.redirect('/especes/' + req.params.id);
});

function insertOrUpdate(b, id, iconPath) {
  // A trait left on "— choisir —" takes the usual value for the category.
  const traits = defaultTraits({ category: b.category, scientific_name: b.scientific_name });
  const trait = (key) => (TRAIT_OPTIONS[key].some(([value]) => value === b[key]) ? b[key] : traits[key]);
  const fields = {
    category: b.category, common_name: b.common_name, scientific_name: b.scientific_name,
    difficulty: Number(b.difficulty) || 3,
    humidity_min: Number(b.humidity_min) || null, humidity_max: Number(b.humidity_max) || null,
    temp_min: Number(b.temp_min) || null, temp_max: Number(b.temp_max) || null,
    sociability: b.sociability || null, diet_summary: b.diet_summary || null, vigilance: b.vigilance || null,
    lifespan: String(b.lifespan || '').trim() || null,
    presentation: b.presentation || null, habitat: b.habitat || null, feeding_detail: b.feeding_detail || null,
    repro_sexing: b.repro_sexing || null, repro_conditions: b.repro_conditions || null,
    repro_mating: b.repro_mating || null, repro_incubation: b.repro_incubation || null,
    repro_juveniles: b.repro_juveniles || null, repro_pitfalls: b.repro_pitfalls || null,
    icon_path: iconPath,
    feed_every_days: Number(b.feed_every_days) || null,
    mist_every_days: Number(b.mist_every_days) || null,
    diet_type: trait('diet_type'), size_class: trait('size_class'),
    niche: trait('niche'), substrate_type: trait('substrate_type'),
    is_draft: b.is_draft ? 1 : 0
  };
  if (id) {
    db.prepare(`
      UPDATE species SET category=:category, common_name=:common_name, scientific_name=:scientific_name,
        difficulty=:difficulty, humidity_min=:humidity_min, humidity_max=:humidity_max,
        temp_min=:temp_min, temp_max=:temp_max, sociability=:sociability, diet_summary=:diet_summary, lifespan=:lifespan,
        vigilance=:vigilance, presentation=:presentation, habitat=:habitat, feeding_detail=:feeding_detail,
        repro_sexing=:repro_sexing, repro_conditions=:repro_conditions, repro_mating=:repro_mating,
        repro_incubation=:repro_incubation, repro_juveniles=:repro_juveniles, repro_pitfalls=:repro_pitfalls,
        icon_path=:icon_path, feed_every_days=:feed_every_days, mist_every_days=:mist_every_days,
        diet_type=:diet_type, size_class=:size_class, niche=:niche, substrate_type=:substrate_type,
        is_draft=:is_draft, updated_at=datetime('now','localtime')
      WHERE id=:id
    `).run({ ...fields, id });
    return { id };
  }
  const info = db.prepare(`
    INSERT INTO species (category, common_name, scientific_name, difficulty, humidity_min, humidity_max,
      temp_min, temp_max, sociability, diet_summary, lifespan, vigilance, presentation, habitat, feeding_detail,
      repro_sexing, repro_conditions, repro_mating, repro_incubation, repro_juveniles, repro_pitfalls,
      icon_path, feed_every_days, mist_every_days, diet_type, size_class, niche, substrate_type, is_draft)
    VALUES (:category, :common_name, :scientific_name, :difficulty, :humidity_min, :humidity_max,
      :temp_min, :temp_max, :sociability, :diet_summary, :lifespan, :vigilance, :presentation, :habitat, :feeding_detail,
      :repro_sexing, :repro_conditions, :repro_mating, :repro_incubation, :repro_juveniles, :repro_pitfalls,
      :icon_path, :feed_every_days, :mist_every_days, :diet_type, :size_class, :niche, :substrate_type, :is_draft)
  `).run(fields);
  return { id: info.lastInsertRowid };
}

module.exports = router;
