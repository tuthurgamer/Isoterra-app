// Entries written together for several species of a bac (tournée, a mixed
// bac's quick actions, a note for the whole bac) or with several photos
// share the bac, the type, the time and the note: they are shown as one line
// naming every species and showing every photo. Rows must come newest
// first, with bac_id, bac_species_id, scientific_name, morph and, for photos,
// the photos row's columns (PHOTO_COLUMNS below, joined on the path).
function groupEntries(rows) {
  const entries = [];
  const byKey = new Map();
  for (const row of rows) {
    const key = [row.bac_id, row.type, row.created_at, row.note || ''].join('|');
    let entry = byKey.get(key);
    if (!entry) {
      entry = { ...row, species: [], photos: [] };
      byKey.set(key, entry);
      entries.push(entry);
    }
    if (!entry.species.some((s) => s.bac_species_id === row.bac_species_id)) entry.species.unshift(row);
    if (row.photo_path && !entry.photos.some((p) => p.path === row.photo_path)) {
      entry.photos.unshift({
        id: row.photo_id, path: row.photo_path, thumb_path: row.thumb_path, width: row.width, height: row.height,
        rating: row.rating, taken_at: row.taken_at, bac_id: row.bac_id, type: row.type, note: row.note
      });
    }
  }
  return entries;
}

// The photo columns to add to a journal query (with
// "LEFT JOIN photos p ON p.path = l.photo_path"). The species seen on each
// photo are added afterwards (lib/photos.js attachSpecies).
const PHOTO_COLUMNS = 'p.id AS photo_id, p.thumb_path, p.width, p.height, p.rating, p.taken_at';

module.exports = { groupEntries, PHOTO_COLUMNS };
