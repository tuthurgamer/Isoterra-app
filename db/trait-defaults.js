// Cohabitation traits used by the compatibility engine (lib/compatibility.js).
// They seed the species guide once and stay editable there.
//
//   diet_type      detritivore | herbivore | omnivore | opportuniste | predateur
//   size_class     petit (< 2 cm) | moyen (2–8 cm) | grand (> 8 cm)
//   niche          fouisseur (in the substrate) | litiere (under leaves, bark)
//                  | surface | semi-aquatique
//   substrate_type humide | flake (fermented leaf soil) | sec | paludarium

const TRAIT_OPTIONS = {
  diet_type: [
    ['detritivore', 'Décomposeur (feuilles, bois)'],
    ['herbivore', 'Herbivore (végétaux frais)'],
    ['omnivore', 'Omnivore (sans chasser)'],
    ['opportuniste', 'Opportuniste (attrape les petites proies)'],
    ['predateur', 'Prédateur']
  ],
  size_class: [
    ['petit', 'Petit (moins de 2 cm)'],
    ['moyen', 'Moyen (2 à 8 cm)'],
    ['grand', 'Grand (plus de 8 cm)']
  ],
  niche: [
    ['fouisseur', 'Fouisseur (dans le substrat)'],
    ['litiere', 'Litière (sous les feuilles, écorces)'],
    ['surface', 'Surface'],
    ['semi-aquatique', 'Semi-aquatique']
  ],
  substrate_type: [
    ['humide', 'Terreau humide'],
    ['flake', 'Terreau fermenté (flake soil)'],
    ['sec', 'Sec avec un coin humide'],
    ['paludarium', 'Paludarium (terre + eau)']
  ]
};

const BY_CATEGORY = {
  iule: { diet_type: 'detritivore', size_class: 'moyen', niche: 'fouisseur', substrate_type: 'humide' },
  cloporte: { diet_type: 'detritivore', size_class: 'petit', niche: 'litiere', substrate_type: 'humide' },
  blatte: { diet_type: 'omnivore', size_class: 'moyen', niche: 'litiere', substrate_type: 'humide' },
  cetoine: { diet_type: 'detritivore', size_class: 'moyen', niche: 'fouisseur', substrate_type: 'flake' },
  coleoptere: { diet_type: 'detritivore', size_class: 'grand', niche: 'fouisseur', substrate_type: 'flake' },
  escargot: { diet_type: 'herbivore', size_class: 'moyen', niche: 'surface', substrate_type: 'humide' },
  crabe: { diet_type: 'opportuniste', size_class: 'moyen', niche: 'semi-aquatique', substrate_type: 'paludarium' },
  reduve: { diet_type: 'predateur', size_class: 'moyen', niche: 'surface', substrate_type: 'sec' },
  mante: { diet_type: 'predateur', size_class: 'moyen', niche: 'surface', substrate_type: 'humide' },
  phasme: { diet_type: 'herbivore', size_class: 'grand', niche: 'surface', substrate_type: 'humide' },
  arachnide: { diet_type: 'predateur', size_class: 'moyen', niche: 'fouisseur', substrate_type: 'humide' },
  scolopendre: { diet_type: 'predateur', size_class: 'grand', niche: 'fouisseur', substrate_type: 'humide' },
  autre: { diet_type: 'omnivore', size_class: 'moyen', niche: 'surface', substrate_type: 'humide' }
};

// Keyed by the binomial without the morph, so every morph shares them.
const BY_SPECIES = {
  'Spirostreptus servatius': { size_class: 'grand' },
  'Spirostreptus sp.': { size_class: 'grand' },
  'Telodeinopus aoutii': { size_class: 'grand' },
  'Dicronorhina derbyana layardi': { size_class: 'grand' },
  'Platymeris biguttatus': { diet_type: 'predateur', niche: 'surface', substrate_type: 'sec' },
  'Therea olegrandjeani': { diet_type: 'omnivore', niche: 'litiere', substrate_type: 'sec' },
  'Geosesarma riani': { diet_type: 'opportuniste', niche: 'semi-aquatique', substrate_type: 'paludarium' },
  'Lissachatina fulica': { diet_type: 'herbivore', size_class: 'grand', niche: 'surface' },
  'Archachatina rhodostoma': { diet_type: 'herbivore', size_class: 'grand', niche: 'surface' },
  'Thelyphonus sp.': { diet_type: 'predateur', niche: 'fouisseur' },
  'Desmoxytes planata': { niche: 'litiere' },
  'Armadillidium espanyoli': { substrate_type: 'sec' }
};

function binomial(scientificName) {
  return String(scientificName || '').replace(/\s*".*"\s*$/, '').trim();
}

// A fiche can bring its own traits (the catalogue's do); they win.
function defaultTraits({ category, scientific_name, ...own }) {
  const given = Object.fromEntries(Object.keys(TRAIT_OPTIONS).filter((k) => own[k]).map((k) => [k, own[k]]));
  return { ...(BY_CATEGORY[category] || BY_CATEGORY.autre), ...(BY_SPECIES[binomial(scientific_name)] || {}), ...given };
}

module.exports = { TRAIT_OPTIONS, defaultTraits, binomial };
