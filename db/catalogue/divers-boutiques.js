// Third batch (catalogue version 3): snails, crabs and assassin bugs sold
// by eBugz, Insectorus and Isopods Mania in 2026.
const SNAIL_SEX = "Hermaphrodite : chaque escargot est à la fois mâle et femelle. Deux adultes suffisent.";

const SNAIL = {
  category: 'escargot', sociability: 'Petit groupe', vigilance: 'Se laver les mains', since: 3,
  diet_summary: 'Herbivore : légumes, calcium',
  habitat: "Bac aéré, 8 à 10 cm de terreau sans engrais ou de fibre de coco humide, écorces, mousse. Chaleur et humidité stables.",
  feeding_detail: "Légumes variés (courgette, concombre, salade foncée), fruits, calcium en permanence (os de seiche, carbonate de calcium), un peu de protéines de temps en temps.",
  repro_sexing: SNAIL_SEX,
  repro_conditions: 'Adultes bien nourris, chaleur.',
  repro_mating: 'Accouplement réciproque, puis ponte enterrée dans le substrat.',
  repro_incubation: 'Quelques semaines dans le substrat chaud.',
  repro_juveniles: 'Les petits mangent d’abord leur coquille d’œuf.',
  repro_pitfalls: 'Manque de calcium (coquille fine), bac détrempé ou sale.'
};
// Tree snails: tall, ventilated tanks, they live on leaves and bark.
const TREE_SNAIL = {
  ...SNAIL,
  habitat: "Bac plus haut que large, aéré, branches et plantes, substrat humide, brumisation quotidienne. Ils vivent en hauteur.",
  repro_pitfalls: 'Bac confiné ou trop sec, manque de calcium.'
};
const CRAB = {
  category: 'crabe', sociability: 'Groupe (plus de femelles que de mâles)', since: 3,
  diet_summary: 'Opportuniste : petits insectes, granulés, légumes',
  vigilance: 'Grimpe partout : couvercle étanche',
  habitat: "Paludarium : deux tiers de terre (fibre de coco, mousse, racines) et un tiers d'eau douce peu profonde avec des pierres pour remonter. Couvercle sans aucun jour.",
  feeding_detail: "Petits insectes, granulés pour crevettes ou poissons, légumes, feuilles de catappa.",
  repro_sexing: "Le mâle a l'abdomen étroit et pointu et des pinces plus grosses ; la femelle a un abdomen large et arrondi.",
  repro_conditions: 'Un groupe avec plus de femelles, beaucoup de cachettes, eau propre.',
  repro_mating: "La femelle porte ses œufs sous l'abdomen.",
  repro_incubation: 'Environ 4 semaines sous la femelle.',
  repro_juveniles: "Les petits crabes sortent directement de l'abdomen de la mère (pas de larves en mer). Les séparer des adultes.",
  repro_pitfalls: 'Fuites, eau sale, trop de mâles.',
  lifespan: '2 à 3 ans', size_class: 'petit'
};
const REDUVE = {
  category: 'reduve', sociability: 'Groupe si bien nourri', since: 3,
  diet_summary: 'Prédateur : blattes, grillons',
  vigilance: 'Piqûre très douloureuse ; ne pas manipuler à main nue',
  habitat: "Bac aéré, substrat sec (fibre de coco sèche, sable et terre), écorces et branches, une petite zone humide.",
  feeding_detail: "Blattes, grillons, ténébrions, deux ou trois fois par semaine.",
  repro_sexing: "La femelle est plus grande avec un abdomen plus large.",
  repro_conditions: 'Chaleur et proies abondantes, sinon le groupe devient cannibale.',
  repro_mating: 'La femelle colle ses œufs sur le substrat ou les écorces.',
  repro_incubation: 'Environ 4 à 6 semaines.',
  repro_juveniles: 'Petits nourris de jeunes grillons ou blattes ; adultes en 4 à 6 mois.',
  repro_pitfalls: 'Manque de proies (cannibalisme), bac humide.',
  lifespan: '1 à 2 ans'
};

module.exports = [
  // Escargots
  { ...SNAIL, common_name: 'Achatine de Knorr', scientific_name: 'Archachatina knorri', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Grand escargot d'Afrique de l'Ouest, à la coquille flammée et au corps sombre. Peu d'œufs, mais gros.", lifespan: '5 à 10 ans (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: 'Achatine de Puylaert', scientific_name: 'Archachatina puylaerti', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Achatine d'Afrique de l'Ouest vendue en formes « White body » et « Black body », selon la couleur du corps.", lifespan: '5 à 10 ans (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: "Achatine d'Adeline", scientific_name: 'Archachatina adelinae', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Achatine d'Afrique de l'Ouest à la coquille claire et finement marquée.", lifespan: '5 à 10 ans (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: 'Achatine à bouche pourpre', scientific_name: 'Archachatina porphyrostoma', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Achatine d'Afrique de l'Ouest à l'ouverture de coquille pourpre, existe en forme albinos.", lifespan: '5 à 10 ans (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: 'Achatine pourpre', scientific_name: 'Archachatina purpurea', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Achatine d'Afrique de l'Ouest à la coquille teintée de pourpre.", lifespan: '5 à 10 ans (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: "Achatine d'Iredale", scientific_name: 'Lissachatina iredalei', difficulty: 1, humidity_min: 70, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Petite achatine de Zanzibar et de Tanzanie (5 à 6 cm), claire (forme « Zanzibar Light Type »). Facile et prolifique.", lifespan: '3 à 5 ans (estimation)', size_class: 'moyen' },
  { ...SNAIL, common_name: 'Achatine peinte', scientific_name: 'Pseudoachatina leaiana', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    presentation: "Escargot d'Afrique de l'Ouest à la coquille fine et colorée (forme « colorata »).", lifespan: 'plusieurs années (estimation)', size_class: 'moyen' },
  { ...SNAIL, common_name: 'Escargot carnivore de Martens', scientific_name: 'Edentulina martensi', difficulty: 3, humidity_min: 70, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Escargot d'Afrique de l'Est à la coquille allongée qui chasse et mange les autres escargots.", lifespan: 'plusieurs années (estimation)', size_class: 'moyen',
    diet_summary: 'Carnivore : autres escargots', vigilance: 'Mange les autres escargots : jamais avec tes achatines',
    feeding_detail: "Petits escargots vivants (Subulina, petits-gris), un peu de viande ou de poisson ; calcium.", diet_type: 'predateur' },
  { ...SNAIL, common_name: 'Escargot de Subulina', scientific_name: 'Subulina octona', difficulty: 1, humidity_min: 70, humidity_max: 95, temp_min: 20, temp_max: 28,
    presentation: "Petit escargot tropical à coquille fine et allongée (2 cm), qui se multiplie seul. Équipe de nettoyage des terrariums humides.", lifespan: '1 à 2 ans', size_class: 'petit',
    vigilance: 'Prolifique : peut envahir un terrarium planté',
    repro_mating: 'Il peut se reproduire seul et pond de petits œufs dans le substrat.', niche: 'litiere' },
  { ...TREE_SNAIL, common_name: 'Escargot arboricole doré', scientific_name: 'Amphidromus atricallosus', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Escargot des arbres d'Asie du Sud-Est, à la coquille jaune vif, souvent enroulée à gauche. Très décoratif.", lifespan: '2 à 4 ans (estimation)', size_class: 'moyen' },
  { ...TREE_SNAIL, common_name: 'Escargot pleurodonte isabelle', scientific_name: 'Pleurodonte isabella', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 27,
    presentation: "Escargot des Antilles à la coquille ronde et colorée.", lifespan: 'plusieurs années (estimation)', size_class: 'moyen' },
  { ...TREE_SNAIL, common_name: 'Escargot lumineux de Bima', scientific_name: 'Asperitas bimaensis', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Escargot d'Indonésie (Sumbawa) à la coquille aplatie et au corps très coloré.", lifespan: 'plusieurs années (estimation)', size_class: 'moyen' },
  { ...TREE_SNAIL, common_name: 'Leptopoma brillant', scientific_name: 'Leptopoma nitidum', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Petit escargot arboricole d'Asie du Sud-Est, à coquille brillante, qui se ferme avec un opercule.", lifespan: 'plusieurs années (estimation)', size_class: 'petit',
    repro_sexing: "Mâle et femelle séparés chez cet escargot à opercule (difficiles à distinguer)." },
  { ...SNAIL, common_name: 'Escargot géant de Flower', scientific_name: 'Hemiplecta floweri', difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Escargot de Thaïlande à grande coquille aplatie et brillante.", lifespan: 'plusieurs années (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: 'Escargot géant de Tweedie', scientific_name: 'Platymma tweediei', difficulty: 4, humidity_min: 80, humidity_max: 95, temp_min: 22, temp_max: 26,
    presentation: "Un des plus grands escargots d'Asie, de Malaisie, à la coquille aplatie de plus de 10 cm. Rare et cher.", lifespan: 'plusieurs années (estimation)', size_class: 'grand' },
  { ...SNAIL, common_name: 'Limace tropicale à dos de cuir', scientific_name: 'Laevicaulis alte', difficulty: 2, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 28,
    presentation: "Limace plate d'origine africaine, au dos coriace, sans coquille. Nocturne.", lifespan: '1 à 2 ans (estimation)', size_class: 'moyen',
    vigilance: 'Espèce invasive : ne jamais relâcher', feeding_detail: "Légumes, feuilles, champignons, calcium." },
  // Crabes
  { ...CRAB, common_name: 'Crabe vampire de Bogor', scientific_name: 'Geosesarma bogorensis', difficulty: 2, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 26,
    presentation: "Petit crabe de Java, de la même famille que ton crabe vampire de Riani. Même élevage." },
  { ...CRAB, common_name: 'Crabe vampire de Roux', scientific_name: 'Geosesarma rouxi', difficulty: 2, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 26,
    presentation: "Petit crabe d'Asie du Sud-Est, aux couleurs vives, cousin des autres crabes vampires." },
  // Réduves
  { ...REDUVE, common_name: 'Réduve à ailes tachetées', scientific_name: 'Platymeris guttatipennis', difficulty: 2, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 30,
    presentation: "Réduve d'Afrique de l'Est, noire aux ailes ponctuées de taches claires. Même élevage que ta Platymeris biguttatus." },
  { ...REDUVE, common_name: 'Réduve à thorax lisse', scientific_name: 'Platymeris laevicollis', difficulty: 2, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 30,
    presentation: "Réduve d'Afrique de l'Est, noire aux taches orangées." },
  { ...REDUVE, common_name: "Réduve à deux points 'Ghost'", scientific_name: 'Platymeris biguttatus "Ghost"', difficulty: 3, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 28,
    presentation: "Forme de ta réduve à deux points aux taches blanc pâle au lieu de jaune. Même élevage ; ne pas mélanger avec ta forme ordinaire." }
];
