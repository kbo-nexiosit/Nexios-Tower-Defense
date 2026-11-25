import { Pix, shadeHex } from './pixel.js';

// The whole town is pre-rendered once into a 640x360 pixel texture, shown at 2x.
// Everything is painted into a plain RGB buffer first (ground, props, shadows, then a
// dithered lighting pass), so the result is one upload and stays crisp pixel art.
const W = 640, H = 360, S = 2;

function rng(seed) {   // small deterministic PRNG (mulberry32)
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hexRGB = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const clamp = v => (v < 0 ? 0 : v > 255 ? 255 : v);

// Smooth value noise in 0..1 (for patchy grass instead of TV static).
function hash2(x, y, seed) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, size, seed) {
  const gx = Math.floor(x / size), gy = Math.floor(y / size);
  let fx = x / size - gx, fy = y / size - gy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash2(gx, gy, seed), b = hash2(gx + 1, gy, seed), c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
// 4x4 ordered dither threshold in 0..1, for banded light and colour steps.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// A W x H RGB paint buffer.
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  px(x, y, c) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255; }
  get(x, y) { const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2]]; }
  mul(x, y, f) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.d[i] *= f; this.d[i + 1] *= f; this.d[i + 2] *= f; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  stamp(pix, ox, oy) { for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) { const c = pix.get(x, y); if (c) this.px(ox + x, oy + y, hexRGB(c)); } }
  // Soft-edged ground shadow.
  shadow(cx, cy, rx, ry, f = 0.55) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) this.mul(x, y, d > 0.6 && bayer(x, y) > 0.5 ? 1 - (1 - f) * 0.5 : f);
    }
  }
  // Dithered light pools: each light is { x, y, r, col: [r,g,b], k }.
  light(lights) {
    for (const L of lights) {
      const x0 = Math.max(0, Math.floor(L.x - L.r)), x1 = Math.min(this.w - 1, Math.ceil(L.x + L.r));
      const y0 = Math.max(0, Math.floor(L.y - L.r)), y1 = Math.min(this.h - 1, Math.ceil(L.y + L.r));
      const k = L.k ?? 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - L.x, (y + 0.5 - L.y) * (L.squash ?? 1)) / L.r;
        if (d >= 1) continue;
        const f = (1 - d) * (1 - d), steps = 6;
        const lv = Math.min(steps, Math.floor(f * steps + bayer(x, y))) / steps * k;
        if (lv <= 0) continue;
        const i = (y * this.w + x) * 4;
        for (let c = 0; c < 3; c++) { const n = L.col[c] / 255; this.d[i + c] = clamp(this.d[i + c] * (1 + 1.5 * lv * n) + 20 * lv * n); }
      }
    }
  }
  toTexture(scene, key) {
    const tex = scene.textures.createCanvas(key, this.w, this.h);
    const ctx = tex.getContext();
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.d);
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    return tex;
  }
}

const WARM = [255, 205, 130], COOL = [150, 190, 255], RED = [255, 60, 70];

// --- Props -------------------------------------------------------------------

// A 30x30 clapboard house seen from the front-top. Lit windows are listed in p.lit.
function house(r, roofCol, wallCol, kind = 0) {
  const p = new Pix(30, 30);
  const roofL = shadeHex(roofCol, 1.2), roofD = shadeHex(roofCol, 0.72), wallD = shadeHex(wallCol, 0.82);
  // chimney (behind the roof)
  const chx = kind === 1 ? 6 : 21;
  p.rect(chx, 0, 4, 7, '#6a4a44').rect(chx, 0, 4, 1, '#8a6a60').rect(chx + 3, 1, 1, 6, '#4a3230');
  // gabled roof with staggered shingles
  for (let y = 2; y < 15; y++) {
    const inset = Math.max(0, 7 - (y - 2));
    for (let x = inset; x < 30 - inset; x++) {
      const row = (y - 2) % 3, tick = (x + (Math.floor((y - 2) / 3) % 2) * 3) % 6 === 0;
      p.set(x, y, row === 2 ? roofD : tick ? roofD : (y < 6 ? roofL : roofCol));
    }
  }
  p.rect(0, 15, 30, 1, shadeHex(roofCol, 0.5));                       // eave shadow
  // wall with siding
  p.rect(2, 16, 26, 12, wallCol);
  for (let y = 18; y < 28; y += 3) p.rect(2, y, 26, 1, wallD);
  p.rect(2, 16, 26, 1, shadeHex(wallCol, 0.6));
  p.rect(2, 27, 26, 1, '#4a4650');                                    // foundation
  p.rect(2, 16, 1, 12, shadeHex(wallCol, 1.15)).rect(27, 16, 1, 12, shadeHex(wallCol, 0.7));
  // door + step
  const dx = kind === 2 ? 5 : 13;
  p.rect(dx - 1, 19, 6, 9, shadeHex(wallCol, 1.25)).rect(dx, 20, 4, 8, '#4a2a1a').rect(dx, 20, 4, 1, '#6a3e24').set(dx + 3, 24, '#e0b040');
  p.rect(dx - 1, 28, 6, 1, '#6a6670');
  // windows
  p.lit = [];
  const wins = kind === 2 ? [[13, 19], [21, 19]] : [[4, 19], [21, 19]];
  for (const [wx, wy] of wins) {
    const lit = r() < 0.62;
    p.rect(wx - 1, wy - 1, 7, 7, shadeHex(wallCol, 1.3));
    p.rect(wx, wy, 5, 5, lit ? '#ffcf6a' : '#1a2636');
    if (lit) { p.rect(wx + 1, wy + 1, 3, 2, '#fff0b4'); p.lit.push([wx + 2, wy + 6]); }
    else p.set(wx + 1, wy + 1, '#3a5676').set(wx + 2, wy + 1, '#2a4460');
    p.rect(wx + 2, wy, 1, 5, '#3a2a22').rect(wx, wy + 2, 5, 1, '#3a2a22');
    p.rect(wx - 1, wy + 5, 7, 1, shadeHex(wallCol, 0.6));
  }
  // attic vent
  p.rect(14, 8, 2, 2, '#1a1418');
  return p.outline();
}

function tree(kind, r) {
  if (kind === 0) {   // round oak
    const p = new Pix(18, 22);
    p.rect(8, 15, 2, 6, '#4a2e1a').set(7, 20, '#4a2e1a').set(10, 20, '#3a2214').rect(9, 15, 1, 6, '#3a2214');
    const d = '#173a26', m = '#22553a', l = '#2f7049', h = '#4a9460';
    p.ellipse(9, 9, 8, 7.5, d);
    p.ellipse(8, 8, 6.5, 6, m);
    p.ellipse(6.5, 6, 4, 3.4, l);
    p.ellipse(12, 7, 2.6, 2.2, l);
    [[5, 4], [6, 5], [4, 6], [12, 6], [8, 3]].forEach(([x, y]) => p.set(x, y, h));
    for (let i = 0; i < 9; i++) { const x = 3 + Math.floor(r() * 12), y = 8 + Math.floor(r() * 7); if (p.get(x, y)) p.set(x, y, d); }
    return p.outline();
  }
  const p = new Pix(14, 24);   // layered pine
  p.rect(6, 20, 2, 4, '#4a2e1a');
  const d = '#12301f', m = '#1b4a30', l = '#2a6a42';
  [[1, 7, 3], [6, 13, 5], [11, 20, 7]].forEach(([y0, y1, wMax]) => {
    for (let y = y0; y <= y1; y++) {
      const w = Math.max(1, Math.round((y - y0 + 1) / (y1 - y0 + 1) * wMax));
      p.rect(7 - w, y, w * 2, 1, y === y1 ? d : m);
      p.set(7 - w, y, l); if (w > 2) p.set(7 - w + 1, y, l);
      p.set(6 + w, y, d);
    }
  });
  p.set(6, 0, l).set(7, 0, m);
  return p.outline();
}

function car(r) {
  const cols = ['#8a2a2a', '#2a4a7a', '#7a6a3a', '#4a6a4a', '#6a4a7a', '#8a8a92'];
  const body = cols[Math.floor(r() * cols.length)];
  const p = new Pix(11, 19);                                           // top-down, nose up
  p.rect(1, 0, 9, 19, body);
  p.rect(1, 0, 9, 1, shadeHex(body, 1.3)).rect(1, 18, 9, 1, shadeHex(body, 0.6));
  p.rect(2, 4, 7, 3, '#7ab0e0').rect(2, 4, 7, 1, '#b0d8f8');          // windshield
  p.rect(2, 7, 7, 6, shadeHex(body, 1.2));                            // roof
  p.rect(2, 13, 7, 2, '#3a5a78');                                     // rear window
  p.rect(0, 2, 1, 4, '#101014').rect(10, 2, 1, 4, '#101014').rect(0, 13, 1, 4, '#101014').rect(10, 13, 1, 4, '#101014');
  p.set(2, 0, '#fff6a0').set(8, 0, '#fff6a0').set(2, 18, '#c8231e').set(8, 18, '#c8231e');
  return p.outline();
}

function lamp() {
  const p = new Pix(7, 16);
  p.rect(3, 4, 1, 12, '#4a4a58').rect(2, 15, 3, 1, '#3a3a44');
  p.rect(1, 1, 5, 1, '#5a5a68').rect(0, 2, 7, 1, '#4a4a58').rect(1, 3, 5, 1, '#fff2c4').set(3, 3, '#ffffff');
  return p.outline();
}

function office(w, h) {
  const p = new Pix(w, h);
  const floors = 4, fh = Math.floor((h - 10) / floors);
  p.rect(0, 0, w, h, '#18202c');
  p.rect(0, 0, w, 6, '#2e3746').rect(0, 0, w, 1, '#4a5466').rect(0, 5, w, 1, '#1a212c');   // roof parapet
  p.rect(10, 1, 8, 4, '#566070').rect(11, 2, 6, 1, '#7a8696');                               // rooftop units
  p.rect(w - 24, 1, 12, 4, '#566070').rect(w - 22, 2, 2, 2, '#2a3240').rect(w - 18, 2, 2, 2, '#2a3240');
  const r = rng(77);
  const pw0 = Math.floor((w - 4) / 6);
  for (let f = 0; f < floors; f++) {
    const y0 = 6 + f * fh;
    p.rect(0, y0, w, 2, '#d0dae4').rect(0, y0 + 1, w, 1, '#9aa6b6');   // floor slab
    for (let c = 0; c < 6; c++) {
      const x0 = 2 + c * pw0, pw = pw0 - 2;
      const warm = r() < 0.3;
      for (let y = 0; y < fh - 3; y++) {
        const k = y / (fh - 3);
        p.rect(x0, y0 + 2 + y, pw, 1, warm ? shadeHex('#ffd27a', 1 - k * 0.35) : shadeHex('#4f9fe8', 1.08 - k * 0.62));
      }
      if (warm) {
        if (r() < 0.6) p.rect(x0 + 3, y0 + fh - 9, 3, 6, '#5a3a2a').ellipse(x0 + 4.5, y0 + fh - 10, 1.6, 1.6, '#5a3a2a');   // someone working late
        p.rect(x0 + pw - 5, y0 + fh - 6, 4, 3, '#8a6a3a').rect(x0 + pw - 4, y0 + fh - 8, 2, 2, '#cfe8ff');                  // desk + monitor
      } else {
        p.line(x0 + 1, y0 + fh - 3, x0 + pw - 2, y0 + 3, '#c8ecff').line(x0 + 4, y0 + fh - 3, x0 + pw - 1, y0 + 6, '#8fd0ff');   // reflections
      }
      p.rect(x0 + pw, y0 + 2, 2, fh - 3, '#aab6c4').rect(x0 + pw + 1, y0 + 2, 1, fh - 3, '#7c8898');                       // mullion
    }
  }
  const base = 6 + floors * fh;
  p.rect(0, base, w, h - base, '#3a4352').rect(0, base, w, 1, '#d0dae4');   // plinth
  p.rect(0, 6, 2, h - 6, '#aab6c4').rect(w - 2, 6, 2, h - 6, '#6a7684');
  // entrance on the maze side (left), glowing, under a small canopy
  const ey = Math.floor(h * 0.44);
  p.rect(0, ey - 3, 9, 2, '#d0dae4').rect(0, ey - 1, 9, 1, '#6a7684');
  p.rect(0, ey, 5, 14, '#ffe6a8').rect(1, ey + 1, 3, 12, '#fff6d8').rect(2, ey, 1, 14, '#c8a868');
  return p.outline();
}

function mediaBlock(w, h) {
  const p = new Pix(w, h);
  p.rect(0, 0, w, h, '#4c505c');
  for (let y = 18; y < h; y += 4) p.rect(0, y, w, 1, '#454954');     // concrete panels
  p.rect(0, 0, w, 14, '#23262e').rect(0, 0, w, 1, '#3a3e48');        // sign band (label added in game)
  p.rect(0, 14, w, 2, '#c8231e').rect(0, 14, w, 1, '#ee3a30');       // red accent stripe
  const r = rng(91);
  for (let row = 0; row < 6; row++) for (let c = 0; c < 6; c++) {
    const x = 5 + c * 13, y = 21 + row * 12;
    if (x + 9 > w - 2 || y + 8 > h - 2) continue;
    const v = r(), col = v < 0.2 ? '#ffd27a' : v < 0.32 ? '#6ab4ff' : '#1a1e26';   // warm lamps and blue TV glow
    p.rect(x - 1, y - 1, 11, 9, '#383c46');
    p.rect(x, y, 9, 7, col);
    if (v >= 0.32) p.set(x + 1, y + 1, '#33404e').set(x + 2, y + 1, '#2a3440');
    else p.rect(x + 1, y + 1, 4, 2, shadeHex(col, 1.2));
    p.rect(x + 4, y, 1, 7, '#383c46');
    p.rect(x - 1, y + 8, 11, 1, '#6e7280');
  }
  p.rect(0, 16, 1, h - 16, '#666a78').rect(w - 1, 16, 1, h - 16, '#383c46');
  return p.outline();
}

// --- Ground ------------------------------------------------------------------

const GRASS = ['#0f1f19', '#13251c', '#172c20', '#1b3324', '#203b28'].map(hexRGB);
const DIRT = ['#1d2018', '#22251b'].map(hexRGB);

function grassAt(x, y) {
  const n = vnoise(x, y, 46, 11) * 0.55 + vnoise(x, y, 17, 23) * 0.3 + vnoise(x, y, 6, 37) * 0.15;
  const band = Math.max(0, Math.min(GRASS.length - 1, Math.floor((n - 0.22) * 8.2 + bayer(x, y) * 0.9)));
  return GRASS[band];
}

// Maze version: a moonlit meadow with a faint grid, fixed houses (2x2) and trees (1x1) as
// obstacles, and the office park on the right. Light pools are baked in.
export function makeMazeGround(scene, maze, { office: of, media: md }) {
  if (scene.textures.exists('maze-ground')) return;
  const b = new Buf(W, H);
  const r = rng(1984);
  const cellA = maze.cell / S, x0 = maze.x0 / S, y0 = maze.y0 / S;
  const fieldW = maze.cols * cellA, fieldH = maze.rows * cellA;
  const [sc, sr] = maze.spawn, [gc, gr] = maze.goal;
  const sx = x0 + sc * cellA + cellA / 2, sy = y0 + sr * cellA + cellA / 2;
  const gy = y0 + gr * cellA + cellA / 2;
  const paveX = x0 + fieldW + 1;                                       // office park starts here
  const lights = [];

  // Grass, bare patches and the build grid.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = grassAt(x, y);
    const bare = vnoise(x, y, 30, 51) * 0.7 + vnoise(x, y, 9, 63) * 0.3;
    if (bare > 0.8 + bayer(x, y) * 0.06) c = DIRT[(x * 7 + y * 3) % 2];
    const fx = x - x0, fy = y - y0;
    if (fx >= 0 && fy >= 0 && fx <= fieldW && fy <= fieldH) {
      const checker = (Math.floor(fx / cellA) + Math.floor(fy / cellA)) % 2;
      if (checker) c = c.map(v => v + 3);
      if (fx % cellA === 0 || fy % cellA === 0) c = c.map(v => v + 7);          // faint grid lines
      if (fx % cellA === 0 && fy % cellA === 0) c = c.map(v => v + 8);          // brighter corner pips
    }
    b.px(x, y, c);
  }
  // Tufts, flowers and pebbles.
  const onField = (x, y) => x < paveX - 2;
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(r() * W), y = 30 + Math.floor(r() * (H - 30));
    if (!onField(x, y)) continue;
    const col = hexRGB(r() < 0.5 ? '#2a4e30' : '#346038');
    b.px(x, y, col); b.px(x - 1, y - 1, col); if (r() < 0.6) b.px(x + 1, y - 1, col); if (r() < 0.3) b.px(x, y - 2, hexRGB('#3e7040'));
  }
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(r() * W), y = 30 + Math.floor(r() * (H - 30));
    if (!onField(x, y)) continue;
    const v = r();
    b.px(x, y, hexRGB(v < 0.45 ? '#c9b860' : v < 0.75 ? '#b8c4d0' : '#b0688c'));
    b.px(x, y + 1, hexRGB('#2a4e30'));
  }
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * W), y = 30 + Math.floor(r() * (H - 30));
    if (!onField(x, y)) continue;
    b.px(x, y, hexRGB('#4a5058')); b.px(x + 1, y, hexRGB('#363a42')); if (r() < 0.5) b.px(x, y - 1, hexRGB('#5c626c'));
  }

  // Scorched, cracked earth around the Rift.
  for (let y = Math.floor(sy - 44); y < sy + 44; y++) for (let x = 0; x < sx + 44; x++) {
    const d = Math.hypot(x - sx, (y - sy) * 0.72) / 40;
    if (d < 1 && bayer(x, y) < (1 - d) * 1.5) b.px(x, y, hexRGB(d < 0.45 ? '#1c0c10' : '#231216'));
  }
  for (let k = 0; k < 11; k++) {
    let a = -1.35 + k * 0.27 + (r() - 0.5) * 0.2, x = sx + 2, y = sy;
    const len = 16 + Math.floor(r() * 26);
    for (let s = 0; s < len; s++) {
      x += Math.cos(a); y += Math.sin(a) * 1.1; a += (r() - 0.5) * 0.7;
      b.px(Math.round(x), Math.round(y), hexRGB(s < len * 0.45 ? '#b01c30' : '#5a0c18'));
      if (s < len * 0.3) b.px(Math.round(x), Math.round(y) + 1, hexRGB('#3a060e'));
    }
  }
  lights.push({ x: sx, y: sy, r: 58, col: RED, k: 0.9, squash: 0.75 });

  // Office park: paving, kerb, a path to the door and a small car park.
  const tile = ['#2b2c35', '#2e2f39', '#282932'].map(hexRGB);
  for (let y = 0; y < H; y++) for (let x = paveX; x < W; x++) {
    let c = tile[Math.floor(hash2(Math.floor(x / 8), Math.floor(y / 8), 5) * 3)];
    if ((x - paveX) % 8 === 0 || y % 8 === 0) c = hexRGB('#22232b');
    if (hash2(x, y, 9) < 0.03) c = c.map(v => v + 8);
    b.px(x, y, c);
  }
  b.rect(paveX - 1, 0, 2, H, hexRGB('#5a5c6a')); b.rect(paveX + 1, 0, 1, H, hexRGB('#1c1d24'));
  const ox = Math.round(of.x / S), oy = Math.round(of.y / S), ow = Math.round(of.w / S), oh = Math.round(of.h / S);
  const mx = Math.round(md.x / S), my = Math.round(md.y / S), mw = Math.round(md.w / S), mh = Math.round(md.h / S);
  // worn stepping-stone path from the last maze square to the entrance
  for (let x = x0 + gc * cellA; x < ox; x++) for (let y = Math.round(gy) - 7; y <= Math.round(gy) + 7; y++) {
    if (x >= paveX - 1) b.px(x, y, hexRGB(((x >> 2) + (y >> 2)) % 2 ? '#4a4b58' : '#424350'));
    else if (bayer(x, y) < 0.7) b.px(x, y, DIRT[(x + y) % 2]);
  }
  // car park below the office
  const py = oy + oh + 10;
  for (let k = 0; k < 6; k++) { const lx = ox + 4 + k * 15; if (lx < W - 3) b.rect(lx, py, 1, 24, hexRGB('#9a9484')); }
  [0, 2, 3].forEach(k => { const c = car(r); b.shadow(ox + 13 + k * 15, py + 22, 6, 3); b.stamp(c, ox + 7 + k * 15, py + 2); });

  // Obstacles.
  const roofs = ['#7a3030', '#3e3a6a', '#2e5a42', '#6a5230', '#4a4a56'], walls = ['#a89878', '#8490a4', '#9a7c72', '#86987e', '#b0a8a0'];
  maze.houses.forEach(([c, rr], n) => {
    const hx = x0 + c * cellA + 1, hy = y0 + rr * cellA + 1;
    const hs = house(r, roofs[n % roofs.length], walls[(n * 3) % walls.length], n % 3);
    b.shadow(hx + 17, hy + 29, 16, 3.5);
    b.stamp(hs, hx, hy);
    hs.lit.forEach(([lx, ly]) => lights.push({ x: hx + lx + 0.5, y: hy + ly + 6, r: 24, col: WARM, k: 0.6, squash: 1.3 }));
  });
  maze.trees.forEach(([c, rr], n) => {
    const t = tree(n % 3 === 0 ? 1 : 0, r);
    const tx = x0 + c * cellA + Math.floor((cellA - t.w) / 2), ty = y0 + rr * cellA + cellA - t.h;
    b.shadow(tx + t.w / 2 + 2, ty + t.h - 1, t.w / 2 - 1, 2.5);
    b.stamp(t, tx, ty);
  });

  // Buildings and street lamps.
  b.shadow(ox + ow / 2 + 3, oy + oh + 1, ow / 2, 3); b.shadow(mx + mw / 2 + 3, my + mh + 1, mw / 2, 3);
  b.stamp(office(ow, oh), ox, oy);
  b.stamp(mediaBlock(mw, mh), mx, my);
  lights.push({ x: ox - 2, y: oy + Math.floor(oh * 0.44) + 8, r: 46, col: WARM, k: 1 });
  [44, 132, 282, 344].forEach(ly => {
    const lx = paveX + 3;
    b.stamp(lamp(), lx - 3, ly - 15);
    lights.push({ x: lx + 0.5, y: ly + 2, r: 42, col: WARM, k: 0.95, squash: 1.2 });
  });
  lights.push({ x: mx + mw / 2, y: my + mh + 6, r: 30, col: COOL, k: 0.35 });
  b.light(lights);
  b.toTexture(scene, 'maze-ground');
}

// Title backdrop: a moonlit skyline behind the standoff.
export function makeTitleBackdrop(scene) {
  if (scene.textures.exists('title-bg')) return;
  const b = new Buf(W, H);
  const r = rng(11);
  const sky = ['#05050c', '#080814', '#0c0b1e', '#120f28', '#1a1230', '#241536', '#30183a'].map(hexRGB);
  const horizon = 300;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.min(0.999, Math.max(0, y / horizon)) * (sky.length - 1);
    b.px(x, y, sky[Math.min(sky.length - 1, Math.floor(t + bayer(x, y) * 0.999))]);
  }
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * 250), v = r();
    b.px(x, y, hexRGB(v < 0.6 ? '#5a5a7a' : v < 0.9 ? '#a8a8c8' : '#ffffff'));
  }
  // moon with a soft halo
  const mx = 520, my = 62;
  b.light([{ x: mx, y: my, r: 70, col: [190, 200, 255], k: 0.8 }]);
  for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d < 15) b.px(mx + x, my + y, hexRGB(Math.hypot(x + 6, y + 5) < 4.5 || Math.hypot(x - 5, y - 6) < 3 || Math.hypot(x - 7, y + 4) < 2 ? '#c4c8d8' : d > 13 ? '#d8dcea' : '#eef0f8'));
  }
  // far tree line, then town silhouettes with a few lit windows
  const far = hexRGB('#0d0b1a'), near = hexRGB('#070610');
  for (let x = 0; x < W; x++) {
    const h = 20 + vnoise(x, 0, 14, 3) * 22 + vnoise(x, 0, 4, 7) * 8;
    for (let y = Math.floor(horizon - h); y < horizon; y++) b.px(x, y, far);
  }
  const lights = [];
  for (let x = 6; x < W - 30;) {
    const w = 22 + Math.floor(r() * 22), h = 18 + Math.floor(r() * 26), top = horizon - h;
    b.rect(x, top, w, h, near);
    if (r() < 0.6) for (let k = 0; k < w / 2 + 2; k++) b.rect(x - 2 + k, top - k - 1 + Math.max(0, 0), w + 4 - k * 2, 1, near);   // pitched roof
    else b.rect(x + 3, top - 5, 3, 5, near);
    for (let wy = top + 5; wy < horizon - 6; wy += 8) for (let wx = x + 4; wx < x + w - 5; wx += 8) {
      if (r() < 0.28) { b.rect(wx, wy, 3, 4, hexRGB('#ffcf6a')); b.px(wx + 1, wy + 1, hexRGB('#fff0b4')); lights.push({ x: wx + 1.5, y: wy + 2, r: 12, col: WARM, k: 0.5 }); }
    }
    x += w + 4 + Math.floor(r() * 26);
  }
  // water tower
  b.rect(96, horizon - 58, 2, 58, near); b.rect(116, horizon - 58, 2, 58, near); b.rect(92, horizon - 76, 30, 20, near);
  for (let k = 0; k < 8; k++) b.rect(92 + k, horizon - 77 - k, 30 - k * 2, 1, near);
  b.px(107, horizon - 86, hexRGB('#ff3040'));
  lights.push({ x: 107, y: horizon - 86, r: 10, col: RED, k: 1 });
  // meadow in front
  for (let y = horizon; y < H; y++) for (let x = 0; x < W; x++) b.px(x, y, grassAt(x, y * 2).map(v => v * 0.8));
  b.rect(0, horizon, W, 1, hexRGB('#2a4e30'));
  for (let i = 0; i < 260; i++) { const x = Math.floor(r() * W), y = horizon + 2 + Math.floor(r() * (H - horizon - 2)); b.px(x, y, hexRGB('#2a4e30')); b.px(x - 1, y - 1, hexRGB('#2a4e30')); }
  // red glow where the Rift stands
  lights.push({ x: 595, y: 300, r: 90, col: RED, k: 1 });
  b.light(lights);
  b.toTexture(scene, 'title-bg');
}

// Soft dark corners for mood.
export function makeVignette(scene) {
  if (scene.textures.exists('vignette')) return;
  const tex = scene.textures.createCanvas('vignette', W, H);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.64);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(2,0,10,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  tex.refresh();
}

// A soft round glow (white; tint and ADD-blend it in the scene).
export function makeGlow(scene) {
  if (scene.textures.exists('glow')) return;
  const n = 32, b = new Buf(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2) / (n / 2), f = d >= 1 ? 0 : (1 - d) * (1 - d);
    const lv = Math.min(8, Math.floor(f * 8 + bayer(x, y) * 0.6)) / 8, i = (y * n + x) * 4;
    b.d[i] = b.d[i + 1] = b.d[i + 2] = 255; b.d[i + 3] = Math.round(lv * 255);
  }
  b.toTexture(scene, 'glow');
}
