const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { uploadPhotos } = require('../lib/uploads');
const { noteForBac } = require('../lib/bac-log');
const {
  savePhotos, removeUnusedPhotos, deletePhoto, setRating, setSpecies, toggleShowcase, listPhotos, photoCard, byMonth, byRating, card
} = require('../lib/photos');
const { pic } = require('../views/helpers/icons');
const { numTag, CATEGORY_LABELS } = require('../views/helpers/format');

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

// The gallery: every photo, or those taken in a bac (?bac=), or showing a
// species (?espece=); by month, the best rated on top, or all of them by
// their stars (?tri=note).
router.get('/', (req, res) => {
  const bacId = Number(req.query.bac) || null;
  const speciesId = Number(req.query.espece) || null;
  const byStars = req.query.tri === 'note';
  const photos = listPhotos({ bacId, speciesId, best: byStars });
  const top = byStars ? [] : listPhotos({ bacId, speciesId, minRating: 4, best: true, limit: 24 });

  const bacs = db.prepare(`
    SELECT b.id, b.name, GROUP_CONCAT(s.scientific_name, ', ') AS residents, GROUP_CONCAT(s.id) AS species_ids
    FROM bacs b JOIN bac_species bs ON bs.bac_id = b.id JOIN species s ON s.id = bs.species_id
    GROUP BY b.id ORDER BY b.id
  `).all();
  const species = speciesId ? db.prepare('SELECT * FROM species WHERE id = ?').get(speciesId) : null;
  const bac = bacId ? bacs.find((b) => b.id === bacId) : null;
  let filterLabel = null;
  if (bac) filterLabel = 'Bac ' + numTag(bac.id) + ' — ' + bac.residents;
  else if (species) filterLabel = species.scientific_name;
  const query = (extra) => {
    const params = new URLSearchParams();
    if (bacId) params.set('bac', bacId);
    if (speciesId) params.set('espece', speciesId);
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    const s = params.toString();
    return '/photos' + (s ? '?' + s : '');
  };

  res.render('photos/index', {
    title: 'Photos', active: 'photos',
    groups: (byStars ? byRating(photos) : byMonth(photos)).map((g) => ({ label: g.label, photos: g.photos.map(card) })),
    top: top.map(card),
    total: photos.length,
    allCount: db.prepare('SELECT COUNT(*) AS n FROM photos p WHERE EXISTS (SELECT 1 FROM log_entries l WHERE l.photo_path = p.path)').get().n,
    filter: { bacId, speciesId, byStars, label: filterLabel },
    links: { byDate: query({}), byStars: query({ tri: 'note' }) },
    bacs,
    speciesList: db.prepare('SELECT * FROM species').all(),
    notice: req.query.notice || null
  });
});

// Every species of the guide, for the viewer's "Espèces" panel: those of
// the photo's bac (?bac=) first.
router.get('/especes.json', (req, res) => {
  const bacId = Number(req.query.bac) || null;
  const inBac = new Set(bacId ? db.prepare('SELECT species_id FROM bac_species WHERE bac_id = ?').all(bacId).map((r) => r.species_id) : []);
  const rank = (c) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  const list = db.prepare('SELECT * FROM species').all()
    .sort((a, b) => rank(a.category) - rank(b.category) || a.scientific_name.localeCompare(b.scientific_name, 'fr'))
    .map((s) => ({ id: s.id, name: s.scientific_name, pic: pic(s), group: inBac.has(s.id) ? 'Dans ce bac' : CATEGORY_LABELS[s.category] || 'Autres' }));
  res.json([...list.filter((s) => s.group === 'Dans ce bac'), ...list.filter((s) => s.group !== 'Dans ce bac')]);
});

// Photos sent from the gallery, for a bac (or one species of it).
router.post('/', uploadPhotos, (req, res) => {
  const b = req.body || {};
  const bacId = Number(b.bac_id);
  const photos = savePhotos(req.files, b);
  if (!photos.length) return res.redirect('/photos?notice=' + encodeURIComponent('Choisis au moins une photo'));
  const written = bacId && noteForBac(bacId, {
    type: 'observation', note: String(b.note || '').trim() || null, photos, ficheId: Number(b.fiche_id) || null
  });
  if (!written) {
    removeUnusedPhotos(photos);
    return res.status(400).send('Bac introuvable.');
  }
  const notice = photos.length > 1 ? `${photos.length} photos ajoutées` : 'Photo ajoutée';
  res.redirect(`/photos?notice=${encodeURIComponent(notice)}`);
});

// The viewer's buttons, sent by script only (a custom header that another
// site can't add). Each answers with the photo as the viewer shows it.
router.use('/:id', (req, res, next) => {
  if (req.method === 'POST' && req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ ok: false });
  next();
});

router.post('/:id/note', express.json(), (req, res) => {
  if (setRating(Number(req.params.id), (req.body || {}).rating) === null) return res.status(404).json({ ok: false });
  res.json({ ok: true, photo: photoCard(Number(req.params.id)) });
});

router.post('/:id/especes', express.json(), (req, res) => {
  const b = req.body || {};
  if (!setSpecies(Number(req.params.id), Number(b.species_id), Boolean(b.on))) return res.status(404).json({ ok: false });
  res.json({ ok: true, photo: photoCard(Number(req.params.id)) });
});

router.post('/:id/fiche-client', express.json(), (req, res) => {
  const speciesId = Number((req.body || {}).species_id);
  const chosen = toggleShowcase(Number(req.params.id), speciesId);
  if (chosen === null) return res.status(404).json({ ok: false });
  const sp = db.prepare('SELECT scientific_name FROM species WHERE id = ?').get(speciesId);
  res.json({
    ok: true, chosen, photo: photoCard(Number(req.params.id)),
    message: chosen ? `Photo choisie pour la fiche client de ${sp.scientific_name}` : `Photo retirée de la fiche client de ${sp.scientific_name}`
  });
});

router.post('/:id/supprimer', (req, res) => {
  if (!deletePhoto(Number(req.params.id))) return res.status(404).json({ ok: false });
  res.json({ ok: true });
});

module.exports = router;
