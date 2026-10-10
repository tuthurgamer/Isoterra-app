const db = require('../db/db');
const { CATEGORY_LABELS } = require('../views/helpers/format');

const ORDER = Object.keys(CATEGORY_LABELS);

function categoryRank(category) {
  return ORDER.includes(category) ? ORDER.indexOf(category) : ORDER.length;
}

// The guide's order: by category, then by name.
function compareSpecies(a, b) {
  return categoryRank(a.category) - categoryRank(b.category) || a.scientific_name.localeCompare(b.scientific_name, 'fr');
}

// Every species of the guide in that order, each with `kept`: the number of
// the breeder's bacs it lives in (0 for the catalogue's fiches).
function allSpecies() {
  return db.prepare(`
    SELECT s.*, (SELECT COUNT(DISTINCT bs.bac_id) FROM bac_species bs WHERE bs.species_id = s.id) AS kept
    FROM species s
  `).all().sort(compareSpecies);
}

module.exports = { allSpecies, compareSpecies, categoryRank };
