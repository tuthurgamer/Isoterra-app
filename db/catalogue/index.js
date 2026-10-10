// The species catalogue: fiches of species the breeder doesn't keep (yet),
// to help choose the next ones. Each version is added to the guide once —
// never again, so a fiche deleted from the guide doesn't come back. A later
// addition gets `since: 2` and CATALOGUE_VERSION goes up to 2.
const { defaultCare } = require('../care-defaults');
const { defaultTraits } = require('../trait-defaults');
const { familyOf } = require('../taxonomy');

const CATALOGUE_VERSION = 1;

const ENTRIES = [
  'iules', 'cloportes', 'blattes', 'cetoines', 'coleopteres', 'escargots', 'crabes',
  'reduves', 'mantes', 'phasmes', 'arachnides', 'scolopendres', 'autres'
].flatMap((file) => require('./' + file));

const COLUMNS = [
  'category', 'common_name', 'scientific_name', 'family', 'difficulty',
  'humidity_min', 'humidity_max', 'temp_min', 'temp_max',
  'sociability', 'diet_summary', 'vigilance', 'presentation', 'habitat', 'feeding_detail',
  'repro_sexing', 'repro_conditions', 'repro_mating', 'repro_incubation', 'repro_juveniles', 'repro_pitfalls',
  'lifespan', 'feed_every_days', 'mist_every_days', 'diet_type', 'size_class', 'niche', 'substrate_type'
];

// One row of the species table: the fiche, its family from the genus, and
// the usual care rhythms and traits where it brings none of its own.
function speciesRow(entry) {
  const row = { ...entry, ...defaultCare(entry), ...defaultTraits(entry) };
  row.family = entry.family || familyOf(entry.scientific_name);
  return Object.fromEntries(COLUMNS.map((c) => [c, row[c] ?? null]));
}

function installCatalogue(db) {
  const done = db.prepare("SELECT value FROM settings WHERE key = 'catalogue_version'").get();
  const installed = Number(done && done.value) || 0;
  if (installed >= CATALOGUE_VERSION) return 0;

  const exists = db.prepare('SELECT 1 FROM species WHERE scientific_name = ?');
  const insert = db.prepare(`INSERT INTO species (${COLUMNS.join(', ')}, is_draft)
    VALUES (${COLUMNS.map((c) => ':' + c).join(', ')}, 1)`);
  let added = 0;
  db.exec('BEGIN');
  try {
    for (const entry of ENTRIES) {
      if ((entry.since || 1) <= installed || exists.get(entry.scientific_name)) continue;
      insert.run(speciesRow(entry));
      added++;
    }
    db.prepare(`INSERT INTO settings (key, value) VALUES ('catalogue_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(CATALOGUE_VERSION));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return added;
}

module.exports = { installCatalogue, ENTRIES };
