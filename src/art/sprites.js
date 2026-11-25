import { Pix, OUTLINE, shadeHex } from './pixel.js';

// Night-time 80s palette.
export const C = {
  skin: '#e8b48c', skinD: '#b97f5c',
  hairBrown: '#6b4226', hairBlack: '#231a1a', hairAuburn: '#8a3b22', hairBlond: '#d8b25a',
  blue: '#3d6fd8', green: '#3c9a58', purple: '#8a4ad0', red: '#d0453a', yellow: '#efc443', white: '#ece7dc',
  denim: '#34477e', khaki: '#8c7a52', grey: '#6d7280', shoe: '#e8e4da', shoeD: '#3a3440',
  wood: '#8a5a2e', woodD: '#5c3a1c', steel: '#cfd6df', steelD: '#8b96a4', gold: '#d9a436', goldD: '#8e6420',
  monster: '#6c5a5c', monsterD: '#4a3c40', flesh: '#c33b4c', fleshD: '#7d1b2b', maw: '#2a0710', teeth: '#efe3c2',
};

// --- Kids --------------------------------------------------------------------

function kidBase({ hair, top, pants, shoes = C.shoe, longHair = false, cap = null }) {
  const p = new Pix(18, 24);
  // legs + shoes
  p.rect(6, 17, 2, 4, pants).rect(10, 17, 2, 4, pants);
  p.rect(5, 21, 3, 1, shoes).rect(10, 21, 3, 1, shoes);
  // torso + arms
  p.rect(5, 11, 8, 7, top);
  p.rect(4, 12, 1, 4, top).rect(13, 12, 1, 4, top);
  p.set(4, 16, C.skin).set(13, 16, C.skin);
  p.rect(5, 17, 8, 1, shadeHex(top, 0.7));
  // head
  p.ellipse(9, 7, 4.6, 4.6, C.skin);
  // hair
  p.ellipse(9, 5, 4.8, 3.2, hair);
  p.rect(5, 5, 8, 2, hair);
  p.set(5, 7, hair).set(12, 7, hair);
  if (longHair) { p.rect(4, 6, 1, 7, hair).rect(13, 6, 1, 7, hair); }
  if (cap) { p.ellipse(9, 4, 4.8, 2.4, cap).rect(9, 5, 6, 1, shadeHex(cap, 0.7)); }
  p.set(7, 3, shadeHex(hair, 1.45)).set(8, 2, shadeHex(hair, 1.45)).set(9, 2, shadeHex(hair, 1.25));
  // face
  p.set(7, 8, OUTLINE).set(10, 8, OUTLINE);
  p.set(8, 10, C.skinD).set(9, 10, C.skinD);
  p.set(6, 9, '#e89a86').set(11, 9, '#e89a86');
  return p;
}

export function kidSlingshot() {
  const p = kidBase({ hair: C.hairBrown, top: C.blue, pants: C.denim });
  p.rect(6, 13, 6, 1, C.white);                       // striped shirt
  p.rect(6, 15, 6, 1, C.white);
  // Y-shaped slingshot raised in the right hand
  p.line(14, 15, 14, 11, C.woodD).line(14, 11, 13, 9, C.wood).line(14, 11, 16, 9, C.wood);
  p.line(13, 9, 16, 9, '#d8d0c0');
  return p.shade().outline();
}

export function kidWalkie() {
  const p = kidBase({ hair: C.hairBlack, top: C.green, pants: C.khaki, cap: C.red });
  p.rect(6, 12, 2, 5, shadeHex(C.green, 0.8));        // open jacket
  // walkie-talkie held up, antenna with red LED
  p.rect(14, 12, 2, 4, '#2c2c34').set(14, 13, '#5a5a66');
  p.line(15, 11, 15, 8, '#9aa0aa').set(15, 7, '#ff3b3b');
  return p.shade().outline();
}

export function kidPsychic() {
  const p = kidBase({ hair: C.hairAuburn, top: C.purple, pants: C.grey, longHair: true });
  p.set(9, 10, '#c0182a').set(9, 11, '#c0182a');      // nosebleed
  // glowing raised hands
  p.set(3, 11, '#ff9dff').set(14, 11, '#ff9dff').set(3, 12, C.skin).set(14, 12, C.skin);
  return p.shade().outline();
}

export function lightsPost() {
  const p = new Pix(18, 24);
  p.rect(8, 4, 2, 19, C.wood).rect(9, 4, 1, 19, C.woodD);     // wooden post
  p.rect(4, 22, 10, 2, '#4a3a2a');                               // base
  const bulbs = ['#ff4a4a', '#ffd84a', '#4aff7a', '#4ab8ff', '#ff6aff'];
  // two swags of wire with bulbs
  let i = 0;
  for (const [y0, dir] of [[5, 1], [12, -1]]) {
    for (let x = 1; x <= 16; x++) {
      const y = y0 + Math.round(Math.sin((x / 16) * Math.PI) * 3);
      p.set(x, y, '#2a3a2a');
      if (x % 3 === 1) { p.set(x, y + 1, bulbs[i++ % bulbs.length]); }
    }
  }
  p.set(8, 3, '#ffd84a');
  return p.outline();
}

// --- Monsters ----------------------------------------------------------------

// Quadruped with an opening flower-petal head; two walk frames. Faces right.
export function crawlerFrames() {
  return [0, 1].map(f => {
    const p = new Pix(22, 14);
    p.ellipse(9, 6, 6.5, 3.2, C.monster);                // body
    p.line(3, 4, 13, 4, C.monsterD);                      // spine ridge
    p.line(3, 6, 0, 3, C.monster);                        // tail
    const legs = f === 0 ? [[5, 12, 3], [8, 12, 9], [12, 12, 11], [15, 12, 16]] : [[5, 12, 6], [8, 12, 7], [12, 12, 14], [15, 12, 13]];
    legs.forEach(([x, y, fx]) => p.line(x, 8, fx, y, C.monsterD).set(fx, y + 1, C.monsterD));
    p.ellipse(16, 5, 3, 2.6, C.monster);                  // neck/head
    // petal mouth
    p.ellipse(19.5, 5, 2.4, 3.6, C.flesh);
    p.set(20, 5, C.maw).set(19, 5, C.maw).set(20, 4, C.maw).set(20, 6, C.maw);
    p.set(19, 3, C.teeth).set(21, 4, C.teeth).set(19, 7, C.teeth).set(21, 6, C.teeth);
    return p.shade().outline();
  });
}

// Tall flower-faced brute. Two walk frames. Faces right.
export function bruteFrames() {
  return [0, 1].map(f => {
    const p = new Pix(24, 30);
    // legs
    const step = f === 0 ? 1 : -1;
    p.rect(8 + step, 21, 3, 7, C.monsterD).rect(13 - step, 21, 3, 7, C.monsterD);
    p.rect(7 + step, 28, 4, 1, C.monsterD).rect(13 - step, 28, 4, 1, C.monsterD);
    // torso
    p.ellipse(12, 16, 6, 7, C.monster);
    p.line(12, 10, 12, 21, C.monsterD);
    // long arms with claws
    p.line(6, 12, 3, 22 - step, C.monster).line(18, 12, 21, 22 + step, C.monster);
    p.set(2, 23 - step, C.teeth).set(4, 23 - step, C.teeth).set(20, 23 + step, C.teeth).set(22, 23 + step, C.teeth);
    // open flower head: five petals around a toothy maw
    const cx = 12, cy = 6;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * (Math.PI * 2 / 5) + (f ? 0.1 : -0.1);
      p.ellipse(cx + Math.cos(a) * 4, cy + Math.sin(a) * 3.6, 2.4, 2.4, k % 2 ? C.flesh : shadeHex(C.flesh, 0.85));
    }
    p.ellipse(cx, cy, 2.8, 2.8, C.maw);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; p.set(cx + Math.round(Math.cos(a) * 2.4), cy + Math.round(Math.sin(a) * 2.4), C.teeth); }
    return p.shade().outline();
  });
}

// Small flying spore-bat. Two wing frames.
export function swarmFrames() {
  return [0, 1].map(f => {
    const p = new Pix(16, 12);
    p.ellipse(8, 6, 2.5, 2.5, '#5c7a3c');
    if (f === 0) { p.line(6, 6, 1, 2, '#7a9a4c').line(6, 6, 0, 5, '#7a9a4c').line(10, 6, 15, 2, '#7a9a4c').line(10, 6, 16, 5, '#7a9a4c'); }
    else { p.line(6, 6, 1, 9, '#7a9a4c').line(6, 6, 2, 10, '#7a9a4c').line(10, 6, 15, 9, '#7a9a4c').line(10, 6, 14, 10, '#7a9a4c'); }
    p.set(7, 5, '#ffe14a').set(9, 5, '#ffe14a');
    return p.outline();
  });
}

// The final boss: a towering Vecna-like figure who resembles Bart — dark hair,
// glasses, very broad build. No name or text anywhere. Two "breathing" frames.
export function bossFrames() {
  return [0, 1].map(f => {
    const p = new Pix(34, 44);
    const robe = '#3a0f16', robeD = '#250a0e', skin = '#c9b0a4', vein = '#8a2a2a';
    // tendrils from the back, swaying per frame
    for (let k = 0; k < 6; k++) {
      const x0 = 5 + k * 5, sway = (k % 2 ? 1 : -1) * (f ? 2 : 0);
      p.line(x0, 26, x0 + sway - 2, 43, '#5e1a22').line(x0 + 1, 26, x0 + sway - 1, 42, '#7a2a30');
    }
    // broad shoulders + robe
    p.ellipse(17, 26, 15, 8, robe);
    p.rect(5, 26, 24, 16, robe);
    p.rect(16, 27, 2, 15, robeD);
    // big arms
    p.ellipse(4, 31, 3.5, 7, robe).ellipse(30, 31, 3.5, 7, robe);
    p.ellipse(4, 38, 2.5, 2.5, skin).ellipse(30, 38, 2.5, 2.5, skin);
    // neck + square head
    p.rect(14, 18, 6, 4, skin);
    p.ellipse(17, 12, 7.5, 8.5, skin);
    p.rect(10, 14, 14, 5, skin);                       // strong square jaw
    // cracked, veined skin
    p.line(11, 8, 13, 12, vein).line(23, 9, 21, 13, vein).line(12, 17, 14, 19, vein).line(22, 16, 20, 19, vein);
    // dark, neat hair
    p.ellipse(17, 6, 8, 4.5, '#1c1414').rect(9, 5, 16, 3, '#1c1414');
    p.set(9, 8, '#1c1414').set(25, 8, '#1c1414');
    // black-rimmed glasses with glowing red eyes
    p.rect(10, 11, 6, 4, '#0c0a0c').rect(18, 11, 6, 4, '#0c0a0c').rect(16, 12, 2, 1, '#0c0a0c');
    p.rect(11, 12, 4, 2, f ? '#ff2a2a' : '#d81a1a').rect(19, 12, 4, 2, f ? '#ff2a2a' : '#d81a1a');
    // grim mouth
    p.rect(14, 17, 6, 1, '#5a1a1a');
    p.shade(1.12, 0.75).outline();
    return p;
  });
}

// --- Props ---------------------------------------------------------------------

// Top-down delivery van, facing right (rotated along the road in game).
export function van() {
  const p = new Pix(30, 15);
  p.rect(1, 2, 28, 11, C.white);
  p.rect(1, 6, 28, 3, '#c8231e');                       // red stripe
  p.rect(22, 3, 6, 9, '#3d8ad8');                       // windshield
  p.rect(23, 4, 2, 7, '#8cc8ff');
  p.rect(6, 4, 10, 7, '#e8e2d8');                       // roof panel
  p.rect(8, 5, 6, 5, '#c8231e');                        // roof sign
  p.rect(3, 0, 4, 2, '#1a1a1a').rect(20, 0, 4, 2, '#1a1a1a').rect(3, 13, 4, 2, '#1a1a1a').rect(20, 13, 4, 2, '#1a1a1a');
  p.set(29, 3, '#fff6a0').set(29, 11, '#fff6a0');       // headlights
  return p.shade(1.08, 0.8).outline();
}

// Tiny 3x5 pixel font for engravings.
const GLYPHS = {
  V: ['1.1', '1.1', '1.1', '1.1', '.1.'], I: ['111', '.1.', '.1.', '.1.', '111'], C: ['.11', '1..', '1..', '1..', '.11'],
  T: ['111', '.1.', '.1.', '.1.', '.1.'], O: ['111', '1.1', '1.1', '1.1', '111'], R: ['11.', '1.1', '11.', '1.1', '1.1'],
  Y: ['1.1', '1.1', '.1.', '.1.', '.1.'],
};
function engrave(p, text, x, y, col) {
  [...text].forEach((ch, k) => GLYPHS[ch].forEach((row, r) => [...row].forEach((v, c) => { if (v === '1') p.set(x + k * 4 + c, y + r, col); })));
}

// The Nexios victory bell, with VICTORY engraved on a band across the skirt.
export function bell() {
  const p = new Pix(36, 34);
  p.rect(15, 0, 6, 2, C.goldD).rect(16, 2, 4, 2, C.goldD);          // crown loop
  p.ellipse(18, 11, 10, 8, C.gold);                                  // dome
  for (let y = 11; y < 27; y++) { const w = 10 + Math.floor((y - 11) * 0.7); p.rect(18 - w, y, w * 2, 1, C.gold); }   // flaring body
  p.rect(1, 26, 34, 3, C.gold);                                      // lip
  p.rect(4, 17, 28, 8, '#f0c75a');                                   // engraving band
  p.rect(4, 16, 28, 1, C.goldD).rect(4, 25, 28, 1, C.goldD);
  engrave(p, 'VICTORY', 5, 19, '#6e4a12');
  p.rect(9, 6, 2, 9, '#ffe9a6');                                     // highlight
  p.rect(1, 28, 34, 1, C.goldD);
  p.ellipse(18, 31, 2.5, 2.5, C.goldD);                              // clapper
  return p.shade(1.08, 0.72).outline();
}

// GoT-style longsword, pointing right. The Nexios wordmark is laid on the blade in game.
export function sword() {
  const p = new Pix(130, 20);
  // blade with fuller and tapered point
  p.rect(30, 7, 88, 6, C.steel);
  for (let i = 0; i < 12; i++) p.line(118 + i, 7 + Math.floor(i / 2), 118 + i, 12 - Math.floor(i / 2), C.steel);
  p.rect(30, 9, 82, 2, C.steelD);
  p.line(30, 7, 116, 7, '#f4f8fc');
  // crossguard with downswept ends
  p.rect(25, 2, 5, 16, C.gold).set(24, 1, C.gold).set(24, 18, C.gold).set(23, 0, C.goldD).set(23, 19, C.goldD);
  // leather-wrapped grip
  p.rect(9, 7, 16, 6, '#4a2c1a');
  for (let x = 10; x < 25; x += 3) p.line(x, 7, x + 1, 12, '#6e4428');
  // round pommel
  p.ellipse(5, 10, 4.5, 4.5, C.gold).ellipse(5, 10, 2, 2, C.goldD);
  return p.shade(1.1, 0.75).outline();
}

export function pebble() { return new Pix(3, 3).rect(0, 0, 3, 3, '#d8d0c4').set(2, 2, '#8a8478'); }

// --- Maze blocks --------------------------------------------------------------
export const KID_COLOURS = { slingshot: C.blue, walkie: C.green, psychic: C.purple, lights: C.yellow };

export function crateTile(band) {
  const p = new Pix(16, 16);
  // planks
  for (let y = 0; y < 16; y++) p.rect(0, y, 16, 1, y % 5 === 4 ? '#4f3219' : (Math.floor(y / 5) % 2 ? '#74502e' : '#7d5632'));
  [[3, 1], [9, 2], [12, 6], [5, 12], [10, 13], [2, 7]].forEach(([x, y]) => p.set(x, y, '#8c6238').set(x + 1, y, '#684626'));   // grain
  // coloured strap with a buckle
  p.rect(0, 5, 16, 6, band).rect(0, 5, 16, 1, shadeHex(band, 1.35)).rect(0, 10, 16, 1, shadeHex(band, 0.55)).rect(0, 9, 16, 1, shadeHex(band, 0.8));
  p.rect(6, 6, 4, 4, shadeHex(band, 1.5)).rect(7, 7, 2, 2, shadeHex(band, 0.6));
  // bevelled frame and iron corners
  p.rect(0, 0, 16, 1, '#b48654').rect(0, 0, 1, 16, '#a87a4a');
  p.rect(0, 15, 16, 1, '#3a2412').rect(15, 0, 1, 16, '#3a2412');
  [[0, 0], [13, 0], [0, 13], [13, 13]].forEach(([x, y]) => p.rect(x, y, 3, 3, '#59606c').set(x + 1, y + 1, '#c8d0da'));
  return p;
}

export function wallTile() {
  const p = new Pix(16, 16);
  p.rect(0, 0, 16, 16, '#3c3844');
  for (let r = 0; r < 4; r++) {
    const off = r % 2 ? 4 : 0;
    p.rect(0, r * 4 + 3, 16, 1, '#221f28');
    p.rect(0, r * 4, 16, 1, '#4c4856');
    for (let x = off; x < 16; x += 8) p.rect(x, r * 4, 1, 4, '#221f28');
  }
  [[2, 1], [10, 5], [5, 9], [13, 13], [7, 14]].forEach(([x, y]) => p.set(x, y, '#5a5666'));
  p.set(1, 14, '#2e4a34').set(2, 14, '#2e4a34').set(1, 13, '#3a5e40').set(12, 2, '#2e4a34');   // moss
  p.rect(0, 15, 16, 1, '#1a1820').rect(15, 0, 1, 16, '#1a1820');
  return p;
}

// --- The Rift, effects and HUD icons --------------------------------------------

// A jagged, glowing tear in the world. Three shimmering frames.
export function riftFrames() {
  const jit = (y, f, k) => { let h = Math.imul(y * 31 + f * 17 + k * 101, 2654435761) >>> 0; return (h >>> 28) / 16; };
  return [0, 1, 2].map(f => {
    const p = new Pix(26, 52);
    // roots creeping out
    [[13, 6, 4, 1], [13, 12, 22, 5], [13, 26, 1, 22], [13, 30, 24, 28], [13, 40, 21, 47], [13, 44, 5, 50], [13, 20, 2, 12]].forEach(([x0, y0, x1, y1], k) => {
      const mx = (x0 + x1) / 2 + (jit(k, f, 3) - 0.5) * 3, my = (y0 + y1) / 2 + (k % 2 ? 2 : -2);
      p.line(x0, y0, mx, my, '#3a0810').line(mx, my, x1, y1, '#3a0810');
    });
    for (let y = 2; y < 50; y++) {
      const t = (y - 2) / 47, w = 8.5 * Math.pow(Math.sin(Math.PI * t), 0.7) + (jit(y, f, 0) - 0.5) * 2.4, cx = 13 + Math.sin(y * 0.5 + f * 2.1) * 0.8;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const d = Math.abs(x + 0.5 - cx);
        if (d > w) continue;
        const e = w - d;                                               // distance in from the edge
        p.set(x, y, e < 1.2 ? '#6a0c18' : e < 2.4 ? '#c81e30' : e < 3.4 ? '#ff5a48' : e < 4.2 ? '#ffb08a' : (jit(x + y * 7, f, 5) < 0.12 ? '#5a0a1a' : '#14020a'));
      }
    }
    return p;
  });
}

export function shadowBlob() { return new Pix(14, 6).ellipse(7, 3, 7, 3, '#000000'); }
export function spark() { return new Pix(5, 5).rect(2, 0, 1, 5, '#ffffff').rect(0, 2, 5, 1, '#ffffff'); }
export function smoke() { return new Pix(6, 6).ellipse(3, 3, 3, 3, '#ffffff').set(1, 1, '#ffffff'); }
export function psyBolt() { return new Pix(7, 7).ellipse(3.5, 3.5, 3.5, 3.5, '#d94adf').ellipse(3.5, 3.5, 2, 2, '#ffb8ff').set(3, 3, '#ffffff'); }

export function coin() {
  const p = new Pix(9, 9).ellipse(4.5, 4.5, 4.5, 4.5, C.gold).ellipse(4.5, 4.5, 2.6, 2.6, '#f4cf6a');
  p.rect(4, 2, 1, 5, C.goldD).set(2, 2, '#fff0b4').set(3, 1, '#fff0b4');
  return p.outline();
}
export function heart() {
  const p = new Pix(9, 8);
  ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...'].forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') p.set(x + 1, y + 1, '#e83a4a'); }));
  p.set(2, 2, '#ff9aa4').set(3, 2, '#ff9aa4').set(2, 3, '#ff9aa4');
  return p.outline();
}
