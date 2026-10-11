// The family of each genus met in the guide, so a species gets its family
// from its name (and the guide can sort a category by family). A family
// typed in the species form always wins.

const FAMILIES = {
  // Iules
  Archispirostreptus: 'Spirostreptidae', Spirostreptus: 'Spirostreptidae', Telodeinopus: 'Spirostreptidae',
  Orthoporus: 'Spirostreptidae',
  Anadenobolus: 'Rhinocricidae',
  Centrobolus: 'Pachybolidae', Tonkinbolus: 'Pachybolidae', Epibolus: 'Pachybolidae', Trigoniulus: 'Pachybolidae',
  Aphistogoniulus: 'Pachybolidae',
  Chicobolus: 'Spirobolidae', Narceus: 'Spirobolidae',
  Ophistreptus: 'Spirostreptidae', Analocostreptus: 'Spirostreptidae', Alienostreptus: 'Spirostreptidae',
  Doratogonus: 'Spirostreptidae',
  Thyropygus: 'Harpagophoridae', Balustreptus: 'Harpagophoridae',
  Atopochetus: 'Pachybolidae', Pelmatojulus: 'Pachybolidae', Xenobolus: 'Pachybolidae',
  Desmoxytes: 'Paradoxosomatidae', Antheromorpha: 'Paradoxosomatidae', Orthomorpha: 'Paradoxosomatidae',
  Coromus: 'Oxydesmidae',
  Tachypodoiulus: 'Julidae', Ommatoiulus: 'Julidae', Cylindroiulus: 'Julidae',
  Glomeris: 'Glomeridae', Loboglomeris: 'Glomeridae', Hyleoglomeris: 'Glomeridae',
  Sphaerotherium: 'Sphaerotheriidae',
  Zephronia: 'Zephroniidae',
  // Cloportes
  Armadillidium: 'Armadillidiidae', Cristarmadillidium: 'Armadillidiidae', Schizidium: 'Armadillidiidae',
  Trichodillidium: 'Armadillidiidae',
  Armadillo: 'Armadillidae', Cubaris: 'Armadillidae', Venezillo: 'Armadillidae', Merulanella: 'Armadillidae',
  Nesodillo: 'Armadillidae', Sinodillo: 'Armadillidae', Laureola: 'Armadillidae',
  Ardentiella: 'Armadillidae', Caribodillo: 'Armadillidae', Spherillo: 'Armadillidae', Troglodillo: 'Armadillidae',
  Helleria: 'Tylidae',
  Porcellio: 'Porcellionidae', Porcellionides: 'Porcellionidae',
  Oniscus: 'Oniscidae',
  Trachelipus: 'Trachelipodidae',
  Trichorhina: 'Platyarthridae',
  // Blattes
  Gromphadorhina: 'Blaberidae', Elliptorhina: 'Blaberidae', Princisia: 'Blaberidae', Blaptica: 'Blaberidae',
  Blaberus: 'Blaberidae', Archimandrita: 'Blaberidae', Eublaberus: 'Blaberidae', Panchlora: 'Blaberidae',
  Pycnoscelus: 'Blaberidae', Opisthoplatia: 'Blaberidae', Gyna: 'Blaberidae', Byrsotria: 'Blaberidae',
  Panesthia: 'Blaberidae',
  Pseudoglomeris: 'Blaberidae', Corydidarum: 'Blaberidae', Lucihormetica: 'Blaberidae', Simandoa: 'Blaberidae',
  Macropanesthia: 'Blaberidae',
  Shelfordella: 'Blattidae', Blatta: 'Blattidae', Archiblatta: 'Blattidae',
  Eucorydia: 'Corydiidae',
  Therea: 'Corydiidae', Ergaula: 'Corydiidae', Polyphaga: 'Corydiidae',
  // Coléoptères
  Pachnoda: 'Scarabaeidae (Cetoniinae)', Dicronorhina: 'Scarabaeidae (Cetoniinae)', Eudicella: 'Scarabaeidae (Cetoniinae)',
  Mecynorrhina: 'Scarabaeidae (Cetoniinae)', Stephanorrhina: 'Scarabaeidae (Cetoniinae)', Chlorocala: 'Scarabaeidae (Cetoniinae)',
  Cetonia: 'Scarabaeidae (Cetoniinae)', Protaetia: 'Scarabaeidae (Cetoniinae)', Goliathus: 'Scarabaeidae (Cetoniinae)',
  Tmesorrhina: 'Scarabaeidae (Cetoniinae)', Chelorrhina: 'Scarabaeidae (Cetoniinae)', Jumnos: 'Scarabaeidae (Cetoniinae)',
  Megalorrhina: 'Scarabaeidae (Cetoniinae)', Taurhina: 'Scarabaeidae (Cetoniinae)', Cheirolasia: 'Scarabaeidae (Cetoniinae)',
  Pedinorrhina: 'Scarabaeidae (Cetoniinae)', Plaesiorrhina: 'Scarabaeidae (Cetoniinae)', Anisorrhina: 'Scarabaeidae (Cetoniinae)',
  Mausoleopsis: 'Scarabaeidae (Cetoniinae)', Cetonischema: 'Scarabaeidae (Cetoniinae)',
  Dynastes: 'Scarabaeidae (Dynastinae)', Trypoxylus: 'Scarabaeidae (Dynastinae)', Xylotrupes: 'Scarabaeidae (Dynastinae)',
  Megasoma: 'Scarabaeidae (Dynastinae)', Chalcosoma: 'Scarabaeidae (Dynastinae)', Golofa: 'Scarabaeidae (Dynastinae)',
  Agaocephala: 'Scarabaeidae (Dynastinae)', Diloboderus: 'Scarabaeidae (Dynastinae)',
  Scarabaeus: 'Scarabaeidae (Scarabaeinae)',
  Dorcus: 'Lucanidae', Phalacrognathus: 'Lucanidae', Prosopocoilus: 'Lucanidae', Homoderus: 'Lucanidae',
  Odontolabis: 'Lucanidae', Cyclommatus: 'Lucanidae',
  Asbolus: 'Tenebrionidae', Zophobas: 'Tenebrionidae', Tenebrio: 'Tenebrionidae', Prionotheca: 'Tenebrionidae',
  Anthia: 'Carabidae',
  Acrocinus: 'Cerambycidae',
  // Escargots
  Achatina: 'Achatinidae', Archachatina: 'Achatinidae', Lissachatina: 'Achatinidae', Limicolaria: 'Achatinidae',
  Pseudoachatina: 'Achatinidae', Pseudachatina: 'Achatinidae', Subulina: 'Achatinidae', Ceras: 'Achatinidae',
  Rumina: 'Achatinidae', Allopeas: 'Achatinidae', Leptinaria: 'Achatinidae', Paropeas: 'Achatinidae',
  Acavus: 'Acavidae', Helicophanta: 'Acavidae', Oligospira: 'Acavidae',
  Cryptozona: 'Ariophantidae', Tanychlamys: 'Ariophantidae', Camaena: 'Camaenidae', Hadra: 'Camaenidae',
  Caracolus: 'Pleurodontidae', Zachrysia: 'Pleurodontidae', Dyakia: 'Dyakiidae', Otala: 'Helicidae',
  Oospira: 'Clausiliidae', Phaedusa: 'Clausiliidae', Anguispira: 'Discidae', Tropidophora: 'Pomatiidae',
  Moulinsia: 'Pupinidae', Gonaxis: 'Streptaxidae', Veronicella: 'Veronicellidae', Sarasinula: 'Veronicellidae',
  Cornu: 'Helicidae',
  Edentulina: 'Streptaxidae', Amphidromus: 'Camaenidae', Pleurodonte: 'Pleurodontidae', Asperitas: 'Dyakiidae',
  Leptopoma: 'Cyclophoridae', Hemiplecta: 'Ariophantidae', Platymma: 'Ariophantidae', Laevicaulis: 'Veronicellidae',
  // Crabes
  Geosesarma: 'Sesarmidae', Perisesarma: 'Sesarmidae',
  Cardisoma: 'Gecarcinidae',
  Coenobita: 'Coenobitidae',
  // Réduves
  Platymeris: 'Reduviidae', Psytalla: 'Reduviidae',
  // Mantes
  Sphodromantis: 'Mantidae', Hierodula: 'Mantidae', Mantis: 'Mantidae', Rhombodera: 'Mantidae', Tenodera: 'Mantidae',
  Stagmatoptera: 'Mantidae', Polyspilota: 'Mantidae', Prohierodula: 'Mantidae', Alalomantis: 'Mantidae',
  Omomantis: 'Mantidae', Cilnia: 'Mantidae', Popa: 'Mantidae',
  Creobroter: 'Hymenopodidae', Pseudocreobotra: 'Hymenopodidae', Hymenopus: 'Hymenopodidae', Harpagomantis: 'Hymenopodidae',
  Chlidonoptera: 'Hymenopodidae', Theopropus: 'Hymenopodidae', Helvia: 'Hymenopodidae', Acromantis: 'Hymenopodidae',
  Astyliasula: 'Hymenopodidae', Asiadodis: 'Hymenopodidae',
  Phyllocrania: 'Empusidae', Idolomantis: 'Empusidae', Empusa: 'Empusidae', Blepharopsis: 'Empusidae',
  Gongylus: 'Empusidae', Idolomorpha: 'Empusidae', Pseudempusa: 'Empusidae',
  Deroplatys: 'Deroplatyidae', Parablepharis: 'Deroplatyidae',
  Acanthops: 'Acanthopidae', Stenophylla: 'Acanthopidae',
  Tarachodula: 'Tarachodidae', Haania: 'Haaniidae', Sibylla: 'Sibyllidae', Metallyticus: 'Metallyticidae',
  // Phasmes
  Carausius: 'Lonchodidae', Eurycantha: 'Lonchodidae', Necroscia: 'Lonchodidae', Lobofemora: 'Lonchodidae',
  Myronides: 'Lonchodidae', Nuichua: 'Lonchodidae', Calvisia: 'Lonchodidae',
  Medauroidea: 'Phasmatidae', Extatosoma: 'Phasmatidae', Achrioptera: 'Phasmatidae', Phasma: 'Phasmatidae',
  Tirachoidea: 'Phasmatidae', Parapachymorpha: 'Phasmatidae', Diapherodes: 'Phasmatidae', Lamponius: 'Phasmatidae',
  Sungaya: 'Heteropterygidae', Heteropteryx: 'Heteropterygidae', Aretaon: 'Heteropterygidae', Trachyaretaon: 'Heteropterygidae',
  Dares: 'Heteropterygidae', Epidares: 'Heteropterygidae', Mearnsiana: 'Heteropterygidae', Haaniella: 'Heteropterygidae',
  Phyllium: 'Phylliidae', Cryptophyllium: 'Phylliidae',
  Peruphasma: 'Pseudophasmatidae', Oreophoetes: 'Pseudophasmatidae',
  // Arachnides
  Thelyphonus: 'Thelyphonidae', Mastigoproctus: 'Thelyphonidae',
  Damon: 'Phrynichidae',
  Phrynus: 'Phrynidae',
  Euphrynichus: 'Phrynichidae', Galeodes: 'Galeodidae',
  Pandinus: 'Scorpionidae', Heterometrus: 'Scorpionidae',
  Hadogenes: 'Hormuridae', Liocheles: 'Hormuridae', Nebo: 'Diplocentridae',
  Tliltocatl: 'Theraphosidae', Brachypelma: 'Theraphosidae', Grammostola: 'Theraphosidae',
  Chromatopelma: 'Theraphosidae', Caribena: 'Theraphosidae', Lasiodora: 'Theraphosidae', Pterinopelma: 'Theraphosidae',
  Neoholothele: 'Theraphosidae', Harpactira: 'Theraphosidae', Idiothele: 'Theraphosidae', Chilobrachys: 'Theraphosidae',
  Phidippus: 'Salticidae', Hyllus: 'Salticidae', Paraphidippus: 'Salticidae', Plexippus: 'Salticidae',
  Hasarius: 'Salticidae', Philaeus: 'Salticidae',
  Heteropoda: 'Sparassidae', Eusparassus: 'Sparassidae', Holconia: 'Sparassidae', Cupiennius: 'Trechaleidae',
  Eresus: 'Eresidae', Stegodyphus: 'Eresidae', Lycosa: 'Lycosidae', Hogna: 'Lycosidae', Liphistius: 'Liphistiidae',
  Trichonephila: 'Araneidae', Nephilingis: 'Araneidae', Argiope: 'Araneidae', Cyrtophora: 'Araneidae',
  Kukulcania: 'Filistatidae', Zoropsis: 'Zoropsidae', Peucetia: 'Oxyopidae', Platythomisus: 'Thomisidae',
  Anelosimus: 'Theridiidae',
  // Scolopendres
  Scolopendra: 'Scolopendridae', Ethmostigmus: 'Scolopendridae',
  // Autres
  Folsomia: 'Isotomidae', Bilobella: 'Neanuridae',
  Acheta: 'Gryllidae', Gryllus: 'Gryllidae',
  Locusta: 'Acrididae',
  Stilpnochlora: 'Tettigoniidae', Siliquofera: 'Tettigoniidae', Ancylecha: 'Tettigoniidae', Acridoxena: 'Tettigoniidae',
  Tropidacris: 'Romaleidae', Zonocerus: 'Pyrgomorphidae', Proscopia: 'Proscopiidae', Pseudoproscopia: 'Proscopiidae',
  Diestrammena: 'Rhaphidophoridae',
  Messor: 'Formicidae', Lasius: 'Formicidae', Camponotus: 'Formicidae',
  Bombyx: 'Bombycidae', Samia: 'Saturniidae', Attacus: 'Saturniidae', Antherina: 'Saturniidae'
};

// The guide category of each family that has its own, for species filed
// under a broader one ("Autres espèces", or "Autres arachnides" for the
// spiders and scorpions).
const CATEGORY_OF_FAMILY = {
  Blaberidae: 'blatte', Blattidae: 'blatte', Corydiidae: 'blatte',
  'Scarabaeidae (Dynastinae)': 'coleoptere', Lucanidae: 'coleoptere', Tenebrionidae: 'coleoptere',
  Sesarmidae: 'crabe', Gecarcinidae: 'crabe', Coenobitidae: 'crabe',
  Reduviidae: 'reduve',
  Mantidae: 'mante', Hymenopodidae: 'mante', Empusidae: 'mante', Deroplatyidae: 'mante',
  Lonchodidae: 'phasme', Phasmatidae: 'phasme', Heteropterygidae: 'phasme', Phylliidae: 'phasme', Pseudophasmatidae: 'phasme',
  Tarachodidae: 'mante', Acanthopidae: 'mante', Haaniidae: 'mante', Sibyllidae: 'mante', Metallyticidae: 'mante',
  Carabidae: 'coleoptere', 'Scarabaeidae (Scarabaeinae)': 'coleoptere', Cerambycidae: 'coleoptere',
  Gryllidae: 'orthoptere', Acrididae: 'orthoptere', Tettigoniidae: 'orthoptere', Romaleidae: 'orthoptere',
  Pyrgomorphidae: 'orthoptere', Proscopiidae: 'orthoptere', Rhaphidophoridae: 'orthoptere',
  Thelyphonidae: 'arachnide', Phrynichidae: 'arachnide', Phrynidae: 'arachnide', Galeodidae: 'arachnide',
  Scorpionidae: 'scorpion', Hormuridae: 'scorpion', Diplocentridae: 'scorpion',
  Theraphosidae: 'araignee', Salticidae: 'araignee', Sparassidae: 'araignee', Trechaleidae: 'araignee',
  Eresidae: 'araignee', Lycosidae: 'araignee', Liphistiidae: 'araignee', Araneidae: 'araignee', Filistatidae: 'araignee',
  Zoropsidae: 'araignee', Oxyopidae: 'araignee', Thomisidae: 'araignee', Theridiidae: 'araignee',
  Scolopendridae: 'scolopendre'
};

function familyOf(scientificName) {
  const genus = String(scientificName || '').trim().split(/\s+/)[0];
  return FAMILIES[genus] || null;
}

module.exports = { familyOf, CATEGORY_OF_FAMILY };
