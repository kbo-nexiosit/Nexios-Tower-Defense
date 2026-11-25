// Tiny pixel-art engine: draw at low resolution with hard pixels, add outlines
// and simple shading, then upscale with nearest-neighbour into a Phaser texture.

export const OUTLINE = '#140c18';

const hex = c => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function shadeHex(c, f) {
  const [r, g, b] = hex(c);
  const k = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + [k(r), k(g), k(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }

  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
  set(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.d[y * this.w + x] = c; return this;
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  // Filled ellipse; centre may be fractional for symmetric even-width shapes.
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  // Recolour existing pixels inside a region (for shading passes).
  tint(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c && c !== OUTLINE) { const n = fn(x, y, c); if (n) this.d[y * this.w + x] = n; } } return this; }
  // Dark 1px outline around the silhouette (4-neighbour).
  outline(c = OUTLINE) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    add.forEach(([x, y]) => this.set(x, y, c));
    return this;
  }
  // Light from top-left: brighten pixels whose top/left neighbour is empty, darken bottom/right edges.
  shade(light = 1.18, dark = 0.72) {
    const src = this.d.slice();
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : src[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = at(x, y);
      if (!c || c === OUTLINE) continue;
      const up = at(x, y - 1), left = at(x - 1, y), down = at(x, y + 1), right = at(x + 1, y);
      if (!down || down === OUTLINE || !right || right === OUTLINE) this.d[y * this.w + x] = shadeHex(c, dark);
      else if (!up || up === OUTLINE || !left || left === OUTLINE) this.d[y * this.w + x] = shadeHex(c, light);
    }
    return this;
  }
  stamp(other, ox, oy) { for (let y = 0; y < other.h; y++) for (let x = 0; x < other.w; x++) { const c = other.get(x, y); if (c) this.set(ox + x, oy + y, c); } return this; }
  flipX() { const p = new Pix(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.set(this.w - 1 - x, y, this.get(x, y)); return p; }

  // Write pixels into a 2D context at a given scale.
  draw(ctx, ox = 0, oy = 0, scale = 1) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.get(x, y);
      if (!c) continue;
      ctx.fillStyle = c; ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}

// Register frames (all the same size) as one Phaser canvas texture with numbered frames.
export function pixTexture(scene, key, frames, scale = 2) {
  if (scene.textures.exists(key)) return;
  const f0 = frames[0], fw = f0.w * scale, fh = f0.h * scale;
  const tex = scene.textures.createCanvas(key, fw * frames.length, fh);
  const ctx = tex.getContext();
  frames.forEach((f, i) => f.draw(ctx, i * fw, 0, scale));
  tex.refresh();
  if (frames.length > 1) frames.forEach((f, i) => tex.add(i, 0, i * fw, 0, fw, fh));
  return tex;
}
