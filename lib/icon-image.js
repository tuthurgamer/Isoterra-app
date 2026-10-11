// Prepares uploaded species icons for display: trims the transparent margin
// around the animal (watercolor cut-outs often use only a third of their
// canvas) and produces two web-sized PNGs:
//   <name>.png     — up to 768px, for the large "planche" illustrations
//   <name>-sm.png  — up to 256px, for cards, lists and the tournée
// The untouched upload is kept in a private folder so icons can be
// re-processed later without asking for the files again.
// Every frame of the app is wider than tall: an animal photographed upright
// (seen from above, head up) is laid down a quarter turn so it fills them.
// The species form can turn an icon again (rotateStored).

const fs = require('node:fs');
const path = require('node:path');
const { Worker, isMainThread, workerData, parentPort } = require('node:worker_threads');
const { PNG } = require('pngjs');

const LARGE_SIDE = 768;
const SMALL_SIDE = 256;
const ALPHA_MIN = 32;   // ignores the faint speckles background removal leaves behind
const MIN_PIXELS = 3;   // a row/column needs a few solid pixels to count as content
const PADDING = 0.03;   // breathing room kept around the animal
const UPRIGHT = 1.25;   // taller than wide by this much: laid down

const publicDir = path.join(__dirname, '..', 'public');

function thumbPath(filePath) {
  return filePath.replace(/(\.[a-z0-9]+)$/i, '-sm$1');
}

function contentBox({ width, height, data }) {
  const cols = new Uint32Array(width);
  const rows = new Uint32Array(height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] >= ALPHA_MIN) { cols[x]++; rows[y]++; }
    }
  }
  const first = (counts) => counts.findIndex((n) => n >= MIN_PIXELS);
  const last = (counts) => counts.length - 1 - [...counts].reverse().findIndex((n) => n >= MIN_PIXELS);

  let x0 = first(cols), y0 = first(rows);
  if (x0 < 0 || y0 < 0) return { x: 0, y: 0, w: width, h: height }; // nothing solid: keep it all
  let x1 = last(cols), y1 = last(rows);

  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * PADDING);
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad);
  y1 = Math.min(height - 1, y1 + pad);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const clamp = (v) => (v <= 0 ? 0 : v >= 255 ? 255 : Math.round(v));

// Crops `box` out of `src` and scales it so its longest side is at most
// `maxSide`, averaging every source pixel a destination pixel covers.
// Colours are premultiplied by alpha while averaging, so the colours that
// hide in fully transparent pixels never bleed into the edges as fringes.
function cropAndResize(src, box, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(box.w, box.h));
  const dw = Math.max(1, Math.round(box.w * scale));
  const dh = Math.max(1, Math.round(box.h * scale));
  const out = new PNG({ width: dw, height: dh });
  out.data.fill(0);

  if (dw === box.w && dh === box.h) {
    for (let y = 0; y < dh; y++) {
      const from = ((box.y + y) * src.width + box.x) * 4;
      src.data.copy(out.data, y * dw * 4, from, from + dw * 4);
    }
    return out;
  }

  const sw = box.w, sh = box.h;
  const pre = new Float32Array(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = ((box.y + y) * src.width + box.x + x) * 4;
      const o = (y * sw + x) * 4;
      const a = src.data[i + 3];
      pre[o] = src.data[i] * a;
      pre[o + 1] = src.data[i + 1] * a;
      pre[o + 2] = src.data[i + 2] * a;
      pre[o + 3] = a;
    }
  }

  const fx = sw / dw;
  const tmp = new Float32Array(dw * sh * 4);
  for (let dx = 0; dx < dw; dx++) {
    const start = dx * fx, end = start + fx;
    for (let sx = Math.floor(start); sx < end && sx < sw; sx++) {
      const w = Math.min(end, sx + 1) - Math.max(start, sx);
      if (w <= 0) continue;
      for (let y = 0; y < sh; y++) {
        const s = (y * sw + sx) * 4, t = (y * dw + dx) * 4;
        tmp[t] += pre[s] * w;
        tmp[t + 1] += pre[s + 1] * w;
        tmp[t + 2] += pre[s + 2] * w;
        tmp[t + 3] += pre[s + 3] * w;
      }
    }
  }

  const fy = sh / dh;
  const acc = new Float32Array(dw * dh * 4);
  for (let dy = 0; dy < dh; dy++) {
    const start = dy * fy, end = start + fy;
    for (let sy = Math.floor(start); sy < end && sy < sh; sy++) {
      const w = Math.min(end, sy + 1) - Math.max(start, sy);
      if (w <= 0) continue;
      for (let x = 0; x < dw; x++) {
        const s = (sy * dw + x) * 4, t = (dy * dw + x) * 4;
        acc[t] += tmp[s] * w;
        acc[t + 1] += tmp[s + 1] * w;
        acc[t + 2] += tmp[s + 2] * w;
        acc[t + 3] += tmp[s + 3] * w;
      }
    }
  }

  const area = fx * fy;
  for (let i = 0; i < dw * dh; i++) {
    const o = i * 4;
    const alphaSum = acc[o + 3];
    if (alphaSum <= 0) continue; // stays fully transparent (buffer is zeroed)
    out.data[o] = clamp(acc[o] / alphaSum);
    out.data[o + 1] = clamp(acc[o + 1] / alphaSum);
    out.data[o + 2] = clamp(acc[o + 2] / alphaSum);
    out.data[o + 3] = clamp(alphaSum / area);
  }
  return out;
}

// A quarter turn of a picture: `turns` 1 clockwise, -1 counter-clockwise,
// 2 upside down.
function rotatePng(src, turns) {
  const t = ((turns % 4) + 4) % 4;
  if (!t) return src;
  const { width: w, height: h } = src;
  const out = new PNG({ width: t === 2 ? w : h, height: t === 2 ? h : w });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = t === 1 ? h - 1 - y : t === 2 ? w - 1 - x : y;
      const ny = t === 1 ? x : t === 2 ? h - 1 - y : w - 1 - x;
      const i = (y * w + x) * 4;
      src.data.copy(out.data, (ny * out.width + nx) * 4, i, i + 4);
    }
  }
  return out;
}

// `filePath` is the upload multer just saved. It is replaced in place by the
// large version, its "-sm" sibling is created next to it, and the original
// is copied into `originalsDir`. An upright animal is laid down (head up
// becomes head left). Anything pngjs can't decode (JPEG, WebP...) is served
// as-is, with a plain copy as its "-sm" version so the naming convention
// always holds.
function processIcon(filePath, originalsDir) {
  fs.mkdirSync(originalsDir, { recursive: true });
  fs.copyFileSync(filePath, path.join(originalsDir, path.basename(filePath)));

  let png;
  try {
    png = PNG.sync.read(fs.readFileSync(filePath));
  } catch {
    fs.copyFileSync(filePath, thumbPath(filePath));
    return;
  }

  const box = contentBox(png);
  const turns = box.h > box.w * UPRIGHT ? -1 : 0;
  fs.writeFileSync(filePath, PNG.sync.write(rotatePng(cropAndResize(png, box, LARGE_SIDE), turns)));
  fs.writeFileSync(thumbPath(filePath), PNG.sync.write(rotatePng(cropAndResize(png, box, SMALL_SIDE), turns)));
}

// A stored icon ("/uploads/species-icons/x.png") turned a quarter: written
// under a new name (phones keep icons forever under their address), its
// original copied along. Returns the new address, or null for an icon that
// isn't a PNG. The old files are left to the caller.
function rotateStored(iconPath, turns, originalsDir) {
  const file = path.join(publicDir, iconPath);
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.png') return null;
  const fresh = path.join(path.dirname(file), `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  try {
    for (const [from, to] of [[file, fresh], [thumbPath(file), thumbPath(fresh)]]) {
      fs.writeFileSync(to, PNG.sync.write(rotatePng(PNG.sync.read(fs.readFileSync(from)), turns)));
    }
  } catch {
    for (const f of [fresh, thumbPath(fresh)]) fs.rmSync(f, { force: true });
    return null;
  }
  const original = path.join(originalsDir, path.basename(file));
  if (fs.existsSync(original)) fs.copyFileSync(original, path.join(originalsDir, path.basename(fresh)));
  return '/uploads/species-icons/' + path.basename(fresh);
}

// Width and height of a PNG, from its header alone (null if not a PNG).
function pngSize(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const head = Buffer.alloc(24);
    fs.readSync(fd, head, 0, 24, 0);
    if (head.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } finally {
    fs.closeSync(fd);
  }
}

// The same work in a worker thread: it takes seconds on the Pi, and the app
// must keep answering meanwhile (a frozen app makes one tap again or leave,
// which cancels the photos still being sent).
function inWorker(task) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData: task });
    let answer = null;
    worker.once('message', (m) => { answer = m; });
    worker.once('error', reject);
    worker.once('exit', (code) => (code === 0 ? resolve(answer) : reject(new Error(`Traitement de l'icône interrompu (code ${code})`))));
  });
}

function processIconInBackground(filePath, originalsDir) {
  return inWorker({ task: 'process', filePath, originalsDir });
}

function rotateInBackground(iconPath, turns, originalsDir) {
  return inWorker({ task: 'rotate', iconPath, turns, originalsDir });
}

if (!isMainThread && workerData && workerData.task === 'process') {
  processIcon(workerData.filePath, workerData.originalsDir);
} else if (!isMainThread && workerData && workerData.task === 'rotate') {
  parentPort.postMessage(rotateStored(workerData.iconPath, workerData.turns, workerData.originalsDir));
}

module.exports = { processIcon, processIconInBackground, rotateInBackground, pngSize, thumbPath, UPRIGHT };
