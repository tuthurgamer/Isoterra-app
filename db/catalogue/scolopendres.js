const VENOM = 'Morsure venimeuse très douloureuse : ne jamais manipuler à la main';

module.exports = [
  {
    category: 'scolopendre', common_name: 'Scolopendre ceinturée', scientific_name: 'Scolopendra cingulata',
    difficulty: 2, humidity_min: 60, humidity_max: 70, temp_min: 22, temp_max: 28,
    sociability: 'Solitaire', diet_summary: 'Prédateur : grillons, blattes',
    vigilance: VENOM,
    presentation: "La scolopendre du pourtour méditerranéen (dont le sud de la France), de 10 à 15 cm, brun-jaune à bandes sombres. Rapide et nocturne.",
    habitat: "Bac plus large que haut, couvercle parfaitement fermé, 10 cm de substrat légèrement humide qui tient (terre, fibre de coco) pour creuser, écorces, coupelle d'eau.",
    feeding_detail: "Grillons, blattes, une fois par semaine.",
    repro_sexing: "Difficile à l'œil.",
    repro_conditions: "Femelle bien nourrie, substrat profond.",
    repro_mating: "Le mâle dépose un sac de sperme ; la femelle pond dans une loge souterraine.",
    repro_incubation: "La femelle s'enroule autour de ses œufs et les garde plusieurs semaines sans manger.",
    repro_juveniles: "Elle garde les petits jusqu'à leur première mue ; les séparer ensuite.",
    repro_pitfalls: "Déranger la femelle qui couve (elle mange ses œufs), couvercle mal fermé.",
    lifespan: '5 à 10 ans (estimation)'
  },
  {
    category: 'scolopendre', common_name: "Scolopendre géante d'Asie", scientific_name: 'Scolopendra dehaani',
    difficulty: 3, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    sociability: 'Solitaire', diet_summary: 'Prédateur : grillons, blattes',
    vigilance: VENOM + ' ; très défensive',
    presentation: "Grande scolopendre d'Asie du Sud-Est (20 cm et plus), rouge cerise à brun selon les formes. Puissante et nerveuse : pour éleveurs prudents.",
    habitat: "Bac solide et parfaitement fermé, 15 cm de substrat humide qui tient, écorces, coupelle d'eau.",
    feeding_detail: "Grosses blattes, grillons, une fois par semaine.",
    repro_sexing: "Difficile à l'œil.",
    repro_conditions: "Substrat profond, calme.",
    repro_mating: "Sac de sperme ; ponte dans une loge souterraine.",
    repro_incubation: "Couvaison de plusieurs semaines par la femelle.",
    repro_juveniles: "Petits gardés par la mère jusqu'à la première mue.",
    repro_pitfalls: "Ouvertures du bac, manipulations.",
    lifespan: '5 à 10 ans (estimation)'
  },
  {
    category: 'scolopendre', common_name: 'Scolopendre bleue de Tanzanie', scientific_name: 'Ethmostigmus trigonopodus',
    difficulty: 2, humidity_min: 70, humidity_max: 80, temp_min: 24, temp_max: 28,
    sociability: 'Solitaire', diet_summary: 'Prédateur : grillons, blattes',
    vigilance: VENOM,
    presentation: "Scolopendre d'Afrique de l'Est (15 à 18 cm) aux pattes bleu vif. Plus calme que les grandes scolopendres asiatiques.",
    habitat: "Bac fermé, 10 à 15 cm de substrat humide, écorces, coupelle d'eau.",
    feeding_detail: "Grillons, blattes, une fois par semaine.",
    repro_sexing: "Difficile à l'œil.",
    repro_conditions: "Substrat profond, calme.",
    repro_mating: "Sac de sperme ; ponte dans une loge.",
    repro_incubation: "Couvaison par la femelle.",
    repro_juveniles: "Petits gardés jusqu'à la première mue.",
    repro_pitfalls: "Dérangement de la femelle.",
    lifespan: '5 à 10 ans (estimation)'
  }
];
