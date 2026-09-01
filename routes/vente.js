const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const stock = db.prepare(`
    SELECT b.*, s.common_name, s.scientific_name, s.category
    FROM bacs b JOIN species s ON s.id = b.species_id
    WHERE b.for_sale_quantity > 0
    ORDER BY b.updated_at DESC
  `).all();

  const orders = db.prepare(`
    SELECT o.*, b.morph, s.common_name
    FROM orders o
    LEFT JOIN bacs b ON b.id = o.bac_id
    LEFT JOIN species s ON s.id = b.species_id
    ORDER BY o.created_at DESC
  `).all();

  const stats = {
    stockTotal: stock.reduce((sum, b) => sum + b.for_sale_quantity, 0),
    ordersOpen: orders.filter(o => o.status !== 'livre').length,
    revenueMonth: db.prepare(`
      SELECT COALESCE(SUM(b.unit_price), 0) AS total
      FROM log_entries l JOIN bacs b ON b.id = l.bac_id
      WHERE l.type = 'vente' AND l.created_at >= date('now', 'start of month', 'localtime')
    `).get().total
  };

  res.render('vente/index', { title: 'Stock & ventes', active: 'vente', stock, orders, stats });
});

router.post('/orders', (req, res) => {
  const { customer_name, description, bac_id, status } = req.body;
  db.prepare('INSERT INTO orders (customer_name, description, bac_id, status) VALUES (?, ?, ?, ?)')
    .run(customer_name, description, bac_id || null, status || 'en_preparation');
  res.redirect('/vente');
});

router.post('/orders/:id/status', (req, res) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.redirect('/vente');
});

module.exports = router;
