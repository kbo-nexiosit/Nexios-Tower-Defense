import CONFIG from '../config.js';
import { makeEnemyState, effectiveSpeed } from '../logic/combat.js';
import { nextCell, distAt } from '../logic/grid.js';

const FLYERS = new Set(['swarm', 'boss']);

// An enemy is its logic state (pure data) plus a sprite and a health bar.
// Walkers follow the maze cell by cell; flyers (bats, the boss) go straight over it.
export function spawnEnemy(scene, type, hpScale = 1, mods = { hpMult: 1, speedMult: 1 }) {
  const e = makeEnemyState(type, hpScale * mods.hpMult);
  e.speed *= mods.speedMult;
  e.flying = FLYERS.has(type);
  const s = scene.cellCenter(CONFIG.maze.spawn), g = scene.cellCenter(CONFIG.maze.goal);
  e.x = s.x; e.y = s.y;
  if (e.flying) { e.from = s; e.to = g; e.len = Math.hypot(g.x - s.x, g.y - s.y); e.flown = 0; }
  else { e.cell = [...CONFIG.maze.spawn]; e.next = nextCell(scene.grid, scene.dist, e.cell); }
  e.sprite = scene.add.sprite(s.x, s.y, type, 0).setDepth(type === 'boss' ? 6 : 5).play(type + '-walk');
  const shadowScale = { boss: 4.5, brute: 1.4, swarm: 0.7, crawler: 1.5 }[type];
  e.shadow = scene.add.image(s.x, s.y, 'shadow').setDepth(3.8).setAlpha(e.flying ? 0.28 : 0.42).setScale(shadowScale, shadowScale * 0.9);
  if (type !== 'boss') {
    e.barBg = scene.add.rectangle(s.x, s.y - 18, 28, 6, 0x0a0a12, 0.85).setStrokeStyle(1, 0x000000, 0.9).setDepth(7);
    e.bar = scene.add.rectangle(s.x - 12, s.y - 18, 24, 3, 0x6bff6b).setOrigin(0, 0.5).setDepth(7.1);
  }
  e.upside = mods.hpMult > 1;
  return e;
}

// Moves the enemy. Returns true when it reached the office this frame.
export function stepEnemy(scene, e, dtMs, now) {
  let move = effectiveSpeed(e, now) * dtMs / 1000;
  const px = e.x;
  let arrived = false, remaining;
  if (e.flying) {
    e.flown = Math.min(e.len, e.flown + move);
    const t = e.flown / e.len;
    e.x = e.from.x + (e.to.x - e.from.x) * t; e.y = e.from.y + (e.to.y - e.from.y) * t;
    remaining = e.len - e.flown;
    arrived = e.flown >= e.len;
  } else {
    while (move > 0 && e.next) {
      const c = scene.cellCenter(e.next), d = Math.hypot(c.x - e.x, c.y - e.y);
      if (move >= d) { e.x = c.x; e.y = c.y; move -= d; e.cell = e.next; e.next = nextCell(scene.grid, scene.dist, e.cell); }
      else { e.x += (c.x - e.x) / d * move; e.y += (c.y - e.y) / d * move; move = 0; }
    }
    const [gc, gr] = CONFIG.maze.goal;
    arrived = e.cell[0] === gc && e.cell[1] === gr;
    remaining = e.next ? Math.max(0, distAt(scene.grid, scene.dist, e.next)) * CONFIG.maze.cell + Math.hypot(scene.cellCenter(e.next).x - e.x, scene.cellCenter(e.next).y - e.y) : 0;
  }
  e.distance = 100000 - remaining;   // larger = closer to the office (for targeting)
  if (e.type === 'crawler' || e.type === 'brute') { if (e.x < px - 0.01) e.sprite.setFlipX(true); else if (e.x > px + 0.01) e.sprite.setFlipX(false); }
  e.sprite.setPosition(e.x, e.y);
  if (e.type === 'swarm') e.sprite.y += Math.sin(now / 90 + e.flown) * 3;
  // Walkers cast a shadow at their feet; flyers cast one further down, so they read as airborne.
  e.shadow.setPosition(e.x, e.y + e.sprite.height / 2 + (e.type === 'boss' ? -6 : e.flying ? 12 : -3));
  if (e.bar) {
    const by = e.y - (e.sprite.height / 2 + 5), frac = Math.max(0, e.hp / e.maxHp);
    e.barBg.setPosition(e.x, by);
    e.bar.setPosition(e.x - 12, by);
    e.bar.width = 24 * frac;
    e.bar.setFillStyle(frac > 0.6 ? 0x6bff6b : frac > 0.3 ? 0xffd84a : 0xff4a4a);
    const hurt = frac < 1;
    e.bar.setVisible(hurt); e.barBg.setVisible(hurt);
  }
  const sauced = now < e.saucedUntil, stunned = now < e.stunUntil, slowed = now < e.slowUntil;
  if (now < e.flashUntil) e.sprite.setTintFill(0xffffff);   // brief white flash when hit
  else if (sauced) e.sprite.setTint(0xff4a3a);
  else if (stunned) e.sprite.setTint(0xffff88);
  else if (slowed) e.sprite.setTint(0x88ccff);
  else if (e.upside) e.sprite.setTint(0xff9090);
  else e.sprite.clearTint();
  return arrived;
}

// Cells a walker stands on or is about to enter (blocks can't be dropped there).
export const enemyCells = e => (e.flying || !e.alive ? [] : [e.cell, e.next].filter(Boolean));

export function removeEnemy(e) {
  e.alive = false;
  e.sprite.destroy();
  e.bar?.destroy();
  e.barBg?.destroy();
  e.shadow?.destroy();
}

export const enemyReward = e => CONFIG.enemies[e.type].reward;
export const enemyLeak = e => CONFIG.enemies[e.type].leak;
