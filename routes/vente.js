const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { listPhotos, card } = require('../lib/photos');
const { getSettings, setSetting } = require('../lib/settings');
const { CATEGORY_LABELS, numTag } = require('../views/helpers/format');

router.get('/', (req, res) => {
  const stock = db.prepare(`
    SELECT bs.*, bs.id AS id, s.scientific_name, s.category, s.icon_path
    FROM bac_species bs JOIN species s ON s.id = bs.species_id
    WHERE bs.for_sale_quantity > 0
    ORDER BY bs.updated_at DESC
  `).all();

  const orders = db.prepare(`
    SELECT o.*, bs.morph, s.common_name
    FROM orders o
    LEFT JOIN bac_species bs ON bs.id = o.bac_species_id
    LEFT JOIN species s ON s.id = bs.species_id
    ORDER BY o.created_at DESC
  `).all();

  const stats = {
    stockTotal: stock.reduce((sum, b) => sum + b.for_sale_quantity, 0),
    ordersOpen: orders.filter(o => o.status !== 'livre').length,
    revenueMonth: db.prepare(`
      SELECT COALESCE(SUM(bs.unit_price), 0) AS total
      FROM log_entries l JOIN bac_species bs ON bs.id = l.bac_species_id
      WHERE l.type = 'vente' AND l.created_at >= date('now', 'start of month', 'localtime')
    `).get().total
  };

  res.render('vente/index', { title: 'Stock & ventes', active: 'vente', stock, orders, stats });
});

router.post('/orders', (req, res) => {
  const { customer_name, description, bac_species_id, status } = req.body;
  db.prepare('INSERT INTO orders (customer_name, description, bac_species_id, status) VALUES (?, ?, ?, ?)')
    .run(customer_name, description, bac_species_id || null, status || 'en_preparation');
  res.redirect('/vente');
});

router.post('/orders/:id/status', (req, res) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.redirect('/vente');
});

// A sale ad for one population: its photos to choose from (only those
// showing its species, the best rated first), and what the text and the
// image are made of. Populations for sale come first, then the others.
router.get('/annonce', (req, res) => {
  const fiches = db.prepare(`
    SELECT bs.id, bs.bac_id, bs.morph, bs.for_sale_quantity, bs.unit_price, bs.lineage, bs.breeding_stage,
           s.id AS species_id, s.scientific_name, s.common_name, s.category, s.icon_path, s.difficulty,
           s.temp_min, s.temp_max, s.humidity_min, s.humidity_max, s.diet_summary, s.presentation,
           s.lifespan, s.size_class, s.sociability
    FROM bac_species bs JOIN species s ON s.id = bs.species_id
    ORDER BY bs.for_sale_quantity > 0 DESC, s.scientific_name, bs.id
  `).all();
  const fiche = fiches.find((f) => f.id === Number(req.query.fiche)) || fiches[0] || null;
  const photos = fiche
    ? listPhotos({ speciesId: fiche.species_id, best: true, limit: 120 }).filter((p) => p.kind !== 'video').map(card)
    : [];
  const settings = getSettings();
  res.render('vente/annonce', {
    title: 'Annonce', active: 'vente', fiches, fiche, photos,
    ad: fiche && {
      name: fiche.scientific_name + (fiche.morph ? ` '${fiche.morph}'` : ''),
      common: fiche.common_name || '',
      category: fiche.category,
      categoryLabel: CATEGORY_LABELS[fiche.category] || '',
      bac: numTag(fiche.bac_id),
      quantity: fiche.for_sale_quantity || 0,
      price: fiche.unit_price || null,
      difficulty: fiche.difficulty,
      temp: fiche.temp_min && fiche.temp_max ? [fiche.temp_min, fiche.temp_max] : null,
      humidity: fiche.humidity_min && fiche.humidity_max ? [fiche.humidity_min, fiche.humidity_max] : null,
      diet: fiche.diet_summary || '',
      presentation: fiche.presentation || '',
      lifespan: fiche.lifespan || '',
      lineage: fiche.lineage || '',
      breeder: settings.breeder_name || '',
      contact: settings.breeder_contact || ''
    },
    prefs: {
      lieu: settings.annonce_lieu || '',
      envoi: settings.annonce_envoi !== '0',
      main: settings.annonce_main !== '0',
      style: settings.annonce_style || 'sobre'
    }
  });
});

// What an ad says every time (where, how it's handed over, its style),
// kept for the next one; the signature and contact are those of the
// customer sheets.
router.post('/annonce/reglages', express.json(), (req, res) => {
  const b = req.body || {};
  setSetting('breeder_name', String(b.breeder || '').trim().slice(0, 80));
  setSetting('breeder_contact', String(b.contact || '').trim().slice(0, 160));
  setSetting('annonce_lieu', String(b.lieu || '').trim().slice(0, 80));
  setSetting('annonce_envoi', b.envoi ? '1' : '0');
  setSetting('annonce_main', b.main ? '1' : '0');
  setSetting('annonce_style', b.style === 'reseaux' ? 'reseaux' : 'sobre');
  res.json({ ok: true });
});

module.exports = router;
