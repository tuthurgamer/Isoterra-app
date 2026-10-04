// Entries written together for several species of a bac (tournée, a mixed
// bac's quick actions, a note for the whole bac) share the bac, the type,
// the time, the note and the photo: they are shown as one line naming every
// species. Rows must come newest first, with bac_id, scientific_name, morph.
function groupEntries(rows) {
  const entries = [];
  const byKey = new Map();
  for (const row of rows) {
    const key = [row.bac_id, row.type, row.created_at, row.note || '', row.photo_path || ''].join('|');
    const same = byKey.get(key);
    if (same) {
      same.species.unshift(row);
      continue;
    }
    const entry = { ...row, species: [row] };
    byKey.set(key, entry);
    entries.push(entry);
  }
  return entries;
}

module.exports = { groupEntries };
