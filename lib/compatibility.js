// Estimates whether species can share a bac, from the guide's data:
// temperature and humidity ranges, sociability, and the structured
// cohabitation traits (diet, size, use of space, substrate — see
// db/trait-defaults.js). A heuristic to plan mixed bacs; watching the
// animals together always has the last word.

const { TRAIT_OPTIONS, binomial } = require('../db/trait-defaults');

const CRITERIA = [
  { key: 'temperature', label: 'Température', weight: 0.2 },
  { key: 'humidity', label: 'Hygrométrie', weight: 0.2 },
  { key: 'behavior', label: 'Comportement', weight: 0.2 },
  { key: 'diet', label: 'Alimentation', weight: 0.25 },
  { key: 'substrate', label: 'Installation', weight: 0.15 }
];

const SIZE_RANK = { petit: 1, moyen: 2, grand: 3 };
const SUBSTRATE_LABEL = Object.fromEntries(TRAIT_OPTIONS.substrate_type);

// Symmetric scores for two installation types (keys sorted alphabetically).
const SUBSTRATE_SCORE = {
  'flake+humide': 60,       // fermented flake soil is humid too, but specific
  'humide+sec': 50,         // workable with a humid side and a dry side
  'humide+paludarium': 70,  // the land part of a paludarium
  'flake+sec': 25,
  'flake+paludarium': 25,
  'paludarium+sec': 10
};

function verdictFor(score) {
  if (score >= 85) return { verdict: 'Excellente compatibilité', verdictClass: 'stamp--moss' };
  if (score >= 70) return { verdict: 'Bonne compatibilité', verdictClass: 'stamp--moss' };
  if (score >= 50) return { verdict: 'Compatibilité moyenne — à surveiller', verdictClass: 'stamp--rust' };
  return { verdict: 'Déconseillé', verdictClass: 'stamp--red' };
}

// 100 when the narrower range fits inside the wider one, 60 when they only
// touch, then `gapCost` points lost per unit of gap once they don't meet.
function rangeScore(aMin, aMax, bMin, bMax, gapCost) {
  if ([aMin, aMax, bMin, bMax].some((v) => v == null)) return { score: 50, missing: true };
  const lo = Math.max(aMin, bMin);
  const hi = Math.min(aMax, bMax);
  if (hi >= lo) {
    const narrow = Math.max(1, Math.min(aMax - aMin, bMax - bMin));
    return { score: Math.round(60 + 40 * Math.min(1, (hi - lo) / narrow)), common: [lo, hi] };
  }
  return { score: Math.max(0, Math.round(60 - gapCost * (lo - hi))), gap: lo - hi };
}

function behaviorScore(a, b, notes, strengths) {
  const text = (s) => (s.sociability || '').toLowerCase();
  let social = 70;
  const loner = [a, b].find((s) => text(s).includes('solitaire'));
  if (loner) {
    social = 40;
    notes.push(`${loner.scientific_name} vit plutôt en solitaire : la cohabitation peut le stresser.`);
  } else if ([a, b].every((s) => /grégaire|colonie/.test(text(s)))) {
    social = 90;
  }

  let niche = 75;
  if (a.niche && b.niche) {
    const water = (s) => s.niche === 'semi-aquatique';
    const pair = [a.niche, b.niche].sort().join('+');
    if (water(a) !== water(b)) niche = 60;
    else if (a.niche === b.niche) niche = 80;
    else niche = { 'fouisseur+litiere': 95, 'fouisseur+surface': 90, 'litiere+surface': 85 }[pair] || 80;
    if (niche >= 90) strengths.push('Ils occupent des espaces différents (dans le sol / en surface) : peu de concurrence.');
  }
  return Math.round(0.6 * social + 0.4 * niche);
}

function dietScore(a, b, notes, strengths) {
  const predator = [a, b].find((s) => s.diet_type === 'predateur');
  if (predator) {
    notes.push(`${predator.scientific_name} est un prédateur : il chassera l'autre espèce.`);
    return { score: 5, blocked: true };
  }

  const hunter = [a, b].find((s) => s.diet_type === 'opportuniste');
  if (hunter) {
    const other = hunter === a ? b : a;
    if (other.diet_type === 'opportuniste') {
      notes.push('Deux espèces opportunistes : risque de conflits et de prédation mutuelle.');
      return { score: 40 };
    }
    if ((SIZE_RANK[other.size_class] || 2) <= (SIZE_RANK[hunter.size_class] || 2)) {
      notes.push(`${hunter.scientific_name} attrape les petits animaux : risque pour ${other.scientific_name}, surtout les juvéniles.`);
      return { score: 30, risky: true };
    }
    notes.push(`${hunter.scientific_name} est opportuniste : surveille les premiers jours.`);
    return { score: 60 };
  }

  const herbivore = [a, b].find((s) => s.diet_type === 'herbivore');
  if (herbivore && a.diet_type !== b.diet_type) {
    const other = herbivore === a ? b : a;
    if (other.size_class === 'petit') {
      notes.push(`${other.scientific_name} peut manger les œufs de ${herbivore.scientific_name} : gênant pour sa reproduction.`);
    }
    return { score: 75 };
  }

  if (a.diet_type === 'detritivore' && b.diet_type === 'detritivore') {
    const iule = [a, b].find((s) => s.category === 'iule');
    const porcellio = [a, b].find((s) => s.category === 'cloporte' && /^Porcellio\b/.test(s.scientific_name));
    if (iule && porcellio) {
      notes.push('Les Porcellio peuvent grignoter un iule en mue : prévois des protéines et beaucoup de cachettes.');
      return { score: 72 };
    }
    if (a.category === 'cloporte' && b.category === 'cloporte') {
      notes.push('Deux espèces de cloportes : la plus prolifique finit souvent par prendre toute la place.');
      return { score: 78 };
    }
    strengths.push("Deux décomposeurs : ils recyclent les mêmes déchets sans s'attaquer.");
    return { score: 90 };
  }

  if (a.diet_type === 'omnivore' || b.diet_type === 'omnivore') return { score: 82 };
  return { score: 80 };
}

function substrateScore(a, b, notes) {
  if (!a.substrate_type || !b.substrate_type) return 75;
  if (a.substrate_type === b.substrate_type) return 100;
  const key = [a.substrate_type, b.substrate_type].sort().join('+');
  const score = SUBSTRATE_SCORE[key] ?? 60;
  if (score <= 25) {
    notes.push(`Installations incompatibles : ${SUBSTRATE_LABEL[a.substrate_type].toLowerCase()} contre ${SUBSTRATE_LABEL[b.substrate_type].toLowerCase()}.`);
  } else if (key === 'humide+sec') {
    notes.push('Installation en gradient : un côté humide, un côté plus sec.');
  } else if (key === 'flake+humide') {
    notes.push('Prévois un terreau fermenté (flake soil) profond, gardé humide.');
  } else if (key === 'humide+paludarium') {
    const land = a.substrate_type === 'humide' ? a : b;
    notes.push(`Seule la partie terrestre du paludarium convient à ${land.scientific_name}.`);
  }
  return score;
}

function computeCompatibility(a, b) {
  const notes = [];
  const strengths = [];

  const temp = rangeScore(a.temp_min, a.temp_max, b.temp_min, b.temp_max, 15);
  const hum = rangeScore(a.humidity_min, a.humidity_max, b.humidity_min, b.humidity_max, 3);
  if (temp.missing || hum.missing) notes.push('Température ou hygrométrie non renseignée pour une des espèces.');
  if (temp.gap != null) notes.push(`Aucune température commune (écart de ${temp.gap} °C).`);
  else if (temp.common && temp.common[0] === temp.common[1]) notes.push(`Température commune très serrée : ${temp.common[0]} °C seulement.`);
  if (hum.gap != null) notes.push(`Aucune hygrométrie commune (écart de ${hum.gap} %).`);
  else if (hum.common && hum.common[0] === hum.common[1]) notes.push(`Hygrométrie commune très serrée : ${hum.common[0]} % seulement.`);
  if (temp.score >= 90 && hum.score >= 90) strengths.push("Ils vivent aux mêmes températures et à la même humidité.");

  const diet = dietScore(a, b, notes, strengths);
  const breakdown = {
    temperature: temp.score,
    humidity: hum.score,
    behavior: behaviorScore(a, b, notes, strengths),
    diet: diet.score,
    substrate: substrateScore(a, b, notes)
  };

  let total = Math.round(CRITERIA.reduce((sum, c) => sum + breakdown[c.key] * c.weight, 0));
  // Deal-breakers can't be averaged away by good scores elsewhere.
  if (diet.blocked) total = Math.min(total, 15);
  if (diet.risky) total = Math.min(total, 45);
  if (breakdown.substrate <= 25) total = Math.min(total, 40);
  if (temp.gap != null || hum.gap != null) total = Math.min(total, 45);

  // An unidentified "sp." may well be the same species as its congener.
  const genus = (s) => s.scientific_name.split(' ')[0];
  const unidentified = (s) => /\bsp\.(\s|$)/.test(s.scientific_name);
  if (genus(a) === genus(b) && (unidentified(a) || unidentified(b)) && binomial(a.scientific_name) !== binomial(b.scientific_name)) {
    total = Math.min(total, 45);
    notes.unshift(`Même genre et une espèce non identifiée (${genus(a)} sp.) : ce pourrait être la même espèce, risque de croisement.`);
  }

  const sameSpecies = a.id !== b.id && binomial(a.scientific_name) === binomial(b.scientific_name);
  if (sameSpecies) {
    total = Math.min(total, 10);
    notes.unshift('Deux morphs de la même espèce : ils vont se croiser et les lignées seront perdues.');
    strengths.length = 0;
  }

  return {
    total, breakdown, notes, strengths, criteria: CRITERIA, sameSpecies,
    common: { temp: temp.common || null, humidity: hum.common || null },
    ...(sameSpecies ? { verdict: 'Même espèce : à ne pas mélanger', verdictClass: 'stamp--red' } : verdictFor(total))
  };
}

// Common range of a whole group: [lo, hi], false when it doesn't exist,
// null when no species has the data.
function commonRange(species, minKey, maxKey) {
  const known = species.filter((s) => s[minKey] != null && s[maxKey] != null);
  if (!known.length) return null;
  const lo = Math.max(...known.map((s) => s[minKey]));
  const hi = Math.min(...known.map((s) => s[maxKey]));
  return hi >= lo ? [lo, hi] : false;
}

// A group is as fragile as its worst pair, so the score leans on it; it
// also needs one temperature and one humidity that suit every member.
function evaluateGroup(species, pairOf = computeCompatibility) {
  const pairs = [];
  for (let i = 0; i < species.length; i++) {
    for (let j = i + 1; j < species.length; j++) {
      pairs.push({ a: species[i], b: species[j], result: pairOf(species[i], species[j]) });
    }
  }
  if (!pairs.length) return null;

  const totals = pairs.map((p) => p.result.total);
  const weakest = pairs.reduce((w, p) => (p.result.total < w.result.total ? p : w));
  let score = Math.round(0.6 * Math.min(...totals) + 0.4 * (totals.reduce((s, t) => s + t, 0) / totals.length));

  const common = {
    temp: commonRange(species, 'temp_min', 'temp_max'),
    humidity: commonRange(species, 'humidity_min', 'humidity_max')
  };
  // Said once for the group, unless a pair already gives the precise gap.
  const pairSays = (start) => pairs.some((p) => p.result.notes.some((n) => n.startsWith(start)));
  const notes = [];
  if (common.temp === false && !pairSays('Aucune température commune')) notes.push('Aucune température ne convient à tout le groupe.');
  if (common.humidity === false && !pairSays('Aucune hygrométrie commune')) notes.push('Aucune hygrométrie ne convient à tout le groupe.');
  if (common.temp === false || common.humidity === false) score = Math.min(score, 45);
  for (const p of pairs) for (const n of p.result.notes) if (!notes.includes(n)) notes.push(n);

  const strengths = [];
  for (const p of pairs) for (const s of p.result.strengths) if (!strengths.includes(s)) strengths.push(s);

  return { species, pairs, score, weakest, common, notes, strengths, ...verdictFor(score) };
}

// Every combination of `size` species, best first. Predators are left out,
// two morphs of one species never share a group, and groups that only
// differ by morph are merged into one result listing the other morphs.
function bestGroups(species, { size = 3, mustInclude = null, mixedOnly = false, limit = 12, minScore = 50 } = {}) {
  const pool = species.filter((s) => s.diet_type !== 'predateur');
  const cache = new Map();
  const pairOf = (a, b) => {
    const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
    if (!cache.has(key)) cache.set(key, computeCompatibility(a, b));
    return cache.get(key);
  };

  // One entry per set of species (morphs ignored): the best-scoring
  // variant, plus every name met in the other variants.
  const merged = new Map();
  const combo = [];
  const visit = () => {
    if (mustInclude && !combo.some((s) => s.id === mustInclude)) return;
    if (mixedOnly && new Set(combo.map((s) => s.category)).size < 2) return;
    const group = evaluateGroup([...combo], pairOf);
    if (group.score < minScore) return;
    const key = combo.map((s) => binomial(s.scientific_name)).sort().join('|');
    const entry = merged.get(key) || { best: group, names: new Set() };
    for (const s of combo) entry.names.add(s.scientific_name);
    if (group.score > entry.best.score) entry.best = group;
    merged.set(key, entry);
  };
  const walk = (start) => {
    if (combo.length === size) return visit();
    for (let i = start; i < pool.length; i++) {
      if (combo.some((s) => binomial(s.scientific_name) === binomial(pool[i].scientific_name))) continue;
      combo.push(pool[i]);
      walk(i + 1);
      combo.pop();
    }
  };
  walk(0);

  const width = (g) => (g.common.temp ? g.common.temp[1] - g.common.temp[0] : 0) + (g.common.humidity ? (g.common.humidity[1] - g.common.humidity[0]) / 5 : 0);
  return [...merged.values()]
    .map(({ best, names }) => ({
      ...best,
      alsoWith: [...names].filter((n) => !best.species.some((s) => s.scientific_name === n))
    }))
    .sort((x, y) => y.score - x.score || width(y) - width(x))
    .slice(0, limit);
}

module.exports = { CRITERIA, computeCompatibility, evaluateGroup, bestGroups, verdictFor };
