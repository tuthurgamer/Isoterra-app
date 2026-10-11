const db = require('../db/db');
const { buildQueue } = require('./tournee-queue');

// Actions noted on the phone while it had no network: the service worker
// (public/service-worker.js) keeps them and sends them once the Pi answers
// again. Each one carries a reference, so one sent twice (the network came
// back just as it left the phone) is written once, and the time it was
// done at, which the journal keeps instead of the time it arrived.
const MAX_DAYS = 7;

// The time an action was done ("YYYY-MM-DD HH:MM:SS", the Pi's local time),
// from the phone's clock in milliseconds. A phone a little ahead counts as
// now; older than a week, or unreadable, it is left out (now, then).
function doneAt(value) {
  const ms = Number(value);
  const now = Date.now();
  if (!value || !Number.isFinite(ms) || ms < now - MAX_DAYS * 86400000) return null;
  return db.prepare("SELECT datetime(?, 'unixepoch', 'localtime') AS t").get(Math.floor(Math.min(ms, now) / 1000)).t;
}

function replayed(req, res, next) {
  if (req.method !== 'POST') return next();
  const ref = req.get('X-Isoterra-Ref');
  if (ref) {
    if (!/^[\w-]{8,64}$/.test(ref)) return res.status(400).send('Référence invalide');
    const fresh = db.prepare('INSERT OR IGNORE INTO actions_recues (ref) VALUES (?)').run(ref).changes;
    if (!fresh) return res.json({ ok: true, deja: true });
    // Refused or failed: the phone may send it again.
    res.on('finish', () => {
      if (res.statusCode >= 400) db.prepare('DELETE FROM actions_recues WHERE ref = ?').run(ref);
    });
  }
  req.doneAt = doneAt(req.get('X-Isoterra-Fait-Le'));
  next();
}

// The pages a phone keeps for when it has no network: the home page, each
// bac's page and its step of the tournée, and the end of the tournée. Each
// comes with a stamp that changes with the bac (and every day, for the
// "fed 3 days ago"), so the phone only fetches again what changed.
function offlinePages() {
  const today = db.prepare("SELECT date('now', 'localtime') AS d").get().d;
  const bacs = db.prepare(`
    SELECT b.id, b.updated_at,
      MAX(bs.updated_at) AS fiches_at, MAX(bs.last_checked_at) AS checked_at,
      (SELECT MAX(l.created_at) FROM log_entries l JOIN bac_species x ON x.id = l.bac_species_id WHERE x.bac_id = b.id) AS log_at,
      COUNT(bs.id) AS n
    FROM bacs b JOIN bac_species bs ON bs.bac_id = b.id
    GROUP BY b.id
    ORDER BY b.id
  `).all();
  const pages = [{ url: '/', key: '/', stamp: null }];
  for (const b of bacs) {
    const stamp = [today, b.updated_at, b.fiches_at, b.checked_at, b.log_at, b.n].join('|');
    pages.push({ url: `/bacs/${b.id}`, key: `/bacs/${b.id}`, stamp });
    pages.push({ url: `/tournee/step?bacs=${b.id}&i=0`, key: `/tournee/bac/${b.id}`, stamp });
  }
  pages.push({ url: '/tournee/step?bacs=0&i=1', key: '/tournee/fin', stamp: today });
  return { tournee: buildQueue(), pages };
}

module.exports = { replayed, offlinePages };
