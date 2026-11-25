import CONFIG from '../config.js';
import { pointAt, roadLength } from '../logic/path.js';

// The Pizza Hut van drives from the office back along the monsters' current route
// to the Rift, spraying tomato sauce on every monster it passes (each one once per run).
export function spawnVan(scene, path) {
  const total = roadLength(path);
  const start = pointAt(path, total);
  const van = {
    path,
    distance: total,
    sauced: new Set(),
    lastSplat: total,
    sprite: scene.add.image(start.x, start.y, 'van').setDepth(6),
    label: scene.add.text(start.x, start.y - 22, 'PIZZA HUT', { fontFamily: '"VT323", monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold', stroke: '#d1201a', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(6),
    done: false,
  };
  return van;
}

// Returns enemies to sauce this frame.
export function stepVan(scene, van, dtMs, enemies) {
  const prev = pointAt(van.path, van.distance);
  van.distance -= CONFIG.pizza.speed * dtMs / 1000;
  const p = pointAt(van.path, Math.max(0, van.distance));
  van.sprite.setPosition(p.x, p.y).setRotation(Math.atan2(p.y - prev.y, p.x - prev.x));
  van.label.setPosition(p.x, p.y - 22);
  if (van.lastSplat - van.distance > 26) {
    van.lastSplat = van.distance;
    const s = scene.add.image(p.x + Phaser.Math.Between(-12, 12), p.y + Phaser.Math.Between(-12, 12), 'sauce')
      .setScale(Phaser.Math.FloatBetween(1.5, 3)).setDepth(1.5).setAlpha(0.85);
    scene.tweens.add({ targets: s, alpha: 0, delay: 4000, duration: 2000, onComplete: () => s.destroy() });
  }
  const hits = enemies.filter(e => e.alive && !van.sauced.has(e) && Math.hypot(e.x - p.x, e.y - p.y) <= CONFIG.pizza.radius);
  hits.forEach(e => van.sauced.add(e));
  if (van.distance <= 0) {
    van.done = true;
    scene.tweens.add({ targets: [van.sprite, van.label], alpha: 0, duration: 300, onComplete: () => { van.sprite.destroy(); van.label.destroy(); } });
  }
  return hits;
}
