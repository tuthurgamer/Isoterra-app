// Care status of each fiche: how long since the bac was last fed and
// misted, judged against its species' rhythm (species.feed_every_days /
// mist_every_days), on a four-step scale.

const db = require('../db/db');

const LEVELS = {
  ras: { rank: 0, label: 'RAS' },
  verifier: { rank: 1, label: 'À vérifier' },
  retard: { rank: 2, label: 'En retard' },
  alerte: { rank: 3, label: 'Alerte' }
};

// Whole calendar days between a local "YYYY-MM-DD HH:MM:SS" timestamp and
// today, so something done yesterday evening reads "hier", not "aujourd'hui".
function daysSince(timestamp, now = new Date()) {
  if (!timestamp) return null;
  const [y, m, d] = timestamp.slice(0, 10).split('-').map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - Date.UTC(y, m - 1, d)) / 86400000));
}

// Past the rhythm comes a grace window of half a rhythm ("À vérifier"),
// then a full rhythm ("En retard"), then "Alerte". Each window lasts at
// least a day, so a daily rhythm doesn't jump straight to the alarm.
function levelFor(days, every) {
  if (!every) return null;              // no rhythm set: no alert for this care
  if (days === null) return 'verifier'; // never recorded
  const soon = Math.max(1, Math.round(every / 2));
  if (days <= every) return 'ras';
  if (days <= every + soon) return 'verifier';
  if (days <= every + soon + every) return 'retard';
  return 'alerte';
}

function whenText(verb, days) {
  if (days === null) return `${verb} : jamais noté`;
  if (days === 0) return `${verb} aujourd'hui`;
  if (days === 1) return `${verb} hier`;
  return `${verb} il y a ${days} j`;
}

function careItem(verb, lastAt, every, ownRhythm, now) {
  const days = daysSince(lastAt, now);
  const level = levelFor(days, every);
  return { days, every: every || null, ownRhythm: Boolean(ownRhythm), level, label: level && LEVELS[level].label, text: whenText(verb, days) };
}

function worstLevel(...levels) {
  return levels.filter(Boolean).sort((a, b) => LEVELS[b].rank - LEVELS[a].rank)[0] || null;
}

// Feeding and misting count per bac, not per fiche: food and water put in a
// bac serve all its occupants, so in a mixed bac an entry logged on either
// fiche counts for both. Each fiche is judged against its own rhythm: the
// one set in the bac's settings, else its species' rhythm.
function careStatuses({ bacId } = {}, now = new Date()) {
  const stmt = db.prepare(`
    SELECT bs.id, bs.bac_id,
      COALESCE(bs.feed_every_days, s.feed_every_days) AS feed_every_days,
      COALESCE(bs.mist_every_days, s.mist_every_days) AS mist_every_days,
      bs.feed_every_days IS NOT NULL AS own_feed,
      bs.mist_every_days IS NOT NULL AS own_mist,
      (SELECT MAX(l.created_at) FROM log_entries l JOIN bac_species o ON o.id = l.bac_species_id
         WHERE o.bac_id = bs.bac_id AND l.type = 'nourrissage') AS last_feed,
      (SELECT MAX(l.created_at) FROM log_entries l JOIN bac_species o ON o.id = l.bac_species_id
         WHERE o.bac_id = bs.bac_id AND l.type = 'pulverisation') AS last_mist
    FROM bac_species bs JOIN species s ON s.id = bs.species_id
    ${bacId ? 'WHERE bs.bac_id = ?' : ''}
  `);
  const statuses = new Map();
  for (const r of bacId ? stmt.all(bacId) : stmt.all()) {
    const feed = careItem('Nourri', r.last_feed, r.feed_every_days, r.own_feed, now);
    const mist = careItem('Pulvérisé', r.last_mist, r.mist_every_days, r.own_mist, now);
    const level = worstLevel(feed.level, mist.level);
    statuses.set(r.id, { fiche: r.id, bac: r.bac_id, feed, mist, level, label: level && LEVELS[level].label });
  }
  return statuses;
}

// A whole bac at a glance (tournée, mixed bac card), from the statuses of
// its fiches: they share the same days, but each has its own rhythm, so
// the most urgent fiche speaks for the bac.
function bacStatusOf(fiches) {
  if (!fiches.length) return null;
  const rank = (item) => (item.level ? LEVELS[item.level].rank : -1);
  const mostUrgent = (key) => fiches.map((f) => f[key]).reduce((worst, item) => (rank(item) > rank(worst) ? item : worst));
  const feed = mostUrgent('feed');
  const mist = mostUrgent('mist');
  const level = worstLevel(feed.level, mist.level);
  return { bac: fiches[0].bac, feed, mist, level, label: level && LEVELS[level].label };
}

function bacCareStatus(bacId, now = new Date()) {
  return bacStatusOf([...careStatuses({ bacId }, now).values()]);
}

const needsAttention = (status) => status.level === 'retard' || status.level === 'alerte';

// The "en retard ou en alerte" figure counts bacs, as the home page shows
// one card per bac.
function bacsNeedingAttention(statuses) {
  return new Set([...statuses].filter(needsAttention).map((s) => s.bac)).size;
}

module.exports = { careStatuses, bacStatusOf, bacCareStatus, needsAttention, bacsNeedingAttention, daysSince };
