import CONFIG from '../config.js';

// Chance per roll that the board flips to the Upside Down during wave n.
export function flipChance(wave) {
  const { firstWave, chancePerWave, maxChance } = CONFIG.flip;
  if (wave < firstWave) return 0;
  return Math.min(maxChance, chancePerWave * wave);
}

export function rollFlip(wave, rng = Math.random) {
  return rng() < flipChance(wave);
}

export function flipModifiers(active) {
  return active ? { hpMult: CONFIG.flip.hpMult, speedMult: CONFIG.flip.speedMult } : { hpMult: 1, speedMult: 1 };
}
