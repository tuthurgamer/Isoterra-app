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

const CATEGORY_LABELS = {
  iule: 'Iules',
  cloporte: 'Cloportes',
  cetoine: 'Cétoines',
  autre: 'Autres espèces'
};

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
  CATEGORY_LABELS, STATUS_LABELS, STATUS_CLASSES, BREEDING_LABELS, LOG_TYPE_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_CLASSES
};
