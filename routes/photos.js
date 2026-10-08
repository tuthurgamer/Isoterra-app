const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { uploadPhotos } = require('../lib/uploads');
const { noteForBac } = require('../lib/bac-log');
const { savePhotos, removeUnusedPhotos, deletePhoto, toggleFavorite, toggleShowcase, listPhotos, byMonth, card } = require('../lib/photos');
const { numTag } = require('../views/helpers/format');

// The gallery: every photo, or those of a bac (?bac=), of a species
// (?espece=), or the favourites (?favoris=1), grouped by month.
router.get('/', (req, res) => {
  const bacId = Number(req.query.bac) || null;
  const speciesId = Number(req.query.espece) || null;
  const favorite = req.query.favoris === '1';
  const photos = listPhotos({ bacId, speciesId, favorite });

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

  res.render('photos/index', {
    title: 'Photos', active: 'photos',
    months: byMonth(photos).map((m) => ({ label: m.label, photos: m.photos.map(card) })),
    total: photos.length,
    allCount: db.prepare('SELECT COUNT(*) AS n FROM photos p WHERE EXISTS (SELECT 1 FROM log_entries l WHERE l.photo_path = p.path)').get().n,
    favoriteCount: db.prepare('SELECT COUNT(*) AS n FROM photos WHERE favorite = 1').get().n,
    filter: { bacId, speciesId, favorite, label: filterLabel },
    bacs,
    speciesList: db.prepare('SELECT * FROM species').all(),
    notice: req.query.notice || null
  });
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
// site can't add).
router.use('/:id', (req, res, next) => {
  if (req.method === 'POST' && req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ ok: false });
  next();
});

router.post('/:id/favori', (req, res) => {
  const favorite = toggleFavorite(Number(req.params.id));
  if (favorite === null) return res.status(404).json({ ok: false });
  res.json({ ok: true, favorite });
});

router.post('/:id/fiche-client', express.json(), (req, res) => {
  const speciesId = Number((req.body || {}).species_id);
  const chosen = toggleShowcase(Number(req.params.id), speciesId);
  if (chosen === null) return res.status(404).json({ ok: false });
  const sp = db.prepare('SELECT scientific_name FROM species WHERE id = ?').get(speciesId);
  res.json({
    ok: true, chosen,
    message: chosen ? `Photo choisie pour la fiche client de ${sp.scientific_name}` : `Photo retirée de la fiche client de ${sp.scientific_name}`
  });
});

router.post('/:id/supprimer', (req, res) => {
  if (!deletePhoto(Number(req.params.id))) return res.status(404).json({ ok: false });
  res.json({ ok: true });
});

module.exports = router;
