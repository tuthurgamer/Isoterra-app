const express = require('express');
const router = express.Router();
const db = require('../db/db');

const STAGES = [
  { key: 'accouplement', label: 'Accouplement observé' },
  { key: 'ponte', label: 'Ponte confirmée' },
  { key: 'incubation', label: 'Incubation' },
  { key: 'naissance', label: 'Naissances récentes' }
];

router.get('/', (req, res) => {
  const bacs = db.prepare(`
    SELECT b.*, s.common_name, s.scientific_name, s.category
    FROM bacs b JOIN species s ON s.id = b.species_id
    WHERE b.breeding_stage IS NOT NULL
    ORDER BY b.updated_at DESC
  `).all();

  const columns = STAGES.map(stage => ({
    ...stage,
    items: bacs.filter(b => b.breeding_stage === stage.key)
  }));

  res.render('pontes/index', { title: 'Pontes & couvain', active: 'pontes', columns });
});

module.exports = router;
