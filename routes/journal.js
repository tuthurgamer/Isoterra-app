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
    SELECT l.*, b.morph, s.common_name, s.scientific_name, s.category
    FROM log_entries l
    JOIN bacs b ON b.id = l.bac_id
    JOIN species s ON s.id = b.species_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `).all();
  res.render('journal/index', { title: 'Journal', active: 'journal', logs });
});

router.get('/new', (req, res) => {
  const bacId = req.query.bac_id;
  if (!bacId) {
    const bacs = db.prepare(`
      SELECT b.id, b.morph, s.common_name FROM bacs b JOIN species s ON s.id = b.species_id ORDER BY s.common_name
    `).all();
    return res.render('journal/pick', { title: 'Nouvelle entrée', active: 'journal', bacs });
  }
  const bac = db.prepare(`
    SELECT b.*, s.common_name, s.scientific_name FROM bacs b JOIN species s ON s.id = b.species_id WHERE b.id = ?
  `).get(bacId);
  if (!bac) return res.status(404).render('404', { path: req.path });
  res.render('journal/new', { title: 'Nouvelle entrée', active: 'journal', bac });
});

router.post('/', upload.single('photo'), (req, res) => {
  const { bac_id, type, note } = req.body;
  if (!bac_id || !type) return res.status(400).send('Bac et type requis');
  const photoPath = req.file ? '/uploads/' + req.file.filename : null;
  db.prepare('INSERT INTO log_entries (bac_id, type, note, photo_path) VALUES (?, ?, ?, ?)')
    .run(bac_id, type, note || null, photoPath);
  db.prepare("UPDATE bacs SET last_checked_at = datetime('now', 'localtime') WHERE id = ?").run(bac_id);
  res.redirect('/fiches/' + bac_id);
});

module.exports = router;
