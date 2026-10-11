// Third batch (catalogue version 3): mantises sold by eBugz, Insectorus and
// Isopods Mania in 2026. Mantises share most of their care, so each group's
// is written once and every species says what sets it apart.
const ALONE = 'Solitaire : une mante par bac';
const MOLT = "Les jeunes muent suspendus au plafond du bac : il doit faire au moins trois fois leur longueur en hauteur, avec un couvercle en grillage.";
const SEXING = "Comptez les segments sous l'abdomen à partir du subadulte : 6 chez la femelle, 8 chez le mâle. Le mâle adulte est plus fin, avec des antennes plus longues et des ailes qui dépassent l'abdomen.";
const MATING = "Bien nourrir la femelle avant de présenter le mâle, et les surveiller : elle peut le manger. Elle pond ensuite une oothèque (une mousse qui durcit) accrochée à une branche.";

const BASE = {
  category: 'mante', sociability: ALONE, vigilance: 'Aucune',
  repro_sexing: SEXING, repro_mating: MATING,
  repro_conditions: 'Femelle adulte depuis deux semaines et bien nourrie.',
  repro_pitfalls: 'Jeunes laissés ensemble (cannibalisme), mues ratées dans un bac trop sec ou trop bas.',
  since: 3
};
// Large green mantises: robust, eat almost anything that moves.
const GIANT = {
  ...BASE, diet_summary: 'Prédateur : mouches, grillons, blattes',
  habitat: "Bac aéré plus haut que large, branches pour s'accrocher, brumisation légère deux ou trois fois par semaine.",
  feeding_detail: "Drosophiles puis mouches pour les petits, puis mouches, grillons et blattes ; deux ou trois proies par semaine pour un adulte.",
  repro_incubation: '4 à 6 semaines à 25-28 °C.',
  repro_juveniles: 'Nombreux petits à séparer rapidement. ' + MOLT
};
// Flower mantises: small, colourful, want flying prey and air.
const FLOWER = {
  ...BASE, diet_summary: 'Prédateur : insectes volants',
  habitat: "Bac bien aéré et haut, branches fines, brumisation légère tous les deux jours ; jamais de bac confiné.",
  feeding_detail: "Surtout des insectes volants : drosophiles pour les petits, puis mouches et papillons de nuit.",
  repro_incubation: '4 à 6 semaines.',
  repro_juveniles: 'Petits délicats, nourris de drosophiles. ' + MOLT,
  repro_pitfalls: 'Proies rampantes seulement, bac confiné, cannibalisme.'
};
// Dead-leaf and leaf mantises: humid, calm, slow.
const LEAF = {
  ...BASE, diet_summary: 'Prédateur : mouches, grillons',
  habitat: "Bac aéré et haut, branches et feuilles sèches pour le camouflage, humidité plus élevée que la moyenne des mantes (brumisation quotidienne légère).",
  feeding_detail: "Mouches, grillons, blattes ; elles chassent à l'affût et mangent moins que les grandes mantes vertes.",
  repro_incubation: '6 à 8 semaines.',
  repro_juveniles: 'Petits sensibles à la sécheresse. ' + MOLT,
  repro_pitfalls: 'Bac trop sec au moment des mues.'
};
// Empusidae and other dry-country mantises: heat, light, flying prey.
const DRYHEAT = {
  ...BASE, diet_summary: 'Prédateur : insectes volants',
  habitat: "Bac haut et très aéré, chaleur forte le jour (lampe), plus fraîche la nuit, humidité basse ; brumisation légère deux fois par semaine.",
  feeding_detail: "Insectes volants surtout (mouches, papillons de nuit), parfois petits criquets.",
  repro_incubation: '5 à 7 semaines.',
  repro_juveniles: 'Petits à nourrir de drosophiles. ' + MOLT,
  repro_pitfalls: 'Humidité trop élevée, manque de chaleur, proies non volantes.'
};
// Bark mantises: flat, fast, live pressed against tree trunks.
const BARK = {
  ...BASE, diet_summary: 'Prédateur : mouches, petits grillons',
  habitat: "Bac aéré plus haut que large avec de grandes écorces de liège verticales où elles se plaquent ; brumisation légère tous les deux jours.",
  feeding_detail: "Mouches, petits grillons et blattes qui passent sur l'écorce.",
  repro_incubation: '4 à 6 semaines.',
  repro_juveniles: 'Petits très rapides. ' + MOLT,
  repro_pitfalls: "Bac sans grande surface d'écorce, fuites à l'ouverture (elles courent vite)."
};

module.exports = [
  // Grandes mantes vertes
  { ...GIANT, common_name: 'Mante géante veinée', scientific_name: 'Hierodula venosa', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Grande mante d'Asie du Sud-Est (8 cm), verte ou brune, aux ailes finement veinées. Robuste et vorace.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante géante de Malaisie', scientific_name: 'Hierodula majuscula', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Une des plus grosses Hierodula (jusqu'à 10 cm), d'Australie et de Nouvelle-Guinée. Très facile et impressionnante.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante à bouclier jaune', scientific_name: 'Hierodula patellifera', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 22, temp_max: 30,
    presentation: "Mante asiatique de taille moyenne (6-7 cm), verte avec deux taches claires sur les ailes. Facile, idéale pour débuter.", lifespan: 'environ 1 an' },
  { ...GIANT, common_name: 'Mante géante de Chine', scientific_name: 'Hierodula chinensis', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 22, temp_max: 30,
    presentation: "Grande Hierodula de Chine, verte, robuste et vorace.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante bouclier géante', scientific_name: 'Rhombodera valida', difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante bouclier d'Asie (8 à 10 cm) dont le thorax s'élargit comme une feuille. Massive et calme.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante bouclier de Kirby', scientific_name: 'Rhombodera kirbyi', difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante bouclier d'Asie du Sud-Est, verte, au thorax largement étalé.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante bouclier commune', scientific_name: 'Rhombodera basalis', difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante bouclier de Malaisie et de Thaïlande (8 cm), la plus courante en élevage, parfois vendue sous le nom de R. latipronotum.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante bouclier de Stål', scientific_name: 'Rhombodera stalii', difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante bouclier d'Asie du Sud-Est, au thorax large et aux couleurs vertes.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante dorée africaine', scientific_name: 'Sphodromantis aurea', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Proche de la mante africaine (Sphodromantis lineola), de couleur verte à dorée. Facile et robuste.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante chinoise', scientific_name: 'Tenodera sinensis', difficulty: 2, humidity_min: 40, humidity_max: 60, temp_min: 20, temp_max: 28,
    presentation: "Grande mante d'Asie de l'Est (jusqu'à 10 cm), introduite en Amérique du Nord. Comme la mante religieuse, son oothèque passe l'hiver.", lifespan: 'environ 1 an (une saison)', size_class: 'grand',
    repro_incubation: "L'oothèque a besoin d'un hiver frais (2 à 3 mois vers 5-10 °C) avant d'éclore au printemps." },
  { ...GIANT, common_name: 'Mante aux bras rouges', scientific_name: 'Stagmatoptera femoralis', difficulty: 2, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Grande mante d'Amérique du Sud qui dévoile des taches oculaires sur ses pattes avant pour effrayer.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante émeraude africaine', scientific_name: 'Polyspilota aeruginosa', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante d'Afrique et de Madagascar (7 cm), allongée, verte ou brune avec des marques claires.", lifespan: 'environ 1 an', size_class: 'grand' },
  { ...GIANT, common_name: 'Mante peinte africaine', scientific_name: 'Prohierodula picta', difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante d'Afrique de l'Ouest, verte ornée de taches colorées sur le thorax.", lifespan: 'environ 1 an' },
  { ...GIANT, common_name: 'Mante muette africaine', scientific_name: 'Alalomantis muta', difficulty: 1, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante verte d'Afrique de l'Ouest et centrale, de taille moyenne, facile.", lifespan: 'environ 1 an' },
  { ...GIANT, common_name: 'Mante zébrée', scientific_name: 'Omomantis zebrata', difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante africaine verte au thorax rayé, de taille moyenne.", lifespan: 'environ 1 an' },
  { ...GIANT, common_name: "Mante à épaulettes", scientific_name: 'Cilnia humeralis', difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante africaine verte qui montre des ailes colorées en posture de menace.", lifespan: 'environ 1 an' },
  { ...GIANT, common_name: 'Mante panthère', scientific_name: 'Tarachodula pantherina', difficulty: 2, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 30,
    presentation: "Mante africaine brun tacheté comme une panthère, qui chasse sur les branches et les écorces.", lifespan: 'environ 1 an' },
  // Mantes fleurs
  { ...FLOWER, common_name: 'Mante fleur ocellée', scientific_name: 'Pseudocreobotra ocellata', difficulty: 3, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Cousine d'Afrique de l'Ouest de la mante fleur épineuse : spirale en forme d'œil sur les ailes et corps hérissé.", lifespan: 'environ 8 mois à 1 an' },
  { ...FLOWER, common_name: 'Mante fleur tricolore', scientific_name: 'Harpagomantis tricolor', difficulty: 3, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 30,
    presentation: "Petite mante fleur d'Afrique australe, aux couleurs vert, rose et blanc.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante fleur de Leston', scientific_name: 'Chlidonoptera lestoni', difficulty: 3, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante fleur d'Afrique de l'Ouest, crème et verte, aux ailes marquées d'une tache.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante fleur élégante', scientific_name: 'Theopropus elegans', difficulty: 3, humidity_min: 60, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante fleur d'Asie du Sud-Est, blanche et verte, aux ailes ornées de bandes.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante fleur cardinal', scientific_name: 'Helvia cardinalis', difficulty: 3, humidity_min: 60, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Petite mante d'Asie du Sud-Est dont les ailes cachent un rouge vif.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante fleur du Japon', scientific_name: 'Acromantis japonica', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 28,
    presentation: "Petite mante fleur d'Asie de l'Est (3 cm), brune et verte, facile pour une mante fleur.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante à ventre noir', scientific_name: 'Astyliasula basinigra', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 24, temp_max: 30,
    presentation: "Petite mante d'Asie du Sud-Est de la famille des mantes fleurs, au camouflage de brindille.", lifespan: 'environ 8 mois' },
  { ...FLOWER, common_name: 'Mante du Yunnan', scientific_name: 'Asiadodis yunnanensis', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 28,
    presentation: "Petite mante rare de Chine (Yunnan), au corps aplati de couleur écorce.", lifespan: 'environ 8 mois (estimation)' },
  // Mantes feuilles mortes et feuilles
  { ...LEAF, common_name: 'Mante feuille morte tronquée', scientific_name: 'Deroplatys truncata', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante feuille morte d'Asie du Sud-Est au thorax tronqué, plus petite que D. desiccata.", lifespan: 'environ 1 an' },
  { ...LEAF, common_name: 'Mante feuille morte lobée', scientific_name: 'Deroplatys lobata', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante feuille morte d'Asie du Sud-Est au thorax découpé en lobes.", lifespan: 'environ 1 an' },
  { ...LEAF, common_name: 'Mante feuille morte triangulaire', scientific_name: 'Deroplatys trigonodera', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante feuille morte de Malaisie et d'Indonésie au thorax triangulaire.", lifespan: 'environ 1 an' },
  { ...LEAF, common_name: 'Mante feuille morte de Gorochov', scientific_name: 'Deroplatys gorochovi', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante feuille morte d'Asie (Vietnam, Chine du Sud), décrite récemment.", lifespan: 'environ 1 an (estimation)' },
  { ...LEAF, common_name: 'Mante feuille de Kuhl', scientific_name: 'Parablepharis kuhlii', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    presentation: "Mante feuille d'Asie du Sud-Est (forme « asiatica »), brune et découpée comme une feuille sèche.", lifespan: 'environ 1 an' },
  { ...LEAF, common_name: 'Mante feuille de Madagascar', scientific_name: 'Brancsikia freyi', difficulty: 4, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 28,
    presentation: "Rare mante feuille de Madagascar, imitation parfaite d'une feuille morte enroulée.", lifespan: 'environ 1 an (estimation)' },
  { ...LEAF, common_name: 'Mante feuille morte érodée', scientific_name: 'Acanthops erosula', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 28,
    presentation: "Mante d'Amérique du Sud qui imite une feuille morte recroquevillée et se laisse tomber au sol si on la touche.", lifespan: 'environ 1 an' },
  { ...LEAF, common_name: 'Mante feuille à cornes', scientific_name: 'Stenophylla lobivertex', difficulty: 4, humidity_min: 70, humidity_max: 85, temp_min: 20, temp_max: 26,
    presentation: "Rare mante feuille d'Amazonie (Équateur, Pérou), à la tête prolongée de lobes. Délicate.", lifespan: 'environ 1 an (estimation)' },
  // Empuses et mantes du sec
  { ...DRYHEAT, common_name: 'Mante diable fleur du désert', scientific_name: 'Blepharopsis mendica', difficulty: 3, humidity_min: 40, humidity_max: 55, temp_min: 26, temp_max: 35,
    presentation: "Mante d'Afrique du Nord et du Moyen-Orient, blanche marbrée de vert, avec une couronne sur la tête. Elle aime la chaleur et la lumière.", lifespan: 'environ 1 an' },
  { ...DRYHEAT, common_name: 'Mante violon', scientific_name: 'Gongylus gongylodes', difficulty: 4, humidity_min: 40, humidity_max: 60, temp_min: 26, temp_max: 35,
    presentation: "Mante très fine d'Inde et du Sri Lanka, aux lobes en forme de violon. Spectaculaire, elle ne mange que des insectes volants. Tolère ses congénères bien nourris.", lifespan: 'environ 1 an', sociability: 'Tolère ses congénères bien nourris' },
  { ...DRYHEAT, common_name: "Empuse d'Hedenborg", scientific_name: 'Empusa hedenborgii', difficulty: 3, humidity_min: 40, humidity_max: 55, temp_min: 24, temp_max: 32,
    presentation: "Empuse d'Afrique du Nord et du Moyen-Orient, fine et cornue, cousine de l'empuse de nos garrigues.", lifespan: 'environ 1 an' },
  { ...DRYHEAT, common_name: 'Mante herbe africaine', scientific_name: 'Idolomorpha lateralis', difficulty: 3, humidity_min: 40, humidity_max: 60, temp_min: 24, temp_max: 32,
    presentation: "Mante très allongée d'Afrique, couleur paille, qui imite un brin d'herbe sèche.", lifespan: 'environ 1 an' },
  { ...DRYHEAT, common_name: 'Mante plume de paon', scientific_name: 'Pseudempusa pinnapavonis', difficulty: 4, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Grande empuse rare d'Asie du Sud-Est dont les ailes portent un dessin en plume de paon.", lifespan: 'environ 1 an (estimation)' },
  // Mantes d'écorce et autres
  { ...BARK, common_name: "Mante d'écorce de Servill", scientific_name: 'Theopompa servillei', difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 24, temp_max: 30,
    presentation: "Mante d'écorce d'Asie du Sud-Est, grise et plate, invisible sur un tronc.", lifespan: 'environ 1 an' },
  { ...BARK, common_name: "Mante d'écorce de Vitalis", scientific_name: 'Haania vitalisi', difficulty: 3, humidity_min: 65, humidity_max: 80, temp_min: 22, temp_max: 28,
    presentation: "Petite mante du Vietnam qui imite la mousse et l'écorce. Discrète et originale.", lifespan: 'environ 1 an (estimation)' },
  { ...BARK, common_name: "Mante d'écorce de Madagascar", scientific_name: 'Tarachomantis alaotrana', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 22, temp_max: 28,
    presentation: "Mante d'écorce de Madagascar, aplatie et rapide.", lifespan: 'environ 1 an (estimation)' },
  { ...BARK, common_name: 'Mante lichen', scientific_name: 'Sibylla pretiosa', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 24, temp_max: 30,
    presentation: "Mante d'Afrique fine et cornue, couleur lichen, qui reste immobile sur l'écorce. Préfère les proies volantes.", lifespan: 'environ 1 an',
    feeding_detail: "Surtout des insectes volants (drosophiles, mouches)." },
  { ...BARK, common_name: 'Mante brindille', scientific_name: 'Popa spurca', difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Mante d'Afrique qui imite un rameau sec et se balance comme une brindille au vent.", lifespan: 'environ 1 an',
    habitat: "Bac aéré et haut avec des branches fines, brumisation légère deux fois par semaine." },
  { ...BARK, common_name: 'Mante bâton africaine', scientific_name: 'Heterochaeta orientalis', difficulty: 3, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 32,
    presentation: "Très longue mante d'Afrique de l'Est (plus de 12 cm), aussi fine qu'un bâton, aux yeux pointus. Il lui faut beaucoup de hauteur.", lifespan: 'environ 1 an', size_class: 'grand',
    habitat: "Bac très haut et aéré (au moins trois fois sa longueur), branches fines, chaleur et lumière." },
  { ...BARK, common_name: 'Mante métallique violette', scientific_name: 'Metallyticus violaceus', difficulty: 4, humidity_min: 70, humidity_max: 85, temp_min: 24, temp_max: 28,
    presentation: "Mante très originale d'Asie du Sud-Est, bleu-violet métallique, à l'allure de blatte. Elle chasse les blattes sous les écorces.", lifespan: 'environ 1 an (estimation)',
    feeding_detail: "Petites blattes surtout, qu'elle débusque sous l'écorce ; grillons et mouches acceptés." }
];
