function toDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
}

// Counted in calendar days, so yesterday evening reads "hier".
function relative(dateStr) {
  const d = toDate(dateStr);
  if (!d) return 'jamais vérifié';
  const now = new Date();
  const days = Math.round(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
  );
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days}j`;
}

function dateFr(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dateShort(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('fr-FR');
}

// For HTML assembled by hand in a template (then output with <%- %>).
function escape(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function numTag(id) {
  return `n° ${String(id).padStart(3, '0')}`;
}

// The guide's categories, in the order they are shown everywhere.
const CATEGORY_LABELS = {
  iule: 'Iules',
  cloporte: 'Cloportes',
  blatte: 'Blattes',
  cetoine: 'Cétoines',
  coleoptere: 'Autres coléoptères',
  escargot: 'Escargots',
  crabe: 'Crabes',
  reduve: 'Réduves',
  mante: 'Mantes',
  phasme: 'Phasmes',
  orthoptere: 'Sauterelles et criquets',
  araignee: 'Araignées',
  scorpion: 'Scorpions',
  arachnide: 'Autres arachnides',
  scolopendre: 'Scolopendres',
  autre: 'Autres espèces'
};

// The group each category stands for in the classification.
const CATEGORY_TAXA = {
  iule: 'Diplopoda',
  cloporte: 'Isopoda',
  blatte: 'Blattodea',
  cetoine: 'Cetoniinae',
  coleoptere: 'Coleoptera',
  escargot: 'Gastropoda',
  crabe: 'Decapoda',
  reduve: 'Reduviidae',
  mante: 'Mantodea',
  phasme: 'Phasmatodea',
  orthoptere: 'Orthoptera',
  araignee: 'Araneae',
  scorpion: 'Scorpiones',
  arachnide: 'Arachnida',
  scolopendre: 'Chilopoda'
};

// What a family name means, said next to it in the guide.
const FAMILY_NOTES = {
  Spirostreptidae: 'grands iules africains et américains',
  Pachybolidae: "iules colorés d'Afrique et d'Asie",
  Rhinocricidae: 'iules des Caraïbes',
  Spirobolidae: "iules d'Amérique du Nord",
  Paradoxosomatidae: 'iules dragons',
  Glomeridae: 'iules boules',
  Sphaerotheriidae: "iules boules géants d'Afrique",
  Zephroniidae: "iules boules géants d'Asie",
  Harpagophoridae: "grands iules d'Asie",
  Julidae: "iules d'Europe",
  Oxydesmidae: 'iules plats africains',
  Odontopygidae: "iules d'Afrique de l'Est et du Sud",
  Cambalopsidae: "iules des forêts et des grottes d'Asie",
  Pseudospirobolellidae: "petits iules d'Asie du Sud-Est",
  Spirobolellidae: 'petits iules des tropiques',
  Xystodesmidae: "iules plats colorés d'Amérique du Nord et du Japon",
  Chelodesmidae: "iules plats d'Afrique et d'Amérique",
  Armadillidiidae: 'cloportes boules',
  Armadillidae: 'cloportes boules tropicaux',
  Porcellionidae: 'cloportes plats et rapides',
  Oniscidae: 'cloportes des murs',
  Trachelipodidae: "cloportes des forêts d'Europe centrale et orientale",
  Platyarthridae: 'cloportes nains',
  Tylidae: 'cloportes fouisseurs',
  Blaberidae: 'blattes qui donnent naissance aux petits',
  Blattidae: 'blattes qui pondent',
  Corydiidae: 'blattes des sables',
  'Scarabaeidae (Dynastinae)': 'scarabées rhinocéros',
  Lucanidae: 'lucanes',
  Tenebrionidae: 'ténébrions',
  Achatinidae: 'achatines et leurs cousins (limicolaires, bulimes, petits escargots allongés)',
  Helicidae: "escargots d'Europe",
  Sesarmidae: 'crabes de forêt et de mangrove',
  Gecarcinidae: 'crabes de terre',
  Coenobitidae: "bernard-l'ermite terrestres",
  Mantidae: 'mantes vraies',
  Hymenopodidae: 'mantes fleurs',
  Empusidae: 'empuses et mantes fantômes',
  Deroplatyidae: 'mantes feuilles mortes',
  Lonchodidae: 'phasmes bâtons',
  Phasmatidae: 'phasmes bâtons et géants',
  Heteropterygidae: 'phasmes trapus',
  Phylliidae: 'phyllies, phasmes feuilles',
  Pseudophasmatidae: "phasmes d'Amérique du Sud",
  Thelyphonidae: 'uropyges, vinaigriers',
  Phrynichidae: 'amblypyges',
  Phrynidae: 'amblypyges',
  Scorpionidae: 'scorpions',
  Hormuridae: 'scorpions plats',
  Theraphosidae: 'mygales',
  Salticidae: 'araignées sauteuses',
  Scolopendridae: 'scolopendres',
  Isotomidae: 'collemboles',
  Neanuridae: 'collemboles',
  Carabidae: 'carabes',
  'Scarabaeidae (Scarabaeinae)': 'bousiers',
  Cerambycidae: 'longicornes',
  Streptaxidae: 'escargots carnivores',
  Camaenidae: 'escargots des arbres',
  Ariophantidae: "escargots géants d'Asie",
  Pleurodontidae: 'escargots des Antilles',
  Dyakiidae: "escargots d'Indonésie",
  Cyclophoridae: 'escargots à opercule',
  Veronicellidae: 'limaces tropicales',
  Acavidae: 'grands escargots du Sri Lanka et de Madagascar',
  Clausiliidae: 'escargots en fuseau (clausilies)',
  Discidae: "escargots disques d'Amérique du Nord",
  Pomatiidae: 'escargots terrestres à opercule',
  Pupinidae: "petits escargots à opercule d'Asie",
  Tarachodidae: "mantes d'écorce et de sol",
  Acanthopidae: 'mantes feuilles mortes américaines',
  Haaniidae: 'mantes mousses',
  Sibyllidae: 'mantes lichens',
  Metallyticidae: 'mantes métalliques',
  Tettigoniidae: 'sauterelles',
  Romaleidae: 'criquets géants américains',
  Pyrgomorphidae: 'criquets colorés',
  Proscopiidae: 'criquets bâtons',
  Rhaphidophoridae: 'sauterelles des cavernes',
  Formicidae: 'fourmis',
  Bombycidae: 'vers à soie',
  Saturniidae: 'grands papillons de nuit',
  Sparassidae: 'araignées chasseresses',
  Trechaleidae: 'araignées errantes',
  Eresidae: 'araignées velours',
  Lycosidae: 'lycoses',
  Liphistiidae: 'araignées primitives à trappe',
  Araneidae: 'araignées à toile (épeires, néphiles)',
  Filistatidae: 'araignées des fissures',
  Zoropsidae: 'zoropsides',
  Oxyopidae: 'araignées lynx',
  Thomisidae: 'araignées crabes',
  Theridiidae: 'araignées sociales',
  Diplocentridae: 'scorpions fouisseurs',
  Galeodidae: 'solifuges',
  Gryllidae: 'grillons',
  Acrididae: 'criquets'
};

// Species for a menu: those living in the breeder's bacs first, then the
// rest of the guide by category. Expects the guide's order and a `kept`
// count on each species (lib/species-list.js).
function speciesGroups(list) {
  const groups = [];
  const kept = list.filter((sp) => sp.kept);
  if (kept.length) groups.push({ label: 'Dans mon élevage', items: kept });
  for (const sp of list) {
    if (sp.kept) continue;
    const label = CATEGORY_LABELS[sp.category] || sp.category;
    const last = groups[groups.length - 1];
    if (last && last.category === sp.category) last.items.push(sp);
    else groups.push({ label, category: sp.category, items: [sp] });
  }
  return groups;
}

const STATUS_LABELS = {
  actif: 'Actif',
  reproduction: 'Reproduction',
  vente: 'En vente'
};

const STATUS_CLASSES = {
  actif: 'stamp--moss',
  reproduction: 'stamp--rust',
  vente: 'stamp--rust'
};

const BREEDING_LABELS = {
  accouplement: 'Accouplement observé',
  ponte: 'Ponte confirmée',
  incubation: 'Incubation',
  naissance: 'Naissances récentes'
};

const ORDER_STATUS_LABELS = {
  en_preparation: 'En préparation',
  expedie: 'Expédié',
  livre: 'Livré'
};

const ORDER_STATUS_CLASSES = {
  en_preparation: 'stamp--rust',
  expedie: 'stamp--moss',
  livre: 'stamp--muted'
};

const LOG_TYPE_LABELS = {
  nourrissage: 'Nourrissage',
  nettoyage: 'Nettoyage',
  pulverisation: 'Pulvérisation',
  ponte: 'Ponte',
  observation: 'Observation',
  vente: 'Vente'
};

module.exports = {
  relative, dateFr, dateShort, numTag, escape,
  CATEGORY_LABELS, CATEGORY_TAXA, FAMILY_NOTES, speciesGroups, STATUS_LABELS, STATUS_CLASSES, BREEDING_LABELS, LOG_TYPE_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_CLASSES
};
