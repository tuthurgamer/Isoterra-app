const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../db/db');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  }
});

router.get('/', (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, bs.bac_id, bs.morph, s.scientific_name, s.category
    FROM log_entries l
    JOIN bac_species bs ON bs.id = l.bac_species_id
    JOIN species s ON s.id = bs.species_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `).all();
  res.render('journal/index', { title: 'Journal', active: 'journal', logs });
});

router.get('/new', (req, res) => {
  const ficheId = req.query.fiche_id;
  if (!ficheId) {
    const fiches = db.prepare(`
      SELECT bs.id, bs.bac_id, bs.morph, s.scientific_name
      FROM bac_species bs JOIN species s ON s.id = bs.species_id
      ORDER BY s.scientific_name
    `).all();
    return res.render('journal/pick', { title: 'Nouvelle entrée', active: 'journal', fiches });
  }
  const bacSpecies = db.prepare(`
    SELECT bs.*, s.scientific_name FROM bac_species bs JOIN species s ON s.id = bs.species_id WHERE bs.id = ?
  `).get(ficheId);
  if (!bacSpecies) return res.status(404).render('404', { path: req.path });
  res.render('journal/new', { title: 'Nouvelle entrée', active: 'journal', bacSpecies });
});

router.post('/', upload.single('photo'), (req, res) => {
  const { fiche_id, type, note } = req.body;
  if (!fiche_id || !type) return res.status(400).send('Fiche et type requis');
  const photoPath = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO log_entries (bac_species_id, type, note, photo_path) VALUES (?, ?, ?, ?)')
    .run(fiche_id, type, note || null, photoPath);
  db.prepare("UPDATE bac_species SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(fiche_id);
  res.redirect('/fiches/' + fiche_id);
});

module.exports = router;
