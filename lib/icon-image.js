// Prepares uploaded species icons for display: trims the transparent margin
// around the animal (watercolor cut-outs often use only a third of their
// canvas) and produces two web-sized PNGs:
//   <name>.png     — up to 768px, for the large "planche" illustrations
//   <name>-sm.png  — up to 256px, for cards, lists and the tournée
// The untouched upload is kept in a private folder so icons can be
// re-processed later without asking for the files again.

const fs = require('node:fs');
const path = require('node:path');
const { Worker, isMainThread, workerData } = require('node:worker_threads');
const { PNG } = require('pngjs');

const LARGE_SIDE = 768;
const SMALL_SIDE = 256;
const ALPHA_MIN = 32;   // ignores the faint speckles background removal leaves behind
const MIN_PIXELS = 3;   // a row/column needs a few solid pixels to count as content
const PADDING = 0.03;   // breathing room kept around the animal

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

// `filePath` is the upload multer just saved. It is replaced in place by the
// large version, its "-sm" sibling is created next to it, and the original
// is copied into `originalsDir`. Anything pngjs can't decode (JPEG, WebP...)
// is served as-is, with a plain copy as its "-sm" version so the naming
// convention always holds.
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
  fs.writeFileSync(filePath, PNG.sync.write(cropAndResize(png, box, LARGE_SIDE)));
  fs.writeFileSync(thumbPath(filePath), PNG.sync.write(cropAndResize(png, box, SMALL_SIDE)));
}

// The same work in a worker thread: it takes seconds on the Pi, and the app
// must keep answering meanwhile (a frozen app makes one tap again or leave,
// which cancels the photos still being sent).
function processIconInBackground(filePath, originalsDir) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData: { filePath, originalsDir } });
    worker.once('error', reject);
    worker.once('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Traitement de l'icône interrompu (code ${code})`))));
  });
}

if (!isMainThread && workerData && workerData.filePath) {
  processIcon(workerData.filePath, workerData.originalsDir);
}

module.exports = { processIcon, processIconInBackground, thumbPath };
