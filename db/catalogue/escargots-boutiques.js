// Catalogue version 5: land snails and slugs sold by breeders and shops that
// ship to France (landsnails.org, Micro-Exo, ebugz, Isopods Mania,
// Schneckenpost, Interaquaristik, Bugpets...). Sizes and difficulty follow
// the breeders' listings; care follows each group's biology, marked
// "estimation" where little is published for the species itself.
const SEX = "Hermaphrodite : chaque escargot est à la fois mâle et femelle, mais il en faut deux pour avoir des œufs fécondés. Un escargot isolé peut encore pondre des mois après un accouplement, grâce au sperme qu'il garde.";
const FOOD = "Légumes et feuilles tendres (courgette, concombre, carotte, patate douce, pissenlit, ortie, salade foncée), un peu de fruits, et des protéines une à deux fois par semaine (granulés pour poissons, pâtée pour chat). Calcium en permanence : os de seiche, coquilles d'œufs broyées. Rien de salé, pas d'agrumes.";
const HYBRIDS = "Ne pas mélanger sous-espèces ni localités dans un même bac : elles se croisent.";

const GIANT = {
  category: 'escargot', sociability: 'Petit groupe', since: 5,
  diet_summary: 'Herbivore : légumes, calcium', vigilance: 'Se laver les mains ; ne jamais relâcher',
  habitat: "Grand bac (60 × 40 cm au sol pour 2 ou 3 adultes) avec 10 à 15 cm de terreau sans engrais ou de fibre de coco humide pour s'enterrer et pondre, écorces et mousse. Chaleur stable, aération sur deux côtés opposés, brumisation chaque jour.",
  feeding_detail: FOOD,
  repro_sexing: SEX,
  repro_conditions: "Adultes (vers un an, à 6–8 cm de coquille pour les grandes espèces), chaleur stable et calcium à volonté.",
  repro_mating: "Accouplement réciproque ; la ponte suit une à trois semaines plus tard, enterrée dans le substrat.",
  repro_juveniles: "Les petits mangent d'abord leur coquille d'œuf, puis la nourriture des adultes en une semaine ; os de seiche à volonté.",
  diet_type: 'herbivore', size_class: 'grand', niche: 'fouisseur', substrate_type: 'humide'
};

// Achatina: big clutches of small round eggs.
const ACHATINA = {
  ...GIANT, difficulty: 2, temp_min: 24, temp_max: 28, humidity_min: 75, humidity_max: 90,
  repro_incubation: "Pontes de 100 à plusieurs centaines d'œufs ronds (4–5 mm, coquille calcaire) ; éclosion en deux à trois semaines au chaud.",
  repro_pitfalls: "Froid, manque de calcium (coquille fine), substrat détrempé ou sec. Ne garder que les petits que tu peux placer : les œufs en trop se congèlent avant d'être jetés.",
  lifespan: '5 à 10 ans (estimation)'
};

// Archachatina: a few big eggs, big young.
const ARCHACHATINA = {
  ...GIANT, difficulty: 2, temp_min: 24, temp_max: 28, humidity_min: 80, humidity_max: 95,
  repro_incubation: "Pontes de 3 à 20 gros œufs ovales (1 à 2,5 cm) ; éclosion en quatre à six semaines.",
  repro_juveniles: "Les petits naissent déjà gros (1 cm et plus) et mangent d'abord leur coquille d'œuf ; os de seiche à volonté.",
  repro_pitfalls: "Froid, air trop sec, manque de calcium. " + HYBRIDS,
  lifespan: "jusqu'à 10 ans (estimation)"
};

// Lissachatina: the easiest, very prolific.
const LISSACHATINA = {
  ...GIANT, difficulty: 1, temp_min: 22, temp_max: 27, humidity_min: 70, humidity_max: 90,
  repro_incubation: "Pontes de 100 à 400 petits œufs ronds ; éclosion en deux semaines environ.",
  repro_pitfalls: "Très prolifique : ne garder que les petits que tu peux placer, les œufs en trop se congèlent avant d'être jetés. Manque de calcium, substrat détrempé.",
  lifespan: '3 à 6 ans (estimation)'
};

// Limicolaria: smaller, active by day, lively groups.
const LIMICOLARIA = {
  ...GIANT, sociability: 'Groupe', difficulty: 1, temp_min: 22, temp_max: 28, humidity_min: 70, humidity_max: 90,
  habitat: "Bac de 40 × 30 cm pour un petit groupe, 5 à 8 cm de terreau sans engrais ou de fibre de coco humide, écorces et branches où ils grimpent. Chaleur, brumisation chaque jour, bonne aération.",
  repro_conditions: "Petit groupe d'adultes (5 à 7 cm), chaleur et calcium.",
  repro_incubation: "Pontes de 15 à 40 œufs d'environ 5 mm dans le substrat ; éclosion en deux semaines environ.",
  repro_pitfalls: "Manque de calcium, bac sec. " + HYBRIDS,
  lifespan: '2 à 4 ans (estimation)', size_class: 'moyen', niche: 'surface'
};

// Small tropical snails of the litter (Subulininae): clean-up crews.
const LITTER = {
  category: 'escargot', sociability: 'Colonie', since: 5, difficulty: 1,
  temp_min: 20, temp_max: 28, humidity_min: 75, humidity_max: 95,
  diet_summary: 'Détritivore : déchets, moisissures, légumes', vigilance: 'Prolifique ; petits qui passent par les aérations',
  habitat: "Petite boîte (20 × 20 cm suffit) ou terrarium planté : terreau humide, feuilles mortes, écorce. Aérations fines : les petits passent par les trous.",
  feeding_detail: "Restes de légumes, feuilles mortes, moisissures, granulés pour poissons, et calcium (os de seiche). Dans un terrarium, ils mangent les déchets des autres animaux.",
  repro_sexing: "Hermaphrodite ; beaucoup de ces petits escargots peuvent se reproduire seuls.",
  repro_conditions: 'Chaleur et humidité : la colonie grandit seule.',
  repro_mating: "Petits œufs pondus dans le substrat.",
  repro_incubation: 'Deux à quatre semaines (estimation).',
  repro_juveniles: 'Croissance rapide.',
  repro_pitfalls: 'Substrat sec, aérations trop larges.',
  lifespan: '1 à 2 ans (estimation)', diet_type: 'detritivore', size_class: 'petit', niche: 'litiere', substrate_type: 'humide'
};

// Snails of the forests of the Antilles and of Asia, that climb.
const FOREST = {
  category: 'escargot', sociability: 'Petit groupe', since: 5, difficulty: 2,
  temp_min: 22, temp_max: 27, humidity_min: 75, humidity_max: 90,
  diet_summary: 'Herbivore : légumes, feuilles, calcium', vigilance: 'Se laver les mains ; ne jamais relâcher',
  habitat: "Terrarium plus haut que large, 5 à 8 cm de terreau humide, feuilles mortes, branches et écorces pour grimper, plantes. Brumisation chaque jour, bonne aération.",
  feeding_detail: FOOD + " Ils aiment aussi les feuilles mortes ramollies et les champignons.",
  repro_sexing: SEX,
  repro_conditions: 'Adultes bien nourris, humidité stable.',
  repro_mating: "Accouplement réciproque ; petits œufs pondus dans le substrat humide.",
  repro_incubation: 'Environ trois à quatre semaines (estimation).',
  repro_juveniles: "Les petits restent cachés dans le substrat ; os de seiche à volonté.",
  repro_pitfalls: 'Air sec, bac confiné, manque de calcium.',
  lifespan: '2 à 5 ans (estimation)', diet_type: 'herbivore', size_class: 'moyen', niche: 'surface', substrate_type: 'humide'
};

// Big snails of Sri Lanka and Madagascar (Acavidae): few big eggs, slow.
const ACAVID = {
  ...FOREST, difficulty: 4, temp_min: 22, temp_max: 26, humidity_min: 80, humidity_max: 95,
  diet_summary: 'Herbivore : fruits mûrs, feuilles mortes, champignons',
  vigilance: 'Rare et cher : demander des animaux nés en élevage',
  feeding_detail: "Fruits bien mûrs, feuilles mortes ramollies, champignons, légumes tendres, un peu de protéines ; calcium en permanence.",
  repro_incubation: "Peu d'œufs, gros et calcaires ; éclosion lente (estimation : un mois et plus).",
  repro_juveniles: 'Croissance lente : plusieurs années pour atteindre la taille adulte.',
  repro_pitfalls: 'Chaleur excessive, air sec, dérangements.',
  lifespan: '5 ans et plus (estimation)'
};

// Slugs of the tropics (Veronicellidae): no shell, flat, nocturnal.
const SLUG = {
  category: 'escargot', sociability: 'Petit groupe', since: 5, difficulty: 1,
  temp_min: 22, temp_max: 28, humidity_min: 80, humidity_max: 95,
  diet_summary: 'Herbivore : légumes, champignons, calcium',
  vigilance: 'Invasive : ne jamais relâcher ; bac bien fermé',
  habitat: "Bac bien fermé (les petits passent par la moindre fente), aérations fines, 5 cm de fibre de coco ou de terreau humide, feuilles mortes, mousse et écorces pour se cacher. Humidité élevée mais aérée.",
  feeding_detail: "Légumes (courgette, carotte, patate douce, concombre), champignons, feuilles tendres, un peu de protéines ; calcium à disposition malgré l'absence de coquille.",
  repro_sexing: "Hermaphrodite : deux adultes suffisent.",
  repro_conditions: 'Chaleur, humidité, nourriture abondante.',
  repro_mating: "Ponte de 10 à 40 œufs en grappe dans le substrat humide.",
  repro_incubation: 'Deux à quatre semaines à température constante.',
  repro_juveniles: 'Croissance rapide ; les petits se cachent sous les écorces.',
  repro_pitfalls: 'Bac qui sèche, fuites par les aérations, citrons et aliments acides.',
  lifespan: '1 à 3 ans (estimation)', diet_type: 'herbivore', size_class: 'moyen', niche: 'litiere', substrate_type: 'humide'
};

module.exports = [
  // ---------- Achatina ----------
  { ...ACHATINA, common_name: "Achatine tigrée 'Albinos'", scientific_name: 'Achatina achatina "Albinos"', difficulty: 3, temp_min: 25, temp_max: 29,
    presentation: "Forme au corps albinos (blanc à crème) de l'achatine tigrée, le plus grand escargot terrestre (13 à 20 cm). La coquille garde ses rayures de tigre. Mêmes besoins que la forme sauvage : beaucoup de chaleur." },
  { ...ACHATINA, common_name: 'Achatine ceinturée', scientific_name: 'Achatina balteata',
    presentation: "Grande achatine d'Afrique centrale (Cameroun, Congo), de 9 à 13 cm, à la coquille brune barrée de bandes sombres. Proche de l'achatine tigrée, mais plus petite. Vendue sous la forme infrafusca.",
    size_class: 'grand' },
  { ...ACHATINA, common_name: 'Achatine de Schweinfurth', scientific_name: 'Achatina schweinfurthi', difficulty: 3,
    presentation: "Très grande achatine du Congo (10 à 20 cm selon la forme : semifusca est la plus grande, simulans plus petite), à la coquille allongée brun-jaune flammée. Rare en élevage, difficulté moyenne." },
  { ...ACHATINA, common_name: 'Achatine teintée', scientific_name: 'Achatina tincta',
    presentation: "Achatine du Congo et d'Angola de taille moyenne (8 à 10 cm), à la coquille fine et colorée. Facile à garder et à reproduire selon les éleveurs.",
    size_class: 'moyen' },
  { ...ACHATINA, common_name: 'Achatine de Weyns', scientific_name: 'Achatina weynsi', difficulty: 3,
    presentation: "Achatine du Congo de 10 à 13 cm, à la coquille élancée et colorée. Rare en élevage, difficulté moyenne." },

  // ---------- Archachatina ----------
  { ...ARCHACHATINA, common_name: 'Achatine du Cameroun', scientific_name: 'Archachatina camerunensis', difficulty: 3,
    presentation: "Archachatina du Cameroun de 8 à 9 cm, plus petite que l'achatine bordée, au corps sombre. Rare, difficulté moyenne.",
    size_class: 'grand' },
  { ...ARCHACHATINA, common_name: 'Achatine de la Côte-de-l\'Or', scientific_name: 'Archachatina degneri',
    presentation: "Grande Archachatina du Ghana (10 à 14 cm), proche de l'achatine de Puylaert mais à la coquille plus allongée, en général brune sans reflet vert. Aucune forme albinos connue. Facile à reproduire." },
  { ...ARCHACHATINA, common_name: 'Achatine ventrue', scientific_name: 'Archachatina ventricosa', difficulty: 3,
    presentation: "Archachatina d'Afrique de l'Ouest à la coquille renflée (d'où son nom), vendue aussi en forme au corps albinos. Rarement proposée.",
    lifespan: "jusqu'à 10 ans (estimation)" },
  { ...ARCHACHATINA, common_name: 'Achatine naine', scientific_name: 'Archachatina papyracea', difficulty: 3,
    presentation: "« Achatine naine » du Cameroun, de 9 à 11 cm, à la coquille fine comme du papier. L'achatine d'Adeline (adelinae) en est une sous-espèce. Vendue aussi en forme à coquille albinos.",
    size_class: 'grand' },
  { ...ARCHACHATINA, common_name: 'Achatine de Calabar', scientific_name: 'Archachatina sp. "Calabar"',
    presentation: "Archachatina non décrite de la région de Calabar, au Nigeria, de 7 à 8 cm. Facile à garder et à reproduire selon l'éleveur.",
    size_class: 'moyen' },
  { ...ARCHACHATINA, common_name: 'Achatine bordée ovum', scientific_name: 'Archachatina marginata ovum',
    presentation: "La forme la plus élevée de l'achatine bordée, du Nigeria : 10 à 15 cm (17 à 20 cm pour la lignée « XXL »), coquille massive en forme d'œuf, corps foncé. Existe en corps clair, albinos, leucistique et acromélanique (pied foncé, coquille claire). Calme et facile." },
  { ...ARCHACHATINA, common_name: "Achatine bordée ovum 'Albinos'", scientific_name: 'Archachatina marginata ovum "Albinos"',
    presentation: "Forme au corps albinos (blanc crème) de l'achatine bordée ovum, très recherchée. Même taille (10 à 15 cm) et mêmes besoins que la forme sauvage." },
  { ...ARCHACHATINA, common_name: 'Achatine bordée suturalis', scientific_name: 'Archachatina marginata suturalis',
    presentation: "Sous-espèce du Nigeria et du Bénin (10 à 14 cm), à la coquille marquée de flammes et au bord souvent rose à rouge (« High red »). Existe en corps albinos, argenté (« Silver ») et leucistique. Facile." },
  { ...ARCHACHATINA, common_name: 'Achatine bordée candefacta', scientific_name: 'Archachatina marginata candefacta', difficulty: 3,
    presentation: "Sous-espèce du Cameroun, plus petite (8 à 9 cm), vendue en plusieurs lignées dont une rayée. Difficulté moyenne.",
    size_class: 'grand' },
  { ...ARCHACHATINA, common_name: 'Achatine bordée egregia', scientific_name: 'Archachatina marginata egregia',
    presentation: "Sous-espèce du Cameroun de 7 à 10 cm, aux très nombreuses variantes de coquille (lignées numérotées par les éleveurs, et une forme bicolore). Facile.",
    size_class: 'moyen' },
  { ...ARCHACHATINA, common_name: "Achatine bordée de Greville", scientific_name: 'Archachatina marginata grevillei', difficulty: 3,
    presentation: "Sous-espèce du Cameroun de 7 à 8 cm, vendue en forme dorée (« Gold ») et en forme rayée. La forme rayée est la plus facile.",
    size_class: 'moyen' },
  { ...ARCHACHATINA, common_name: 'Achatine bordée icterica', scientific_name: 'Archachatina marginata icterica',
    presentation: "Grande sous-espèce du Nigeria (12 à 15 cm), à la coquille aux teintes jaunes. Facile selon les éleveurs." },
  { ...ARCHACHATINA, common_name: "Achatine bordée d'Édouard", scientific_name: 'Archachatina marginata eduardi',
    presentation: "Sous-espèce du Cameroun de 8 à 10 cm, vendue aussi en variante « rhodei ». Facile à garder et à reproduire." },

  // ---------- Lissachatina ----------
  { ...LISSACHATINA, common_name: "Petit-gris africain 'Rodatzi'", scientific_name: 'Lissachatina fulica "Rodatzi"',
    presentation: "Forme de l'achatine commune à la coquille claire, crème à jaune pâle et sans rayures, sur un corps sombre (8 à 10 cm). L'inverse de la « White Jade » (corps blanc, coquille rayée)." },
  { ...LISSACHATINA, common_name: "Petit-gris africain 'Jadatzi'", scientific_name: 'Lissachatina fulica "Jadatzi"',
    presentation: "Forme de l'achatine commune toute claire : corps albinos de la « White Jade » et coquille sans rayures de la « Rodatzi ». Vendue aussi sous le nom de « Full Gold » ou « Full White Jade »." },
  { ...LISSACHATINA, common_name: "Petit-gris africain 'Madagascar'", scientific_name: 'Lissachatina fulica "Madagascar"',
    presentation: "Lignée de l'achatine commune venue de Madagascar (10 à 12 cm), à la coquille caramel, en forme claire ou foncée." },
  { ...LISSACHATINA, common_name: 'Achatine panthère', scientific_name: 'Lissachatina immaculata panthera',
    presentation: "Forme de l'achatine immaculée d'Afrique australe et de l'océan Indien (8 à 12 cm), à la coquille tachetée comme une panthère et au bord rose (« pink lipped »). Calme et facile." },
  { ...LISSACHATINA, common_name: "Achatine réticulée 'Albinos'", scientific_name: 'Lissachatina reticulata "Albinos"', temp_min: 24, temp_max: 28, humidity_min: 75, humidity_max: 90, difficulty: 2,
    presentation: "Forme au corps albinos de l'achatine réticulée de Tanzanie et de Zanzibar, l'une des plus grandes (10 à 17 cm), à la coquille quadrillée. Curieuse et active." },
  { ...LISSACHATINA, common_name: 'Achatine albopicta', scientific_name: 'Lissachatina albopicta',
    presentation: "Achatine d'Afrique de l'Est (Kenya, Tanzanie) de 10 à 12 cm, à la coquille marquée de flammes claires, vendue en plusieurs lignées numérotées. Facile." },
  { ...LISSACHATINA, common_name: 'Achatine de Craven', scientific_name: 'Lissachatina craveni',
    presentation: "Petite achatine d'Afrique de l'Est (6 à 8 cm), à la coquille élancée et colorée. Facile mais rarement proposée.",
    size_class: 'moyen' },
  { ...LISSACHATINA, common_name: 'Achatine de Zanzibar', scientific_name: 'Lissachatina zanzibarica', difficulty: 3,
    presentation: "Achatine de Zanzibar et de la côte tanzanienne (7 à 10 cm), aux nombreuses formes de coquille (lignées numérotées, dont une à coquille albinos). Un peu plus délicate que les autres Lissachatina.",
    repro_pitfalls: LISSACHATINA.repro_pitfalls + ' ' + HYBRIDS },

  // ---------- Limicolaria ----------
  { ...LIMICOLARIA, common_name: 'Limicolaire aethiops', scientific_name: 'Limicolaria aethiops',
    presentation: "Limicolaire du Nigeria de 5 à 6 cm, à la coquille flammée, vendue aussi en forme à coquille claire (« White »)." },
  { ...LIMICOLARIA, common_name: 'Limicolaire agathina', scientific_name: 'Limicolaria agathina',
    presentation: "Limicolaire du Nigeria de 5 à 6 cm, à la coquille rayée. Active de jour, vit en groupe." },
  { ...LIMICOLARIA, common_name: 'Limicolaire de Martens', scientific_name: 'Limicolaria martensiana',
    presentation: "Limicolaire d'Ouganda (5 cm), en formes à rayures sombres, claires ou sans rayures selon la localité (Mbarara, Kampala)." },
  { ...LIMICOLARIA, common_name: 'Limicolaire numide', scientific_name: 'Limicolaria numidica',
    presentation: "Limicolaire du Cameroun de 5 à 7,5 cm, en formes à rayures sombres ou claires." },
  { ...LIMICOLARIA, common_name: 'Limicolaire en tour', scientific_name: 'Limicolaria turris',
    presentation: "Limicolaire d'Afrique tropicale à la coquille haute et pointue comme une tour, plus rarement proposée." },
  { ...LIMICOLARIA, common_name: "Limicolaire 'Deep Red'", scientific_name: 'Limicolaria sp. "Deep Red"',
    presentation: "Limicolaire à coquille rouge profond vendue en Allemagne, souvent rapportée à Limicolaria aurora. Mêmes besoins que les autres limicolaires." },
  { ...LIMICOLARIA, common_name: "Limicolaire flammée 'White'", scientific_name: 'Limicolaria flammea "White"',
    presentation: "Forme à coquille blanche, sans flammes, de la limicolaire flammée (vendue aussi comme « unicolor »). Mêmes besoins que la forme sauvage." },

  // ---------- Autres Achatinidae ----------
  { ...ARCHACHATINA, common_name: 'Achatine arboricole du Cameroun', scientific_name: 'Pseudachatina connectens', difficulty: 4,
    presentation: "Achatine du Cameroun de 6 à 8 cm qui vit dans les arbres, à la coquille colorée. Rare et difficile à reproduire. Vendue sous la forme rollei.",
    habitat: "Terrarium plus haut que large, 8 cm de terreau humide, branches, écorces et plantes pour grimper. Chaleur, brumisation chaque jour, bonne aération ; nourriture posée en hauteur aussi.",
    niche: 'surface', size_class: 'moyen', repro_incubation: "Peu d'œufs (estimation).", repro_pitfalls: 'Bac trop bas, air sec, froid.' },
  { ...LITTER, common_name: 'Escargot de Dautzenberg', scientific_name: 'Ceras dautzenbergi',
    presentation: "Escargot à coquille allongée d'Afrique centrale (décrit du Congo, vendu d'une souche du Nigeria), de 4 cm, cousin des Subulina mais bien plus grand. Facile.",
    size_class: 'moyen', vigilance: 'Aucune' },
  { ...LITTER, common_name: 'Petit escargot aiguille', scientific_name: 'Allopeas gracile',
    presentation: "Minuscule escargot tropical (1 cm) à coquille fine et pointue, répandu dans les serres du monde entier. Équipe de nettoyage des terrariums humides." },
  { ...LITTER, common_name: 'Leptinaria', scientific_name: 'Leptinaria sp.',
    presentation: "Petit escargot d'Amérique tropicale (1,5 cm) à coquille brillante, vendu comme équipe de nettoyage. Se multiplie facilement." },
  { ...LITTER, common_name: 'Escargot aiguille du Sri Lanka', scientific_name: 'Paropeas achatinaceum',
    presentation: "Petit escargot d'Asie du Sud-Est (1 à 2 cm) à coquille élancée, vendu d'une souche du Sri Lanka. Équipe de nettoyage des terrariums humides." },
  { ...LITTER, common_name: 'Bulime tronqué', scientific_name: 'Rumina decollata', sociability: 'Seul ou entre eux',
    temp_min: 15, temp_max: 26, humidity_min: 60, humidity_max: 80,
    presentation: "Escargot méditerranéen (présent dans le sud de la France) de 3 à 4 cm, dont la coquille se casse au sommet en grandissant, d'où son nom. Il chasse les autres escargots et mange leurs œufs.",
    diet_summary: 'Omnivore : escargots, œufs, végétaux',
    vigilance: 'Mange escargots et œufs : jamais avec d\'autres escargots',
    habitat: "Petit bac avec 5 cm de terreau mêlé de calcaire, feuilles mortes, pierres. Supporte un air plus sec que les escargots tropicaux.",
    feeding_detail: "Petits escargots et limaces, œufs d'escargots, mais aussi légumes, feuilles et granulés ; calcium en permanence.",
    repro_sexing: "Hermaphrodite, capable de se reproduire seul.",
    repro_conditions: 'Température de la maison, calcium à volonté.',
    repro_pitfalls: "Le loger avec d'autres escargots (il les mange), bac détrempé.",
    lifespan: '2 à 4 ans (estimation)', size_class: 'moyen', diet_type: 'predateur' },
  { ...LITTER, common_name: 'Bulime tronqué du Sahara', scientific_name: 'Rumina saharica', sociability: 'Seul ou entre eux',
    temp_min: 18, temp_max: 28, humidity_min: 55, humidity_max: 75,
    presentation: "Cousin du bulime tronqué, d'Afrique du Nord et de Méditerranée orientale (vendu d'une souche de Rhodes), de 3 à 4 cm. Comme lui, il mange aussi les autres escargots.",
    diet_summary: 'Omnivore : escargots, œufs, végétaux',
    vigilance: 'Mange escargots et œufs : jamais avec d\'autres escargots',
    habitat: "Petit bac avec 5 cm de terreau mêlé de calcaire, pierres, feuilles mortes. Plutôt sec et chaud.",
    feeding_detail: "Petits escargots, œufs, légumes, granulés ; calcium en permanence.",
    repro_sexing: "Hermaphrodite, capable de se reproduire seul.",
    repro_conditions: 'Chaleur douce, calcium à volonté.',
    repro_pitfalls: "Le loger avec d'autres escargots (il les mange), bac détrempé.",
    lifespan: '2 à 4 ans (estimation)', size_class: 'moyen', diet_type: 'predateur', substrate_type: 'sec' },

  // ---------- Grands escargots du Sri Lanka et de Madagascar (Acavidae) ----------
  { ...ACAVID, common_name: 'Acavus à bouche rouge', scientific_name: 'Acavus haemastoma',
    presentation: "Escargot endémique du Sri Lanka (4 cm), à la coquille ronde et à l'ouverture rouge sang. Nocturne, il mange surtout des fruits pourrissants. Vendu en formes de localités (Mirrisa, Induruwa)." },
  { ...ACAVID, common_name: 'Acavus superbe', scientific_name: 'Acavus superbus',
    presentation: "Escargot du Sri Lanka de 5 cm, à la coquille globuleuse richement colorée. Vendu sous la forme grevillei de Kandy." },
  { ...ACAVID, common_name: "Oligospire de Walton", scientific_name: 'Oligospira waltoni',
    presentation: "Grand escargot du sud du Sri Lanka (6 cm), à la coquille ronde et lisse. Très rarement proposé.", size_class: 'moyen' },
  { ...ACAVID, common_name: 'Hélicophante à deux bandes', scientific_name: 'Helicophanta bicingulata',
    presentation: "Grand escargot de Madagascar (7 à 8 cm), à la coquille aplatie et très ouverte, marquée de deux bandes.", size_class: 'grand' },
  { ...ACAVID, common_name: 'Hélicophante magnifique', scientific_name: 'Helicophanta magnifica',
    presentation: "L'un des plus beaux escargots de Madagascar (7 à 9 cm), à la coquille large aux couleurs chaudes et à l'ouverture immense.", size_class: 'grand' },

  // ---------- Escargots d'Asie (Ariophantidae, Camaenidae, Dyakiidae) ----------
  { ...FOREST, common_name: "Cryptozona de l'Inde", scientific_name: 'Cryptozona bistrialis', difficulty: 1, temp_min: 22, temp_max: 30,
    presentation: "Escargot de l'Inde et du Sri Lanka de 3 cm, à la coquille brune marquée de deux lignes. Facile et prolifique." },
  { ...FOREST, common_name: 'Cryptozona du Siam', scientific_name: 'Cryptozona siamensis', difficulty: 1, temp_min: 22, temp_max: 30,
    presentation: "Escargot de Thaïlande de 3 cm, à la coquille brillante brun-roux, vendu en plusieurs lignées. Facile." },
  { ...FOREST, common_name: 'Hémiplecte de Phu Quoc', scientific_name: 'Hemiplecta distincta', difficulty: 3, temp_min: 22, temp_max: 28, humidity_min: 80,
    presentation: "Grand escargot d'Asie du Sud-Est (5 à 6 cm), vendu d'une souche de l'île de Phu Quoc (Vietnam), à la coquille aplatie et brillante." },
  { ...FOREST, common_name: 'Hémiplecte de Malaisie', scientific_name: 'Hemiplecta malaouyi', difficulty: 3, temp_min: 22, temp_max: 27, humidity_min: 80,
    presentation: "Escargot de Malaisie de 3,5 à 4 cm, à la coquille brillante. Rare et cher." },
  { ...FOREST, common_name: "Escargot d'Amboine", scientific_name: 'Tanychlamys amboinensis', difficulty: 1, temp_min: 22, temp_max: 28,
    presentation: "Petit escargot d'Indonésie (2 cm), vendu d'une souche de l'île de Selayar. Facile.", size_class: 'petit' },
  { ...FOREST, common_name: 'Camaena de Hainan', scientific_name: 'Camaena platyodon', difficulty: 1, temp_min: 20, temp_max: 27,
    presentation: "Escargot de l'île de Hainan (Chine), de 2,5 cm. Facile à garder et à reproduire." },
  { ...FOREST, common_name: 'Escargot de Rumphius', scientific_name: 'Dyakia rumphii', difficulty: 2, temp_min: 22, temp_max: 28, humidity_min: 80,
    presentation: "Escargot d'Indonésie de 3 à 3,5 cm, à la coquille aplatie, de la même famille que l'escargot lumineux de Bima." },
  { ...FOREST, common_name: 'Escargot de Webb', scientific_name: 'Hadra webbi', difficulty: 1, temp_min: 20, temp_max: 26,
    presentation: "Escargot des forêts du nord-est de l'Australie (5 cm), à la coquille ronde brun-roux. Facile selon l'éleveur ; les animaux d'Australie sont rarement exportés." },

  // ---------- Escargots des Antilles (Pleurodontidae) ----------
  { ...FOREST, common_name: 'Caracol de Cuba', scientific_name: 'Caracolus sagemon', difficulty: 1,
    presentation: "Escargot de l'est de Cuba (3,5 à 4,5 cm), à la coquille aplatie très variable : formes de plaine et de montagne de la Gran Piedra, formes sombres ou rayées, et une forme à coquille albinos. Facile." },
  { ...FOREST, common_name: 'Escargot de Saint-Domingue', scientific_name: 'Pleurodonte excellens', difficulty: 1,
    presentation: "Grand escargot de la République dominicaine (5 à 6 cm), à la coquille aplatie et carénée, vendu aussi sous le nom de Caracolus excellens. Facile." },
  { ...FOREST, common_name: 'Pleurodonte bordé', scientific_name: 'Pleurodonte marginella', difficulty: 1,
    presentation: "Escargot de Cuba de 3 à 4 cm, à la coquille brune bordée de clair, vendu en plusieurs formes (claire, semiaperta). Facile." },
  { ...FOREST, common_name: 'Zachrysia de Viñales', scientific_name: 'Zachrysia guanensis', difficulty: 3, temp_min: 22, temp_max: 26,
    presentation: "Escargot des falaises calcaires de Viñales, à l'ouest de Cuba (5 cm), à la coquille côtelée. Croissance lente, difficulté moyenne.",
    habitat: FOREST.habitat + " Pierres calcaires dans le bac." },
  { ...FOREST, common_name: 'Escargot brun de Cuba', scientific_name: 'Zachrysia provisoria', difficulty: 2,
    presentation: "Escargot de Cuba de 2,5 à 3 cm, à la coquille brune très côtelée. Introduit en Floride, il y abîme les jardins : à ne jamais relâcher.",
    vigilance: 'Invasif ailleurs : ne jamais relâcher' },

  // ---------- Escargots d'Europe et d'Amérique du Nord ----------
  { ...FOREST, common_name: 'Gros-gris', scientific_name: 'Cornu aspersum maxima', difficulty: 1,
    temp_min: 15, temp_max: 22, humidity_min: 70, humidity_max: 90,
    presentation: "Grande forme d'élevage du petit-gris (4 à 4,5 cm), originaire d'Afrique du Nord, élevée en héliciculture et vendue aussi comme « Helix maxima ». Facile, à garder au frais.",
    habitat: "Bac aéré avec 5 à 8 cm de terreau humide, mousse, écorces. Température de la maison, sans chauffage ; repos hivernal possible au frais.",
    repro_incubation: "Pontes de 50 à 100 œufs enterrés ; éclosion en deux à quatre semaines.",
    lifespan: '2 à 5 ans' },
  { ...FOREST, common_name: 'Otala ponctuée', scientific_name: 'Otala punctata', difficulty: 1,
    temp_min: 18, temp_max: 26, humidity_min: 60, humidity_max: 80,
    presentation: "Escargot d'Espagne et d'Afrique du Nord (3 à 3,5 cm), à la coquille ponctuée de brun et à l'ouverture sombre. Habitué à la sécheresse, il s'enferme dans sa coquille l'été.",
    habitat: "Bac aéré, 5 cm de terreau mêlé de sable et de calcaire, pierres. Moins humide que pour les escargots tropicaux : il faut des moments de sec.",
    repro_incubation: "Ponte de quelques dizaines d'œufs enterrés ; éclosion en trois à quatre semaines (estimation).",
    repro_pitfalls: 'Bac toujours détrempé, manque de calcium.', substrate_type: 'sec' },
  { ...FOREST, common_name: 'Disque flammé', scientific_name: 'Anguispira alternata', difficulty: 2,
    temp_min: 12, temp_max: 22, humidity_min: 75, humidity_max: 90,
    presentation: "Escargot des forêts de l'est de l'Amérique du Nord (2 cm), à la coquille plate flammée de brun-roux. Il vit dans le bois mort et mange des champignons.",
    habitat: "Bac aéré avec 5 cm de terreau humide, bois pourri, feuilles mortes, mousse. Frais : température de la maison ou moins, repos hivernal au frais conseillé.",
    feeding_detail: "Champignons, bois pourri, feuilles mortes, légumes ; calcium en permanence.",
    diet_summary: 'Détritivore : champignons, bois mort, légumes', size_class: 'petit', niche: 'litiere' },
  { ...FOREST, common_name: 'Disque flammé du Sud', scientific_name: 'Anguispira strongylodes', difficulty: 2,
    temp_min: 15, temp_max: 25, humidity_min: 75, humidity_max: 90,
    presentation: "Cousin du disque flammé, du sud-est des États-Unis (vendu d'une souche de Floride), de 2 cm. Supporte un peu plus de chaleur. Vendu aussi par ebugz.",
    habitat: "Bac aéré avec 5 cm de terreau humide, bois pourri, feuilles mortes, mousse. Température de la maison.",
    feeding_detail: "Champignons, bois pourri, feuilles mortes, légumes ; calcium en permanence.",
    diet_summary: 'Détritivore : champignons, bois mort, légumes', size_class: 'petit', niche: 'litiere' },

  // ---------- Clausilies du Vietnam ----------
  { ...FOREST, common_name: 'Clausilie de Cuc Phuong', scientific_name: 'Oospira vanbuensis', difficulty: 2,
    temp_min: 18, temp_max: 25, humidity_min: 80, humidity_max: 95,
    presentation: "Escargot en fuseau (3 cm) des forêts calcaires du parc de Cuc Phuong, au Vietnam. Comme toutes les clausilies, il ferme sa coquille avec une petite porte (clausilium). Il broute algues et lichens sur les pierres et les écorces.",
    habitat: "Bac aéré avec pierres calcaires et écorces couvertes de lichen, mousse, 3 à 5 cm de terreau humide. Frais à tempéré, très humide.",
    feeding_detail: "Lichens, algues, feuilles mortes, champignons, un peu de légumes ; calcium en permanence.",
    diet_summary: 'Brouteur : lichens, algues, feuilles mortes' },
  { ...FOREST, common_name: 'Clausilie de Pavie', scientific_name: 'Phaedusa paviei', difficulty: 2,
    temp_min: 18, temp_max: 25, humidity_min: 80, humidity_max: 95,
    presentation: "Escargot en fuseau (3 cm) du nord du Vietnam, de la même famille que la clausilie de Cuc Phuong. Il broute algues et lichens.",
    habitat: "Bac aéré avec pierres calcaires et écorces couvertes de lichen, mousse, 3 à 5 cm de terreau humide. Frais à tempéré, très humide.",
    feeding_detail: "Lichens, algues, feuilles mortes, champignons, un peu de légumes ; calcium en permanence.",
    diet_summary: 'Brouteur : lichens, algues, feuilles mortes' },

  // ---------- Escargots à opercule ----------
  { ...FOREST, common_name: 'Tropidophore de Cuvier', scientific_name: 'Tropidophora cuvieriana', difficulty: 4,
    temp_min: 22, temp_max: 26, humidity_min: 75, humidity_max: 90,
    presentation: "Grand escargot à opercule de Madagascar (5 à 5,5 cm), à la coquille carénée. Il ferme sa coquille avec un couvercle calcaire. Rare et difficile à reproduire.",
    repro_sexing: "Mâles et femelles séparés (escargot à opercule), difficiles à distinguer : garder un petit groupe.",
    repro_mating: "Accouplement entre un mâle et une femelle ; œufs pondus dans le substrat (estimation).",
    feeding_detail: "Feuilles mortes en décomposition, champignons, légumes tendres ; calcium et sol calcaire.",
    diet_summary: 'Détritivore : feuilles mortes, champignons', diet_type: 'detritivore', niche: 'litiere' },
  { ...LITTER, common_name: 'Moulinsia des Philippines', scientific_name: 'Moulinsia fusca', difficulty: 2, sociability: 'Petit groupe',
    presentation: "Petit escargot à opercule de l'île de Negros, aux Philippines (1 cm), à l'ouverture rouge (forme erythrostoma). Vit dans la litière.",
    vigilance: 'Petits qui passent par les aérations',
    repro_sexing: "Mâles et femelles séparés (escargot à opercule), difficiles à distinguer : garder un groupe.",
    repro_mating: "Accouplement entre un mâle et une femelle ; petits œufs dans la litière (estimation)." },

  // ---------- Escargot carnivore ----------
  { ...FOREST, common_name: 'Escargot carnivore du Nigeria', scientific_name: 'Gonaxis sp. "Nigeria"', difficulty: 4,
    sociability: 'Seul ou entre eux',
    presentation: "Petit escargot carnivore d'Afrique de l'Ouest (1,2 à 1,5 cm), de la famille des Streptaxidae : il chasse les autres escargots. Difficile à reproduire.",
    diet_summary: 'Carnivore : petits escargots', vigilance: 'Mange les autres escargots : bac à part',
    feeding_detail: "Petits escargots vivants (Subulina, Allopeas, jeunes achatines en trop), un peu de viande ou de poisson ; calcium.",
    diet_type: 'predateur', size_class: 'petit' },

  // ---------- Limaces tropicales (Veronicellidae) ----------
  { ...SLUG, common_name: 'Limace à bouclier', scientific_name: 'Veronicella sloanei',
    presentation: "Grande limace plate des Antilles (10 à 16 cm), au manteau couvrant tout le dos comme un bouclier. Calme, discrète et nocturne. Élevée en France, vendue aussi par Terrazoo.",
    size_class: 'grand', lifespan: '2 à 3 ans (estimation)' },
  { ...SLUG, common_name: 'Limace de Cuba', scientific_name: 'Veronicella cubensis',
    presentation: "Limace plate de Cuba (5 cm), introduite à Hawaï où elle abîme les cultures. Calme et nocturne." },
  { ...SLUG, common_name: 'Limace noire du Ghana', scientific_name: 'Laevicaulis sp. "Ghana"',
    presentation: "Limace plate d'Afrique de l'Ouest à dos de cuir noir (3 à 6 cm), cousine de Laevicaulis alte. Vendue par Isopods Mania (« Ghana black ») ; une forme du Nigeria existe aussi." },
  { ...SLUG, common_name: 'Limace du Brésil', scientific_name: 'Sarasinula sp. "Brésil"',
    presentation: "Limace plate d'Amérique du Sud, de la même famille que les Veronicella, vendue par ebugz. Calme et nocturne." }
];
