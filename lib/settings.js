const db = require('../db/db');

// App-wide preferences, kept in the database so the PC and the phone share
// them (e.g. the breeder's name and contact on customer sheets).
function getSettings() {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((r) => [r.key, r.value]));
}

function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

module.exports = { getSettings, setSetting };
