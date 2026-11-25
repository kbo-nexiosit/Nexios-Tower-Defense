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
  if (type !== 'boss') e.bar = scene.add.rectangle(s.x, s.y - 18, 24, 3, 0x6bff6b).setDepth(7);
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
  if (e.bar) {
    e.bar.setPosition(e.x, e.y - (e.sprite.height / 2 + 4));
    e.bar.width = 24 * Math.max(0, e.hp / e.maxHp);
  }
  const sauced = now < e.saucedUntil, stunned = now < e.stunUntil, slowed = now < e.slowUntil;
  if (sauced) e.sprite.setTint(0xff4a3a);
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
}

export const enemyReward = e => CONFIG.enemies[e.type].reward;
export const enemyLeak = e => CONFIG.enemies[e.type].leak;
