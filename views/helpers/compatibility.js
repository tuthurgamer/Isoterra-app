// Heuristic, keyword-based compatibility estimate between two species.
// It only has the fields already in the species guide (humidity/temp
// ranges, free-text sociability/diet/vigilance) to work with, so this is
// an indicative starting point for cohabitation, not a guarantee — real
// observation of the animals always wins.

function rangeOverlapScore(aMin, aMax, bMin, bMax) {
  if (aMin == null || aMax == null || bMin == null || bMax == null) return 50;
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  const avgSpan = ((aMax - aMin) + (bMax - bMin)) / 2 || 1;
  if (overlapEnd >= overlapStart) {
    const overlap = overlapEnd - overlapStart;
    return Math.round(60 + Math.min(40, (overlap / avgSpan) * 40));
  }
  const gap = overlapStart - overlapEnd;
  return Math.round(Math.max(0, 60 - (gap / avgSpan) * 60));
}

function behaviorScore(socA, socB) {
  const a = (socA || '').toLowerCase();
  const b = (socB || '').toLowerCase();
  if (a.includes('solitaire') || b.includes('solitaire')) return 35;
  if (a.includes('grégaire') && b.includes('grégaire')) return 90;
  return 60;
}

function dietScore(a, b, notes) {
  const aPred = /prédateur/i.test(a.diet_summary || '');
  const bPred = /prédateur/i.test(b.diet_summary || '');
  if (aPred || bPred) {
    const predator = aPred ? a.scientific_name : b.scientific_name;
    notes.push(`${predator} est une espèce prédatrice : risque réel qu'elle chasse l'autre espèce. Cohabitation déconseillée.`);
    return 10;
  }
  const aVenom = /venimeux/i.test(a.vigilance || '');
  const bVenom = /venimeux/i.test(b.vigilance || '');
  if (aVenom || bVenom) {
    notes.push("Une des deux espèces présente un risque particulier (venimeuse) — vérifie que cela ne menace pas l'autre espèce.");
    return 40;
  }
  return 85;
}

const CRITERIA = [
  { key: 'humidity', label: 'Humidité', weight: 0.25 },
  { key: 'temperature', label: 'Température', weight: 0.20 },
  { key: 'behavior', label: 'Comportement', weight: 0.25 },
  { key: 'diet', label: 'Alimentation', weight: 0.30 }
];

function computeCompatibility(a, b) {
  const notes = [];
  const breakdown = {
    humidity: rangeOverlapScore(a.humidity_min, a.humidity_max, b.humidity_min, b.humidity_max),
    temperature: rangeOverlapScore(a.temp_min, a.temp_max, b.temp_min, b.temp_max),
    behavior: behaviorScore(a.sociability, b.sociability),
    diet: dietScore(a, b, notes)
  };

  let total = 0;
  for (const c of CRITERIA) total += breakdown[c.key] * c.weight;
  total = Math.round(total);

  // A predator pairing is a safety issue, not just one weighted factor
  // among others — a high score on humidity/temperature/behavior must
  // never average it into "moderate" or "good".
  if (breakdown.diet <= 15) total = Math.min(total, 20);

  let verdict, verdictClass;
  if (total >= 75) { verdict = 'Bonne compatibilité'; verdictClass = 'stamp--moss'; }
  else if (total >= 50) { verdict = 'Compatibilité modérée — à surveiller'; verdictClass = 'stamp--rust'; }
  else { verdict = 'Compatibilité faible — déconseillé'; verdictClass = 'stamp--red'; }

  return { total, breakdown, notes, verdict, verdictClass, criteria: CRITERIA };
}

module.exports = { computeCompatibility, CRITERIA };
