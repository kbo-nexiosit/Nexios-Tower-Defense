import { Pix, OUTLINE, shadeHex } from './pixel.js';

// The whole town is pre-rendered once into a 640x360 pixel texture, shown at 2x.
const W = 640, H = 360, S = 2;
const ROAD_HALF = 11, CURB = 13;

function rng(seed) {   // small deterministic PRNG (mulberry32)
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hexRGB = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// Nearest point on the road: distance and distance along the road.
function roadInfo(pts, x, y) {
  let best = { d: Infinity, along: 0 }, acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (len * len)));
    const d = Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
    if (d < best.d) best = { d, along: acc + t * len, t, len };
    acc += len;
  }
  return best;
}

function house(r, roofCol, wallCol) {
  const p = new Pix(26, 22);
  p.rect(2, 11, 22, 10, wallCol);                                    // front wall
  for (let y = 0; y < 11; y++) { const inset = Math.max(0, 5 - y); p.rect(inset, y + 1, 26 - inset * 2, 1, y < 5 ? shadeHex(roofCol, 1.15) : roofCol); }
  p.rect(1, 6, 24, 1, shadeHex(roofCol, 0.7));                       // ridge shadow
  p.rect(18, 0, 3, 4, '#5a4a48');                                    // chimney
  p.rect(11, 14, 4, 7, '#3a2418');                                   // door
  p.set(14, 17, '#d9a436');
  const lit = () => (r() < 0.55 ? '#ffcf6a' : '#24303e');
  p.rect(4, 13, 5, 4, lit()).rect(17, 13, 5, 4, lit());              // windows
  p.rect(6, 13, 1, 4, '#3a2a22').rect(19, 13, 1, 4, '#3a2a22');
  return p.shade(1.08, 0.78).outline();
}

function tree(kind) {
  if (kind === 0) {
    const p = new Pix(16, 18);
    p.rect(7, 12, 2, 5, '#4a2e1a');
    p.ellipse(8, 7, 7, 6.5, '#1f4a2c').ellipse(6, 5, 3, 2.5, '#2c6a3e');
    return p.shade(1.1, 0.7).outline();
  }
  const p = new Pix(14, 20);
  p.rect(6, 16, 2, 3, '#4a2e1a');
  for (let y = 0; y < 16; y++) { const w = Math.floor(1 + y * 0.42) + (y % 5 === 4 ? -1 : 0); p.rect(7 - w, y, w * 2, 1, '#1a3e2a'); }
  return p.shade(1.12, 0.7).outline();
}

function car(r) {
  const cols = ['#8a2a2a', '#2a4a7a', '#7a6a3a', '#4a6a4a', '#6a4a7a'];
  const body = cols[Math.floor(r() * cols.length)];
  const p = new Pix(16, 9);
  p.rect(0, 1, 16, 7, body);
  p.rect(4, 2, 7, 5, shadeHex(body, 1.25));                        // roof
  p.rect(11, 2, 2, 5, '#6aa0d0').rect(2, 2, 2, 5, '#4a7aa0');       // windows
  p.rect(1, 0, 3, 1, '#151515').rect(11, 0, 3, 1, '#151515').rect(1, 8, 3, 1, '#151515').rect(11, 8, 3, 1, '#151515');
  return p.outline();
}
const transpose = p => { const q = new Pix(p.h, p.w); for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) q.set(y, x, p.get(x, y)); return q; };

function lamp() {
  const p = new Pix(5, 10);
  p.rect(2, 2, 1, 8, '#3a3a44').rect(0, 1, 5, 2, '#4a4a54').rect(1, 3, 3, 1, '#fff2c4');
  return p.outline();
}

function office(w, h) {
  const p = new Pix(w, h);
  const floors = 4, fh = Math.floor((h - 8) / floors);
  p.rect(0, 0, w, h, '#18202c');
  p.rect(0, 0, w, 6, '#2a3240');                                     // roof parapet
  p.rect(10, 1, 8, 4, '#4a5260').rect(w - 22, 1, 10, 4, '#4a5260');  // rooftop units
  const r = rng(77);
  for (let f = 0; f < floors; f++) {
    const y0 = 6 + f * fh;
    p.rect(0, y0, w, 2, '#c8d2dc');                                  // floor slab
    for (let c = 0; c < 6; c++) {
      const x0 = 2 + c * Math.floor((w - 4) / 6), pw = Math.floor((w - 4) / 6) - 2;
      const warm = r() < 0.3;
      for (let y = 0; y < fh - 3; y++) {
        const k = y / (fh - 3);
        const col = warm ? shadeHex('#ffd27a', 1 - k * 0.35) : shadeHex('#5fb4ff', 1.05 - k * 0.6);
        p.rect(x0, y0 + 2 + y, pw, 1, col);
      }
      if (warm && r() < 0.6) p.rect(x0 + 3, y0 + fh - 9, 3, 6, '#5a3a2a').ellipse(x0 + 4.5, y0 + fh - 10, 1.6, 1.6, '#5a3a2a'); // someone working late
      if (!warm) p.line(x0 + 1, y0 + fh - 3, x0 + pw - 2, y0 + 3, '#c8ecff');                                                  // reflection
      p.rect(x0 + pw, y0 + 2, 2, fh - 3, '#aab6c4');                                                                         // mullion
    }
  }
  p.rect(0, 6, 2, h - 6, '#aab6c4').rect(w - 2, 6, 2, h - 6, '#6a7684');
  // entrance on the road side (left), glowing
  const ey = Math.floor(h * 0.44);
  p.rect(0, ey, 4, 14, '#ffe6a8').rect(0, ey, 4, 1, '#c8d2dc');
  return p.outline();
}

function mediaBlock(w, h) {
  const p = new Pix(w, h);
  p.rect(0, 0, w, h, '#4c505c');
  p.rect(0, 0, w, 14, '#2c2f38');                                    // sign band (label added in game)
  p.rect(0, 14, w, 2, '#c8231e');                                    // red accent stripe
  const r = rng(91);
  for (let row = 0; row < 6; row++) for (let c = 0; c < 7; c++) {
    const x = 4 + c * 12, y = 20 + row * 12;
    if (x + 8 > w - 2 || y + 7 > h - 2) continue;
    p.rect(x, y, 8, 7, r() < 0.2 ? '#ffd27a' : '#1c2028');
    p.rect(x, y + 7, 8, 1, '#6a6e7a');
  }
  return p.shade(1.06, 0.8).outline();
}

export function makeGround(scene, ROAD, { lamps = [], office: of, media: md }) {
  if (scene.textures.exists('ground')) return;
  const tex = scene.textures.createCanvas('ground', W, H);
  const ctx = tex.getContext();
  const img = ctx.createImageData(W, H);
  const pts = ROAD.map(p => ({ x: p.x / S, y: p.y / S }));
  const r = rng(1983);
  const grass = ['#12211a', '#142519', '#10201a', '#16281c'].map(hexRGB);
  const asphalt = ['#26232c', '#2a2630', '#23202a'].map(hexRGB);
  const curb = hexRGB('#5c5866'), line = hexRGB('#b8952e'), scorch = hexRGB('#2a1014');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const info = roadInfo(pts, x + 0.5, y + 0.5);
    let c;
    if (info.d <= ROAD_HALF) {
      c = asphalt[Math.floor(r() * asphalt.length)];
      if (info.d < 0.9 && info.along % 10 < 5 && info.t > 0.06 && info.t < 0.94) c = line;
    } else if (info.d <= CURB) c = curb;
    else {
      c = grass[Math.floor(r() * grass.length)];
      if (r() < 0.025) c = hexRGB('#22402a');
      const rd = Math.hypot(x - 6, (y - 75) * 0.6);                  // scorched earth around the Rift
      if (rd < 26 && r() < 1 - rd / 26) c = scorch;
    }
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Props, kept off the road, the buildings and each other.
  const taken = [];
  const free = (x, y, w, h, roadGap) => {
    if (x < 2 || y < 32 || x + w > W - 2 || y + h > H - 2) return false;
    if (x + w > 535) return false;                                     // building lot
    if (x < 34 && y < 110) return false;                               // the Rift
    for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y + h / 2]]) if (roadInfo(pts, cx, cy).d < roadGap) return false;
    return !taken.some(t => x < t.x + t.w + 3 && x + w + 3 > t.x && y < t.y + t.h + 3 && y + h + 3 > t.y);
  };
  const put = (pix, x, y) => { taken.push({ x, y, w: pix.w, h: pix.h }); pix.draw(ctx, x, y, 1); };
  const shadow = (x, y, w) => { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y, w, 2); };

  lamps.forEach(([lx, ly]) => { const l = lamp(); put(l, Math.round(lx / S) - 2, Math.round(ly / S) - 9); });

  const roofs = ['#6a2e2e', '#3e3a62', '#2e523e', '#5a4a2e'], walls = ['#9a8a70', '#7a8496', '#8a7068', '#7a8a78'];
  for (let n = 0, tries = 0; n < 26 && tries < 3000; tries++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (!free(x, y, 26, 22, 20)) continue;
    const h = house(r, roofs[n % roofs.length], walls[(n * 3) % walls.length]);
    shadow(x, y + 22, 24); put(h, x, y); n++;
  }
  for (let n = 0, tries = 0; n < 60 && tries < 4000; tries++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H), kind = r() < 0.6 ? 0 : 1;
    const t = tree(kind);
    if (!free(x, y, t.w, t.h, 17)) continue;
    shadow(x, y + t.h, t.w - 2); put(t, x, y); n++;
  }
  // Cars parked along the kerb.
  let placed = 0;
  for (let i = 1; i < pts.length && placed < 5; i++) {
    const a = pts[i - 1], b = pts[i], horiz = Math.abs(b.y - a.y) < 1;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 60) continue;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const c = horiz ? car(r) : transpose(car(r));
    const x = Math.round(horiz ? mx - c.w / 2 : mx + 15), y = Math.round(horiz ? my + 15 : my - c.h / 2);
    if (free(x, y, c.w, c.h, 14)) { put(c, x, y); placed++; }
  }

  // Buildings.
  const ob = office(Math.round(of.w / S), Math.round(of.h / S));
  ob.draw(ctx, Math.round(of.x / S), Math.round(of.y / S), 1);
  const mb = mediaBlock(Math.round(md.w / S), Math.round(md.h / S));
  mb.draw(ctx, Math.round(md.x / S), Math.round(md.y / S), 1);
  tex.refresh();
}

// Soft dark corners for mood.
export function makeVignette(scene) {
  if (scene.textures.exists('vignette')) return;
  const tex = scene.textures.createCanvas('vignette', W, H);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  tex.refresh();
}
