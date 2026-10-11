// Third batch (catalogue version 3): flower beetles sold by eBugz and
// Insectorus in 2026.
const SEXING = "Chez l'adulte, le mâle a le dessous de l'abdomen creusé d'un sillon et les pattes avant souvent plus longues ; la femelle a l'abdomen bombé.";
const HORNED = "Le mâle porte une corne ou des cornes sur la tête ; la femelle n'en a pas.";

const BASE = {
  category: 'cetoine', sociability: 'Groupe', vigilance: 'Les adultes volent',
  habitat: "Bac aéré avec 15 cm de terreau de feuilles fermenté (flake soil) et du bois pourri pour les larves, branches et écorces pour les adultes, couvercle grillagé.",
  repro_conditions: 'Substrat profond et riche, chaleur douce.',
  repro_mating: "Les femelles s'enfouissent pour pondre dans le substrat.",
  repro_incubation: '2 à 3 semaines.',
  since: 3
};
// Easy flower beetles: larvae on leaf mould alone.
const EASY = {
  ...BASE, diet_summary: 'Adultes : fruits ; larves : terreau de feuilles',
  feeding_detail: "Adultes : banane, pomme, gelée pour coléoptères. Larves : flake soil et bois pourri.",
  repro_sexing: SEXING,
  repro_juveniles: 'Cycle complet en 4 à 8 mois : larve, puis cocon de terre où elle se nymphose.',
  repro_pitfalls: 'Substrat pauvre ou sec, cocons écrasés en fouillant.'
};
// Goliathini: bigger, horned males, larvae need protein and get cannibalistic.
const GOLIATH = {
  ...BASE, diet_summary: 'Adultes : fruits ; larves : flake soil et protéines',
  vigilance: 'Larves cannibales : les séparer en grandissant',
  feeding_detail: "Adultes : fruits mûrs, gelée pour coléoptères. Larves : flake soil, bois pourri et un apport régulier de protéines (croquettes pour chien ou chat, nourriture pour poissons).",
  repro_sexing: HORNED,
  repro_juveniles: 'Isoler les larves du dernier stade dans des boîtes d’1 à 2 litres. Cycle de 6 à 10 mois.',
  repro_pitfalls: 'Larves serrées (cannibalisme), manque de protéines, cocons dérangés.'
};

module.exports = [
  { ...GOLIATH, common_name: 'Cétoine cornue de Horniman', scientific_name: 'Eudicella hornimani', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine cornue d'Afrique centrale, vert métallique bordé de rouge, aux mâles armés d'une corne fourchue.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: 'Cétoine cornue de Schultze', scientific_name: 'Eudicella schultzeorum', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine cornue d'Afrique de l'Est aux élytres colorés.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: 'Cétoine cornue pythie', scientific_name: 'Eudicella pythia', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine cornue d'Afrique de l'Ouest, verte aux élytres orangés.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: 'Cétoine cornue de Morgan', scientific_name: 'Eudicella morgani', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine cornue d'Afrique centrale, verte métallique.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: 'Cétoine iris', scientific_name: 'Tmesorrhina iris', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine d'Afrique de l'Ouest et centrale aux reflets vert-bleu irisés.", lifespan: 'environ 1 an', repro_sexing: SEXING },
  { ...GOLIATH, common_name: 'Cétoine cornue de Savage', scientific_name: 'Chelorrhina savagei', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Grande cétoine d'Afrique de l'Ouest et centrale (jusqu'à 5 cm), brune et verte, aux mâles cornus et aux pattes avant très longues.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GOLIATH, common_name: 'Cétoine de Rucker', scientific_name: 'Jumnos ruckeri', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 26,
    presentation: "Grande cétoine d'Asie (de l'Himalaya à la Thaïlande), verte et orange. Les larves deviennent énormes.", lifespan: 'environ 1 an et demi', size_class: 'grand', repro_sexing: SEXING },
  { ...GOLIATH, common_name: 'Cétoine géante de Harris', scientific_name: 'Megalorrhina harrisi', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 26,
    presentation: "Grande cétoine d'Afrique (jusqu'à 6 cm), verte rayée de blanc (forme « eximia »), cousine des Mecynorrhina.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GOLIATH, common_name: 'Cétoine cornue à long nez', scientific_name: 'Taurhina longiceps', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine d'Afrique centrale aux mâles cornus, verte ou brune.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: "Cétoine d'Oberthür", scientific_name: 'Dicronorhina oberthuri', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cousine de ta cétoine de Derby, d'Afrique de l'Est, verte rayée de blanc, aux mâles cornus.", lifespan: 'environ 1 an' },
  { ...GOLIATH, common_name: 'Cétoine cornue de Burke', scientific_name: 'Cheirolasia burkei', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Grande cétoine d'Afrique de l'Est, verte et blanche, aux mâles portant une longue corne.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...EASY, common_name: 'Cétoine de Voss', scientific_name: 'Pachnoda vossi', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 22, temp_max: 28,
    presentation: "Pachnoda d'Afrique de l'Est, jaune et noire. Aussi facile que tes Pachnoda marginata.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Cétoine conjointe', scientific_name: 'Chlorocala conjux', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine africaine vert métallique, proche de la cétoine émeraude.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Cétoine à sept taches', scientific_name: 'Pedinorrhina septa', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine d'Afrique de l'Ouest et centrale, verte ou brune tachée de blanc.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Cétoine de Watkins', scientific_name: 'Plaesiorrhina watkinsiana', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Cétoine d'Afrique de l'Est aux élytres verts tachés de jaune.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Cétoine à taches jaunes', scientific_name: 'Anisorrhina flavomaculata', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 22, temp_max: 28,
    presentation: "Petite cétoine d'Afrique, sombre ponctuée de jaune. Facile et prolifique.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Cétoine aimable', scientific_name: 'Mausoleopsis amabilis', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 27,
    presentation: "Petite cétoine africaine verte et colorée.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: 'Grande cétoine verte', scientific_name: 'Protaetia aeruginosa', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 15, temp_max: 25,
    presentation: "La plus grande cétoine d'Europe (jusqu'à 3 cm), vert doré métallique, aussi présente en France. Ses larves vivent dans le terreau des vieux arbres creux. Vendue aussi sous le nom de Cetonischema speciosissima.", lifespan: '2 à 3 ans, dont quelques mois en adulte',
    vigilance: "Rare dans la nature : n'acheter que des animaux d'élevage",
    repro_conditions: 'Hiver frais pour les larves âgées, terreau de bois très décomposé.',
    repro_juveniles: 'Cycle de 2 à 3 ans selon la température.' },
  { ...EASY, common_name: 'Cétoine splendide', scientific_name: 'Protaetia speciosa', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 18, temp_max: 26,
    presentation: "Grande cétoine métallique d'Europe de l'Est et d'Asie (forme « cyanochlora », bleu-vert).", lifespan: '1 à 2 ans' },
  { ...EASY, common_name: 'Cétoine cultivée', scientific_name: 'Protaetia culta', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 26,
    presentation: "Cétoine d'Asie du Sud-Est, verte métallique ornée de taches.", lifespan: 'environ 1 an' },
  { ...EASY, common_name: "Cétoine de l'Himalaya", scientific_name: 'Protaetia himalayana', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 18, temp_max: 25,
    presentation: "Cétoine des contreforts de l'Himalaya, métallique.", lifespan: 'environ 1 an (estimation)' }
];
