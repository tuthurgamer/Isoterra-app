// The species catalogue: fiches of species the breeder doesn't keep (yet),
// to help choose the next ones. Each version is added to the guide once —
// never again, so a fiche deleted from the guide doesn't come back. The next
// batch gets `since: 6` and CATALOGUE_VERSION goes up to 6.
const { defaultCare } = require('../care-defaults');
const { defaultTraits } = require('../trait-defaults');
const { familyOf, CATEGORY_OF_FAMILY } = require('../taxonomy');

const CATALOGUE_VERSION = 5;

const ENTRIES = [
  'iules', 'cloportes', 'blattes', 'cetoines', 'coleopteres', 'escargots', 'crabes',
  'reduves', 'mantes', 'phasmes', 'arachnides', 'scolopendres', 'autres',
  // Version 2: isopods and millipedes sold in France.
  'cloportes-france', 'iules-france',
  // Version 3: the other species of those shops.
  'mantes-boutiques', 'phasmes-boutiques', 'blattes-boutiques', 'cetoines-boutiques',
  'coleopteres-boutiques', 'divers-boutiques', 'orthopteres-autres-boutiques',
  'araignees-boutiques', 'scorpions-boutiques',
  // Version 4: many more isopods, European and tropical.
  'cloportes-europe', 'cloportes-tropicaux',
  // Version 5: land snails and slugs sold by breeders.
  'escargots-boutiques'
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

// Categories that a broader one gave way to: species of "Autres espèces",
// and the spiders and scorpions of "Autres arachnides", move to their own.
const NARROWED = { autre: null, arachnide: ['araignee', 'scorpion'] };
const SCORPION_RULES = 'Réglementé en France : souvent soumis au certificat de capacité (CDC), à vérifier auprès de la DDPP avant l’achat';

function refile(db) {
  const move = db.prepare('UPDATE species SET category = ? WHERE id = ?');
  for (const sp of db.prepare('SELECT id, category, family FROM species WHERE family IS NOT NULL').all()) {
    const target = CATEGORY_OF_FAMILY[sp.family];
    if (!target || target === sp.category || !(sp.category in NARROWED)) continue;
    const allowed = NARROWED[sp.category];
    if (!allowed || allowed.includes(target)) move.run(target, sp.id);
  }
  // Scorpions already in the guide get the French rules in their warning.
  db.prepare(`UPDATE species SET vigilance = ? || CASE WHEN vigilance IS NULL OR vigilance = '' OR vigilance = 'Aucune' THEN '' ELSE ' ; ' || vigilance END
    WHERE category = 'scorpion' AND (vigilance IS NULL OR vigilance NOT LIKE 'Réglementé%')`).run(SCORPION_RULES);
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
    if (installed < 3) refile(db);
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
