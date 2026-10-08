const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = process.env.ISOTERRA_DB || path.join(__dirname, '..', 'data', 'isoterra.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

// Tables whose arrival brings a one-time filling (see below).
const hadPhotoSpecies = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'photo_species'").get());

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Lightweight migration: schema.sql only creates tables that don't exist yet,
// so a database created before a column was added needs it patched in here.
const speciesColumns = db.prepare("PRAGMA table_info(species)").all().map((c) => c.name);
if (!speciesColumns.includes('icon_path')) {
  db.exec('ALTER TABLE species ADD COLUMN icon_path TEXT');
}
if (!speciesColumns.includes('feed_every_days')) {
  // Existing species get starting rhythms once, when the columns appear —
  // never again, so later edits in the guide are left alone.
  const { defaultCare } = require('./care-defaults');
  db.exec('BEGIN');
  db.exec('ALTER TABLE species ADD COLUMN feed_every_days INTEGER');
  db.exec('ALTER TABLE species ADD COLUMN mist_every_days INTEGER');
  const setCare = db.prepare('UPDATE species SET feed_every_days = :feed_every_days, mist_every_days = :mist_every_days WHERE id = :id');
  for (const sp of db.prepare('SELECT id, category, scientific_name, humidity_min FROM species').all()) {
    setCare.run({ id: sp.id, ...defaultCare(sp) });
  }
  db.exec('COMMIT');
}

if (!speciesColumns.includes('diet_type')) {
  // Same one-time seeding as the care rhythms: starting cohabitation traits
  // for the species already in the guide.
  const { defaultTraits } = require('./trait-defaults');
  db.exec('BEGIN');
  for (const col of ['diet_type', 'size_class', 'niche', 'substrate_type']) {
    db.exec(`ALTER TABLE species ADD COLUMN ${col} TEXT`);
  }
  const setTraits = db.prepare(`UPDATE species SET diet_type = :diet_type, size_class = :size_class,
    niche = :niche, substrate_type = :substrate_type WHERE id = :id`);
  for (const sp of db.prepare('SELECT id, category, scientific_name FROM species').all()) {
    setTraits.run({ id: sp.id, ...defaultTraits(sp) });
  }
  db.exec('COMMIT');
}

if (!speciesColumns.includes('lifespan')) {
  // Life expectancy, filled once for the species already in the guide; the
  // giant land snails move at the same time to their own "Escargots" category.
  const { defaultLifespan, SNAIL_GENERA } = require('./lifespan-defaults');
  db.exec('BEGIN');
  db.exec('ALTER TABLE species ADD COLUMN lifespan TEXT');
  const setLifespan = db.prepare('UPDATE species SET lifespan = ? WHERE id = ?');
  const toSnails = db.prepare("UPDATE species SET category = 'escargot' WHERE id = ? AND category = 'autre'");
  for (const sp of db.prepare('SELECT id, scientific_name FROM species').all()) {
    const lifespan = defaultLifespan(sp.scientific_name);
    if (lifespan) setLifespan.run(lifespan, sp.id);
    if (SNAIL_GENERA.some((genus) => sp.scientific_name.startsWith(genus + ' '))) toSnails.run(sp.id);
  }
  db.exec('COMMIT');
}

// The photo of their own animals shown on a species' customer sheet.
if (!speciesColumns.includes('showcase_photo')) {
  db.exec('ALTER TABLE species ADD COLUMN showcase_photo TEXT');
}

// Journal photos sent before the gallery existed get their gallery row
// (the photo itself stands in for its thumbnail).
db.exec(`
  INSERT OR IGNORE INTO photos (path, thumb_path, taken_at, created_at)
  SELECT photo_path, photo_path, MIN(created_at), MIN(created_at) FROM log_entries
  WHERE photo_path IS NOT NULL GROUP BY photo_path
`);

// Photos get a 0-to-5-star rating; the favourites of before become 5 stars.
const photoColumns = db.prepare('PRAGMA table_info(photos)').all().map((c) => c.name);
if (!photoColumns.includes('rating')) {
  db.exec('ALTER TABLE photos ADD COLUMN rating INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE photos SET rating = 5 WHERE favorite = 1');
}
if (!photoColumns.includes('caption')) {
  db.exec('ALTER TABLE photos ADD COLUMN caption TEXT');
}

// The species of each photo are chosen photo by photo; when that arrives,
// every photo starts with the species of the entries it was sent with.
if (!hadPhotoSpecies) {
  db.exec(`
    INSERT OR IGNORE INTO photo_species (photo_id, species_id)
    SELECT DISTINCT p.id, bs.species_id FROM photos p
    JOIN log_entries l ON l.photo_path = p.path JOIN bac_species bs ON bs.id = l.bac_species_id
  `);
}

const ficheColumns = db.prepare("PRAGMA table_info(bac_species)").all().map((c) => c.name);
if (!ficheColumns.includes('feed_every_days')) {
  db.exec('ALTER TABLE bac_species ADD COLUMN feed_every_days INTEGER');
  db.exec('ALTER TABLE bac_species ADD COLUMN mist_every_days INTEGER');
}

module.exports = db;
