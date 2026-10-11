const express = require('express');
const router = express.Router();
const rappels = require('../lib/rappels');
const { setSetting } = require('../lib/settings');

// Requests made by the page's script (fetch with this header), which a form
// from another site can't send.
function fromPage(req, res, next) {
  if (req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ ok: false });
  next();
}

const json = express.json({ limit: '16kb' });

// Hours offered for the daily reminder.
const TIMES = [];
for (let h = 5; h <= 22; h++) for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);

router.get('/', (req, res) => {
  const care = rappels.todaysCare();
  res.render('rappels/index', {
    title: 'Rappels', active: null,
    publicKey: rappels.publicKey(),
    time: rappels.reminderTime(),
    times: TIMES,
    phones: rappels.subscriptions(),
    preview: care ? rappels.messageFor(care) : null,
    notice: req.query.notice || null
  });
});

router.post('/reglages', (req, res) => {
  const time = String((req.body || {}).heure || '');
  if (TIMES.includes(time)) setSetting('rappels_heure', time);
  res.redirect('/rappels?notice=' + encodeURIComponent('Heure enregistrée : ' + time.replace(':', ' h ')));
});

// This phone asks for the reminders (its push subscription, from the browser).
router.post('/abonnement', fromPage, json, (req, res) => {
  const b = req.body || {};
  const id = rappels.saveSubscription(b.subscription, b.label);
  if (!id) return res.status(400).json({ ok: false });
  res.json({ ok: true, id });
});

router.post('/desabonnement', fromPage, json, (req, res) => {
  const endpoint = String((req.body || {}).endpoint || '');
  if (endpoint) rappels.removeSubscription({ endpoint });
  res.json({ ok: true });
});

// A reminder right now, to this phone only: today's list, or a short test
// message when there is nothing to do.
router.post('/essai', fromPage, json, async (req, res) => {
  const endpoint = String((req.body || {}).endpoint || '');
  const phone = rappels.subscriptions().find((s) => s.endpoint === endpoint);
  if (!phone) return res.status(404).json({ ok: false });
  const care = rappels.todaysCare();
  const message = care
    ? rappels.messageFor(care)
    : { title: 'Rappels activés', body: "Rien à faire aujourd'hui : tous les bacs sont à jour.", url: '/rappels', tag: 'essai' };
  const sent = await rappels.send(message, [phone]);
  res.json({ ok: sent > 0 });
});

router.post('/:id/retirer', (req, res) => {
  rappels.removeSubscription({ id: Number(req.params.id) || 0 });
  res.redirect('/rappels?notice=' + encodeURIComponent('Téléphone retiré'));
});

module.exports = router;
