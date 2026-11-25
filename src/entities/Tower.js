import CONFIG from '../config.js';
import { pickTarget } from '../logic/combat.js';

export function towerStatsFor(type, level) {
  const base = CONFIG.towers[type];
  return { ...base };
}

export function placeTower(scene, type, x, y) {
  const t = { type, level: 0, x, y, lastFire: -Infinity };
  Object.assign(t, towerStatsFor(type, 0));
  t.sprite = scene.add.image(x, y, type).setDepth(4).setInteractive({ useHandCursor: true });
  t.sprite.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); scene.selectTower(t); });
  return t;
}

// Fires if ready. `hit(target, damage)` applies damage and pays rewards.
export function stepTower(scene, t, enemies, now, hit) {
  if (now - t.lastFire < t.fireMs) return;
  const target = pickTarget(t, enemies);
  if (!target) return;
  t.lastFire = now;
  const shot = scene.add.image(t.x, t.y, 'pebble').setDepth(8);
  scene.tweens.add({
    targets: shot, x: target.x, y: target.y, duration: 120,
    onComplete: () => { shot.destroy(); hit(target, t.damage); },
  });
  scene.sfx?.shot();
}
