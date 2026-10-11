// Third batch (catalogue version 3): scorpions and other arachnids sold by
// eBugz, Insectorus and Isopods Mania in 2026.
const RULES = 'Réglementé en France : souvent soumis au certificat de capacité (CDC), à vérifier auprès de la DDPP avant l’achat';
const SCORPION_SEX = "Sous l'animal, les peignes (pectines) sont plus grands chez le mâle ; la femelle est en général plus massive.";

const SCORPION = {
  category: 'scorpion', sociability: 'Solitaire', since: 3,
  diet_summary: 'Prédateur : grillons, blattes',
  feeding_detail: "Grillons, blattes, une à deux fois par semaine.",
  repro_sexing: SCORPION_SEX,
  repro_conditions: 'Chaleur stable, nourriture régulière.',
  repro_mating: "Danse nuptiale où le mâle tient la femelle par les pinces et dépose un sac de sperme.",
  repro_incubation: 'Gestation de plusieurs mois : les petits naissent vivants.',
  repro_juveniles: "Les petits montent sur le dos de la mère jusqu'à leur première mue, puis se dispersent.",
  repro_pitfalls: 'Plusieurs adultes ensemble (cannibalisme), bac inadapté.'
};
const FOREST = {
  ...SCORPION,
  habitat: "Bac plus large que haut, 10 à 15 cm de substrat humide (terre, fibre de coco), écorces et cachettes, coupelle d'eau.",
  repro_pitfalls: 'Bac trop sec, plusieurs adultes ensemble.'
};
const DESERT = {
  ...SCORPION,
  habitat: "Bac à fond de sable et terre secs, compactés pour tenir un terrier, pierres plates, un coin légèrement humide, chaleur.",
  repro_pitfalls: 'Bac humide, substrat trop meuble.',
  substrate_type: 'sec'
};
const WHIP = {
  category: 'arachnide', sociability: 'Solitaire', since: 3, vigilance: 'Inoffensif mais fragile',
  diet_summary: 'Prédateur : grillons, blattes',
  habitat: "Bac plus haut que large, plaque de liège verticale contre le fond, substrat humide de 5 cm. Il mue suspendu la tête en bas : prévoir de la hauteur.",
  feeding_detail: "Grillons, blattes, une à deux fois par semaine.",
  repro_sexing: "Difficile ; les mâles ont souvent des pédipalpes plus longs.",
  repro_conditions: 'Humidité stable, adultes bien nourris.',
  repro_mating: "Le mâle dépose un sac de sperme au sol et guide la femelle dessus. Elle porte ensuite ses œufs sous l'abdomen.",
  repro_incubation: 'Environ 3 mois sous la femelle.',
  repro_juveniles: 'Les petits montent sur le dos de la mère, puis se dispersent après une mue.',
  repro_pitfalls: 'Bac trop bas ou trop sec (mue ratée, souvent fatale).',
  size_class: 'moyen', niche: 'surface'
};

module.exports = [
  { ...FOREST, common_name: 'Scorpion géant de forêt de Malaisie', scientific_name: 'Heterometrus silenus', difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    vigilance: RULES + ' ; pinces fortes',
    presentation: "Grand scorpion noir-bleuté d'Asie du Sud-Est, proche du scorpion géant de forêt. Il se défend surtout avec ses pinces.", lifespan: '5 à 8 ans', size_class: 'grand' },
  { ...FOREST, common_name: 'Scorpion géant du Laos', scientific_name: 'Heterometrus laoticus', difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 30,
    vigilance: RULES + ' ; pinces fortes, piqûre douloureuse',
    presentation: "Grand scorpion noir du Laos, de Thaïlande et du Vietnam (jusqu'à 12 cm). Plus nerveux que le scorpion empereur.", lifespan: '5 à 8 ans', size_class: 'grand' },
  { ...FOREST, common_name: 'Scorpion nain des bois', scientific_name: 'Liocheles australasiae', difficulty: 1, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 28,
    vigilance: RULES + ' ; venin très faible',
    presentation: "Petit scorpion plat (3 cm) d'Asie et du Pacifique, au venin très faible. Les femelles se reproduisent sans mâle et tolèrent leurs congénères : une colonie se forme facilement.",
    sociability: 'Groupe (tolérant)', habitat: "Bac humide avec beaucoup d'écorces et de bois pourri, sous lesquels ils se glissent.",
    repro_sexing: "Presque toutes les populations sont des femelles qui se reproduisent seules (parthénogenèse).",
    repro_mating: 'Pas d’accouplement : la femelle se reproduit seule.', repro_pitfalls: 'Bac sec.', lifespan: '3 à 5 ans', size_class: 'petit', niche: 'litiere' },
  { ...DESERT, common_name: 'Scorpion plat à peu de dents', scientific_name: 'Hadogenes paucidens', difficulty: 3, humidity_min: 40, humidity_max: 60, temp_min: 24, temp_max: 30,
    vigilance: RULES + ' ; venin très faible, très calme',
    presentation: "Scorpion plat des rochers d'Afrique australe, cousin du Hadogenes troglodytes : longue queue chez le mâle, croissance lente, longue vie.",
    habitat: "Pierres plates ou plaques de liège serrées pour créer des fentes, substrat sec, un coin légèrement humide, coupelle d'eau.",
    repro_incubation: 'Gestation longue, souvent plus d’un an.', lifespan: 'plus de 10 ans (estimation)', size_class: 'grand', niche: 'litiere' },
  { ...DESERT, common_name: 'Scorpion fouisseur de White', scientific_name: 'Nebo whitei', difficulty: 3, humidity_min: 40, humidity_max: 55, temp_min: 24, temp_max: 32,
    vigilance: RULES,
    presentation: "Grand scorpion fouisseur du Moyen-Orient, brun-jaune (formes « Bright » et « typical »), aux grosses pinces. Il creuse de profonds terriers.",
    habitat: "Bac avec 15 cm de sable et terre compactés, légèrement humides au fond, pour creuser ; pierres, chaleur.",
    lifespan: '5 à 10 ans (estimation)', size_class: 'grand', niche: 'fouisseur' },
  // Amblypyges et solifuges
  { ...WHIP, common_name: "Amblypyge d'Afrique de l'Ouest", scientific_name: 'Damon medius', difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    presentation: "Amblypyge d'Afrique de l'Ouest, aux longues pattes fouets et aux pédipalpes épineux. Sans venin ni soie.", lifespan: '5 à 10 ans (estimation)' },
  { ...WHIP, common_name: 'Amblypyge à pédipalpes en massue', scientific_name: 'Euphrynichus bacillifer', difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    presentation: "Amblypyge d'Afrique de l'Est dont les mâles portent des pédipalpes très longs terminés en massue.", lifespan: '5 à 10 ans (estimation)' },
  { category: 'arachnide', common_name: 'Solifuge de Grant', scientific_name: 'Galeodes granti', difficulty: 5, since: 3,
    humidity_min: 30, humidity_max: 50, temp_min: 26, temp_max: 35, sociability: 'Solitaire', diet_summary: 'Prédateur vorace : grillons, blattes',
    vigilance: 'Vit souvent peu en captivité ; morsure douloureuse mais sans venin',
    presentation: "Solifuge (« araignée chameau ») des déserts d'Afrique du Nord et du Moyen-Orient, aux énormes chélicères. Très rapide et vorace, il meurt souvent en quelques mois en élevage.",
    habitat: "Grand bac de sable sec compacté, pierres plates, un coin humide, forte chaleur.", feeding_detail: "Grillons et blattes en quantité, plusieurs fois par semaine.",
    repro_sexing: "Le mâle porte un flagelle sur les chélicères.", repro_conditions: 'Presque jamais reproduit en élevage.',
    repro_mating: 'Peu documenté en élevage.', repro_incubation: 'Inconnue en élevage.', repro_juveniles: 'Inconnus en élevage.',
    repro_pitfalls: "En attendre une longue vie : c'est un animal d'observation.",
    lifespan: 'souvent moins d’un an en élevage', diet_type: 'predateur', size_class: 'moyen', niche: 'surface', substrate_type: 'sec' }
];
