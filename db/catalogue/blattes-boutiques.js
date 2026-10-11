// Third batch (catalogue version 3): cockroaches sold by eBugz, Insectorus
// and Isopods Mania in 2026.
const LIVE_BIRTH = "La femelle forme une oothèque qu'elle garde à l'intérieur de son corps : les petits naissent vivants.";

const BASE = { category: 'blatte', sociability: 'Colonie', vigilance: 'Aucune', since: 3 };
const VIVIPARE = {
  ...BASE, diet_summary: 'Omnivore : fruits, légumes, croquettes',
  habitat: "Bac aéré, 3 à 5 cm de fibre de coco ou de terreau humide, écorces et boîtes à œufs.",
  feeding_detail: "Fruits, légumes, croquettes pour chat ou poisson, feuilles mortes.",
  repro_sexing: "Le mâle est plus fin, souvent avec des styles (petits filaments) au bout de l'abdomen ; la femelle est plus large.",
  repro_conditions: 'Chaleur (25-28 °C) et nourriture variée.',
  repro_mating: LIVE_BIRTH,
  repro_incubation: 'Environ 1 à 2 mois.',
  repro_juveniles: 'Les jeunes vivent souvent enfouis ; adultes en quelques mois.',
  repro_pitfalls: 'Substrat trop sec, froid.'
};
// Madagascar hissers.
const HISSER = {
  ...VIVIPARE,
  vigilance: 'Grimpe sur le verre : couvercle bien fermé',
  habitat: "Bac aéré, fibre de coco, écorces de liège dressées et boîtes à œufs pour grimper ; bande antigrimpe en haut des parois. Chaleur de 26 à 28 °C.",
  repro_sexing: "Le mâle a des bosses ou des cornes sur le pronotum et des antennes plus épaisses ; la femelle a un pronotum lisse.",
  repro_incubation: 'Environ 2 mois.',
  repro_pitfalls: 'Froid, couvercle mal fermé.'
};
// Corydiidae: sand and wood cockroaches that bury their oothecae.
const CORYDIID = {
  ...BASE, diet_summary: 'Omnivore : feuilles, bois pourri, fruits',
  habitat: "8 à 10 cm de substrat (terreau de feuilles, sable, bois pourri) sec en surface et humide au fond, écorces.",
  feeding_detail: "Feuilles mortes, bois pourri, fruits, croquettes.",
  repro_sexing: "La femelle est sans ailes (ou presque) ; le mâle est ailé.",
  repro_conditions: 'Fond de substrat humide, chaleur.',
  repro_mating: 'La femelle enterre ses oothèques dans le substrat.',
  repro_incubation: 'Environ 2 mois.',
  repro_juveniles: 'Les jeunes vivent enterrés ; croissance lente.',
  repro_pitfalls: 'Substrat entièrement sec ou détrempé.'
};

module.exports = [
  { ...HISSER, common_name: 'Blatte siffleuse large', scientific_name: 'Gromphadorhina oblongonota', difficulty: 1, humidity_min: 60, humidity_max: 75, temp_min: 24, temp_max: 30,
    presentation: "Grande siffleuse de Madagascar, plus large et plus foncée que G. portentosa. Calme et facile.", lifespan: '2 à 5 ans', size_class: 'grand' },
  { ...HISSER, common_name: 'Blatte siffleuse de Chopard', scientific_name: 'Elliptorhina chopardi', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Petite siffleuse de Madagascar (3 cm), cousine de la siffleuse naine. Discrète et facile.", lifespan: '2 à 3 ans' },
  { ...VIVIPARE, common_name: 'Blatte émeraude', scientific_name: 'Pseudoglomeris magnifica', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 20, temp_max: 26,
    presentation: "Petite blatte d'Asie (Chine, Vietnam), vert émeraude métallique, qui se roule à moitié comme un cloporte. Vendue aussi sous le nom de Corydidarum magnifica. Lente mais magnifique.", lifespan: '2 ans et plus (estimation)', size_class: 'petit',
    habitat: "Bac humide avec beaucoup de bois blanc pourri, feuilles, écorces et mousse ; température modérée.",
    feeding_detail: "Bois pourri, feuilles mortes, fruits, un peu de croquettes.", repro_juveniles: 'Petites portées, croissance lente.' },
  { ...VIVIPARE, common_name: 'Blatte lumineuse', scientific_name: 'Lucihormetica verrucosa', difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 22, temp_max: 28,
    presentation: "Blatte d'Amérique du Sud dont les mâles portent sur le pronotum des taches claires qui évoquent les blattes lumineuses du genre. Surface verruqueuse, aspect original.", lifespan: '1 à 2 ans (estimation)',
    habitat: "Bac humide, bois pourri et écorces, feuilles mortes." },
  { ...VIVIPARE, common_name: 'Blatte encre de Marajó', scientific_name: 'Eublaberus marajoara', difficulty: 1, humidity_min: 60, humidity_max: 75, temp_min: 25, temp_max: 30,
    presentation: "Blatte fouisseuse du Brésil (île de Marajó), aux ailes tachées comme de l'encre. Prolifique, comme la blatte à quatre taches.", lifespan: '1 an et demi à 2 ans', niche: 'fouisseur' },
  { ...VIVIPARE, common_name: 'Blatte de porcelaine de Gambie', scientific_name: 'Gyna centurio', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Petite blatte d'Afrique de l'Ouest (souche « Gambia »), proche de la blatte de porcelaine.", lifespan: 'environ 1 an', size_class: 'petit', vigilance: 'Les mâles volent' },
  { ...VIVIPARE, common_name: 'Blatte de porcelaine du Cap', scientific_name: 'Gyna caffrorum', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Petite blatte d'Afrique australe, cousine de la blatte de porcelaine. Facile et prolifique.", lifespan: 'environ 1 an', size_class: 'petit', vigilance: 'Les mâles volent' },
  { ...VIVIPARE, common_name: "Blatte de porcelaine 'Yellow'", scientific_name: 'Gyna lurida "Yellow"', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Forme jaune de la blatte de porcelaine. Même élevage ; ne pas la mélanger avec la forme ordinaire.", lifespan: 'environ 1 an', size_class: 'petit', vigilance: 'Les mâles volent' },
  { ...VIVIPARE, common_name: 'Blatte fouisseuse de Cabrera', scientific_name: 'Byrsotria cabrerai', difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 25, temp_max: 30,
    presentation: "Grande blatte brune de Cuba, proche de la blatte fouisseuse de Cuba. Calme.", lifespan: '1 an et demi à 2 ans (estimation)', niche: 'fouisseur' },
  { ...VIVIPARE, common_name: 'Blatte de Simandou', scientific_name: 'Simandoa conserfariam', difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    presentation: "Blatte noire à taches blanches d'une seule grotte de Guinée, détruite par une mine : l'espèce n'existe plus qu'en élevage. Élever cette blatte, c'est la conserver.", lifespan: '1 à 2 ans (estimation)',
    habitat: "Bac humide et sombre, substrat de feuilles et bois pourri, écorces.",
    repro_pitfalls: 'Substrat sec, consanguinité : échanger des individus entre éleveurs.' },
  { ...VIVIPARE, common_name: 'Blatte rhinocéros', scientific_name: 'Macropanesthia rhinoceros', difficulty: 3, humidity_min: 40, humidity_max: 60, temp_min: 24, temp_max: 30,
    presentation: "La blatte la plus lourde du monde (jusqu'à 35 g), d'Australie, sans ailes. Elle creuse des terriers profonds dans le sable et y élève ses petits pendant des mois. Très chère et rare.", lifespan: "jusqu'à 10 ans", size_class: 'grand', niche: 'fouisseur', substrate_type: 'sec',
    diet_summary: "Feuilles sèches d'eucalyptus",
    habitat: "Bac profond (30 cm de sable et terre légèrement humide au fond) pour le terrier, chaleur.",
    feeding_detail: "Feuilles sèches d'eucalyptus surtout, un peu de feuilles mortes et de flocons.",
    repro_conditions: 'Substrat profond et calme : la femelle garde ses petits dans le terrier.', repro_incubation: 'Gestation longue (plusieurs mois).',
    repro_juveniles: 'Petites portées, gardées par la mère ; plusieurs années avant l’adulte.' },
  { ...BASE, common_name: 'Blatte géante de Sumatra', scientific_name: 'Archiblatta hoevenii', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    diet_summary: 'Omnivore : fruits, bois, croquettes',
    presentation: "Grande blatte d'Asie du Sud-Est, noire et luisante, aux bords orangés. Rare en élevage.", lifespan: '2 ans (estimation)', size_class: 'grand',
    habitat: "Grand bac humide, écorces, bois pourri, feuilles.", feeding_detail: "Fruits, bois pourri, feuilles, croquettes.",
    repro_sexing: "Le mâle est plus fin.", repro_conditions: 'Peu documentées.', repro_mating: "Elle pond des oothèques qu'elle dépose.",
    repro_incubation: 'Peu documentée.', repro_juveniles: 'Peu documentés.', repro_pitfalls: 'Bac trop sec.' },
  { ...CORYDIID, common_name: 'Blatte de Bernhardt', scientific_name: 'Therea bernhardti', difficulty: 2, humidity_min: 50, humidity_max: 60, temp_min: 26, temp_max: 30,
    presentation: "Blatte d'Inde du genre de ta blatte panda, noire à taches claires. Les adultes courent en surface, les jeunes vivent enterrés.", lifespan: '1 à 2 ans', size_class: 'petit', substrate_type: 'sec' },
  { ...CORYDIID, common_name: 'Blatte saphir', scientific_name: 'Eucorydia yasumatsui', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 26,
    presentation: "Petite blatte du sud du Japon, bleu métallique et orange. Les jeunes vivent dans le bois pourri.", lifespan: '1 à 2 ans (estimation)', size_class: 'petit',
    habitat: "Terreau fermenté (flake soil) et bois blanc pourri, feuilles, température modérée." },
  { ...CORYDIID, common_name: 'Blatte saphir à bandes', scientific_name: 'Eucorydia dasytoides', difficulty: 3, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 26,
    presentation: "Petite blatte métallique d'Asie de l'Est (forme « zonata »), cousine de la blatte saphir.", lifespan: '1 à 2 ans (estimation)', size_class: 'petit',
    habitat: "Terreau fermenté et bois blanc pourri, feuilles." },
  { ...CORYDIID, common_name: 'Blatte capucin velue', scientific_name: 'Ergaula pilosa', difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 24, temp_max: 30,
    presentation: "Proche de la blatte capucin, couverte d'une fine pilosité. Fouisseuse et discrète.", lifespan: '1 à 2 ans', niche: 'fouisseur', vigilance: 'Les mâles volent' }
];
