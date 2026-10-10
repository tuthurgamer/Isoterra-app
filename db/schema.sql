CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  family TEXT,
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
  icon_path TEXT,
  feed_every_days INTEGER,
  mist_every_days INTEGER,
  diet_type TEXT,
  size_class TEXT,
  niche TEXT,
  substrate_type TEXT,
  lifespan TEXT,
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
  feed_every_days INTEGER,  -- per-bac override of the species rhythm (NULL = species)
  mist_every_days INTEGER,
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

-- Every photo, kept once even when a note for a whole bac puts it in each
-- species' journal (log_entries.photo_path = photos.path). A photo added
-- from a species' page without choosing a bac has no journal entry.
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  thumb_path TEXT,
  view_path TEXT,  -- a lighter copy for viewing (the photo itself stays untouched)
  width INTEGER,
  height INTEGER,
  taken_at TEXT,  -- when it was shot (read from the photo), else when it was sent
  favorite INTEGER NOT NULL DEFAULT 0,  -- replaced by rating (a favourite became 5 stars)
  rating INTEGER NOT NULL DEFAULT 0,    -- 1 to 5 stars, 0 = not rated yet
  caption TEXT,  -- the note of a photo added from a species' page without a bac
  kind TEXT NOT NULL DEFAULT 'photo',  -- 'photo' or 'video'
  duration REAL,  -- a video's length, in seconds
  mime TEXT,
  source_hash TEXT,  -- fingerprint of the file as it was on the phone (lib/empreinte.js)
  file_hash TEXT,    -- fingerprint of the file as stored
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- The species seen on a photo, chosen photo by photo (at first those of the
-- journal entries it was sent with). A species' page shows these photos.
CREATE TABLE IF NOT EXISTS photo_species (
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, species_id)
);

-- App-wide preferences, e.g. the breeder's name printed on customer sheets.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_bac_species_bac ON bac_species(bac_id);
CREATE INDEX IF NOT EXISTS idx_bac_species_species ON bac_species(species_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_bs ON log_entries(bac_species_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_photo ON log_entries(photo_path);
CREATE INDEX IF NOT EXISTS idx_photo_species_species ON photo_species(species_id);
CREATE INDEX IF NOT EXISTS idx_orders_bs ON orders(bac_species_id);
