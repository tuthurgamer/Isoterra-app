const db = require('./db');

const species = [
  {
    category: 'iule', common_name: 'Iule géant à tête rouge', scientific_name: 'Spirostreptus servatius',
    difficulty: 4, humidity_min: 70, humidity_max: 85, temp_min: 23, temp_max: 27,
    sociability: 'Grégaire en grand bac', diet_summary: 'Détritivore : bois mort, feuilles',
    vigilance: 'Sécrétion irritante si stressé — se laver les mains',
    presentation: "Un des plus grands iules gardés en terrarium, corps noir luisant et tête rouge caractéristique. Calme et lent, actif surtout la nuit et après brumisation.",
    habitat: "Substrat profond (10 cm minimum) type terreau de feuilles et fibre de coco, pour permettre le fouissage. Bois en décomposition et litière abondante. Une source de calcium (os de seiche, coquilles broyées) doit rester disponible en permanence pour des mues réussies.",
    feeding_detail: "Bois mort et feuilles mortes en décomposition, complétés par des légumes (courgette, carotte) et un peu de protéine occasionnelle (croquette pour poisson).",
    repro_sexing: "En retournant l'animal, les mâles adultes portent des gonopodes (paire de pattes modifiées) vers le 7e segment, visibles à l'œil nu — absents chez la femelle.",
    repro_conditions: "Substrat profond et jamais asséché, calcium disponible en continu, nourriture riche et régulière. Un bac stable depuis longtemps reproduit mieux qu'un bac récent.",
    repro_mating: "La femelle creuse une loge dans le substrat profond pour y déposer ses œufs — la ponte elle-même est rarement observée directement.",
    repro_incubation: "Développement anamorphe : les jeunes gagnent progressivement segments et pattes au fil des mues successives, sur plusieurs mois.",
    repro_juveniles: "Très petits et discrets à l'éclosion, ils se nourrissent d'abord des restes du bac. Maturité atteinte en un à deux ans selon les conditions — c'est une espèce de patience.",
    repro_pitfalls: "Fouiller le substrat pour vérifier une ponte supposée, substrat qui sèche même brièvement, manque de calcium (mues ratées ou fatales)."
  },
  {
    category: 'iule', common_name: 'Iule de Tanzanie', scientific_name: 'Spirostreptus sp. "Tanzanie"',
    difficulty: 4, humidity_min: 70, humidity_max: 85, temp_min: 23, temp_max: 27,
    sociability: 'Grégaire en grand bac', diet_summary: 'Détritivore : bois mort, feuilles',
    vigilance: 'Sécrétion irritante possible si stressé',
    presentation: "Grand iule brun foncé importé sans identification complète au rang de l'espèce (désigné \"sp.\" en attendant confirmation) — garde donc les généralités du genre Spirostreptus comme base et affine avec l'observation.",
    habitat: "Mêmes principes que les autres grands iules africains : substrat profond et meuble, humidité stable, calcium disponible en continu, cachettes (écorce, bois).",
    feeding_detail: "Détritivore : bois tendre en décomposition, feuilles mortes, légumes en complément.",
    repro_sexing: "Comme chez les autres Spirostreptus : gonopodes visibles chez le mâle adulte en retournant l'animal, absents chez la femelle.",
    repro_conditions: "Bac établi depuis longtemps, substrat jamais asséché, calcium constant, nourriture régulière et variée.",
    repro_mating: "Ponte discrète dans une loge creusée en profondeur, rarement observée directement.",
    repro_incubation: "Développement lent par mues successives, comme chez les autres grandes espèces du genre.",
    repro_juveniles: "Petits et discrets, maturité probablement atteinte en un à deux ans — à confirmer par l'observation, cette souche étant peu documentée.",
    repro_pitfalls: "Fouiller le substrat, l'assécher même brièvement, manquer de calcium disponible."
  },
  {
    category: 'iule', common_name: 'Iule rustique', scientific_name: 'Anadenobolus monilicornis',
    difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 22, temp_max: 26,
    sociability: 'Très grégaire, se plaît en colonie', diet_summary: 'Détritivore : feuilles, bois, légumes',
    vigilance: 'Aucune, espèce sans souci',
    presentation: "Petit iule noir à anneaux jaunes, originaire des Caraïbes. Réputé comme l'un des iules les plus simples à installer et à reproduire — un bon point de repère pour comparer les autres espèces de la collection.",
    habitat: "Substrat meuble de 6-8 cm (fibre de coco, terreau), litière de feuilles abondante, morceaux de bois tendre. Tolère des conditions un peu moins strictes que les grandes espèces africaines.",
    feeding_detail: "Feuilles mortes, bois en décomposition, légumes (courgette, patate douce), calcium disponible en continu.",
    repro_sexing: "Gonopodes visibles chez le mâle en retournant l'animal, comme chez les autres iules — plus facile à repérer sur cette espèce de petite taille avec un peu d'habitude.",
    repro_conditions: "Se reproduit facilement dans un bac stable et bien nourri, sans intervention particulière — souvent la première espèce à s'auto-entretenir en colonie.",
    repro_mating: "Ponte groupée dans le substrat, souvent découverte par surprise lors d'un changement de décor plutôt qu'observée directement.",
    repro_incubation: "Plus rapide que chez les grandes espèces africaines : les jeunes progressent par mues successives sur quelques mois.",
    repro_juveniles: "Maturité atteinte en six mois à un an selon les conditions — nettement plus rapide que les grandes espèces, idéal pour observer un cycle complet.",
    repro_pitfalls: "Surpopulation dans un bac trop petit (la colonie grossit vite), manque de calcium sur la durée."
  },
  {
    category: 'iule', common_name: 'Iule dragon', scientific_name: 'Tonkinbolus caudulanus',
    difficulty: 3, humidity_min: 75, humidity_max: 85, temp_min: 23, temp_max: 27,
    sociability: 'Grégaire', diet_summary: 'Détritivore : bois, feuilles',
    vigilance: 'Manipulation calme suffisante',
    presentation: "Iule brun clair aux anneaux orangés, originaire d'Asie du Sud-Est, apprécié pour son contraste de couleurs. Assez actif en surface le soir.",
    habitat: "Substrat humide et meuble de 8-10 cm, litière de feuilles épaisse, bois en décomposition. Sensible aux variations brutales d'humidité, préfère une atmosphère constante.",
    feeding_detail: "Bois tendre, feuilles mortes, légumes en complément, calcium disponible en permanence.",
    repro_sexing: "Gonopodes du mâle visibles en retournant l'individu adulte, comme chez les autres iules.",
    repro_conditions: "Humidité stable sans à-coups, nourriture régulière, densité de population raisonnable pour éviter le stress.",
    repro_mating: "Ponte enfouie dans le substrat profond, discrète.",
    repro_incubation: "Développement progressif par mues, modérément lent pour une espèce de taille moyenne.",
    repro_juveniles: "Juvéniles discrets dans la litière, sensibles aux variations d'humidité les premiers mois.",
    repro_pitfalls: "Écarts brusques d'humidité, substrat qui sèche en surface, manque de bois tendre disponible."
  },
  {
    category: 'iule', common_name: 'Iule beige de Guinée', scientific_name: 'Telodeinopus aoutii',
    difficulty: 4, humidity_min: 75, humidity_max: 85, temp_min: 23, temp_max: 27,
    sociability: 'Grégaire en grand bac', diet_summary: 'Détritivore : bois, feuilles',
    vigilance: 'Sécrétion irritante possible si stressé',
    presentation: "Grand iule africain beige clair, moins courant en élevage que ses cousins Spirostreptus. Peu de retours d'expérience circulent sur cette espèce — les généralités des grands iules africains servent de base ici.",
    habitat: "Substrat profond, humide, riche en matière organique en décomposition. Cachettes et calcium disponible en continu, comme pour les autres grandes espèces africaines.",
    feeding_detail: "Bois mort, feuilles en décomposition, légumes en complément.",
    repro_sexing: "Gonopodes du mâle visibles en retournant l'animal adulte, principe commun à tous les iules.",
    repro_conditions: "À documenter avec l'expérience — probablement proche des autres grands iules africains : stabilité d'humidité, calcium constant, patience.",
    repro_mating: "À observer et noter ici au fil de l'élevage — peu de références publiées pour cette espèce précise.",
    repro_incubation: "Probablement lente comme chez les autres grandes espèces — à confirmer.",
    repro_juveniles: "À documenter : notes de terrain bienvenues dès les premières observations.",
    repro_pitfalls: "Comme pour tout grand iule : substrat qui sèche, manque de calcium, fouille du substrat pour vérifier une ponte supposée."
  },
  {
    category: 'iule', common_name: 'Iule rouge et noir', scientific_name: 'Centrobolus richardii',
    difficulty: 4, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 27,
    sociability: 'Grégaire, calme', diet_summary: 'Détritivore : bois, feuilles',
    vigilance: 'Très sensible au dessèchement, même bref',
    presentation: "Iule très coloré (rouge et noir) originaire de la région malgache/est-africaine, recherché pour son aspect. Réputé plus exigeant que les Spirostreptus sur la stabilité de l'humidité — à confirmer selon ton propre retour d'expérience.",
    habitat: "Substrat très humide en permanence, litière épaisse, bonne circulation d'air malgré tout pour éviter la stagnation. Un vaporisateur ou une brumisation régulière est souvent nécessaire.",
    feeding_detail: "Bois tendre en décomposition, feuilles mortes, calcium en continu.",
    repro_sexing: "Gonopodes du mâle visibles en retournant l'animal adulte.",
    repro_conditions: "Une humidité très stable semble être le facteur le plus critique — plus que pour la plupart des autres iules de la collection.",
    repro_mating: "Ponte enfouie, discrète, à ne pas perturber en fouillant le substrat.",
    repro_incubation: "Développement probablement lent — peu de retours précis disponibles, à documenter au fil de l'élevage.",
    repro_juveniles: "Juvéniles probablement très sensibles aux variations d'humidité — à surveiller de près les premières semaines.",
    repro_pitfalls: "Toute chute d'humidité, même brève ; ventilation excessive qui assèche le bac ; manipulation trop fréquente."
  },
  {
    category: 'cloporte', common_name: 'Armadillo commun', scientific_name: 'Armadillo officinalis',
    difficulty: 2, humidity_min: 60, humidity_max: 75, temp_min: 18, temp_max: 25,
    sociability: 'Grégaire, en colonie', diet_summary: 'Détritivore : feuilles, bois',
    vigilance: 'Aucune',
    presentation: "Grand cloporte noir originaire du pourtour méditerranéen, capable de s'enrouler en boule complète comme les Armadillidium. Tolère des températures plus fraîches que les espèces tropicales.",
    habitat: "Substrat calcaire (terreau avec sable/craie), feuilles mortes, morceaux de bois et pierres plates comme cachettes. Moins exigeant en humidité constante que les espèces tropicales.",
    feeding_detail: "Feuilles mortes variées, bois en décomposition, légumes occasionnels, source de calcium pour la carapace.",
    repro_sexing: "Comme chez tous les cloportes, le sexage externe est difficile — il faut examiner la face ventrale sous grossissement. En pratique, on se fie surtout à la croissance de la population plutôt qu'à des couples identifiés.",
    repro_conditions: "Colonie bien établie, nourriture riche et régulière, nombreuses cachettes pour réduire le stress.",
    repro_mating: "La femelle porte les œufs puis les jeunes dans un marsupium ventral (poche visible sous forme de renflement blanchâtre).",
    repro_incubation: "Les mancae (premiers stades, blanchâtres) sortent directement du marsupium, déjà formés en miniature.",
    repro_juveniles: "Les mancae se pigmentent après quelques mues. Bonne survie en colonie stable, sans intervention particulière.",
    repro_pitfalls: "Substrat trop humide en permanence (contrairement aux espèces tropicales), manque de calcium pour la carapace."
  },
  {
    category: 'cloporte', common_name: 'Cloporte rugueux', scientific_name: 'Porcellio scaber',
    difficulty: 1, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 25,
    sociability: 'Très grégaire', diet_summary: 'Détritivore peu sélectif',
    vigilance: 'Aucune',
    presentation: "L'un des cloportes les plus communs et les plus tolérants du hobby. Le morph \"Lava\" (noir tacheté de rouge) est une variation de couleur recherchée sur cette espèce par ailleurs très banale à l'état sauvage.",
    habitat: "Peu exigeant : substrat classique (terreau, fibre de coco), feuilles mortes, bois. Tolère une gamme d'humidité assez large, idéal comme première espèce.",
    feeding_detail: "Mange presque tout ce qui se décompose : feuilles, bois, légumes. Un ajout de protéine (paillettes de poisson) stimule la reproduction.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; on suit surtout la croissance globale de la population.",
    repro_conditions: "Se reproduit facilement dès que le bac est stable ; peu exigeant sur les conditions précises, ce qui en fait une bonne espèce de référence.",
    repro_mating: "La femelle porte les œufs dans un marsupium ventral, visible en renflement blanchâtre.",
    repro_incubation: "Les mancae sortent directement formées du marsupium, pas de stade larvaire externe.",
    repro_juveniles: "Croissance rapide et bonne survie en colonie ; c'est souvent l'espèce qui explose en population le plus vite du bac.",
    repro_pitfalls: "Mélanger avec d'autres morphs de la même espèce si tu veux garder les lignées pures — le croisement est facile et rapide vu la vigueur de l'espèce."
  },
  {
    category: 'cloporte', common_name: 'Cloporte hérissé beige', scientific_name: 'Cristarmadillidium muricatum',
    difficulty: 3, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 26,
    sociability: 'Grégaire', diet_summary: 'Détritivore : bois, feuilles',
    vigilance: 'Aucune',
    presentation: "Cloporte beige à la carapace rugueuse et hérissée de petites protubérances, moins courant que les Armadillidium/Porcellio classiques. Espèce de spécialiste, encore peu discutée dans la communauté francophone.",
    habitat: "Substrat humide type terreau de feuilles et fibre de coco, bonne litière, cachettes variées. Les principes généraux des cloportes asiatiques tropicaux s'appliquent probablement.",
    feeding_detail: "Bois en décomposition, feuilles mortes, complément protéiné occasionnel.",
    repro_sexing: "Comme chez tous les cloportes, difficile à l'œil nu sans grossissement.",
    repro_conditions: "À documenter avec l'expérience — probablement une humidité stable et une colonie bien établie, comme pour la plupart des cloportes tropicaux.",
    repro_mating: "Marsupium ventral comme chez tous les cloportes ; visible en renflement chez la femelle porteuse.",
    repro_incubation: "Développement direct dans le marsupium, sans stade larvaire externe.",
    repro_juveniles: "À observer et noter au fil de l'élevage — peu de retours publiés sur la vitesse de reproduction de cette espèce précise.",
    repro_pitfalls: "Comme pour toute espèce peu documentée : éviter les changements brusques de conditions tant que la colonie n'est pas bien installée."
  },
  {
    category: 'cloporte', common_name: 'Cloporte commun', scientific_name: 'Armadillidium vulgare',
    difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 18, temp_max: 25,
    sociability: 'Très grégaire', diet_summary: 'Détritivore peu sélectif',
    vigilance: 'Aucune',
    presentation: "Le cloporte le plus commun d'Europe, capable de s'enrouler en boule parfaite. Base de référence du hobby, support de très nombreux morphs de couleur dont \"St Lucia\" (petit point rouge) et \"Albinos\" (blanc translucide) de la collection.",
    habitat: "Substrat classique, moins humide que les espèces tropicales, avec zone plus sèche et zone plus humide pour laisser le choix aux animaux. Calcaire apprécié (coquille d'œuf, craie).",
    feeding_detail: "Feuilles mortes variées, bois, légumes, calcium régulier pour l'\"Albinos\" en particulier (carapace plus fragile).",
    repro_sexing: "Difficile à l'œil nu ; on se fie à la croissance de la colonie plutôt qu'à l'identification de couples.",
    repro_conditions: "Extrêmement facile à reproduire dès que le bac est stable ; l'espèce est souvent utilisée comme \"témoin\" pour valider qu'un nouveau bac fonctionne bien avant d'y placer des morphs plus fragiles.",
    repro_mating: "Marsupium ventral chez la femelle porteuse, comme chez tous les cloportes.",
    repro_incubation: "Développement direct, mancae déjà formés à la sortie du marsupium.",
    repro_juveniles: "Très bonne survie, croissance rapide. Le morph \"Albinos\" (sans pigmentation) demande une attention un peu plus soutenue au calcium disponible.",
    repro_pitfalls: "Mélanger \"St Lucia\" et \"Albinos\" dans un même bac (perte des lignées pures par croisement), substrat trop humide en permanence."
  },
  {
    category: 'cloporte', common_name: 'Cloporte géant', scientific_name: 'Porcellio laevis',
    difficulty: 1, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 27,
    sociability: 'Très grégaire, colonies denses', diet_summary: 'Détritivore vorace',
    vigilance: "Surveiller surtout l'espace disponible",
    presentation: "Un des plus grands cloportes du hobby, et sans doute le plus rapide à se reproduire. Base de nombreux morphs vivement colorés (Orange, Orange Koi, Dairy Cow) très demandés à la vente.",
    habitat: "Substrat humide et aéré, grand volume conseillé vu la vitesse de croissance de la colonie. Bonne ventilation malgré l'humidité pour éviter les moisissures liées à la forte densité de population.",
    feeding_detail: "Mange abondamment et vite : feuilles, bois, légumes, protéine régulière. Anticiper la consommation vu la taille des colonies.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; inutile ici de toute façon vu la vitesse de reproduction en colonie.",
    repro_conditions: "Se reproduit très facilement : chaleur, humidité et nourriture abondante suffisent. Le vrai défi est souvent de gérer la population plutôt que de la stimuler.",
    repro_mating: "Marsupium ventral chez la femelle, très fréquemment observable vu le rythme de reproduction élevé.",
    repro_incubation: "Développement direct, cycle particulièrement rapide pour un cloporte.",
    repro_juveniles: "Excellente survie, croissance très rapide. Cette espèce peut vite saturer un bac si la population n'est pas régulièrement répartie ou vendue.",
    repro_pitfalls: "Mélanger les morphs Orange/Orange Koi/Dairy Cow entre eux (croisement rapide vu la vitesse de reproduction), sous-estimer l'espace nécessaire à moyen terme."
  },
  {
    category: 'cloporte', common_name: 'Cloporte de Gestro', scientific_name: 'Armadillidium gestroi',
    difficulty: 2, humidity_min: 65, humidity_max: 80, temp_min: 21, temp_max: 26,
    sociability: 'Grégaire', diet_summary: 'Détritivore : feuilles, bois',
    vigilance: 'Aucune',
    presentation: "Cloporte noir tacheté de jaune, capable de s'enrouler en boule comme les autres Armadillidium. Légèrement plus exigeant en humidité que l'espèce commune (A. vulgare) mais reste accessible.",
    habitat: "Substrat un peu plus humide que pour A. vulgare, feuilles mortes, cachettes variées. Bien tolérant une fois la colonie établie.",
    feeding_detail: "Feuilles mortes, bois, légumes, calcium régulier.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes.",
    repro_conditions: "Bonne reproduction dès que l'humidité reste stable et un peu plus élevée que pour les espèces européennes classiques.",
    repro_mating: "Marsupium ventral chez la femelle, comme chez tous les cloportes.",
    repro_incubation: "Développement direct, rythme modéré.",
    repro_juveniles: "Bonne survie en colonie stable, croissance régulière.",
    repro_pitfalls: "Substrat trop sec (contrairement aux Armadillidium européens classiques), manque de cachettes."
  },
  {
    category: 'cloporte', common_name: 'Cloporte à écusson', scientific_name: 'Armadillidium flavoscutatum',
    difficulty: 3, humidity_min: 65, humidity_max: 80, temp_min: 20, temp_max: 25,
    sociability: 'Grégaire', diet_summary: 'Détritivore : feuilles, bois',
    vigilance: "Reproduction plus lente à anticiper",
    presentation: "Petite espèce de cloporte moins répandue, valorisée pour son écusson coloré (morph \"Redhead\"). Plus petite et plus discrète que les Armadillidium/Porcellio classiques de la collection.",
    habitat: "Substrat humide et meuble, litière fine, petites cachettes adaptées à sa taille réduite.",
    feeding_detail: "Feuilles mortes tendres, bois fin en décomposition, calcium disponible.",
    repro_sexing: "Difficile à l'œil nu, d'autant plus sur une espèce de petite taille.",
    repro_conditions: "Colonie stable et patiente : cette espèce semble se reproduire plus lentement que les grandes espèces communes.",
    repro_mating: "Marsupium ventral chez la femelle, comme chez tous les cloportes, mais plus discret vu la petite taille de l'espèce.",
    repro_incubation: "Développement direct, rythme plus lent que chez les grandes espèces prolifiques de la collection.",
    repro_juveniles: "Juvéniles minuscules, à surveiller de près les premières semaines dans un substrat fin.",
    repro_pitfalls: "Substrat trop grossier pour les juvéniles minuscules, impatience face à une reproduction plus lente que les autres espèces du bac."
  },
  {
    category: 'cetoine', common_name: 'Cétoine de Derby', scientific_name: 'Dicronorhina derbyana layardi',
    difficulty: 4, humidity_min: 65, humidity_max: 75, temp_min: 23, temp_max: 27,
    sociability: 'Larve solitaire dans son terreau', diet_summary: 'Terreau de feuilles fermenté (larve)',
    vigilance: 'Ne pas déranger pendant la nymphose',
    presentation: "Grande cétoine diurne très recherchée pour la robe métallique de l'adulte. Actuellement au stade larvaire dans la collection — c'est le moment de bien préparer l'élevage avant l'émergence.",
    habitat: "Grand volume de terreau de feuilles fermentées (flake soil), bien humidifié mais non détrempé, profondeur suffisante pour que la larve s'enfouisse librement. Éviter tout dérangement au moment de la nymphose.",
    feeding_detail: "La larve se nourrit du terreau de feuilles lui-même (fermentation) ; renouveler la partie consommée sans tout remplacer d'un coup. À l'émergence, l'adulte se nourrira de fruits mûrs et de gelée protéinée.",
    repro_sexing: "Impossible sur la larve actuelle. Chez l'adulte, la taille et la forme des pattes antérieures permettent généralement de différencier les sexes — à observer dès l'émergence.",
    repro_conditions: "Laisser l'adulte durcir sa carapace 2 à 4 semaines après émergence avant toute manipulation ou tentative de reproduction.",
    repro_mating: "La femelle pond dans le même type de substrat que celui utilisé pour la larve actuelle (terreau de feuilles humide).",
    repro_incubation: "Les larves de grandes cétoines comme celle-ci se développent lentement (L1 à L3 sur plusieurs mois, parfois plus d'un an avant nymphose) — patience nécessaire, comme pour l'individu actuel.",
    repro_juveniles: "Après la nymphose dans une loge en terreau, ne pas déterrer l'adulte : le laisser sortir de lui-même.",
    repro_pitfalls: "Déterrer la larve ou la loge nymphale par impatience, manipuler l'adulte trop tôt après émergence, laisser le terreau s'assécher."
  },
  {
    category: 'cetoine', common_name: 'Cétoine commune', scientific_name: 'Pachnoda marginata',
    difficulty: 1, humidity_min: 60, humidity_max: 70, temp_min: 24, temp_max: 28,
    sociability: 'Adultes grégaires, larves solitaires', diet_summary: 'Fruits mûrs (adulte), terreau (larve)',
    vigilance: 'Aucune',
    presentation: "La cétoine de début par excellence : jaune orangé tachetée de noir, cycle complet rapide, très bien documentée. Idéale pour observer un élevage de cétoine de bout en bout avant de se lancer sur la Dicronorhina.",
    habitat: "Adultes : terrarium sec avec substrat léger, branches pour se percher. Larves : bac séparé de terreau de feuilles/flake soil humide en profondeur suffisante.",
    feeding_detail: "Adultes : fruits mûrs (banane, pomme), gelée protéinée. Larves : terreau de feuilles en décomposition, renouvelé progressivement.",
    repro_sexing: "Le mâle a une petite encoche sur le dernier segment abdominal visible par transparence, absente chez la femelle — facile à observer avec un peu d'habitude.",
    repro_conditions: "Se reproduit facilement dès que les adultes sont bien nourris (fruits + protéine) et qu'un bac de ponte séparé avec terreau humide est disponible.",
    repro_mating: "La femelle pond directement dans le terreau humide ; les œufs sont petits et discrets, mieux vaut ne pas fouiller pour les chercher.",
    repro_incubation: "Éclosion en 2 à 3 semaines. Les larves passent par les stades L1, L2 puis L3 sur plusieurs mois avant nymphose.",
    repro_juveniles: "Cycle complet relativement rapide pour une cétoine (quelques mois de la ponte à l'émergence). Laisser durcir l'adulte 2 semaines avant manipulation.",
    repro_pitfalls: "Déterrer les larves pour les compter (stress inutile), terreau de larve trop sec ou trop détrempé."
  },
  {
    category: 'autre', common_name: 'Réduve à deux points', scientific_name: 'Platymeris biguttatus',
    difficulty: 3, humidity_min: 50, humidity_max: 65, temp_min: 24, temp_max: 28,
    sociability: 'Grégaire si proies abondantes', diet_summary: 'Prédateur : grillons, blattes',
    vigilance: 'Piqûre douloureuse — ne jamais manipuler à main nue',
    presentation: "Réduve prédateur noir aux deux points blancs caractéristiques, très prisé pour son comportement actif. La piqûre est douloureuse (venin pour immobiliser les proies) — toujours déplacer les individus à la pince ou en les faisant passer dans un contenant, jamais à main nue.",
    habitat: "Terrarium sec à peu humide, substrat simple, nombreuses cachettes (écorces) pour réduire les rencontres agressives entre individus. Bonne ventilation.",
    feeding_detail: "Proies vivantes (grillons, blattes de petite taille) régulières et abondantes — le manque de proies favorise le cannibalisme entre individus du même bac.",
    repro_sexing: "La taille et la forme de l'abdomen diffèrent légèrement entre mâles et femelles adultes — à affiner par comparaison directe entre plusieurs individus de la colonie.",
    repro_conditions: "Colonie bien nourrie avec un excédent de proies disponibles en permanence, cachettes suffisantes pour que chaque individu ait son espace.",
    repro_mating: "La femelle pond des œufs groupés dans les anfractuosités du substrat ou sous les écorces.",
    repro_incubation: "Éclosion en quelques semaines ; les nymphes traversent plusieurs stades avant l'âge adulte, en chassant dès les premiers stades.",
    repro_juveniles: "Les jeunes nymphes sont aussi prédatrices que les adultes et doivent recevoir des proies de taille adaptée dès l'éclosion, sous peine de cannibalisme entre fratrie.",
    repro_pitfalls: "Manque de proies (cannibalisme immédiat), manipulation directe à main nue, densité trop élevée sans cachettes suffisantes."
  },
  {
    category: 'autre', common_name: 'Blatte panda', scientific_name: 'Therea olegrandjeani',
    difficulty: 2, humidity_min: 55, humidity_max: 70, temp_min: 23, temp_max: 27,
    sociability: 'Grégaire, vit en colonie', diet_summary: 'Omnivore : granulés, légumes, feuilles',
    vigilance: 'Aucune, espèce non grimpante',
    presentation: "Petite blatte noire et blanche très appréciée pour son aspect graphique, incapable de grimper sur les surfaces lisses (contrairement à beaucoup de blattes) — facile à contenir en terrarium ouvert ou peu fermé.",
    habitat: "Substrat plutôt sec (fibre de coco) avec une zone plus humide d'un côté du bac (gradient), cachettes plates (écorces). Évite les milieux trop détrempés.",
    feeding_detail: "Granulés pour rongeurs ou croquettes, complétés de légumes et fruits occasionnels, source d'eau (gel ou coton humide) sans excès.",
    repro_sexing: "Les mâles ont généralement des ailes plus longues et visibles que les femelles — à confirmer avec l'observation directe de ta colonie.",
    repro_conditions: "Colonie stable avec gradient d'humidité respecté, nourriture régulière, densité suffisante pour les interactions sociales.",
    repro_mating: "Comme la plupart des blattes de la famille des Blaberidae, la femelle porte son oothèque (capsule d'œufs) puis donne naissance à des jeunes déjà formés plutôt que de pondre des œufs isolés — à confirmer par l'observation, les détails variant selon les sources.",
    repro_incubation: "Développement porté par la femelle jusqu'à la naissance, comme chez les autres espèces vivipares de la famille.",
    repro_juveniles: "Les jeunes rejoignent directement la colonie et se nourrissent comme les adultes, à taille réduite.",
    repro_pitfalls: "Substrat trop humide en permanence (favorise moisissures et acariens), absence de zone sèche pour se retirer."
  },
  {
    category: 'autre', common_name: 'Crabe vampire de Riani', scientific_name: 'Geosesarma riani',
    difficulty: 4, humidity_min: 75, humidity_max: 90, temp_min: 24, temp_max: 28,
    sociability: 'Grégaire, prévoir des cachettes', diet_summary: 'Omnivore opportuniste',
    vigilance: 'Juvéniles très fragiles',
    presentation: "Petit crabe terrestre originaire de Java, actif et curieux, à la carapace sombre marbrée de violet. Mauvais nageur : il lui faut surtout de la terre humide et un point d'eau peu profond, jamais un bassin profond ou agité.",
    habitat: "Paludarium à dominante terrestre (environ 80% terre / 20% eau stagnante peu profonde). Substrat humide type fibre de coco et sphaigne, mousse et bois flotté pour l'escalade, cachettes nombreuses (écorces, plantes). Bonne circulation d'air malgré l'humidité élevée, pour éviter la stagnation.",
    feeding_detail: "Omnivore et opportuniste : litière de feuilles, algues (spiruline, pastilles), petits morceaux de crevette ou de poisson à l'occasion, biofilm du bac. Petites quantités fréquentes plutôt qu'une grosse ration.",
    repro_sexing: "Les femelles portent un abdomen repliable plus large que celui du mâle, visible en retournant doucement l'animal — c'est le moyen le plus fiable de les distinguer une fois adultes.",
    repro_conditions: "Humidité stable au-dessus de 80%, bonne densité de nourriture protéinée et groupe de plusieurs individus semblent favoriser la reproduction. Le stress ou les écarts d'humidité brusques la bloquent facilement.",
    repro_mating: "La femelle porte sa ponte sous l'abdomen — une masse d'œufs orangés à brunâtres, facile à repérer lors de l'observation.",
    repro_incubation: "Contrairement à beaucoup de crabes, les Geosesarma n'ont pas de stade larvaire planctonique en eau salée : les petits éclosent directement sous forme de crabes miniatures. C'est ce qui rend l'espèce reproductible en bac d'eau douce par un éleveur amateur.",
    repro_juveniles: "Les juvéniles sont minuscules et fragiles les premières semaines : humidité irréprochable et nourriture écrasée très fine. C'est le point de mortalité le plus élevé du cycle. Isoler la femelle porteuse dans un bac de maternité limite la prédation par les adultes.",
    repro_pitfalls: "Chute d'humidité même brève, manipulation excessive de la femelle porteuse, eau stagnante trop profonde, sous-alimentation en protéines avant la ponte."
  },
  {
    category: 'autre', common_name: 'Petit-gris africain', scientific_name: 'Lissachatina fulica',
    difficulty: 2, humidity_min: 80, humidity_max: 95, temp_min: 22, temp_max: 27,
    sociability: 'Grégaire, hermaphrodite', diet_summary: 'Végétal + calcium',
    vigilance: 'Statut réglementaire à vérifier localement',
    presentation: "Grand escargot terrestre africain, parmi les plus grands escargots du monde, très populaire en élevage. Le morph \"Jade White\" est une variation de couleur de coquille recherchée. Espèce considérée invasive dans plusieurs régions du monde — à vérifier auprès des autorités locales avant tout élevage à visée commerciale, la réglementation pouvant varier et évoluer.",
    habitat: "Terrarium très humide, substrat profond (tourbe, terreau non traité) pour permettre l'enfouissement, bonne aération malgré l'humidité élevée. Brumisation quotidienne souvent nécessaire.",
    feeding_detail: "Légumes et fruits variés, feuilles, source de calcium abondante et permanente (os de seiche, coquille d'œuf) indispensable à la croissance de la coquille.",
    repro_sexing: "Sans objet : chaque individu est hermaphrodite et possède les deux organes reproducteurs. L'autofécondation est possible mais la fécondation croisée entre deux individus est plus fréquente et préférable pour la diversité génétique.",
    repro_conditions: "Humidité élevée et stable, calcium abondant, individus adultes bien nourris. L'espèce est naturellement très prolifique — le défi est souvent de gérer le nombre d'œufs plutôt que de stimuler la ponte.",
    repro_mating: "Après accouplement, chaque individu peut pondre une centaine d'œufs dans le substrat humide, potentiellement plusieurs fois par an.",
    repro_incubation: "Éclosion en deux à quatre semaines selon la température et l'humidité du substrat.",
    repro_juveniles: "Les jeunes ont besoin de calcium dès l'éclosion pour construire leur coquille. Croissance rapide vers la maturité (environ six mois à un an). Prévoir à l'avance où placer le surplus de naissances.",
    repro_pitfalls: "Sous-estimer le nombre de naissances par ponte, manque de calcium (coquille fragile), et surtout : ne pas relâcher d'individus dans la nature, l'espèce étant problématique pour les écosystèmes et l'agriculture locale hors de son aire d'origine."
  }
];

const insertSpecies = db.prepare(`
  INSERT INTO species (
    category, common_name, scientific_name, difficulty,
    humidity_min, humidity_max, temp_min, temp_max,
    sociability, diet_summary, vigilance,
    presentation, habitat, feeding_detail,
    repro_sexing, repro_conditions, repro_mating, repro_incubation, repro_juveniles, repro_pitfalls,
    is_draft
  ) VALUES (
    :category, :common_name, :scientific_name, :difficulty,
    :humidity_min, :humidity_max, :temp_min, :temp_max,
    :sociability, :diet_summary, :vigilance,
    :presentation, :habitat, :feeding_detail,
    :repro_sexing, :repro_conditions, :repro_mating, :repro_incubation, :repro_juveniles, :repro_pitfalls,
    1
  )
`);

const speciesIds = {};
for (const sp of species) {
  const info = insertSpecies.run(sp);
  speciesIds[sp.scientific_name] = info.lastInsertRowid;
}

const insertBac = db.prepare('INSERT INTO bacs (substrate) VALUES (?)');

const insertBacSpecies = db.prepare(`
  INSERT INTO bac_species (bac_id, species_id, morph, lineage, population_estimate, acquisition_date, status, breeding_stage, for_sale_quantity, unit_price, last_checked_at)
  VALUES (:bac_id, :species_id, :morph, :lineage, :population_estimate, :acquisition_date, :status, :breeding_stage, :for_sale_quantity, :unit_price, :last_checked_at)
`);

// Each bac has a shared substrate and one or more species living in it.
// Bacs 0-9 are single-species; the last one is a real cohabitation
// example (isopod cleanup crew alongside a millipede colony).
const sampleBacs = [
  { substrate: 'Terreau de feuilles et fibre de coco', entries: [
    { species_id: speciesIds['Tonkinbolus caudulanus'], morph: null, lineage: null, population_estimate: '~24 individus', acquisition_date: '2025-04-10', status: 'actif', breeding_stage: null, for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Terreau feuilles et écorce', entries: [
    { species_id: speciesIds['Porcellio scaber'], morph: 'Lava', lineage: "F3 — issue du groupe fondateur A2", population_estimate: '~38 individus, dont 6 subadultes', acquisition_date: '2025-03-12', status: 'reproduction', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Fibre de coco et sphaigne', entries: [
    { species_id: speciesIds['Geosesarma riani'], morph: null, lineage: null, population_estimate: '9 individus', acquisition_date: '2025-02-01', status: 'actif', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Flake soil (terreau de feuilles fermenté)', entries: [
    { species_id: speciesIds['Pachnoda marginata'], morph: null, lineage: null, population_estimate: '17 larves', acquisition_date: '2025-01-20', status: 'reproduction', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Terreau humide et aéré', entries: [
    { species_id: speciesIds['Porcellio laevis'], morph: 'Dairy Cow', lineage: null, population_estimate: '~45 individus', acquisition_date: '2024-11-05', status: 'vente', breeding_stage: null, for_sale_quantity: 15, unit_price: 8 }
  ]},
  { substrate: 'Terreau humide et aéré', entries: [
    { species_id: speciesIds['Porcellio laevis'], morph: 'Orange Koi', lineage: null, population_estimate: '6 juvéniles', acquisition_date: '2025-08-28', status: 'actif', breeding_stage: null, for_sale_quantity: 6, unit_price: 10 }
  ]},
  { substrate: 'Terreau calcaire', entries: [
    { species_id: speciesIds['Armadillidium vulgare'], morph: 'Albinos', lineage: null, population_estimate: '~20 individus', acquisition_date: '2025-05-15', status: 'vente', breeding_stage: null, for_sale_quantity: 4, unit_price: 12 }
  ]},
  { substrate: 'Fibre de coco', entries: [
    { species_id: speciesIds['Anadenobolus monilicornis'], morph: null, lineage: null, population_estimate: '~20 individus', acquisition_date: '2024-09-01', status: 'vente', breeding_stage: null, for_sale_quantity: 20, unit_price: 5 }
  ]},
  { substrate: 'Substrat sec, écorces', entries: [
    { species_id: speciesIds['Platymeris biguttatus'], morph: null, lineage: null, population_estimate: '11 individus', acquisition_date: '2025-06-01', status: 'actif', breeding_stage: null, for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Tourbe et terreau', entries: [
    { species_id: speciesIds['Lissachatina fulica'], morph: 'Jade White', lineage: null, population_estimate: '14 individus', acquisition_date: '2025-03-01', status: 'reproduction', breeding_stage: 'ponte', for_sale_quantity: 8, unit_price: 15 }
  ]},
  { substrate: 'Terreau de feuilles et fibre de coco — bac mixte cloportes / iules', entries: [
    { species_id: speciesIds['Armadillidium vulgare'], morph: null, lineage: null, population_estimate: '~15 individus', acquisition_date: '2025-07-01', status: 'actif', breeding_stage: null, for_sale_quantity: 0, unit_price: null },
    { species_id: speciesIds['Anadenobolus monilicornis'], morph: null, lineage: null, population_estimate: '~10 individus', acquisition_date: '2025-07-01', status: 'actif', breeding_stage: null, for_sale_quantity: 0, unit_price: null }
  ]}
];

const bacSpeciesIds = [];
for (const bac of sampleBacs) {
  const bacInfo = insertBac.run(bac.substrate);
  for (const entry of bac.entries) {
    const info = insertBacSpecies.run({ bac_id: bacInfo.lastInsertRowid, last_checked_at: null, ...entry });
    bacSpeciesIds.push(info.lastInsertRowid);
  }
}

const insertLog = db.prepare(`
  INSERT INTO log_entries (bac_species_id, type, note, created_at) VALUES (:bac_species_id, :type, :note, :created_at)
`);

const sampleLogs = [
  { bac_species_id: bacSpeciesIds[1], type: 'mue', note: 'Mue groupée, 4 individus repérés', created_at: '2026-08-28 10:00:00' },
  { bac_species_id: bacSpeciesIds[1], type: 'observation', note: 'Exuvie retrouvée côté humide', created_at: '2026-08-14 09:00:00' },
  { bac_species_id: bacSpeciesIds[1], type: 'ponte', note: 'Ponte confirmée, marsupium visible', created_at: '2026-08-02 09:00:00' },
  { bac_species_id: bacSpeciesIds[2], type: 'observation', note: "Femelle porteuse toujours en incubation, aucun signe de stress.", created_at: '2026-08-25 18:30:00' },
  { bac_species_id: bacSpeciesIds[0], type: 'nourrissage', note: null, created_at: '2026-08-29 08:00:00' },
  { bac_species_id: bacSpeciesIds[11], type: 'observation', note: 'Bac mixte stable, aucune interaction agressive observée entre les deux espèces.', created_at: '2026-08-30 09:00:00' }
];

for (const log of sampleLogs) {
  insertLog.run(log);
}

const insertOrder = db.prepare(`
  INSERT INTO orders (customer_name, description, bac_species_id, status) VALUES (?, ?, ?, ?)
`);

insertOrder.run('Julie M.', '5x Porcellio laevis Dairy Cow', bacSpeciesIds[4], 'en_preparation');
insertOrder.run('Marc D.', '10x Anadenobolus monilicornis', bacSpeciesIds[7], 'expedie');

console.log(`Seeded ${species.length} species, ${sampleBacs.length} bacs (${bacSpeciesIds.length} fiches), ${sampleLogs.length} log entries, 2 orders.`);
