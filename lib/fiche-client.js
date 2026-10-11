// What a customer sheet adds to the species' fiche, so a buyer wants to read
// it all: an opening line, the difficulty in words, the equipment to get,
// the care over two weeks, the steps of breeding and a fact about the
// animal's group.

const DIFFICULTY_WORDS = ['', 'Très facile, idéal pour débuter', 'Facile', 'Intermédiaire', 'Pour éleveurs confirmés', 'Pour éleveurs experts'];

// Abbreviations a sentence doesn't end on ("Cubaris sp. « Salmon »").
const NOT_AN_END = /\b(sp|spp|cf|env|ex|etc|var|ssp|n°|St|Mt)\.$/i;

// The presentation's first sentence (the hook, printed large) and the rest.
function splitLead(text) {
  const t = String(text || '').trim();
  const re = /[.!?…](?=\s+[«"A-ZÀ-ÖØ-Þ])/g;
  let m;
  while ((m = re.exec(t))) {
    const head = t.slice(0, m.index + 1);
    if (NOT_AN_END.test(head)) continue;
    return { lead: head, rest: t.slice(m.index + 1).trim() };
  }
  return { lead: t, rest: '' };
}

// Where a value sits on a scale, for the gauges (in % of the bar).
function gauge(min, max, low, high) {
  if (!min && !max) return null;
  const a = Math.max(low, Math.min(high, Number(min || max)));
  const b = Math.max(low, Math.min(high, Number(max || min)));
  const left = ((a - low) / (high - low)) * 100;
  return { left: Math.round(left), width: Math.max(4, Math.round(((b - a) / (high - low)) * 100)) };
}

const CALCIUM = ['cloporte', 'iule', 'escargot', 'crabe'];
const LITTER = ['cloporte', 'iule', 'blatte', 'cetoine', 'coleoptere', 'escargot'];
const CLIMBERS = ['mante', 'phasme', 'araignee', 'reduve', 'orthoptere'];

// The equipment to get before the animals arrive, from what they need.
function equipment(sp) {
  const items = ['Un bac aéré et bien fermé, adapté à la taille du groupe'];
  const substrate = {
    humide: "Un substrat qui garde l'humidité : terreau sans engrais, fibre de coco ou terreau de feuilles",
    sec: 'Un substrat plutôt sec (terreau et sable) avec un coin humide',
    flake: 'Du terreau fermenté (flake soil), qui nourrit aussi les larves',
    paludarium: "Une partie terrestre et un coin d'eau peu profonde (eau sans chlore)"
  }[sp.substrate_type];
  if (substrate) items.push(substrate);
  if (LITTER.includes(sp.category) || sp.diet_type === 'detritivore') items.push('Des feuilles mortes (chêne, hêtre) et du bois blanc pourri');
  if (CALCIUM.includes(sp.category)) items.push('Une source de calcium en permanence : os de seiche');
  if (sp.diet_type === 'predateur') items.push('Des proies vivantes adaptées à sa taille (grillons, mouches, blattes)');
  if (sp.category === 'phasme') items.push('Des branches fraîches de sa plante nourricière, dans un pot d\'eau bien fermé');
  else if (CLIMBERS.includes(sp.category) || sp.niche === 'surface') items.push('Des branches et des écorces pour grimper');
  items.push('Des cachettes : écorce de liège, mousse');
  if (Number(sp.humidity_max) >= 70) items.push('Un pulvérisateur');
  if (sp.temp_min || sp.humidity_min) items.push('Un thermomètre-hygromètre');
  if (Number(sp.temp_min) >= 22) items.push('Un chauffage doux si la pièce est fraîche, par le côté ou le dessus (jamais sous tout le bac)');
  return items;
}

// Feeding and misting over two weeks: day by day, the days to do it.
function careDays(sp, days = 14) {
  return [
    { type: 'nourrissage', label: 'Nourrir', every: Number(sp.feed_every_days) },
    { type: 'pulverisation', label: 'Pulvériser', every: Number(sp.mist_every_days) }
  ].filter((r) => r.every > 0).map((r) => ({
    ...r,
    days: Array.from({ length: days }, (_, d) => d % r.every === 0)
  }));
}

// Breeding as steps, with what the fiche says for each.
function breedingSteps(sp) {
  return [
    ['Reconnaître mâle et femelle', sp.repro_sexing],
    ['Accouplement et ponte', sp.repro_mating],
    ['Incubation', sp.repro_incubation],
    ['Les petits', sp.repro_juveniles]
  ].filter(([, text]) => text).map(([title, text]) => ({ title, text }));
}

// One thing to marvel at, for each group of animals.
const FACTS = {
  cloporte: "Le cloporte n'est pas un insecte : c'est un crustacé, cousin des crabes et des crevettes, qui respire par de petits organes sous le ventre. C'est pour cela qu'il a besoin d'humidité. La femelle porte ses œufs, puis ses petits, dans une poche sous son ventre.",
  iule: "Un iule a deux paires de pattes par anneau et en gagne à chaque mue. Le record appartient à un iule d'Australie découvert en 2021 : 1 306 pattes !",
  escargot: "L'escargot est hermaphrodite : chaque individu est à la fois mâle et femelle. Sa coquille grandit avec lui toute sa vie, grâce au calcium qu'il mange, et sa langue porte des milliers de dents minuscules.",
  blatte: "Sur les milliers d'espèces de blattes du monde, seule une poignée vit chez l'homme. Les autres, comme celle-ci, sont des recycleuses discrètes des forêts.",
  cetoine: "La larve vit presque toute sa vie sous terre, à transformer bois et feuilles en terreau. L'adulte, lui, ne vit que quelques mois : il butine les fruits mûrs.",
  coleoptere: "Chez beaucoup de coléoptères, c'est la larve qui vit le plus longtemps : des mois, voire des années, à transformer le bois mort en terreau, avant de devenir adulte.",
  crabe: "Ce crabe vit hors de l'eau une bonne partie du temps, mais ses branchies doivent rester humides : il lui faut toujours de l'eau à portée de pinces.",
  reduve: "Les réduves sont des punaises chasseuses : leur rostre injecte une salive qui liquéfie l'intérieur de leurs proies.",
  mante: "La mante peut tourner la tête et voit en relief : c'est l'un des rares insectes à vraiment « regarder » sa proie avant de l'attraper.",
  phasme: "Beaucoup de phasmes peuvent se reproduire sans mâle : les femelles pondent des œufs qui donnent des femelles. Et leur camouflage est l'un des plus parfaits du monde animal.",
  orthoptere: "Criquets et sauterelles entendent grâce à des tympans : sur l'abdomen chez les criquets, sur les pattes avant chez les sauterelles.",
  araignee: "Une araignée n'est pas un insecte : elle a huit pattes et fabrique sa soie avec des filières au bout de l'abdomen.",
  scorpion: "Sous une lampe UV, la carapace d'un scorpion brille d'un bleu-vert étonnant.",
  arachnide: "Ces arachnides n'ont pas de venin : leurs longues pattes ou leurs pinces avant leur servent à sentir et à attraper leurs proies.",
  scolopendre: "La scolopendre a une seule paire de pattes par anneau, et la première est devenue une paire de crochets à venin."
};

function funFact(category) {
  return FACTS[category] || null;
}

module.exports = { DIFFICULTY_WORDS, splitLead, gauge, equipment, careDays, breedingSteps, funFact };
