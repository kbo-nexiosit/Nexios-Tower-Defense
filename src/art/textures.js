// Placeholder pixel textures drawn in code. Swap for PNGs later by loading
// images with the same keys in TitleScene.preload.

export const PALETTE = {
  night: 0x0b0b14, grass: 0x14201a, road: 0x2b2633, roadEdge: 0x4a4256,
  rift: 0xff2a3a, glass: 0x3fa9f5, glassDark: 0x1c4f7a, steel: 0x8892a6,
  neonPink: 0xff3fa4, neonCyan: 0x3ff2ff, amber: 0xffb627, white: 0xffffff,
};

function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function makeTextures(scene) {
  // Enemies: distinct silhouettes and colours.
  tex(scene, 'crawler', 24, 24, g => {
    g.fillStyle(0xd94a6a); g.fillCircle(12, 12, 9);
    g.fillStyle(0x5a0f1f); g.fillCircle(12, 12, 4);           // petal mouth
    g.fillStyle(0xd94a6a); for (const [x, y] of [[2, 4], [22, 4], [2, 20], [22, 20]]) g.fillRect(x - 2, y - 2, 4, 4);
  });
  tex(scene, 'brute', 36, 36, g => {
    g.fillStyle(0x7a3b8f); g.fillRoundedRect(2, 4, 32, 30, 6);
    g.fillStyle(0x2a0f33); g.fillRect(8, 12, 20, 8);
    g.fillStyle(0xffe14a); g.fillRect(10, 14, 4, 4); g.fillRect(22, 14, 4, 4);
  });
  tex(scene, 'swarm', 18, 14, g => {
    g.fillStyle(0x9fe86b); g.fillTriangle(0, 7, 9, 0, 9, 14); g.fillTriangle(18, 7, 9, 0, 9, 14);
    g.fillStyle(0x1d3310); g.fillCircle(9, 7, 3);
  });
  tex(scene, 'boss', 80, 96, g => {
    // Vecna-like look-alike: pale skin, tendrils, dark hair, glasses, broad build.
    g.fillStyle(0x3a0d12); g.fillRect(6, 44, 68, 52);                   // broad dark robe
    g.fillStyle(0x8a3a3a); for (let i = 0; i < 6; i++) g.fillRect(8 + i * 12, 52 + (i % 2) * 8, 4, 40); // tendrils
    g.fillStyle(0xd9b8a6); g.fillRoundedRect(22, 8, 36, 40, 10);        // head
    g.fillStyle(0x1a1410); g.fillRoundedRect(20, 2, 40, 14, 6);         // dark hair
    g.fillStyle(0x111111); g.fillRect(24, 22, 13, 9); g.fillRect(43, 22, 13, 9); g.fillRect(37, 25, 6, 2); // glasses
    g.fillStyle(0xff3030); g.fillRect(28, 25, 5, 3); g.fillRect(47, 25, 5, 3);                            // red eyes
    g.fillStyle(0x6b2020); g.fillRect(32, 38, 16, 3);                   // grim mouth
  });
  // Kids.
  tex(scene, 'slingshot', 32, 32, g => {
    g.fillStyle(0x2d6cdf); g.fillCircle(16, 16, 14);
    g.fillStyle(0xf2c9a0); g.fillCircle(16, 12, 6);
    g.fillStyle(0x8b5a2b); g.fillRect(14, 18, 4, 10); g.fillRect(9, 16, 4, 4); g.fillRect(19, 16, 4, 4);
  });
  tex(scene, 'walkie', 32, 32, g => {
    g.fillStyle(0x2fae66); g.fillCircle(16, 16, 14);
    g.fillStyle(0xf2c9a0); g.fillCircle(16, 12, 6);
    g.fillStyle(0x222222); g.fillRect(19, 14, 6, 10); g.fillStyle(0xff4444); g.fillRect(23, 8, 2, 6);
  });
  tex(scene, 'psychic', 32, 32, g => {
    g.fillStyle(0xd94adf); g.fillCircle(16, 16, 14);
    g.fillStyle(0xf2c9a0); g.fillCircle(16, 13, 7);
    g.fillStyle(0xcc0000); g.fillRect(16, 16, 2, 4);                    // nosebleed
    g.lineStyle(2, 0xffffff); g.strokeCircle(16, 16, 14);
  });
  tex(scene, 'lights', 32, 32, g => {
    g.fillStyle(0x3a3a3a); g.fillCircle(16, 16, 14);
    const c = [0xff4444, 0x44ff44, 0x4488ff, 0xffdd33, 0xff44ff, 0x44ffff];
    c.forEach((col, i) => { const a = i / c.length * Math.PI * 2; g.fillStyle(col); g.fillCircle(16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 3); });
  });
  tex(scene, 'pebble', 6, 6, g => { g.fillStyle(0xdddddd); g.fillCircle(3, 3, 3); });
  tex(scene, 'dot', 4, 4, g => { g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4); });
  tex(scene, 'ash', 3, 3, g => { g.fillStyle(0xcfc8d6); g.fillRect(0, 0, 3, 3); });
  tex(scene, 'sauce', 6, 6, g => { g.fillStyle(0xd1201a); g.fillCircle(3, 3, 3); });
  tex(scene, 'van', 56, 28, g => {
    g.fillStyle(0xf2f2f2); g.fillRect(0, 4, 56, 20);
    g.fillStyle(0xd1201a); g.fillRect(0, 12, 56, 6); g.fillRect(40, 4, 16, 8);
    g.fillStyle(0x3fa9f5); g.fillRect(44, 6, 10, 6);
    g.fillStyle(0x111111); g.fillCircle(12, 25, 4); g.fillCircle(44, 25, 4);
  });
  tex(scene, 'bell', 48, 52, g => {
    g.fillStyle(0xffc94a); g.fillRoundedRect(8, 8, 32, 34, 12); g.fillRect(2, 36, 44, 8);
    g.fillStyle(0xb8862b); g.fillRect(20, 0, 8, 10); g.fillCircle(24, 46, 5);
    g.fillStyle(0xfff0b0); g.fillRect(14, 14, 4, 20);
  });
  tex(scene, 'sword', 260, 40, g => {
    g.fillStyle(0xdfe6ee); g.fillTriangle(60, 14, 60, 26, 260, 20); g.fillRect(60, 14, 170, 12); // blade
    g.fillStyle(0x9aa6b4); g.fillRect(60, 19, 180, 2);                                         // fuller
    g.fillStyle(0xb8862b); g.fillRect(48, 2, 12, 36);                                          // crossguard
    g.fillStyle(0x3a2a1a); g.fillRect(16, 14, 32, 12);                                         // grip
    g.fillStyle(0x0b0b14); g.fillCircle(10, 20, 10); g.lineStyle(2, 0xb8862b); g.strokeCircle(10, 20, 10); // pommel (logo goes here)
  });
}
