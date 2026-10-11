// Catalogue version 6: millipedes sold by breeders and shops that ship to
// France (Micro-Exo, ebugz, Isopods Mania, Insectorus, Exuvium,
// landsnails.org, Insektenliebe, Schaben & Co...). Names checked against
// GBIF and MilliBase. Figures come from the breeders' sheets; where little
// is published, care follows the family and is marked "estimation".
const GONOPODS = "Le mâle adulte n'a pas de pattes sur le 7e anneau : elles sont remplacées par les gonopodes, visibles en retournant l'animal. La femelle garde une rangée de pattes continue.";
const PILL = "Le mâle porte à l'arrière des pattes transformées en pinces (télopodes), visibles sous l'animal ; la femelle n'en a pas.";
const DEEP = "Substrat plus profond que la longueur d'un adulte (au moins 10 à 15 cm : ils s'enterrent pour muer et restent cachés une semaine) : terreau de feuilles fermentées, bois blanc pourri, feuilles mortes en surface, calcium en continu (os de seiche). Humide en profondeur, plus sec en surface, bonne aération. Chauffage par le haut si besoin, jamais par le dessous.";
const FOOD = "Feuilles mortes (chêne, hêtre) et bois blanc pourri en continu : c'est la base de leur alimentation. Légumes (courgette, carotte, patate douce, concombre) et fruits en complément, un peu de protéines de temps en temps (granulés pour poissons), calcium en permanence (os de seiche).";

// Large iules of Africa (Spirostreptidae, Odontopygidae).
const AFRICAN = {
  category: 'iule', sociability: 'Se garde en groupe', since: 6, difficulty: 1,
  temp_min: 23, temp_max: 27, humidity_min: 70, humidity_max: 85,
  diet_summary: 'Détritivore : feuilles, bois pourri, légumes',
  vigilance: 'Sécrétion irritante si stressé : se laver les mains',
  habitat: DEEP,
  feeding_detail: FOOD,
  repro_sexing: GONOPODS,
  repro_conditions: "Groupe d'adultes, substrat profond toujours humide en profondeur, renouvelé en feuilles et bois pourri.",
  repro_mating: "Accouplement ventre contre ventre ; la femelle pond dans le substrat, chaque œuf enrobé dans une petite boule de terre.",
  repro_incubation: 'Quelques semaines dans le substrat (estimation).',
  repro_juveniles: "Les petits restent enterrés et grandissent lentement : plusieurs années jusqu'à l'adulte.",
  repro_pitfalls: "Fouiller ou changer tout le substrat (œufs et jeunes perdus), substrat sec, chauffage par le dessous.",
  lifespan: '5 à 10 ans (estimation)', size_class: 'grand', diet_type: 'detritivore', niche: 'fouisseur', substrate_type: 'humide'
};

// Giant iules of Asia (Harpagophoridae): warmer and more humid.
const ASIAN = {
  ...AFRICAN, difficulty: 3, temp_min: 24, temp_max: 28, humidity_min: 75, humidity_max: 90,
  repro_pitfalls: "Air ou substrat secs, froid, substrat trop peu profond pour muer, dérangements.",
  lifespan: '5 à 10 ans (estimation)'
};

// Mid-sized colourful iules (Pachybolidae): climbers, livelier.
const PACHY = {
  ...AFRICAN, sociability: 'Groupe', temp_min: 22, temp_max: 27, humidity_min: 70, humidity_max: 85,
  habitat: DEEP + " Branches et écorces : ils grimpent volontiers.",
  repro_juveniles: "Les petits restent cachés dans le substrat ; croissance de quelques mois à deux ans selon l'espèce.",
  lifespan: '3 à 7 ans (estimation)', size_class: 'moyen', niche: 'surface'
};

// Small iules (Rhinocricidae, Pseudospirobolellidae, Spirobolellidae...).
const SMALL = {
  ...PACHY, temp_min: 20, temp_max: 27, humidity_min: 70, humidity_max: 85,
  habitat: "Bac de 30 cm suffisant pour un groupe, 8 à 10 cm de terreau de feuilles et de bois blanc pourri, feuilles mortes, mousse, écorces et branches. Bonne aération.",
  repro_juveniles: 'Les petits grandissent en quelques mois.',
  lifespan: '2 à 3 ans', size_class: 'petit'
};

// Flat-backed millipedes (Polydesmida): very humid, short-lived.
const FLAT = {
  ...AFRICAN, sociability: 'Groupe', difficulty: 2, temp_min: 21, temp_max: 26, humidity_min: 75, humidity_max: 95,
  habitat: "Bac aéré mais très humide : 8 à 10 cm de terreau de feuilles et beaucoup de bois blanc pourri, feuilles mortes, mousse, écorces ; calcium (os de seiche, coquilles broyées). Ne jamais laisser sécher.",
  repro_mating: "Accouplement ventre contre ventre ; la femelle pond dans un petit nid de terre en forme de dôme, enfoui dans le substrat.",
  repro_juveniles: "Les petits sortent du nid avec peu de pattes et en gagnent à chaque mue ; croissance en quelques mois.",
  repro_pitfalls: 'Substrat qui sèche, manque de bois pourri, bac confiné.',
  lifespan: '1 à 2 ans (estimation)', size_class: 'moyen', niche: 'litiere'
};

module.exports = [
  // ---------- Spirostreptidae et Odontopygidae d'Afrique ----------
  { ...AFRICAN, common_name: 'Iule géant à pattes ivoire', scientific_name: 'Dendrostreptus macracanthus',
    temp_min: 22, temp_max: 26,
    presentation: "Grand iule du Cameroun (jusqu'à 18–25 cm), noir brillant aux pattes ivoire. Actif et bon grimpeur, on le voit souvent sur les branches et les parois, surtout le soir ou après une brumisation. Paisible, en groupe ou seul.",
    habitat: DEEP + " Branches et racines : il grimpe beaucoup.", niche: 'surface' },
  { ...AFRICAN, common_name: 'Iule géant de Fischer', scientific_name: 'Spiropoeus fischeri',
    presentation: "Grand iule d'Afrique de l'Ouest (20 à 25 cm), longtemps vendu comme Mardonius parilis. La forme la plus courante a les pattes rouges ; la forme acuticonus a les pattes noires. Facile." },
  { ...AFRICAN, common_name: "Iule géant de Fischer 'acuticonus'", scientific_name: 'Spiropoeus fischeri "acuticonus"',
    presentation: "Forme à pattes noires de l'iule géant de Fischer (Mardonius parilis acuticonus pour les vendeurs), proposée en animaux nés en captivité. Mêmes besoins que la forme à pattes rouges ; ne pas les mélanger." },
  { ...AFRICAN, common_name: 'Iule noir et rose du Cameroun', scientific_name: 'Odontostreptus sjoestedti', difficulty: 2,
    temp_min: 22, temp_max: 26,
    presentation: "Grand iule du Cameroun (15 à 20 cm), noir rayé de rose à saumon, plus ou moins marqué selon les animaux. Paisible, lent, nocturne ; il creuse volontiers." },
  { ...AFRICAN, common_name: 'Iule noir à pattes rouges', scientific_name: 'Telodeinopus bibundinus',
    presentation: "Grand iule du Nigeria et du Cameroun (15 à 22 cm), noir aux pattes rouges à roses, cousin de l'iule olive Telodeinopus aoutii. Relativement actif, facile.", niche: 'surface' },
  { ...AFRICAN, common_name: 'Iule « Cameroon Red Leg »', scientific_name: 'Treptogonostreptus intricatus',
    presentation: "Iule du Cameroun au corps sombre et aux pattes rouges contrastées, vendu autrefois comme Mardonius sp. « Cameroon Red Leg ». Calme, il vit au sol, s'enterre complètement et peut rester longtemps invisible : c'est normal." },
  { ...AFRICAN, common_name: "Iule d'Afrique du Sud à pattes roses", scientific_name: 'Orthoporoides tabulinus',
    presentation: "Iule d'Afrique du Sud (10 à 14 cm) aux pattes rose fuchsia. Facile à garder, il se reproduit bien sur un substrat riche.", size_class: 'grand' },
  { ...AFRICAN, common_name: "Iule d'Ibanda", scientific_name: 'Spirostreptus ibanda',
    presentation: "Iule d'Afrique de l'Est, rarement proposé (ebugz). Même élevage que les autres grands Spirostreptus." },
  { ...AFRICAN, common_name: "Iule épineux d'Afrique australe", scientific_name: 'Doratogonus sp. "Spike"',
    temp_min: 22, temp_max: 27, humidity_min: 65, humidity_max: 80,
    presentation: "Doratogonus d'Afrique australe vendu sous le nom « Spike », cousin de Doratogonus stylifer. Mêmes besoins : un peu moins humide que les iules de forêt." },
  { ...AFRICAN, common_name: "Iule « Grüne Fee »", scientific_name: 'Spirostreptidae sp. 8', family: 'Spirostreptidae', difficulty: 2,
    presentation: "Grand iule d'Afrique de l'Ouest (Nigeria, Cameroun ; jusqu'à 25–30 cm), sombre aux reflets vert métallique selon la lumière, d'où son nom allemand « fée verte ». Assez actif. Il se roule en spirale quand on l'inquiète." },
  { ...AFRICAN, common_name: 'Iule orange et noir', scientific_name: 'Spirostreptidae sp. 9', family: 'Spirostreptidae',
    humidity_min: 65, humidity_max: 80,
    presentation: "Grand iule de savane africaine (15 à 25 cm), orange et noir, relativement actif. Facile." },
  { ...AFRICAN, common_name: 'Iule « Rainbow » du Bénin', scientific_name: 'Spirostreptidae sp. "Rainbow"', family: 'Spirostreptidae', difficulty: 2,
    humidity_min: 65, humidity_max: 80,
    presentation: "Iule de savane du Bénin (14 à 16 cm), aux couleurs très nuancées. Peu courant." },
  { ...AFRICAN, common_name: 'Iule du Togo', scientific_name: 'Spirostreptidae sp. "Togo"', family: 'Spirostreptidae',
    presentation: "Grand iule non identifié du Togo, proposé par Insectorus et Isopods Mania. Même élevage que les grands iules d'Afrique de l'Ouest." },
  { ...AFRICAN, common_name: "Iule d'Afrique du Sud « Spinotarsus »", scientific_name: 'Spinotarsus xanthonotus',
    presentation: "Iule d'Afrique australe (10 à 14 cm), peu courant, actif et facile à observer. Son nom veut dire « dos jaune ».", niche: 'surface' },
  { ...AFRICAN, common_name: 'Iule rouge de Tanzanie', scientific_name: 'Peridontopyge rubescens',
    temp_min: 22, temp_max: 26, size_class: 'moyen',
    presentation: "Iule de Tanzanie (moins de 10 cm), rouge à brun-rouge selon l'âge et la mue. Paisible, il vit au sol et s'enterre complètement ; dérangé, il fuit ou s'enroule." },
  { ...AFRICAN, common_name: 'Iule de Lomont', scientific_name: 'Orthoporus lomonti', difficulty: 2,
    humidity_min: 60, humidity_max: 75,
    presentation: "Iule du même genre que l'iule du désert (Orthoporus ornatus), proposé par ebugz et Isopods Mania. Il supporte un bac moins humide que les iules de forêt (estimation)." },

  // ---------- Grands iules d'Asie (Harpagophoridae) ----------
  { ...ASIAN, common_name: 'Iule géant de Thaïlande', scientific_name: 'Thyropygus allevatus', difficulty: 1,
    temp_min: 25, temp_max: 28, humidity_min: 75, humidity_max: 95,
    presentation: "« Le géant d'Asie » : iule de Thaïlande jusqu'à 30 cm, brun foncé aux anneaux plus clairs. Calme mais actif, il explore beaucoup ; robuste et peu stressé. Maturité vers 3 à 4 ans.",
    repro_conditions: 'Patience : maturité vers 3 à 4 ans, substrat profond et stable.' },
  { ...ASIAN, common_name: 'Iule arboricole géant de Malaisie', scientific_name: 'Anurostreptus sp. "Pak Chong"',
    presentation: "Très grand iule d'Asie du Sud-Est (28 à 35 cm), qui grimpe dans les arbres. Vendu sous le nom de localité « Pak Chong » (Thaïlande) ou comme « Giant » de Malaisie.",
    habitat: DEEP + " Grand bac haut, avec de grosses branches solides.", niche: 'surface' },
  { ...ASIAN, common_name: 'Iule géant à pattes rouges', scientific_name: 'Balustreptus falcatus', difficulty: 2,
    presentation: "Grand iule d'Asie du Sud-Est (Vietnam) aux pattes rouges, rare et très recherché (forme « XXL »).",
    habitat: DEEP + " Grosses branches pour grimper.", niche: 'surface' },
  { ...ASIAN, common_name: 'Iule géant à pattes blanches', scientific_name: 'Balustreptus sp. "Silverleg"', difficulty: 1,
    presentation: "Très grand iule arboricole du Vietnam (30 à 32 cm), aux pattes blanches à argentées (« White Leg », « Silverleg »). Facile.",
    habitat: DEEP + " Grand bac haut, avec de grosses branches solides.", niche: 'surface' },
  { ...ASIAN, common_name: "Iule de l'Indonésie « Remulopygus »", scientific_name: 'Remulopygus brevispinus', difficulty: 4,
    temp_min: 22, temp_max: 26, humidity_min: 80, humidity_max: 90,
    presentation: "Iule d'Asie du Sud-Est (vendu comme venant de Java), de 15 à 17 cm, brun foncé à noir légèrement brillant. Nocturne, calme, fouisseur. Réservé aux éleveurs expérimentés ; reproduction rarement réussie." },
  { ...ASIAN, common_name: "Iule d'Afrique du Sud « Zinophora »", scientific_name: 'Zinophora sp.',
    temp_min: 18, temp_max: 25, humidity_min: 70, humidity_max: 85,
    presentation: "Iule d'Afrique du Sud (8 à 14 cm), de climat tempéré humide, particulièrement friand de fruits. Une très belle espèce, de difficulté moyenne.",
    size_class: 'grand' },

  // ---------- Iules colorés (Pachybolidae) ----------
  { ...PACHY, common_name: 'Iule thaï à pattes orange', scientific_name: 'Atopochetus spinimargo',
    temp_min: 20, temp_max: 27, humidity_min: 75, humidity_max: 90,
    presentation: "Iule de l'est de la Thaïlande (Isan), introduit au Vietnam, de 8 à 10 cm : mâles aux pattes et anneaux noirs, femelles aux pattes rougeâtres, bandes orange. Les adultes se promènent souvent de jour sur les branches. Facile, prolifique, il supporte des périodes plus sèches.",
    repro_conditions: 'Prolifique en groupe.', lifespan: '2 à 3 ans' },
  { ...PACHY, common_name: "Iule thaï « Orange Dot »", scientific_name: 'Atopochetus sp. "Orange Dot"',
    presentation: "Atopochetus de Thaïlande (10 à 14 cm), relativement coloré et actif, peu courant. Facile." },
  { ...PACHY, common_name: "Iule thaï « Red Satun »", scientific_name: 'Atopochetus sp. "Red Satun"',
    presentation: "Atopochetus rouge de la province de Satun, au sud de la Thaïlande, proposé par Isopods Mania. Même élevage que les autres Atopochetus." },
  { ...PACHY, common_name: 'Iule rouge du Mozambique', scientific_name: 'Centrobolus anulatus',
    presentation: "Iule rouge du Mozambique (6 à 8 cm, vendu sous le nom « annulatus »), extrêmement actif, de la famille du iule rouge Centrobolus richardii. Facile." },
  { ...PACHY, common_name: "Iule rouge d'Afrique du Sud", scientific_name: 'Centrobolus rugulosus',
    presentation: "Centrobolus d'Afrique du Sud, rouge et noir comme ses cousins, plus rarement proposé (ebugz)." },
  { ...PACHY, common_name: 'Iule à bandes jaunes', scientific_name: 'Pelmatojulus ligulatus', difficulty: 3,
    temp_min: 25, temp_max: 28, humidity_min: 80, humidity_max: 95,
    presentation: "Iule d'Afrique de l'Ouest (Togo, Bénin, Nigeria, Ghana) de 12 à 14 cm : anneaux jaune à orange et brun foncé, antennes rouges. Nocturne, il vit au sol sous le bois pourri. Reproduit plusieurs fois en élevage ; maturité vers 2 ans. Il lui faut sans cesse du bois blanc pourri et des feuilles.",
    repro_conditions: "Maturité vers 2 ans ; bois pourri et feuilles toujours disponibles.", niche: 'litiere', size_class: 'grand' },
  { ...PACHY, common_name: 'Iule à bandes géant', scientific_name: 'Pelmatojulus tectus',
    humidity_min: 70, humidity_max: 85,
    presentation: "Iule de savane du Cameroun (16 à 20 cm), proche de l'iule à bandes jaunes mais plus grand et plus contrasté (vendu aussi comme Pelmatojulus sp. « Giant »). Facile.", size_class: 'grand' },
  { ...PACHY, common_name: 'Iule rouge de Madagascar', scientific_name: 'Aphistogoniulus polleni',
    temp_min: 22, temp_max: 26, humidity_min: 80, humidity_max: 90,
    presentation: "Iule des forêts humides de Madagascar (15 à 18 cm), rouge châtaigne à noir selon la lumière, pattes noires brillantes. Calme et nocturne. Relativement facile à reproduire, avec de la patience ; petits à croissance lente. Vendu aussi comme « Spirostreptidae sp. 6 ».",
    size_class: 'grand', niche: 'fouisseur' },

  // ---------- Petits iules d'Asie et des tropiques ----------
  { ...SMALL, common_name: 'Iule fluorescent du Siam', scientific_name: 'Benoitolus siamensis',
    temp_min: 20, temp_max: 28, humidity_min: 65, humidity_max: 75,
    presentation: "Petit iule de Thaïlande (jusqu'à 6 cm), toujours trouvé près des plages, dans les fourches d'arbres pleines d'humus. Gris foncé à bandes jaune-orange et pattes orange ; sous une lampe UV (365 nm), il brille en bleu électrique. Facile, assez prolifique.",
    repro_mating: "Ponte dans l'humus ; dans la nature, dans les fourches d'arbres remplies de feuilles.", lifespan: '2 à 3 ans' },
  { ...SMALL, common_name: 'Petit iule thaï « Coxobolellus »', scientific_name: 'Coxobolellus sp. "Thaïlande"',
    presentation: "Petit iule de Thaïlande d'un genre décrit en 2020, vendu par Isopods Mania (sous le nom « Coxobollelus »). Même élevage que l'iule fluorescent du Siam." },
  { ...SMALL, common_name: 'Petit iule de Maui', scientific_name: 'Spirobolellus sp. "Maui"', temp_min: 20, temp_max: 26,
    presentation: "Tout petit iule (moins de 3,5 cm) d'une souche de Maui (Hawaï), très contrasté. Calme et lent ; il s'enroule puis s'éloigne vite quand on le dérange. Un bac de 20 × 20 cm suffit. Il supporte mal le sec permanent." },
  { ...SMALL, common_name: 'Iule bourdon « sp. 1 »', scientific_name: 'Anadenobolus sp. 1',
    presentation: "Petit iule des Caraïbes (5 à 8 cm), très coloré, cousin du iule bourdon Anadenobolus monilicornis. Facile et relativement prolifique.",
    size_class: 'moyen', temp_min: 22, temp_max: 28 },
  { ...SMALL, common_name: 'Iule de Guyane', scientific_name: 'Rhinocricus sp. "Guyane"',
    presentation: "Iule d'Amérique du Sud (6 à 10 cm), proposé d'une souche de Guyane française. Peu courant, facile à garder et à reproduire.",
    size_class: 'moyen', temp_min: 22, temp_max: 28 },
  { ...SMALL, common_name: 'Iule géant de Java à pattes jaunes', scientific_name: 'Acladocricus sp. "Java Giant"', difficulty: 3,
    temp_min: 23, temp_max: 26, humidity_min: 80, humidity_max: 90,
    presentation: "Grand iule des forêts de Java (Indonésie), brun foncé à noir aux pattes jaune citron, vendu comme « Java Giant Yellow Legs » ; une forme « White Legs » existe aussi. Doux et paisible, caché le jour. Les petits grandissent lentement.",
    habitat: "Bac d'au moins 40 à 50 cm, épaisse couche de terreau de feuilles, bois blanc pourri, un peu de sphaigne, feuilles mortes ; brumisation régulière.",
    repro_incubation: "Œufs pondus dans de petites cavités du substrat ; éclosion après quelques semaines.",
    repro_juveniles: 'Croissance lente mais régulière.', lifespan: '5 ans et plus (estimation)', size_class: 'grand', niche: 'fouisseur' },
  { ...SMALL, common_name: "Iule « Avatar »", scientific_name: 'Salpidobolus sp. "Avatar"', difficulty: 2,
    temp_min: 22, temp_max: 28, humidity_min: 75, humidity_max: 90,
    presentation: "Iule d'Indonésie de la famille des Rhinocricidae, vendu sous le nom « Avatar » pour ses couleurs (Isopods Mania). Peu documenté en élevage.",
    size_class: 'moyen', lifespan: '3 à 5 ans (estimation)' },
  { ...SMALL, common_name: 'Iule jaune de Thaïlande', scientific_name: 'Glyphiulus sp. "Thaïlande"',
    temp_min: 22, temp_max: 26, humidity_min: 75, humidity_max: 90,
    presentation: "Iule de Thaïlande (environ 12 cm), jaune vif aux fines marques plus sombres, de la famille des Cambalopsidae. Nocturne et paisible ; il vit au sol, enterré ou sous les écorces le jour. Facile ; se garde avec des cloportes ou des collemboles.",
    repro_incubation: "Œufs pondus dans le substrat ; les petits éclosent après quelques semaines.", size_class: 'moyen', niche: 'litiere' },
  { ...SMALL, common_name: 'Iule très long de Chine', scientific_name: 'Bilingulus sp.',
    temp_min: 22, temp_max: 27, humidity_min: 75, humidity_max: 90,
    presentation: "Iule de Chine très long et fin (16 à 26 cm), extrêmement actif, rare en élevage. Facile selon l'éleveur.",
    habitat: "Bac long (au moins 50 cm) et bien fermé : il est très actif. 10 cm de terreau de feuilles et bois blanc pourri, feuilles mortes, écorces.", size_class: 'grand', lifespan: '3 à 5 ans (estimation)' },

  // ---------- Iules plats (Polydesmida) ----------
  { ...FLAT, common_name: 'Iule plat à bande jaune', scientific_name: 'Coromus vittatus', difficulty: 3,
    temp_min: 21, temp_max: 26, humidity_min: 70, humidity_max: 95,
    presentation: "Iule plat d'Afrique de l'Ouest (Cameroun, Nigeria, Liberia), jusqu'à 10 cm, brun foncé à pattes rouge-brun et bande jaune sur le dos. Crépusculaire, il grimpe aux branches. Facile à garder, difficile à reproduire (pertes élevées chez les jeunes).",
    repro_pitfalls: 'Reproduction rare en élevage, avec beaucoup de pertes ; substrat sec, manque de bois pourri.' },
  { ...FLAT, common_name: "Iule plat « Chocolate »", scientific_name: 'Coromus sp. "Chocolate"',
    presentation: "Iule plat du Togo (6 à 7 cm), brun chocolat, de difficulté moyenne. Cousin de l'iule plat à bord doré Coromus diaphorus." },
  { ...FLAT, common_name: 'Iule dragon de Thaïlande', scientific_name: 'Orthomorpha subkarschi', difficulty: 3,
    vigilance: "Sécrétion à odeur d'amande (cyanure) : se laver les mains",
    presentation: "Petit iule plat de Thaïlande (4 cm), de la famille des iules dragons. Difficulté moyenne.", size_class: 'petit' },
  { ...FLAT, common_name: "Iule dragon d'Ao Nang", scientific_name: 'Orthomorpha sp. "Ao Nang"', difficulty: 1,
    temp_min: 22, temp_max: 26,
    vigilance: "Sécrétion à odeur d'amande (cyanure) : se laver les mains",
    presentation: "Iule plat des falaises calcaires d'Ao Nang, au sud de la Thaïlande (près de 4 cm). Il lui faut beaucoup de calcium. Facile, il se reproduit volontiers en groupe : on voit grandir les petits.",
    habitat: "Bac d'au moins 30 × 30 cm, 10 cm de terreau de feuilles, bois blanc pourri, sphaigne et feuilles mortes, avec le double de calcium habituel (grit de coquillages) ; roches volcaniques pour grimper. Toujours humide.",
    repro_conditions: 'Se reproduit volontiers en groupe.', size_class: 'petit' },
  { ...FLAT, common_name: 'Iule plat à perles rouges', scientific_name: 'Prepodesmus ornatus', difficulty: 1,
    temp_min: 22, temp_max: 26, humidity_min: 75, humidity_max: 85,
    presentation: "Petit iule plat des forêts du Nigeria (moins de 4 cm), noir profond orné de tubercules rouge-orange sur chaque anneau. Calme, actif le soir ou après une brumisation ; il cohabite bien avec cloportes et collemboles.",
    size_class: 'petit' },
  { ...FLAT, common_name: 'Iule plat bleu du Japon', scientific_name: 'Parafontaria tonominea', difficulty: 3,
    temp_min: 15, temp_max: 22, humidity_min: 75, humidity_max: 90,
    vigilance: "Sécrétion à odeur d'amande (cyanure) : se laver les mains",
    presentation: "Iule plat du Japon (5 à 8 cm), gris bleuté, très rare en élevage. Difficulté moyenne. Climat plus frais que les espèces tropicales (estimation)." },
  { ...FLAT, common_name: 'Iule plat rouge des Appalaches', scientific_name: 'Boraria sp. "Red"', difficulty: 3,
    temp_min: 15, temp_max: 22, humidity_min: 75, humidity_max: 90,
    vigilance: "Sécrétion à odeur d'amande (cyanure) : se laver les mains",
    presentation: "Iule plat d'Amérique du Nord (forêts des Appalaches), rouge et noir, de la famille des Xystodesmidae aux couleurs d'avertissement. Climat tempéré, frais et humide (estimation)." },

  // ---------- Iules d'Europe et d'Asie tempérée (Julidae) ----------
  { ...SMALL, common_name: 'Iule ivoire du Caucase', scientific_name: 'Pachyiulus krivolutskyi', difficulty: 3,
    temp_min: 17, temp_max: 25, humidity_min: 70, humidity_max: 85,
    vigilance: "Forte odeur d'ail : plutôt dans une pièce à part",
    presentation: "Iule des forêts du Caucase (Russie), jusqu'à 9 cm, jaune ivoire avec une fine ligne noire sur le dos et des motifs noirs sur les côtés. Il sort du sol quand il pleut. Forte odeur d'ail ; à garder sans autres iules ni cloportes.",
    habitat: "Bac d'au moins 30 × 30 × 30 cm, au moins 9 cm de substrat mi-humide (terreau de feuilles, bois pourri), recouvert de feuilles, d'écorce ou de mousse. Température de la maison, sans chauffage.",
    repro_conditions: "Un repos hivernal au frais n'est pas obligatoire mais aide à déclencher les accouplements.",
    sociability: 'Groupe, sans autres espèces', size_class: 'moyen', niche: 'fouisseur', lifespan: '2 à 4 ans (estimation)' },
  { ...SMALL, common_name: 'Iule rouille des Balkans', scientific_name: 'Paectophyllum ferrugineum', difficulty: 1,
    temp_min: 15, temp_max: 24, humidity_min: 50, humidity_max: 65,
    presentation: "Iule des Balkans de taille moyenne (6 à 10 cm), couleur rouille, qui vit en milieu sec. Facile.",
    habitat: "Bac aéré avec 8 cm de terreau mêlé de sable, feuilles mortes, bois pourri, un coin plus humide. Température de la maison, sans chauffage.",
    size_class: 'moyen', substrate_type: 'sec', lifespan: '2 à 4 ans (estimation)' },

  // ---------- Iule boule ----------
  { category: 'iule', common_name: 'Glomeris bourdon du Laos', scientific_name: 'Hyleoglomeris cf. bomba', since: 6,
    difficulty: 3, temp_min: 20, temp_max: 27, humidity_min: 65, humidity_max: 75,
    sociability: 'Groupe', diet_summary: 'Détritivore : feuilles, bois pourri, lichens',
    vigilance: 'Aucune',
    presentation: "Petit iule boule (jusqu'à 2 cm) aux couleurs de bourdon, de Nong Khiaw au Laos ; « cf. » parce qu'il ressemble à Hyleoglomeris bomba de Thaïlande sans être sûr d'être la même espèce. Actif de jour comme de nuit, il se roule en boule et se manipule sans risque.",
    habitat: "Boîte de 4,5 litres ou plus, substrat plus profond que pour des cloportes (il mue enterré), au moins la moitié couverte de mousse de forêt et de feuilles en décomposition, beaucoup de bois blanc pourri.",
    feeding_detail: "Lichens, mousse, feuilles en décomposition, bois blanc pourri, kinshi, flake soil, un peu de fruits, légumes et granulés pour poissons, calcium ; gelée pour insectes une fois par semaine.",
    repro_sexing: PILL,
    repro_conditions: 'Moyennement prolifique ; colonie au calme.',
    repro_mating: "Œufs pondus dans le substrat, souvent enfermés dans une petite capsule de terre.",
    repro_incubation: 'Quelques semaines (estimation).',
    repro_juveniles: 'Croissance lente.',
    repro_pitfalls: 'Bac qui sèche, manque de mousse et de bois pourri.',
    lifespan: '1 à 2 ans', size_class: 'petit', diet_type: 'detritivore', niche: 'litiere', substrate_type: 'humide' }
];
