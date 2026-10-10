const { thumbPath } = require('../../lib/icon-image');

function svg(inner, { size = 21, stroke = 2, viewBox = '0 0 24 24' } = {}) {
  return `<svg viewBox="${viewBox}" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const NAV_ICONS = {
  bacs: svg('<rect x="5" y="8" width="14" height="13" rx="1.5"/><path d="M8 8V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M5 13h14"/>', { stroke: 1.6 }),
  fiches: svg('<path d="M4 6h9l7 7-9 9-7-7z"/><circle cx="8" cy="10" r="1.3"/>', { stroke: 1.6 }),
  especes: svg('<path d="M12 6c-2-1.5-5-2-9-1v13c4-1 7-0.5 9 1c2-1.5 5-2 9-1V5c-4-1-7-0.5-9 1z"/><path d="M12 6v13"/>', { stroke: 1.6 }),
  tournee: svg('<circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.6l5.2 3.4-5.2 3.4z"/>', { stroke: 1.6 }),
  journal: svg('<path d="M19 4c-5 0-11 4-13 11l-1 5 5-1C17 17 21 11 21 6"/><path d="M9 15l-3 3"/>', { stroke: 1.6 }),
  pontes: svg('<ellipse cx="12" cy="13" rx="5" ry="7"/><path d="M4 18c2-2 5-2 8-2s6 0 8 2"/>', { stroke: 1.6 }),
  vente: svg('<path d="M12 3v18M6 21h12"/><path d="M4 7h6M14 7h6"/><path d="M4 7l-2 5a3 3 0 0 0 6 0zM20 7l-2 5a3 3 0 0 0 6 0z"/>', { stroke: 1.6 }),
  photos: svg('<path d="M4 8h3.2l1.8-2.6h6l1.8 2.6H20v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>', { stroke: 1.6 }),
  serveur: svg('<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>', { stroke: 1.6 })
};

const SPECIES_ICONS = {
  iule: '<path d="M6 30 Q 12 16, 20 24 T 34 22 Q 40 20 42 14"/><path d="M9 28 L6 33 M12 25 L9 30 M15 23 L13 29 M19 22 L17 28 M23 22 L22 28 M27 21 L27 27 M31 21 L32 27 M35 20 L37 26 M39 17 L41 22"/><path d="M42 14 L45 11 M42 14 L44 16"/>',
  cloporte: '<path d="M10 24c0-8 6-13 14-13s14 5 14 13-6 13-14 13-14-5-14-13z"/><path d="M12 18h24M10 24h28M12 30h24"/><path d="M8 20l-4-2M8 24l-5 0M8 28l-4 2M40 20l4-2M40 24l5 0M40 28l4 2"/><path d="M20 37l-3 4M28 37l3 4"/>',
  cetoine: '<ellipse cx="24" cy="26" rx="11" ry="15"/><path d="M24 12v29"/><ellipse cx="24" cy="10" rx="5" ry="4"/><path d="M14 18l-7-3M14 26l-8 1M14 34l-7 4M34 18l7-3M34 26l8 1M34 34l7 4"/>',
  escargot: '<circle cx="21" cy="25" r="10"/><path d="M21 25a2 2 0 0 1 4 0a4 4 0 0 1-8 0a6 6 0 0 1 12 0"/><path d="M5 36h30c4 0 6-2 7-6l1-4"/><path d="M43 26l-3-8M43 26l3-8"/><path d="M40 18h.01M46 18h.01"/>',
  blatte: '<path d="M24 15c5.5 0 8.5 6 8.5 13.5S29 42 24 42s-8.5-6-8.5-13.5S18.5 15 24 15z"/><path d="M16.5 22c2-2.6 4.6-3.6 7.5-3.6s5.5 1 7.5 3.6"/><path d="M24 22v20"/><path d="M21.5 15.5C19 10 14 6 6 4M26.5 15.5C29 10 34 6 42 4"/><path d="M16 25l-6-3-3 2M15.5 31l-7 1-2 4M17 37l-5 4v4M32 25l6-3 3 2M32.5 31l7 1 2 4M31 37l5 4v4"/>',
  coleoptere: '<path d="M15 27c0-5 4-8 9-8s9 3 9 8v6c0 6-4 10-9 10s-9-4-9-10z"/><path d="M24 27v16"/><path d="M15.5 26.5c2.5 1 5.5 1.5 8.5 1.5s6-.5 8.5-1.5"/><path d="M20 19.5c0-3 1.8-4.5 4-4.5s4 1.5 4 4.5"/><path d="M24 15c0-4-1-7.5-4-10.5M24 11.5l3-2.5"/><path d="M15.5 30l-7-2-2 3M15 36l-8 2-1 4M18 41l-5 4M32.5 30l7-2 2 3M33 36l8 2 1 4M30 41l5 4"/>',
  crabe: '<path d="M11 28c0-6 6-10 13-10s13 4 13 10-6 8-13 8-13-2-13-8z"/><path d="M20 18v-4M28 18v-4"/><path d="M13 22l-4-6"/><path d="M9 16c-3-1-4-4-3-7 2.5 0 4.5 1.5 5.5 3.5M9 16c0-3 1-5.5 3.5-6.5"/><path d="M35 22l4-6"/><path d="M39 16c3-1 4-4 3-7-2.5 0-4.5 1.5-5.5 3.5M39 16c0-3-1-5.5-3.5-6.5"/><path d="M12 30l-6 2-2 5M14 33l-5 5-1 5M36 30l6 2 2 5M34 33l5 5 1 5"/>',
  reduve: '<path d="M24 21c4.5 0 7.5 4 7.5 10S28.5 43 24 43s-7.5-6-7.5-12 3-10 7.5-10z"/><path d="M17 26c2 1 4.5 1.5 7 1.5s5-.5 7-1.5"/><path d="M24 21v-4"/><ellipse cx="24" cy="13.5" rx="2.3" ry="3.5"/><path d="M24 10V6.5c0-1-1-2-2-2"/><path d="M22.5 11C20 7 16 5 11 5M25.5 11C28 7 32 5 37 5"/><path d="M17.5 28l-8-5-3 2M17 34l-9 2-2 6M19 39l-5 6M30.5 28l8-5 3 2M31 34l9 2 2 6M29 39l5 6"/>',
  mante: '<path d="M19.5 7.5c3 1.3 6 1.3 9 0L24 14z"/><path d="M21 8C19 5 16 3.5 12 3M27 8c2-3 5-4.5 9-5"/><path d="M24 14v10"/><path d="M24 17c-4 0-7.5 1.5-9 5l4 4.5M15 22l-1 3"/><path d="M24 17c4 0 7.5 1.5 9 5l-4 4.5M33 22l1 3"/><path d="M24 24c3.6 0 5.6 4.5 5.6 9.5S27.5 45 24 45s-5.6-6.5-5.6-11.5S20.4 24 24 24z"/><path d="M20.5 26.5l-8 4-2 6M27.5 26.5l8 4 2 6M20 30.5l-6 9M28 30.5l6 9"/>',
  phasme: '<path d="M9 42L35 13"/><path d="M35 13l2.5-2.5"/><path d="M37 11l1.5-7M37 11l7-1.5"/><path d="M31.5 17l-5-5.5-1-5.5M31.5 17l7.5 3 5-1"/><path d="M24.5 25l-8-3-4.5 2M24.5 25l4 7.5-1 5.5"/><path d="M17 33.5l-8-1-3 3.5M17 33.5l3 7.5-1.5 5"/>',
  arachnide: '<ellipse cx="24" cy="32" rx="7" ry="8.5"/><ellipse cx="24" cy="18.5" rx="5" ry="5"/><path d="M22 14l-1.5-4M26 14l1.5-4"/><path d="M20 16.5l-6-6-3.5 1.5M19.2 18.5l-8.5-2-3.5 4M19.3 21l-8 4-2.5 5.5M20.5 22.5l-6 8-1 5.5M28 16.5l6-6 3.5 1.5M28.8 18.5l8.5-2 3.5 4M28.7 21l8 4 2.5 5.5M27.5 22.5l6 8 1 5.5"/>',
  scolopendre: '<rect x="20" y="9" width="8" height="32" rx="4"/><path d="M20 14.5h8M20 19.5h8M20 24.5h8M20 29.5h8M20 34.5h8"/><path d="M20 12l-6-2.5M20 17l-7-.5M20 22l-7 1M20 27l-7 2.5M20 32l-6.5 3.5M20.5 37l-5 4.5M28 12l6-2.5M28 17l7-.5M28 22l7 1M28 27l7 2.5M28 32l6.5 3.5M27.5 37l5 4.5"/><path d="M22 9.5C20 6 18 4.5 14.5 3.5M26 9.5c2-3.5 4-5 7.5-6"/><path d="M22 41l-2 5.5M26 41l2 5.5"/>',
  autre: '<ellipse cx="24" cy="24" rx="12" ry="9"/><path d="M13 19l-6-5m-1 8l-7-2m2 9l-7 3M35 19l6-5m1 8l7-2m-2 9l7 3"/><path d="M9 12c-3-1-6 1-6 4M39 12c3-1 6 1 6 4"/><path d="M18 15l-2-3M30 15l2-3"/>'
};

const ACTION_ICONS = {
  nourrissage: svg('<path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z"/><path d="M5 19c3-6 6-9 11-11"/>', { size: 22, stroke: 1.7 }),
  nettoyage: svg('<path d="M4 20l4-4M4 20h4v-4M20 4l-4 4M20 4h-4v4"/><path d="M9 15l6-6"/>', { size: 22, stroke: 1.7 }),
  pulverisation: svg('<path d="M9 4c2 3 2.6 4.4 2.6 5.8a2.6 2.6 0 1 1-5.2 0C6.4 8.4 7 7 9 4z"/><path d="M16 9c1.6 2.3 2 3.3 2 4.3a2 2 0 1 1-4 0c0-1 .4-2 2-4.3z"/><path d="M4 20c6-1.3 10-1.3 16 0"/>', { size: 22, stroke: 1.7 }),
  ponte: svg('<ellipse cx="12" cy="13" rx="5" ry="7"/><path d="M4 18c2-2 5-2 8-2s6 0 8 2"/>', { size: 22, stroke: 1.7 }),
  observation: svg('<path d="M5 13l4 4L19 7"/>', { size: 22, stroke: 1.7 }),
  vente: svg('<path d="M12 3v18M6 21h12"/><path d="M4 7h6M14 7h6"/><path d="M4 7l-2 5a3 3 0 0 0 6 0zM20 7l-2 5a3 3 0 0 0 6 0z"/>', { size: 22, stroke: 1.7 })
};

function nav(name) {
  return NAV_ICONS[name] || '';
}

// Accepts either a species-like object ({ category, icon_path }) or a bare
// category string (older call sites) — a custom watercolor icon wins when
// the species has one, otherwise falls back to the generic hand-drawn SVG.
// Small sizes use the light "-sm" version of the icon; large sizes are a
// page's main illustration. None waits for the page to be scrolled to it:
// the service worker keeps every icon on the phone, so they arrive with the
// page. Width/height are plain attributes (not inline styles) so a
// context's CSS can resize it, e.g. the large illustration plates.
function species(sp, size = 30) {
  const category = typeof sp === 'string' ? sp : sp && sp.category;
  const iconPath = typeof sp === 'object' && sp ? sp.icon_path : null;
  if (iconPath) {
    const src = size <= 128 ? thumbPath(iconPath) : iconPath;
    return `<img src="${src}" alt="" class="species-icon-img" width="${size}" height="${size}" decoding="async">`;
  }
  const inner = SPECIES_ICONS[category] || SPECIES_ICONS.autre;
  return svg(inner, { size, stroke: 2, viewBox: '0 0 48 48' });
}

// For the icon pickers that stand in for species dropdowns: what an option
// shows, as its custom icon's small file or else its category name, whose
// hand-drawn SVG `categoryIcons()` provides once per page.
function pic(sp) {
  if (!sp) return '';
  return sp.icon_path ? thumbPath(sp.icon_path) : sp.category || 'autre';
}

function categoryIcons(size = 28) {
  return Object.fromEntries(Object.entries(SPECIES_ICONS).map(([cat, inner]) => [cat, svg(inner, { size, stroke: 2, viewBox: '0 0 48 48' })]));
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

function gear(size = 20) {
  return svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', { size, stroke: 1.6 });
}

module.exports = { nav, species, pic, categoryIcons, action, diamond, droplet, thermometer, group, leaf, warning, ratingDiamonds, humidityDroplets, gear };
