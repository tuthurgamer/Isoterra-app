const express = require('express');
const router = express.Router();
const { offlinePages } = require('../lib/hors-ligne');

// What the phone keeps for when it has no network (public/service-worker.js).
router.get('/pages.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(offlinePages());
});

module.exports = router;
