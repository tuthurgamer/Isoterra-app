const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = process.env.ISOTERRA_DB || path.join(__dirname, '..', 'data', 'isoterra.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

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

const ficheColumns = db.prepare("PRAGMA table_info(bac_species)").all().map((c) => c.name);
if (!ficheColumns.includes('feed_every_days')) {
  db.exec('ALTER TABLE bac_species ADD COLUMN feed_every_days INTEGER');
  db.exec('ALTER TABLE bac_species ADD COLUMN mist_every_days INTEGER');
}

module.exports = db;
