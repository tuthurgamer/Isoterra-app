// Nightly copy of the database (run by isoterra-backup.timer on the Pi):
// a consistent snapshot even while the app is running. Keeps the last 30.
//   node deploy/backup.js [backup folder]
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const KEEP = 30;
const dbFile = process.env.ISOTERRA_DB || path.join(__dirname, '..', 'data', 'isoterra.db');
const dir = path.resolve(process.argv[2] || path.join(os.homedir(), 'isoterra-sauvegardes'));
fs.mkdirSync(dir, { recursive: true });

const target = path.join(dir, `isoterra-${new Date().toISOString().slice(0, 10)}.db`);
fs.rmSync(target, { force: true });
const db = new DatabaseSync(dbFile);
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();

const old = fs.readdirSync(dir).filter((f) => /^isoterra-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().slice(0, -KEEP);
for (const f of old) fs.rmSync(path.join(dir, f));
console.log('Sauvegarde :', target);
