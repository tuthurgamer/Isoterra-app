const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const stock = db.prepare(`
    SELECT bs.*, bs.id AS id, s.scientific_name, s.category
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

module.exports = router;
