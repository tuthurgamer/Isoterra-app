// What a customer sheet adds to the species' fiche. The sheet is an A5
// handout for the breeder's stand: good basics, quick to read; for more,
// people ask the breeder. So: an opening line, the difficulty in words, a
// short word on breeding, the equipment to get (optional) and a fact about
// the animal's group.

const DIFFICULTY_WORDS = ['', 'Très facile, idéal pour débuter', 'Facile', 'Intermédiaire', 'Pour éleveurs confirmés', 'Pour éleveurs experts'];

// Abbreviations a sentence doesn't end on ("Cubaris sp. « Salmon »").
const NOT_AN_END = /\b(sp|spp|cf|env|ex|etc|var|ssp|n°|St|Mt)\.$/i;

// A text cut into sentences.
function sentences(text) {
  const t = String(text || '').trim();
  const out = [];
  const re = /[.!?…](?=\s+[«"A-ZÀ-ÖØ-Þ])/g;
  let from = 0;
  let m;
  while ((m = re.exec(t))) {
    const piece = t.slice(from, m.index + 1);
    if (NOT_AN_END.test(piece)) continue;
    out.push(piece.trim());
    from = m.index + 1;
  }
  if (t.slice(from).trim()) out.push(t.slice(from).trim());
  return out;
}

// The presentation's first sentence (the hook, a little larger) and the rest.
function splitLead(text) {
  const all = sentences(text);
  return { lead: all[0] || '', rest: all.slice(1).join(' ') };
}

// The first sentences of a text, for the short word on breeding.
function briefly(text, count = 2) {
  return sentences(text).slice(0, count).join(' ');
}

const CALCIUM = ['cloporte', 'iule', 'escargot', 'crabe'];
const LITTER = ['cloporte', 'iule', 'blatte', 'cetoine', 'coleoptere', 'escargot'];
const CLIMBERS = ['mante', 'phasme', 'araignee', 'reduve', 'orthoptere'];

// The equipment to get before the animals arrive, from what they need.
function equipment(sp) {
  const items = ['Un bac aéré et bien fermé'];
  const substrate = {
    humide: "Un substrat qui garde l'humidité (terreau sans engrais, fibre de coco)",
    sec: 'Un substrat plutôt sec avec un coin humide',
    flake: 'Du terreau fermenté (flake soil) pour les larves',
    paludarium: "Une partie terrestre et un coin d'eau peu profonde"
  }[sp.substrate_type];
  if (substrate) items.push(substrate);
  if (LITTER.includes(sp.category) || sp.diet_type === 'detritivore') items.push('Feuilles mortes et bois blanc pourri');
  if (CALCIUM.includes(sp.category)) items.push('Os de seiche (calcium)');
  if (sp.diet_type === 'predateur') items.push('Des proies vivantes adaptées à sa taille');
  if (sp.category === 'phasme') items.push('Des branches fraîches de sa plante nourricière');
  else if (CLIMBERS.includes(sp.category)) items.push('Des branches pour grimper');
  items.push('Des cachettes (écorce de liège, mousse)');
  if (Number(sp.humidity_max) >= 70) items.push('Un pulvérisateur');
  if (sp.temp_min || sp.humidity_min) items.push('Un thermomètre-hygromètre');
  return items;
}

// One thing to marvel at, for each group of animals.
const FACTS = {
  cloporte: "Le cloporte n'est pas un insecte : c'est un crustacé, cousin des crabes et des crevettes. La femelle porte ses petits dans une poche sous son ventre.",
  iule: "Un iule a deux paires de pattes par anneau et en gagne à chaque mue. Le record : 1 306 pattes, chez un iule d'Australie découvert en 2021.",
  escargot: "L'escargot est à la fois mâle et femelle. Sa coquille grandit avec lui toute sa vie, grâce au calcium qu'il mange.",
  blatte: "Sur des milliers d'espèces de blattes, seule une poignée vit chez l'homme : les autres, comme celle-ci, recyclent les feuilles des forêts.",
  cetoine: "La larve vit presque toute sa vie sous terre, à transformer bois et feuilles en terreau ; l'adulte ne vit que quelques mois.",
  coleoptere: "Chez beaucoup de coléoptères, c'est la larve qui vit le plus longtemps, parfois des années, avant de devenir adulte.",
  crabe: "Ce crabe vit hors de l'eau une bonne partie du temps, mais ses branchies doivent rester humides : il lui faut toujours de l'eau.",
  reduve: "Les réduves sont des punaises chasseuses : leur salive liquéfie l'intérieur de leurs proies.",
  mante: "La mante peut tourner la tête et voit en relief : l'un des rares insectes à vraiment « regarder » sa proie.",
  phasme: "Beaucoup de phasmes se reproduisent sans mâle : les femelles pondent des œufs qui donnent des femelles.",
  orthoptere: "Criquets et sauterelles entendent grâce à des tympans : sur l'abdomen des criquets, sur les pattes avant des sauterelles.",
  araignee: "Une araignée n'est pas un insecte : elle a huit pattes et tisse sa soie avec des filières au bout de l'abdomen.",
  scorpion: "Sous une lampe UV, la carapace d'un scorpion brille d'un bleu-vert étonnant.",
  arachnide: "Ces arachnides n'ont pas de venin : leurs longues pattes ou leurs pinces avant leur servent à sentir et attraper leurs proies.",
  scolopendre: "La scolopendre a une paire de pattes par anneau, et la première est devenue une paire de crochets à venin."
};

function funFact(category) {
  return FACTS[category] || null;
}

// How tight the printed text must be for the sheet to stay on one A5
// page: most fiches fit at the normal size, the longest get a little smaller
// type ("dense", "denser").
function density(sp, repro) {
  const vigilance = sp.vigilance && sp.vigilance !== 'Aucune' ? sp.vigilance : '';
  const length = [sp.presentation, sp.habitat, sp.feeding_detail, repro, vigilance].join('').length;
  return length > 1400 ? 'denser' : length > 1150 ? 'dense' : '';
}

module.exports = { DIFFICULTY_WORDS, splitLead, briefly, equipment, funFact, density };
