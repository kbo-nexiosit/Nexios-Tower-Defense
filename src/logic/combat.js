import CONFIG from '../config.js';

export function makeEnemyState(type, hpScale = 1) {
  const base = CONFIG.enemies[type];
  const hp = base.hp * hpScale;
  return { type, hp, maxHp: hp, speed: base.speed, distance: 0, alive: true,
    slowUntil: 0, slowFactor: 1, stunUntil: 0, saucedUntil: 0 };
}

export function applyDamage(e, amount, now) {
  if (!e.alive) return { killed: false };
  const mult = now < e.saucedUntil ? CONFIG.pizza.saucedDamageMult : 1;
  e.hp -= amount * mult;
  if (e.hp <= 0) { e.alive = false; return { killed: true }; }
  return { killed: false };
}

export function effectiveSpeed(e, now) {
  if (now < e.stunUntil) return 0;
  let s = e.speed;
  if (now < e.slowUntil) s *= e.slowFactor;
  if (now < e.saucedUntil) s *= CONFIG.pizza.saucedSpeedMult;
  return s;
}

export function pickTarget(tower, enemies) {
  let best = null;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (Math.hypot(e.x - tower.x, e.y - tower.y) > tower.range) continue;
    if (!best || e.distance > best.distance) best = e;
  }
  return best;
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function canPlace(slot, towers, road, minRoadDist = 32, minTowerDist = 40) {
  for (let i = 1; i < road.length; i++) {
    if (distToSegment(slot, road[i - 1], road[i]) < minRoadDist) return false;
  }
  return !towers.some(t => Math.hypot(t.x - slot.x, t.y - slot.y) < minTowerDist);
}

export function towerStats(type, level) {
  const { levels, ...base } = CONFIG.towers[type];
  const stats = { ...base };
  for (let i = 0; i < level; i++) Object.assign(stats, levels[i]);
  stats.cost = base.cost;
  return stats;
}

export function upgradeCost(type, level) {
  const next = CONFIG.towers[type].levels[level];
  return next ? next.cost : null;
}

export function applySlow(e, factor, ms, now) {
  const active = now < e.slowUntil;
  e.slowFactor = active ? Math.min(e.slowFactor, factor) : factor;
  e.slowUntil = Math.max(e.slowUntil, now + ms);
}

export function applyStun(e, ms, now) {
  e.stunUntil = Math.max(e.stunUntil, now + ms);
}

// Pizza Hut van: tomato sauce marks the enemy (slower, takes extra damage), then splashes it.
export function sauce(e, now) {
  e.saucedUntil = now + CONFIG.pizza.saucedMs;
  return applyDamage(e, CONFIG.pizza.damage, now);
}

// Blocks fire from their edge squares: target the furthest-along enemy within range
// of any edge, shooting from the edge square nearest to it.
export function pickTargetFrom(origins, range, enemies) {
  let best = null;
  for (const e of enemies) {
    if (!e.alive) continue;
    let near = null, nd = Infinity;
    for (const o of origins) { const d = Math.hypot(e.x - o.x, e.y - o.y); if (d < nd) { nd = d; near = o; } }
    if (!near || nd > range) continue;
    if (!best || e.distance > best.target.distance) best = { target: e, origin: near };
  }
  return best;
}

export function inRangeOfAny(origins, range, enemies) {
  return enemies.filter(e => e.alive && origins.some(o => Math.hypot(e.x - o.x, e.y - o.y) <= range));
}
