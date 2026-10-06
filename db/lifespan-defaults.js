// Starting life expectancies for the species guide (species page, customer
// sheets). Rough figures from breeders' experience, to be refined in the
// guide; "estimation" where the species is little documented. Keyed by the
// binomial without the morph, so every morph of a species shares them.
const { binomial } = require('./trait-defaults');

const LIFESPAN = {
  'Spirostreptus servatius': '5 à 7 ans',
  'Spirostreptus sp.': '5 à 7 ans (estimation)',
  'Anadenobolus monilicornis': '2 à 3 ans',
  'Tonkinbolus caudulanus': '3 à 5 ans (estimation)',
  'Telodeinopus aoutii': '4 à 6 ans',
  'Centrobolus richardii': '3 à 5 ans (estimation)',
  'Desmoxytes planata': '1 à 2 ans',
  'Armadillo officinalis': '3 à 5 ans',
  'Porcellio scaber': '2 à 3 ans',
  'Cristarmadillidium muricatum': '2 à 3 ans',
  'Armadillidium vulgare': '2 à 3 ans, parfois plus',
  'Porcellio laevis': '1 à 2 ans',
  'Armadillidium gestroi': '2 à 3 ans',
  'Armadillidium flavoscutatum': '2 à 3 ans (estimation)',
  'Armadillidium espanyoli': '2 à 3 ans',
  'Dicronorhina derbyana layardi': '1 an à 1 an et demi, dont 3 à 6 mois en adulte',
  'Pachnoda marginata': 'environ 1 an, dont 3 à 5 mois en adulte',
  'Platymeris biguttatus': '1 à 2 ans',
  'Therea olegrandjeani': '1 à 2 ans',
  'Geosesarma riani': '2 à 3 ans',
  'Thelyphonus sp.': '3 à 5 ans',
  'Lissachatina fulica': '5 à 6 ans en moyenne, jusqu\'à 9 ans',
  'Archachatina rhodostoma': '3 à 5 ans, parfois plus'
};

// Giant African land snails, filed under "Escargots" rather than "Autres".
const SNAIL_GENERA = ['Lissachatina', 'Achatina', 'Archachatina'];

function defaultLifespan(scientificName) {
  return LIFESPAN[binomial(scientificName)] || null;
}

module.exports = { defaultLifespan, SNAIL_GENERA };
