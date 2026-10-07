const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const db = require('../db/db');
const { collect, ON_PI, ROOT, BACKUP_DIR } = require('../lib/server-info');

// Reached only through Tailscale: `tailscale serve` hands requests to the app
// from the Pi itself. The app also listens on the home network, where anyone
// on the Wi-Fi could otherwise restart or switch off the Pi.
router.use((req, res, next) => {
  const ip = req.socket.remoteAddress || '';
  if (['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) return next();
  res.status(403).send("Le panneau serveur ne s'ouvre que par l'adresse Tailscale de l'app.");
});

router.get('/', async (req, res) => {
  res.render('serveur/index', { title: 'Serveur', active: 'serveur', info: await collect() });
});

router.get('/etat.json', async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await collect());
});

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 60000, encoding: 'utf8', windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).trim()));
      else resolve(stdout.trim());
    });
  });
}

const sudo = (...args) => run('sudo', ['-n', ...args]);

// `piOnly`: needs the Pi's services. `later`: stops this very app, so it is
// answered first and run half a second after.
const ACTIONS = {
  sauvegarde: {
    run: () => run(process.execPath, [path.join(ROOT, 'deploy', 'backup.js'), BACKUP_DIR]),
    done: (out) => `Sauvegarde faite : ${path.basename(out.replace(/^Sauvegarde :\s*/, ''))}`
  },
  'mise-a-jour': {
    piOnly: true,
    run: () => sudo('systemctl', 'start', '--no-block', 'isoterra-update.service'),
    done: () => "Recherche lancée : s'il y a une nouvelle version, l'app redémarre d'ici une minute."
  },
  'redemarrer-app': { piOnly: true, later: true, run: () => sudo('systemctl', 'restart', '--no-block', 'isoterra.service'), done: () => "L'app redémarre…" },
  'redemarrer-pi': { piOnly: true, later: true, run: () => sudo('systemctl', 'reboot'), done: () => 'Le Pi redémarre…' },
  eteindre: { piOnly: true, later: true, run: () => sudo('systemctl', 'poweroff'), done: () => "Le Pi s'éteint…" }
};

// Called by the page's script only: a custom header, which another site
// can't add to a request, keeps a link or a form elsewhere from triggering it.
router.post('/action/:name', async (req, res) => {
  if (req.get('X-Requested-With') !== 'serveur') return res.status(403).json({ ok: false, message: 'Refusé.' });
  const action = ACTIONS[req.params.name];
  if (!action) return res.status(404).json({ ok: false, message: 'Action inconnue.' });
  if (action.piOnly && !ON_PI) return res.json({ ok: false, message: 'Possible seulement sur le Pi.' });
  if (action.later) {
    res.json({ ok: true, message: action.done() });
    setTimeout(() => action.run().catch((err) => console.error('Action serveur', req.params.name, err.message)), 500);
    return;
  }
  try {
    res.json({ ok: true, message: action.done(await action.run()) });
  } catch (err) {
    res.json({ ok: false, message: 'Échec : ' + err.message });
  }
});

// A copy of the database made right now, to keep somewhere other than the
// Pi's card (photos and icons are not in it).
router.get('/telecharger', (req, res) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}h${pad(now.getMinutes())}`;
  const tmp = path.join(os.tmpdir(), `isoterra-copie-${process.pid}-${Date.now()}.db`);
  db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
  res.download(tmp, `isoterra-${stamp}.db`, () => fs.rm(tmp, { force: true }, () => {}));
});

module.exports = router;
