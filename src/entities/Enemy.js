import CONFIG from '../config.js';
import { ROAD, pointAt } from '../logic/path.js';
import { makeEnemyState, effectiveSpeed } from '../logic/combat.js';

// An enemy is its logic state (pure data) plus a sprite and a health bar.
export function spawnEnemy(scene, type, hpScale = 1, mods = { hpMult: 1, speedMult: 1 }) {
  const e = makeEnemyState(type, hpScale * mods.hpMult);
  e.speed *= mods.speedMult;
  const p = pointAt(ROAD, 0);
  e.x = p.x; e.y = p.y;
  e.sprite = scene.add.sprite(p.x, p.y, type, 0).setDepth(type === 'boss' ? 6 : 5).play(type + '-walk');
  if (type !== 'boss') e.bar = scene.add.rectangle(p.x, p.y - 18, 24, 3, 0x6bff6b).setDepth(7);
  e.upside = mods.hpMult > 1;
  return e;
}

// Moves the enemy. Returns true when it reached the office this frame.
export function stepEnemy(scene, e, dtMs, now) {
  e.distance += effectiveSpeed(e, now) * dtMs / 1000;
  const p = pointAt(ROAD, e.distance);
  if (e.type === 'crawler' || e.type === 'brute') e.sprite.setFlipX(p.x < e.x - 0.01 ? true : p.x > e.x + 0.01 ? false : e.sprite.flipX);
  e.x = p.x; e.y = p.y;
  e.sprite.setPosition(p.x, p.y);
  if (e.type === 'swarm') e.sprite.y += Math.sin(now / 90 + e.distance) * 3;
  if (e.bar) {
    e.bar.setPosition(p.x, p.y - (e.sprite.height / 2 + 4));
    e.bar.width = 24 * Math.max(0, e.hp / e.maxHp);
  }
  const sauced = now < e.saucedUntil, stunned = now < e.stunUntil, slowed = now < e.slowUntil;
  if (sauced) e.sprite.setTint(0xff4a3a);
  else if (stunned) e.sprite.setTint(0xffff88);
  else if (slowed) e.sprite.setTint(0x88ccff);
  else if (e.upside) e.sprite.setTint(0xff9090);
  else e.sprite.clearTint();
  return p.done;
}

export function removeEnemy(e) {
  e.alive = false;
  e.sprite.destroy();
  e.bar?.destroy();
}

export const enemyReward = e => CONFIG.enemies[e.type].reward;
export const enemyLeak = e => CONFIG.enemies[e.type].leak;
