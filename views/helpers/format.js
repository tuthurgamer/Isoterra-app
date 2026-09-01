function toDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
}

function relative(dateStr) {
  const d = toDate(dateStr);
  if (!d) return 'jamais vérifié';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
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

function numTag(id) {
  return `n° ${String(id).padStart(3, '0')}`;
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
  mue: 'Mue',
  ponte: 'Ponte',
  observation: 'Observation',
  vente: 'Vente'
};

module.exports = {
  relative, dateFr, dateShort, numTag,
  STATUS_LABELS, STATUS_CLASSES, BREEDING_LABELS, LOG_TYPE_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_CLASSES
};
