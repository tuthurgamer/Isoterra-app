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
  Desmoxytes: 'Paradoxosomatidae',
  Glomeris: 'Glomeridae',
  // Cloportes
  Armadillidium: 'Armadillidiidae', Cristarmadillidium: 'Armadillidiidae',
  Armadillo: 'Armadillidae', Cubaris: 'Armadillidae', Venezillo: 'Armadillidae', Merulanella: 'Armadillidae',
  Porcellio: 'Porcellionidae', Porcellionides: 'Porcellionidae',
  Oniscus: 'Oniscidae',
  Trichorhina: 'Platyarthridae',
  // Blattes
  Gromphadorhina: 'Blaberidae', Elliptorhina: 'Blaberidae', Princisia: 'Blaberidae', Blaptica: 'Blaberidae',
  Blaberus: 'Blaberidae', Archimandrita: 'Blaberidae', Eublaberus: 'Blaberidae', Panchlora: 'Blaberidae',
  Pycnoscelus: 'Blaberidae', Opisthoplatia: 'Blaberidae', Gyna: 'Blaberidae', Byrsotria: 'Blaberidae',
  Panesthia: 'Blaberidae',
  Shelfordella: 'Blattidae', Blatta: 'Blattidae',
  Therea: 'Corydiidae', Ergaula: 'Corydiidae', Polyphaga: 'Corydiidae',
  // Coléoptères
  Pachnoda: 'Scarabaeidae (Cetoniinae)', Dicronorhina: 'Scarabaeidae (Cetoniinae)', Eudicella: 'Scarabaeidae (Cetoniinae)',
  Mecynorrhina: 'Scarabaeidae (Cetoniinae)', Stephanorrhina: 'Scarabaeidae (Cetoniinae)', Chlorocala: 'Scarabaeidae (Cetoniinae)',
  Cetonia: 'Scarabaeidae (Cetoniinae)', Protaetia: 'Scarabaeidae (Cetoniinae)', Goliathus: 'Scarabaeidae (Cetoniinae)',
  Dynastes: 'Scarabaeidae (Dynastinae)', Trypoxylus: 'Scarabaeidae (Dynastinae)', Xylotrupes: 'Scarabaeidae (Dynastinae)',
  Dorcus: 'Lucanidae',
  Asbolus: 'Tenebrionidae', Zophobas: 'Tenebrionidae', Tenebrio: 'Tenebrionidae',
  // Escargots
  Achatina: 'Achatinidae', Archachatina: 'Achatinidae', Lissachatina: 'Achatinidae', Limicolaria: 'Achatinidae',
  Cornu: 'Helicidae',
  // Crabes
  Geosesarma: 'Sesarmidae', Perisesarma: 'Sesarmidae',
  Cardisoma: 'Gecarcinidae',
  Coenobita: 'Coenobitidae',
  // Réduves
  Platymeris: 'Reduviidae', Psytalla: 'Reduviidae',
  // Mantes
  Sphodromantis: 'Mantidae', Hierodula: 'Mantidae', Mantis: 'Mantidae',
  Creobroter: 'Hymenopodidae', Pseudocreobotra: 'Hymenopodidae', Hymenopus: 'Hymenopodidae',
  Phyllocrania: 'Empusidae', Idolomantis: 'Empusidae', Empusa: 'Empusidae',
  Deroplatys: 'Deroplatyidae',
  // Phasmes
  Carausius: 'Lonchodidae', Eurycantha: 'Lonchodidae',
  Medauroidea: 'Phasmatidae', Extatosoma: 'Phasmatidae', Achrioptera: 'Phasmatidae',
  Sungaya: 'Heteropterygidae', Heteropteryx: 'Heteropterygidae',
  Phyllium: 'Phylliidae',
  Peruphasma: 'Pseudophasmatidae',
  // Arachnides
  Thelyphonus: 'Thelyphonidae', Mastigoproctus: 'Thelyphonidae',
  Damon: 'Phrynichidae',
  Phrynus: 'Phrynidae',
  Pandinus: 'Scorpionidae', Heterometrus: 'Scorpionidae',
  Hadogenes: 'Hormuridae',
  Tliltocatl: 'Theraphosidae', Brachypelma: 'Theraphosidae', Grammostola: 'Theraphosidae',
  Chromatopelma: 'Theraphosidae', Caribena: 'Theraphosidae', Lasiodora: 'Theraphosidae',
  Phidippus: 'Salticidae',
  // Scolopendres
  Scolopendra: 'Scolopendridae', Ethmostigmus: 'Scolopendridae',
  // Autres
  Folsomia: 'Isotomidae',
  Acheta: 'Gryllidae', Gryllus: 'Gryllidae',
  Locusta: 'Acrididae'
};

// The guide category of the families that have their own, for species
// still filed under "Autres espèces".
const CATEGORY_OF_FAMILY = {
  Blaberidae: 'blatte', Blattidae: 'blatte', Corydiidae: 'blatte',
  'Scarabaeidae (Dynastinae)': 'coleoptere', Lucanidae: 'coleoptere', Tenebrionidae: 'coleoptere',
  Sesarmidae: 'crabe', Gecarcinidae: 'crabe', Coenobitidae: 'crabe',
  Reduviidae: 'reduve',
  Mantidae: 'mante', Hymenopodidae: 'mante', Empusidae: 'mante', Deroplatyidae: 'mante',
  Lonchodidae: 'phasme', Phasmatidae: 'phasme', Heteropterygidae: 'phasme', Phylliidae: 'phasme', Pseudophasmatidae: 'phasme',
  Thelyphonidae: 'arachnide', Phrynichidae: 'arachnide', Phrynidae: 'arachnide', Scorpionidae: 'arachnide',
  Hormuridae: 'arachnide', Theraphosidae: 'arachnide', Salticidae: 'arachnide',
  Scolopendridae: 'scolopendre'
};

function familyOf(scientificName) {
  const genus = String(scientificName || '').trim().split(/\s+/)[0];
  return FAMILIES[genus] || null;
}

module.exports = { familyOf, CATEGORY_OF_FAMILY };
