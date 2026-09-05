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
  const fiches = db.prepare(`
    SELECT bs.*, bs.id AS id, s.scientific_name, s.category
    FROM bac_species bs JOIN species s ON s.id = bs.species_id
    WHERE bs.breeding_stage IS NOT NULL
    ORDER BY bs.updated_at DESC
  `).all();

  const columns = STAGES.map(stage => ({
    ...stage,
    items: fiches.filter(f => f.breeding_stage === stage.key)
  }));

  res.render('pontes/index', { title: 'Pontes & couvain', active: 'pontes', columns });
});

module.exports = router;
