function svg(inner, { size = 21, stroke = 2, viewBox = '0 0 24 24' } = {}) {
  return `<svg viewBox="${viewBox}" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const NAV_ICONS = {
  bacs: svg('<rect x="5" y="8" width="14" height="13" rx="1.5"/><path d="M8 8V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M5 13h14"/>', { stroke: 1.6 }),
  fiches: svg('<path d="M4 6h9l7 7-9 9-7-7z"/><circle cx="8" cy="10" r="1.3"/>', { stroke: 1.6 }),
  especes: svg('<path d="M12 6c-2-1.5-5-2-9-1v13c4-1 7-0.5 9 1c2-1.5 5-2 9-1V5c-4-1-7-0.5-9 1z"/><path d="M12 6v13"/>', { stroke: 1.6 }),
  journal: svg('<path d="M19 4c-5 0-11 4-13 11l-1 5 5-1C17 17 21 11 21 6"/><path d="M9 15l-3 3"/>', { stroke: 1.6 }),
  pontes: svg('<ellipse cx="12" cy="13" rx="5" ry="7"/><path d="M4 18c2-2 5-2 8-2s6 0 8 2"/>', { stroke: 1.6 }),
  vente: svg('<path d="M12 3v18M6 21h12"/><path d="M4 7h6M14 7h6"/><path d="M4 7l-2 5a3 3 0 0 0 6 0zM20 7l-2 5a3 3 0 0 0 6 0z"/>', { stroke: 1.6 })
};

const SPECIES_ICONS = {
  iule: '<path d="M6 30 Q 12 16, 20 24 T 34 22 Q 40 20 42 14"/><path d="M9 28 L6 33 M12 25 L9 30 M15 23 L13 29 M19 22 L17 28 M23 22 L22 28 M27 21 L27 27 M31 21 L32 27 M35 20 L37 26 M39 17 L41 22"/><path d="M42 14 L45 11 M42 14 L44 16"/>',
  cloporte: '<path d="M10 24c0-8 6-13 14-13s14 5 14 13-6 13-14 13-14-5-14-13z"/><path d="M12 18h24M10 24h28M12 30h24"/><path d="M8 20l-4-2M8 24l-5 0M8 28l-4 2M40 20l4-2M40 24l5 0M40 28l4 2"/><path d="M20 37l-3 4M28 37l3 4"/>',
  cetoine: '<ellipse cx="24" cy="26" rx="11" ry="15"/><path d="M24 12v29"/><ellipse cx="24" cy="10" rx="5" ry="4"/><path d="M14 18l-7-3M14 26l-8 1M14 34l-7 4M34 18l7-3M34 26l8 1M34 34l7 4"/>',
  autre: '<ellipse cx="24" cy="24" rx="12" ry="9"/><path d="M13 19l-6-5m-1 8l-7-2m2 9l-7 3M35 19l6-5m1 8l7-2m-2 9l7 3"/><path d="M9 12c-3-1-6 1-6 4M39 12c3-1 6 1 6 4"/><path d="M18 15l-2-3M30 15l2-3"/>'
};

const ACTION_ICONS = {
  nourrissage: svg('<path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z"/><path d="M5 19c3-6 6-9 11-11"/>', { size: 22, stroke: 1.7 }),
  nettoyage: svg('<path d="M4 20l4-4M4 20h4v-4M20 4l-4 4M20 4h-4v4"/><path d="M9 15l6-6"/>', { size: 22, stroke: 1.7 }),
  mue: svg('<ellipse cx="12" cy="12" rx="9" ry="6"/><path d="M6 12c1.5 2 3.5 2 6 0s4.5-2 6 0"/>', { size: 22, stroke: 1.7 }),
  ponte: svg('<ellipse cx="12" cy="13" rx="5" ry="7"/><path d="M4 18c2-2 5-2 8-2s6 0 8 2"/>', { size: 22, stroke: 1.7 }),
  observation: svg('<path d="M5 13l4 4L19 7"/>', { size: 22, stroke: 1.7 }),
  vente: svg('<path d="M12 3v18M6 21h12"/><path d="M4 7h6M14 7h6"/><path d="M4 7l-2 5a3 3 0 0 0 6 0zM20 7l-2 5a3 3 0 0 0 6 0z"/>', { size: 22, stroke: 1.7 })
};

function nav(name) {
  return NAV_ICONS[name] || '';
}

function species(category, size = 30) {
  const inner = SPECIES_ICONS[category] || SPECIES_ICONS.autre;
  return svg(inner, { size, stroke: 2, viewBox: '0 0 48 48' });
}

function action(type) {
  return ACTION_ICONS[type] || '';
}

function diamond(filled) {
  const fill = filled ? 'fill="var(--ink)"' : 'fill="none" stroke="var(--ink-faint)" stroke-width="1"';
  return `<svg class="d" viewBox="0 0 10 10" width="11" height="11"><path d="M5 0L10 5L5 10L0 5Z" ${fill}/></svg>`;
}

function droplet(filled) {
  const fill = filled ? 'fill="var(--rust)"' : 'fill="none" stroke="var(--ink-faint)" stroke-width="1"';
  return `<svg viewBox="0 0 10 12" width="11" height="13"><path d="M5 0C5 0 9.5 6 9.5 8.5A4.5 4.5 0 0 1 0.5 8.5C0.5 6 5 0 5 0Z" ${fill}/></svg>`;
}

function thermometer() {
  return svg('<path d="M12 14V5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0z"/>', { size: 18, stroke: 1.8 });
}

function group() {
  return svg('<circle cx="9" cy="10" r="4"/><circle cx="16" cy="12" r="3.2"/>', { size: 18, stroke: 1.8 });
}

function leaf() {
  return svg('<path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z"/>', { size: 18, stroke: 1.8 });
}

function warning(color = 'var(--stampred)', size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l10 17H2z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="${color}" stroke="none"/></svg>`;
}

function ratingDiamonds(score, max = 5) {
  let out = '';
  for (let i = 1; i <= max; i++) out += diamond(i <= score);
  return `<div class="rating-icons">${out}</div>`;
}

function humidityDroplets(min, max) {
  const avg = (Number(min) + Number(max)) / 2;
  const score = avg >= 80 ? 4 : avg >= 65 ? 3 : avg >= 50 ? 2 : 1;
  let out = '';
  for (let i = 1; i <= 4; i++) out += droplet(i <= score);
  return `<div class="rating-icons">${out}</div>`;
}

module.exports = { nav, species, action, diamond, droplet, thermometer, group, leaf, warning, ratingDiamonds, humidityDroplets };
