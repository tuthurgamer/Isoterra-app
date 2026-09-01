CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 3,
  humidity_min INTEGER,
  humidity_max INTEGER,
  temp_min INTEGER,
  temp_max INTEGER,
  sociability TEXT,
  diet_summary TEXT,
  vigilance TEXT,
  presentation TEXT,
  habitat TEXT,
  feeding_detail TEXT,
  repro_sexing TEXT,
  repro_conditions TEXT,
  repro_mating TEXT,
  repro_incubation TEXT,
  repro_juveniles TEXT,
  repro_pitfalls TEXT,
  is_draft INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- A bac is the physical enclosure. It can hold more than one species
-- (a common setup: an isopod cleanup crew cohabiting with a millipede).
CREATE TABLE IF NOT EXISTS bacs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  substrate TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- One row per species kept in a given bac. Everything that is specific
-- to "this species, in this bac" (morph, lineage, population, sale
-- status, breeding stage...) lives here rather than on bacs directly,
-- so a cohabiting bac has one bac_species row per species it holds.
CREATE TABLE IF NOT EXISTS bac_species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bac_id INTEGER NOT NULL REFERENCES bacs(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES species(id),
  morph TEXT,
  lineage TEXT,
  population_estimate TEXT,
  acquisition_date TEXT,
  status TEXT NOT NULL DEFAULT 'actif',
  breeding_stage TEXT,
  for_sale_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price REAL,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS log_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bac_species_id INTEGER NOT NULL REFERENCES bac_species(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  note TEXT,
  photo_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  bac_species_id INTEGER REFERENCES bac_species(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'en_preparation',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_bac_species_bac ON bac_species(bac_id);
CREATE INDEX IF NOT EXISTS idx_bac_species_species ON bac_species(species_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_bs ON log_entries(bac_species_id);
CREATE INDEX IF NOT EXISTS idx_orders_bs ON orders(bac_species_id);
