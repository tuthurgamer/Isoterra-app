const fs = require('node:fs');
const path = require('node:path');
const db = require('../db/db');
const { getSettings, setSetting } = require('./settings');
const { rotateInBackground, pngSize, thumbPath, UPRIGHT } = require('./icon-image');

// Once: the species icons sent before new uploads were laid down, and that
// show an upright animal (much taller than wide), get the same quarter turn,
// so they fill the app's frames too. Each can be turned back from its
// species form. One at a time, in the background.
const publicDir = path.join(__dirname, '..', 'public');
const originalsDir = path.join(__dirname, '..', 'data', 'icon-originals');

async function layDownUprightIcons() {
  if (getSettings().icones_couchees) return;
  const icons = db.prepare('SELECT id, icon_path FROM species WHERE icon_path IS NOT NULL').all();
  let turned = 0;
  for (const sp of icons) {
    let size = null;
    try { size = pngSize(path.join(publicDir, thumbPath(sp.icon_path))); } catch { /* file missing */ }
    if (!size || size.height <= size.width * UPRIGHT) continue;
    const fresh = await rotateInBackground(sp.icon_path, -1, originalsDir);
    if (!fresh) continue;
    db.prepare('UPDATE species SET icon_path = ? WHERE id = ?').run(fresh, sp.id);
    const old = path.join(publicDir, sp.icon_path);
    for (const f of [old, thumbPath(old), path.join(originalsDir, path.basename(old))]) fs.rm(f, { force: true }, () => {});
    turned++;
  }
  setSetting('icones_couchees', '1');
  if (turned) console.log(`Icônes couchées pour remplir leur cadre : ${turned}`);
}

module.exports = { layDownUprightIcons };
