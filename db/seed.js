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
    category: 'iule', common_name: 'Iule dragon rose', scientific_name: 'Desmoxytes planata',
    difficulty: 3, humidity_min: 75, humidity_max: 90, temp_min: 22, temp_max: 27,
    sociability: 'Grégaire, discret', diet_summary: 'Détritivore : feuilles, bois pourri',
    vigilance: "Sécrète du cyanure en défense (odeur d'amande) — se laver les mains",
    presentation: "Petit mille-pattes plat (ordre des Polydesmida) vendu sous le nom de « Pink Dragon » : corps rose vif hérissé d'expansions latérales pointues qui lui donnent son allure de petit dragon. Adulte vers 3 cm. Originaire des îles Andaman, il a été disséminé par l'homme dans une grande partie des tropiques (Thaïlande, Sri Lanka, Java, Seychelles…). Timide et plutôt nocturne, il vit dans la litière et le bois pourri au lieu de s'enfouir profondément comme les grands iules.",
    habitat: "Pas besoin d'un grand bac : 5 à 10 cm de terreau de feuilles et fibre de coco, une épaisse couche de feuilles mortes de feuillus et des morceaux de bois pourri blanc, avec de la mousse d'un côté. Le substrat doit rester humide au toucher en permanence sans être détrempé, avec un peu d'aération pour éviter l'air stagnant. Une source de calcium (os de seiche râpé) aide aux mues.",
    feeding_detail: "Feuilles mortes et bois pourri à volonté : c'est la base de son alimentation. En complément, légumes (courgette, carotte, champignons) et fruits en petites quantités, et un peu de protéines de temps en temps (croquette pour poisson). Retirer ce qui moisit.",
    repro_sexing: "Comme chez tous les Polydesmida, le mâle adulte porte une paire de gonopodes à la place des pattes du 7e anneau, visibles en retournant délicatement l'animal (une loupe aide vu la petite taille). La femelle garde des pattes normales à cet endroit.",
    repro_conditions: "Un groupe d'une dizaine d'individus au moins, une humidité élevée et stable, de la litière et du bois pourri en abondance. Un bac établi et peu dérangé reproduit bien mieux qu'un bac récent.",
    repro_mating: "Le mâle enlace la femelle ventre contre ventre. Elle pond ensuite ses œufs en petits groupes dans le substrat humide ou le bois pourri.",
    repro_incubation: "Développement anamorphe : les jeunes naissent avec peu d'anneaux et de pattes et en gagnent à chaque mue, sur plusieurs mues jusqu'à l'âge adulte.",
    repro_juveniles: "Minuscules à la naissance (la taille d'un grain de riz) et pâles, ils prennent leur couleur rose en grandissant, cachés dans la litière et le bois pourri. Maturité au bout de plusieurs mois, pour une durée de vie de l'ordre de deux ans.",
    repro_pitfalls: "Un substrat qui sèche, même brièvement (les juvéniles y sont très sensibles), fouiller la litière pour chercher les jeunes, un bac confiné qui moisit, et le voisinage d'espèces prédatrices."
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
    category: 'cloporte', common_name: "Cloporte rugueux 'Lava'", scientific_name: 'Porcellio scaber "Lava"',
    difficulty: 1, humidity_min: 60, humidity_max: 75, temp_min: 20, temp_max: 25,
    sociability: 'Très grégaire', diet_summary: 'Détritivore peu sélectif',
    vigilance: 'Aucune',
    presentation: "Morph de Porcellio scaber sélectionné pour sa robe noire tachetée de rouge/orangé, en contraste avec la forme sauvage brun-gris terne et banale de l'espèce. Aussi robuste et tolérant que le type sauvage — un excellent morph d'entrée pour découvrir l'élevage de cloportes sans sacrifier l'esthétique.",
    habitat: "Peu exigeant : substrat classique (terreau, fibre de coco), feuilles mortes, bois. Tolère une gamme d'humidité assez large, idéal comme première espèce.",
    feeding_detail: "Mange presque tout ce qui se décompose : feuilles, bois, légumes. Un ajout de protéine (paillettes de poisson) stimule la reproduction.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; on suit surtout la croissance globale de la population.",
    repro_conditions: "Se reproduit facilement dès que le bac est stable ; peu exigeant sur les conditions précises, ce qui en fait une bonne espèce de référence.",
    repro_mating: "La femelle porte les œufs dans un marsupium ventral, visible en renflement blanchâtre.",
    repro_incubation: "Les mancae sortent directement formées du marsupium, pas de stade larvaire externe.",
    repro_juveniles: "Croissance rapide et bonne survie en colonie ; c'est souvent l'espèce qui explose en population le plus vite du bac.",
    repro_pitfalls: "Mélanger avec des individus sauvages (gris/bruns) ou un autre morph : le croisement est facile et rapide vu la vigueur de l'espèce, et dilue vite la sélection Lava si tu veux garder une lignée pure."
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
    presentation: "Le cloporte le plus commun d'Europe, capable de s'enrouler en boule parfaite. Base de référence du hobby. Cette fiche couvre la forme sauvage (grise/marbrée) ; les morphs \"St Lucia\" et \"Albinos\" de la collection ont chacun leur propre fiche détaillée.",
    habitat: "Substrat classique, moins humide que les espèces tropicales, avec zone plus sèche et zone plus humide pour laisser le choix aux animaux. Calcaire apprécié (coquille d'œuf, craie).",
    feeding_detail: "Feuilles mortes variées, bois, légumes, calcium régulier pour l'\"Albinos\" en particulier (carapace plus fragile).",
    repro_sexing: "Difficile à l'œil nu ; on se fie à la croissance de la colonie plutôt qu'à l'identification de couples.",
    repro_conditions: "Extrêmement facile à reproduire dès que le bac est stable ; l'espèce est souvent utilisée comme \"témoin\" pour valider qu'un nouveau bac fonctionne bien avant d'y placer des morphs plus fragiles.",
    repro_mating: "Marsupium ventral chez la femelle porteuse, comme chez tous les cloportes.",
    repro_incubation: "Développement direct, mancae déjà formés à la sortie du marsupium.",
    repro_juveniles: "Très bonne survie, croissance rapide. Le morph \"Albinos\" (sans pigmentation) demande une attention un peu plus soutenue au calcium disponible.",
    repro_pitfalls: "Mélanger cette forme sauvage avec les morphs St Lucia ou Albinos dans un même bac de reproduction (perte des lignées pures par croisement), substrat trop humide en permanence."
  },
  {
    category: 'cloporte', common_name: "Cloporte commun 'St Lucia'", scientific_name: 'Armadillidium vulgare "St Lucia"',
    difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 18, temp_max: 25,
    sociability: 'Très grégaire', diet_summary: 'Détritivore peu sélectif',
    vigilance: 'Aucune',
    presentation: "Morph d'Armadillidium vulgare marqué d'un petit point rouge-orangé sur le dos, sur fond gris classique de l'espèce. Aussi facile et robuste que la forme sauvage — un excellent premier morph coloré pour qui débute avec cette espèce de référence.",
    habitat: "Substrat classique, moins humide que les espèces tropicales, avec zone plus sèche et zone plus humide pour laisser le choix aux animaux. Calcaire apprécié (coquille d'œuf, craie).",
    feeding_detail: "Feuilles mortes variées, bois, légumes, calcium régulier.",
    repro_sexing: "Difficile à l'œil nu ; on se fie à la croissance de la colonie plutôt qu'à l'identification de couples.",
    repro_conditions: "Extrêmement facile à reproduire dès que le bac est stable ; l'espèce est souvent utilisée comme \"témoin\" pour valider qu'un nouveau bac fonctionne bien avant d'y placer des morphs plus fragiles.",
    repro_mating: "Marsupium ventral chez la femelle porteuse, comme chez tous les cloportes.",
    repro_incubation: "Développement direct, mancae déjà formés à la sortie du marsupium.",
    repro_juveniles: "Très bonne survie, croissance rapide.",
    repro_pitfalls: "Mélanger avec la forme sauvage ou le morph Albinos dans le même bac de reproduction : la marque St Lucia se dilue vite par croisement."
  },
  {
    category: 'cloporte', common_name: "Cloporte commun 'Albinos'", scientific_name: 'Armadillidium vulgare "Albinos"',
    difficulty: 1, humidity_min: 55, humidity_max: 70, temp_min: 18, temp_max: 25,
    sociability: 'Très grégaire', diet_summary: 'Détritivore peu sélectif',
    vigilance: 'Aucune',
    presentation: "Morph totalement dépigmenté d'Armadillidium vulgare, à la carapace blanc translucide qui laisse deviner les organes internes par transparence. Aussi facile à élever que la forme sauvage, mais la carapace plus fine le rend plus sensible au manque de calcium et à une lumière directe trop forte.",
    habitat: "Substrat classique, moins humide que les espèces tropicales, avec zone plus sèche et zone plus humide. Calcaire apprécié (coquille d'œuf, craie). Éviter une exposition prolongée à une lumière vive, la carapace dépigmentée protégeant moins l'animal.",
    feeding_detail: "Feuilles mortes variées, bois, légumes, et calcium en plus grande quantité que pour la forme sauvage — la carapace translucide est plus fragile.",
    repro_sexing: "Difficile à l'œil nu ; on se fie à la croissance de la colonie plutôt qu'à l'identification de couples.",
    repro_conditions: "Facile à reproduire dès que le bac est stable, à condition de ne jamais laisser manquer le calcium.",
    repro_mating: "Marsupium ventral chez la femelle porteuse, comme chez tous les cloportes.",
    repro_incubation: "Développement direct, mancae déjà formés à la sortie du marsupium.",
    repro_juveniles: "Bonne survie, croissance rapide, mais demande une attention un peu plus soutenue au calcium disponible que la forme sauvage.",
    repro_pitfalls: "Manque de calcium (la carapace fine de ce morph est plus fragile que la forme sauvage), le mélanger avec la forme sauvage ou St Lucia dans un bac de reproduction (perte de la lignée pure Albinos)."
  },
  {
    category: 'cloporte', common_name: "Cloporte géant 'Orange'", scientific_name: 'Porcellio laevis "Orange"',
    difficulty: 1, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 27,
    sociability: 'Très grégaire, colonies denses', diet_summary: 'Détritivore vorace',
    vigilance: "Surveiller surtout l'espace disponible",
    presentation: "Morph uni orange vif de Porcellio laevis, l'un des plus grands cloportes du hobby et sans doute le plus rapide à se reproduire. Couleur intense et homogène sur tout le corps — souvent le morph d'appel pour découvrir l'espèce avant de viser les motifs plus travaillés (Orange Koi, Dairy Cow).",
    habitat: "Substrat humide et aéré, grand volume conseillé vu la vitesse de croissance de la colonie. Bonne ventilation malgré l'humidité pour éviter les moisissures liées à la forte densité de population.",
    feeding_detail: "Mange abondamment et vite : feuilles, bois, légumes, protéine régulière. Anticiper la consommation vu la taille des colonies.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; inutile ici de toute façon vu la vitesse de reproduction en colonie.",
    repro_conditions: "Se reproduit très facilement : chaleur, humidité et nourriture abondante suffisent. Le vrai défi est souvent de gérer la population plutôt que de la stimuler.",
    repro_mating: "Marsupium ventral chez la femelle, très fréquemment observable vu le rythme de reproduction élevé.",
    repro_incubation: "Développement direct, cycle particulièrement rapide pour un cloporte.",
    repro_juveniles: "Excellente survie, croissance très rapide. Cette espèce peut vite saturer un bac si la population n'est pas régulièrement répartie ou vendue.",
    repro_pitfalls: "Le croiser avec Orange Koi ou Dairy Cow dilue la couleur unie en une génération vu la vitesse de reproduction — isoler la lignée si tu veux la garder pure. Sous-estimer l'espace nécessaire à moyen terme."
  },
  {
    category: 'cloporte', common_name: "Cloporte géant 'Orange Koi'", scientific_name: 'Porcellio laevis "Orange Koi"',
    difficulty: 1, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 27,
    sociability: 'Très grégaire, colonies denses', diet_summary: 'Détritivore vorace',
    vigilance: "Surveiller surtout l'espace disponible",
    presentation: "Morph de Porcellio laevis au patron marbré blanc et orange rappelant la robe d'un poisson koï — l'un des motifs les plus demandés du genre. Aussi vigoureux et rapide à se reproduire que le reste de l'espèce, avec en plus la variabilité individuelle du motif qui rend chaque animal un peu unique.",
    habitat: "Substrat humide et aéré, grand volume conseillé vu la vitesse de croissance de la colonie. Bonne ventilation malgré l'humidité pour éviter les moisissures liées à la forte densité de population.",
    feeding_detail: "Mange abondamment et vite : feuilles, bois, légumes, protéine régulière. Anticiper la consommation vu la taille des colonies.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; inutile ici de toute façon vu la vitesse de reproduction en colonie.",
    repro_conditions: "Se reproduit très facilement : chaleur, humidité et nourriture abondante suffisent. Le vrai défi est souvent de gérer la population plutôt que de la stimuler.",
    repro_mating: "Marsupium ventral chez la femelle, très fréquemment observable vu le rythme de reproduction élevé.",
    repro_incubation: "Développement direct, cycle particulièrement rapide pour un cloporte.",
    repro_juveniles: "Excellente survie, croissance très rapide. Cette espèce peut vite saturer un bac si la population n'est pas régulièrement répartie ou vendue.",
    repro_pitfalls: "Le motif marbré varie beaucoup d'un individu à l'autre : sélectionner les reproducteurs les plus marqués si tu vises une lignée à fort contraste. Le croiser avec Orange ou Dairy Cow dilue le motif Koi en une génération."
  },
  {
    category: 'cloporte', common_name: "Cloporte géant 'Dairy Cow'", scientific_name: 'Porcellio laevis "Dairy Cow"',
    difficulty: 1, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 27,
    sociability: 'Très grégaire, colonies denses', diet_summary: 'Détritivore vorace',
    vigilance: "Surveiller surtout l'espace disponible",
    presentation: "Morph de Porcellio laevis au patron noir et blanc tacheté façon vache laitière (d'où le nom), très recherché à la vente pour son fort contraste. Partage la vigueur et la vitesse de reproduction record de l'espèce, ce qui en fait un des morphs les plus rentables à produire en volume.",
    habitat: "Substrat humide et aéré, grand volume conseillé vu la vitesse de croissance de la colonie. Bonne ventilation malgré l'humidité pour éviter les moisissures liées à la forte densité de population.",
    feeding_detail: "Mange abondamment et vite : feuilles, bois, légumes, protéine régulière. Anticiper la consommation vu la taille des colonies.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; inutile ici de toute façon vu la vitesse de reproduction en colonie.",
    repro_conditions: "Se reproduit très facilement : chaleur, humidité et nourriture abondante suffisent. Le vrai défi est souvent de gérer la population plutôt que de la stimuler.",
    repro_mating: "Marsupium ventral chez la femelle, très fréquemment observable vu le rythme de reproduction élevé.",
    repro_incubation: "Développement direct, cycle particulièrement rapide pour un cloporte.",
    repro_juveniles: "Excellente survie, croissance très rapide. Cette espèce peut vite saturer un bac si la population n'est pas régulièrement répartie ou vendue.",
    repro_pitfalls: "Le croiser avec Orange ou Orange Koi dilue rapidement le contraste noir et blanc vu la vitesse de reproduction — isoler la lignée si tu vends en \"pure Dairy Cow\". Anticiper l'espace : c'est souvent le morph qui sature un bac en premier."
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
    category: 'cloporte', common_name: "Cloporte à écusson 'Redhead'", scientific_name: 'Armadillidium flavoscutatum "Redhead"',
    difficulty: 3, humidity_min: 65, humidity_max: 80, temp_min: 20, temp_max: 25,
    sociability: 'Grégaire', diet_summary: 'Détritivore : feuilles, bois',
    vigilance: "Reproduction plus lente à anticiper",
    presentation: "Petite espèce de cloporte peu répandue en élevage, sélectionnée pour l'écusson rouge-orangé sur le bouclier céphalique (d'où \"Redhead\") qui tranche avec le corps sombre. Plus petite et plus discrète que les Armadillidium/Porcellio classiques de la collection — à observer de près pour profiter du contraste.",
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
    category: 'cloporte', common_name: "Cloporte espagnol 'Marbleized'", scientific_name: 'Armadillidium espanyoli "Marbleized"',
    difficulty: 2, humidity_min: 50, humidity_max: 70, temp_min: 18, temp_max: 26,
    sociability: 'Grégaire', diet_summary: 'Détritivore : feuilles sèches, bois',
    vigilance: "Craint le substrat détrempé en permanence et l'air confiné",
    presentation: "Armadillidium originaire d'Espagne, capable de s'enrouler en boule. La forme \"Marbleized\" (souvent écrite \"Marbelized\" dans le commerce) a un corps sombre veiné de blanc comme du marbre : chaque individu a son propre motif, qui s'affirme avec l'âge. Adulte vers 14 à 16 mm. Parfois vendu comme \"A. cf. espanyoli\", l'identification exacte de la lignée restant à confirmer. Espèce méditerranéenne : elle préfère un bac nettement plus sec que la plupart des cloportes de la collection.",
    habitat: "Gradient marqué : la plus grande partie du bac sèche, un coin humide (environ un tiers). Terreau mélangé d'un peu de flake soil et de calcaire (craie, coquilles broyées), feuilles sèches de feuillus, bois en décomposition et beaucoup d'écorces de liège. Très bonne aération indispensable. Idéal vers 18 à 24 °C : la reproduction ralentit au-dessus de 26 °C.",
    feeding_detail: "Feuilles mortes sèches et bois en décomposition en base, légumes en petites quantités tous les quelques jours, fruits à l'occasion et protéines régulières (gammares, croquette pour poisson). Calcium en permanence pour sa carapace très calcifiée. Limiter la nourriture fraîche, qui fait monter l'humidité du bac.",
    repro_sexing: "Difficile à l'œil nu comme chez tous les cloportes ; une femelle gestante se repère à son marsupium ventral gonflé.",
    repro_conditions: "Colonie installée, gradient d'humidité respecté, calcium et protéines réguliers. Un peu de chaleur au printemps et à l'automne relance les naissances.",
    repro_mating: "Marsupium ventral chez la femelle, comme chez tous les cloportes.",
    repro_incubation: "Gestation longue, environ 60 jours dans le marsupium ; développement direct, les petits sortent déjà formés.",
    repro_juveniles: "Les jeunes naissent clairs, leur marbrure apparaît puis se renforce au fil des mues. Croissance lente : la colonie met plusieurs semaines à vraiment démarrer.",
    repro_pitfalls: "Substrat détrempé en permanence (le principal risque), air confiné, chaleur excessive, impatience face à une reproduction lente. Le croiser avec une autre forme d'A. espanyoli dilue la marbrure si tu veux garder une lignée Marbleized pure."
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
    presentation: "Grand escargot terrestre africain, parmi les plus grands escargots du monde, très populaire en élevage. Cette fiche couvre la forme sauvage (coquille brune striée classique) ; le morph \"Jade White\" a sa propre fiche dédiée. Espèce considérée invasive dans plusieurs régions du monde — à vérifier auprès des autorités locales avant tout élevage à visée commerciale, la réglementation pouvant varier et évoluer.",
    habitat: "Terrarium très humide, substrat profond (tourbe, terreau non traité) pour permettre l'enfouissement, bonne aération malgré l'humidité élevée. Brumisation quotidienne souvent nécessaire.",
    feeding_detail: "Légumes et fruits variés, feuilles, source de calcium abondante et permanente (os de seiche, coquille d'œuf) indispensable à la croissance de la coquille.",
    repro_sexing: "Sans objet : chaque individu est hermaphrodite et possède les deux organes reproducteurs. L'autofécondation est possible mais la fécondation croisée entre deux individus est plus fréquente et préférable pour la diversité génétique.",
    repro_conditions: "Humidité élevée et stable, calcium abondant, individus adultes bien nourris. L'espèce est naturellement très prolifique — le défi est souvent de gérer le nombre d'œufs plutôt que de stimuler la ponte.",
    repro_mating: "Après accouplement, chaque individu peut pondre une centaine d'œufs dans le substrat humide, potentiellement plusieurs fois par an.",
    repro_incubation: "Éclosion en deux à quatre semaines selon la température et l'humidité du substrat.",
    repro_juveniles: "Les jeunes ont besoin de calcium dès l'éclosion pour construire leur coquille. Croissance rapide vers la maturité (environ six mois à un an). Prévoir à l'avance où placer le surplus de naissances.",
    repro_pitfalls: "Sous-estimer le nombre de naissances par ponte, manque de calcium (coquille fragile), et surtout : ne pas relâcher d'individus dans la nature, l'espèce étant problématique pour les écosystèmes et l'agriculture locale hors de son aire d'origine."
  },
  {
    category: 'autre', common_name: "Petit-gris africain 'Jade White'", scientific_name: 'Lissachatina fulica "Jade White"',
    difficulty: 2, humidity_min: 80, humidity_max: 95, temp_min: 22, temp_max: 27,
    sociability: 'Grégaire, hermaphrodite', diet_summary: 'Végétal + calcium',
    vigilance: 'Statut réglementaire à vérifier localement',
    presentation: "Morph de Lissachatina fulica sélectionné pour sa coquille blanc-jade quasi dépourvue des stries brunes de la forme sauvage, très recherché en élevage pour cet aspect. Mêmes besoins et même vigueur que la forme sauvage — seule la coquille change.",
    habitat: "Terrarium très humide, substrat profond (tourbe, terreau non traité) pour permettre l'enfouissement, bonne aération malgré l'humidité élevée. Brumisation quotidienne souvent nécessaire.",
    feeding_detail: "Légumes et fruits variés, feuilles, source de calcium abondante et permanente (os de seiche, coquille d'œuf) indispensable à la croissance de la coquille — les carences se voient particulièrement sur ce morph clair.",
    repro_sexing: "Sans objet : chaque individu est hermaphrodite et possède les deux organes reproducteurs. L'autofécondation est possible mais la fécondation croisée entre deux individus est plus fréquente et préférable pour la diversité génétique.",
    repro_conditions: "Humidité élevée et stable, calcium abondant, individus adultes bien nourris. L'espèce est naturellement très prolifique — le défi est souvent de gérer le nombre d'œufs plutôt que de stimuler la ponte.",
    repro_mating: "Après accouplement, chaque individu peut pondre une centaine d'œufs dans le substrat humide, potentiellement plusieurs fois par an.",
    repro_incubation: "Éclosion en deux à quatre semaines selon la température et l'humidité du substrat.",
    repro_juveniles: "Les jeunes ont besoin de calcium dès l'éclosion pour construire leur coquille. Croissance rapide vers la maturité (environ six mois à un an). Prévoir à l'avance où placer le surplus de naissances.",
    repro_pitfalls: "Sous-estimer le nombre de naissances par ponte, manque de calcium, ne pas relâcher d'individus dans la nature (espèce invasive hors de son aire d'origine), et le croiser avec la forme sauvage réintroduit les stries brunes sur la coquille de la descendance si tu veux garder une lignée Jade White pure."
  },
  {
    category: 'autre', common_name: "Achatine à bouche rose 'Albinos'", scientific_name: 'Archachatina rhodostoma "Albinos"',
    difficulty: 2, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 26,
    sociability: 'Grégaire, hermaphrodite', diet_summary: 'Végétal + calcium, un peu de protéines',
    vigilance: 'Ne jamais relâcher — congeler les œufs en surplus',
    presentation: "Grand escargot terrestre d'Afrique de l'Ouest (souches du Bénin dans le commerce), à la coquille plus ronde et plus massive que celle des Lissachatina, ornée de flammes brunes sur fond clair, avec la lèvre rose-rouge qui lui donne son nom (rhodostoma : « bouche rose »). Coquille de 9 à 10 cm adulte. La forme \"Albinos\" (\"Albino Body\" dans le commerce) concerne le corps, blanc-crème au lieu de gris-brun ; la coquille garde ses couleurs. Plus calme et plus lent à grandir qu'un petit-gris africain, nocturne, il s'enterre volontiers le jour.",
    habitat: "Terrarium aéré mais humide, 10 à 15 cm de substrat (terreau non traité, fibre de coco, humus de feuilles) gardé humide sans être détrempé, pour l'enfouissement et la ponte. Feuilles mortes et écorces, petite gamelle d'eau peu profonde. 24 à 26 °C le jour, vers 22 °C la nuit. Nettoyer régulièrement les restes et les vitres (moisissures, acariens).",
    feeding_detail: "Légumes variés (courgette, concombre, courge, carotte, salade, champignons), fruits en complément, feuilles mortes en décomposition qu'il apprécie, et une petite source de protéines une fois par semaine (gammares, nourriture pour escargots). Calcium en libre service en permanence (os de seiche, coquilles d'œuf broyées). Retirer les restes au bout de 24 à 48 heures.",
    repro_sexing: "Sans objet : chaque individu est hermaphrodite. Il faut cependant au moins deux adultes : l'accouplement est réciproque et l'autofécondation n'est pas à espérer.",
    repro_conditions: "Adultes bien nourris en calcium et protéines (maturité vers 10 mois, souvent plus tard), substrat profond et humide pour pondre, température stable autour de 24 à 26 °C.",
    repro_mating: "Accouplement réciproque, chaque partenaire fécondant l'autre. Les pontes sont petites mais faites de très gros œufs : 5 à 10 œufs d'environ 12 mm, enfouis dans le substrat, plusieurs fois par an.",
    repro_incubation: "Environ quatre semaines à 24-26 °C dans un substrat humide. La ponte peut rester dans le bac ou passer dans une boîte d'incubation avec le même substrat, à surveiller (ni dessèchement ni moisissure).",
    repro_juveniles: "Les jeunes sont déjà gros à l'éclosion grâce à la taille des œufs, et mangent leur coquille d'œuf : ne pas la retirer, c'est leur premier calcium. Légumes tendres et calcium dès les premiers jours. Croissance plus lente que chez les Lissachatina, espérance de vie de trois à cinq ans, parfois plus. Le caractère albinos est en général récessif : un couple albinos donne des jeunes albinos, un croisement avec la forme normale peut le masquer.",
    repro_pitfalls: "Substrat trop sec (œufs qui se dessèchent) ou détrempé (œufs qui moisissent), manque de calcium (coquille fine, apex abîmé). Ne jamais relâcher d'escargot ni jeter d'œufs vivants : congeler les pontes en surplus."
  },
  {
    category: 'autre', common_name: 'Vinaigrier de Thaïlande', scientific_name: 'Thelyphonus sp. "Thaïlande"',
    difficulty: 3, humidity_min: 70, humidity_max: 85, temp_min: 22, temp_max: 27,
    sociability: 'Solitaire, un individu par bac (cannibale)', diet_summary: 'Prédateur : grillons, blattes, vers',
    vigilance: "Projette de l'acide acétique (odeur de vinaigre) — protéger les yeux ; pinces sans venin",
    presentation: "Le « vinaigrier » est un arachnide sans venin de l'ordre des Thelyphonida : grosses pinces (pédipalpes), pattes avant très fines qui lui servent d'antennes, et longue queue fine (flagelle). Dérangé, il projette depuis la base de sa queue un liquide à l'odeur de vinaigre, d'où son nom. Corps de 3 à 4 cm environ sans le flagelle, plus petit que le vinaigrier géant américain (Mastigoproctus). Nocturne, il passe ses journées dans un terrier qu'il creuse lui-même. Souche thaïlandaise vendue sans identification à l'espèce (\"sp.\") : les généralités du genre servent de base, à affiner par l'observation.",
    habitat: "Bac individuel (environ 30 × 20 cm au sol pour un adulte) rempli de 15 à 20 cm d'un substrat qui tient la forme d'un terrier (terreau, fibre de coco et un peu de tourbe ou d'argile). Il doit rester humide au toucher sans être détrempé : l'animal se dessèche vite. Une écorce de liège posée à plat donne un point de départ au terrier ; petite gamelle d'eau peu profonde et aération correcte malgré l'humidité.",
    feeding_detail: "Proies vivantes de taille raisonnable : grillons, blattes (Blatta lateralis…), vers de farine. Un adulte mange tous les 7 à 10 jours, un jeune tous les 5 à 7 jours. Retirer les proies non mangées sous 24 heures : un grillon peut blesser un vinaigrier en mue. Il refuse de manger avant une mue et s'enferme dans son terrier : ne pas le déterrer.",
    repro_sexing: "Les mâles adultes ont des pédipalpes plus longs et plus massifs et un abdomen plus fin ; les femelles sont plus trapues. La comparaison entre deux adultes reste le moyen le plus simple.",
    repro_conditions: "Deux adultes bien nourris. Le mâle est présenté dans le bac de la femelle sous surveillance, puis retiré après l'accouplement pour éviter le cannibalisme. La femelle a besoin d'un substrat profond pour creuser sa chambre de ponte.",
    repro_mating: "Parade où le mâle tient la femelle par les pattes avant et la guide, puis dépose un spermatophore qu'elle récupère. Quelques semaines plus tard, elle s'enferme dans son terrier et porte ses œufs dans un sac collé sous l'abdomen.",
    repro_incubation: "La femelle reste enfermée sans manger pendant toute l'incubation, de plusieurs semaines à quelques mois : ne pas ouvrir le terrier. À l'éclosion, les petits montent sur son dos et y restent jusqu'à leur première mue, en vivant sur leurs réserves.",
    repro_juveniles: "Après leur première mue sur le dos de leur mère, les petits descendent et la famille sort du terrier : les séparer dans de petites boîtes individuelles à substrat humide dans les semaines qui suivent, avant que le cannibalisme commence. Petites proies (micro-grillons, petites blattes). Croissance lente, autour d'une mue par an chez les vinaigriers : compter plusieurs années jusqu'à l'âge adulte.",
    repro_pitfalls: "Déranger la femelle pendant l'incubation (elle peut abandonner ou manger sa ponte), substrat trop peu profond ou qui sèche (mues ratées), proies vivantes laissées dans le bac, plusieurs adultes ensemble."
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

const { defaultCare } = require('./care-defaults');
const { defaultTraits } = require('./trait-defaults');
const setCare = db.prepare('UPDATE species SET feed_every_days = :feed_every_days, mist_every_days = :mist_every_days WHERE id = :id');
const setTraits = db.prepare(`UPDATE species SET diet_type = :diet_type, size_class = :size_class,
  niche = :niche, substrate_type = :substrate_type WHERE id = :id`);

const speciesIds = {};
for (const sp of species) {
  const info = insertSpecies.run(sp);
  speciesIds[sp.scientific_name] = info.lastInsertRowid;
  setCare.run({ id: info.lastInsertRowid, ...defaultCare(sp) });
  setTraits.run({ id: info.lastInsertRowid, ...defaultTraits(sp) });
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
    { species_id: speciesIds['Porcellio scaber "Lava"'], morph: null, lineage: "F3 — issue du groupe fondateur A2", population_estimate: '~38 individus, dont 6 subadultes', acquisition_date: '2025-03-12', status: 'reproduction', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Fibre de coco et sphaigne', entries: [
    { species_id: speciesIds['Geosesarma riani'], morph: null, lineage: null, population_estimate: '9 individus', acquisition_date: '2025-02-01', status: 'actif', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Flake soil (terreau de feuilles fermenté)', entries: [
    { species_id: speciesIds['Pachnoda marginata'], morph: null, lineage: null, population_estimate: '17 larves', acquisition_date: '2025-01-20', status: 'reproduction', breeding_stage: 'incubation', for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Terreau humide et aéré', entries: [
    { species_id: speciesIds['Porcellio laevis "Dairy Cow"'], morph: null, lineage: null, population_estimate: '~45 individus', acquisition_date: '2024-11-05', status: 'vente', breeding_stage: null, for_sale_quantity: 15, unit_price: 8 }
  ]},
  { substrate: 'Terreau humide et aéré', entries: [
    { species_id: speciesIds['Porcellio laevis "Orange Koi"'], morph: null, lineage: null, population_estimate: '6 juvéniles', acquisition_date: '2025-08-28', status: 'actif', breeding_stage: null, for_sale_quantity: 6, unit_price: 10 }
  ]},
  { substrate: 'Terreau calcaire', entries: [
    { species_id: speciesIds['Armadillidium vulgare "Albinos"'], morph: null, lineage: null, population_estimate: '~20 individus', acquisition_date: '2025-05-15', status: 'vente', breeding_stage: null, for_sale_quantity: 4, unit_price: 12 }
  ]},
  { substrate: 'Fibre de coco', entries: [
    { species_id: speciesIds['Anadenobolus monilicornis'], morph: null, lineage: null, population_estimate: '~20 individus', acquisition_date: '2024-09-01', status: 'vente', breeding_stage: null, for_sale_quantity: 20, unit_price: 5 }
  ]},
  { substrate: 'Substrat sec, écorces', entries: [
    { species_id: speciesIds['Platymeris biguttatus'], morph: null, lineage: null, population_estimate: '11 individus', acquisition_date: '2025-06-01', status: 'actif', breeding_stage: null, for_sale_quantity: 0, unit_price: null }
  ]},
  { substrate: 'Tourbe et terreau', entries: [
    { species_id: speciesIds['Lissachatina fulica "Jade White"'], morph: null, lineage: null, population_estimate: '14 individus', acquisition_date: '2025-03-01', status: 'reproduction', breeding_stage: 'ponte', for_sale_quantity: 8, unit_price: 15 }
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
  { bac_species_id: bacSpeciesIds[1], type: 'pulverisation', note: 'Pulvérisation du bac, substrat réhumidifié', created_at: '2026-08-28 10:00:00' },
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
