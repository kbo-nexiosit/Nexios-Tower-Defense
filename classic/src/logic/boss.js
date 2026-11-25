import CONFIG from '../config.js';

// Health thresholds (fractions of maxHp) crossed by one hit, highest first.
export function crossedThresholds(prevHp, hp, maxHp, thresholds = CONFIG.boss.thresholds) {
  return thresholds
    .filter(t => prevHp > t * maxHp && hp <= t * maxHp)
    .sort((a, b) => b - a);
}
