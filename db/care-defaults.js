// Starting care rhythms, in days, for supplemental feeding and misting.
// Deliberately moderate: they only seed the species guide, where each value
// can be adjusted to how the bacs are actually set up.

const FEED_BY_CATEGORY = { iule: 7, cloporte: 5, cetoine: 14, escargot: 2, autre: 4 };

// Species whose needs differ from their category's default. Keyed by the
// binomial without the morph, so every morph of a species shares them.
const FEED_BY_SPECIES = {
  'Porcellio laevis': 3,       // voracious, dense colonies
  'Platymeris biguttatus': 3,  // live prey two or three times a week
  'Geosesarma riani': 2,       // small portions, often
  'Lissachatina fulica': 2,    // fresh vegetables every day or two
  'Archachatina rhodostoma': 2, // same as the other giant land snails
  'Thelyphonus sp.': 7         // one prey a week or so for an adult
};

function mistFor(category, humidityMin) {
  if (category === 'cetoine') return 5; // larval substrate: kept moist, not soaked
  if (humidityMin >= 75) return 2;
  if (humidityMin >= 70) return 3;
  if (humidityMin >= 60) return 4;
  return 5;
}

function defaultCare({ category, scientific_name, humidity_min }) {
  const binomial = String(scientific_name || '').replace(/\s*".*"\s*$/, '');
  return {
    feed_every_days: FEED_BY_SPECIES[binomial] || FEED_BY_CATEGORY[category] || 5,
    mist_every_days: mistFor(category, Number(humidity_min) || 0)
  };
}

module.exports = { defaultCare };
