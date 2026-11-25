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
