const db = require('../db/db');

// The tournée's order, one step per bac: a mixed bac is fed, misted and
// cleaned in one go, so its species are visited together. Bacs looked at
// longest ago come first.
function buildQueue() {
  return db.prepare(`
    SELECT bac_id FROM bac_species
    GROUP BY bac_id
    ORDER BY MAX(last_checked_at) IS NOT NULL, MAX(last_checked_at) ASC, bac_id ASC
  `).all().map((r) => r.bac_id);
}

module.exports = { buildQueue };
