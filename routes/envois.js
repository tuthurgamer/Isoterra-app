const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const { uploadCopies } = require('../lib/uploads');
const { PIECE_MAX, validId, partFile, received, roomFor, finish } = require('../lib/envois');

// Photos and videos sent in pieces (see lib/envois.js), by the page's
// script only: a header that another site can't add.
router.use((req, res, next) => {
  if (req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ ok: false });
  if (!validId(req.params.id || req.path.split('/')[1])) return res.status(400).json({ ok: false });
  next();
});

// How much of a file the Pi already has.
router.get('/:id', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ received: received(req.params.id) });
});

// One piece, appended at ?offset= (which must be what the Pi has). A piece
// cut on the way is kept as far as it came: the phone asks again and goes
// on from there.
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const have = received(id);
  if (Number(req.query.offset) !== have) return res.status(409).json({ received: have });
  if (Number(req.get('content-length')) > PIECE_MAX) return res.status(413).json({ message: 'Morceau trop gros.' });
  if (have === 0 && !roomFor(req.get('X-Envoi-Taille'))) {
    return res.status(507).json({ message: 'Plus assez de place sur le Pi pour ce fichier.' });
  }
  const out = fs.createWriteStream(partFile(id), { flags: 'a' });
  req.pipe(out);
  req.on('close', () => { if (!req.complete) out.end(); });
  out.on('finish', () => { if (!res.headersSent) res.json({ received: received(id) }); });
  out.on('error', () => { if (!res.headersSent) res.status(500).json({ message: "Le Pi n'a pas pu écrire le fichier." }); });
});

// All pieces in: the file joins the gallery (body: "meta" JSON, "thumb" and
// "view" copies).
router.post('/:id/fin', uploadCopies, (req, res) => {
  let meta = {};
  try { meta = JSON.parse((req.body || {}).meta || '{}'); } catch { /* checked below */ }
  const result = finish(req.params.id, meta, req.files || {});
  if (result.ok) return res.json(result);
  res.status(result.status || 400).json({ ok: false, message: result.message, received: result.received });
});

module.exports = router;
