// All tuning numbers live here.
const CONFIG = {
  world: { width: 1280, height: 720 },
  // The maze: a grid between the Rift (spawn, left) and the NexiosIT office (goal, right).
  maze: {
    cell: 32, x0: 0, y0: 64, cols: 33, rows: 20, spawn: [0, 10], goal: [32, 10],
    houses: [[4, 2], [9, 15], [14, 4], [19, 13], [23, 3], [27, 15], [6, 7]],   // 2x2 fixed obstacles
    trees: [[2, 16], [11, 8], [16, 17], [21, 8], [26, 9], [29, 5], [12, 1], [30, 18], [8, 12], [17, 1], [25, 12], [3, 5]],
  },
  startTokens: 160, baseHealth: 20,   // blocks double as walls, so the opening needs a few
  towers: {
    slingshot: { cost: 25, range: 110, damage: 6,  fireMs: 400,  levels: [{ cost: 30, damage: 10 }, { cost: 50, damage: 16, range: 130 }] },
    walkie:    { cost: 40, range: 90,  slow: 0.5,  slowMs: 1500, pulseMs: 1000, levels: [{ cost: 35, slow: 0.4 }, { cost: 55, slow: 0.3, range: 110 }] },
    psychic:   { cost: 80, range: 160, damage: 45, fireMs: 1800, levels: [{ cost: 70, damage: 80 }, { cost: 110, damage: 130 }] },
    lights:    { cost: 60, range: 80,  damage: 3,  stunMs: 600,  pulseMs: 3000, levels: [{ cost: 50, stunMs: 900 }, { cost: 80, stunMs: 1200, range: 100 }] },
  },
  enemies: {
    crawler: { hp: 20, speed: 80,  reward: 4, leak: 1 },
    brute:   { hp: 90, speed: 42,  reward: 9, leak: 3 },
    swarm:   { hp: 10, speed: 55, reward: 2, leak: 1 },     // flies straight over the maze
    boss:    { hp: 4000, speed: 9, reward: 0, leak: 20 },     // flies straight over the maze
  },
  waves: { count: 10, hpScalePerWave: 0.12, gapMs: 700, clearBonusBase: 10, clearBonusPerWave: 3 },
  boss: { thresholds: [0.75, 0.5, 0.25] },
  sword: { bossDamagePct: 0.15 },
  flip: { firstWave: 3, rollEveryMs: 10000, chancePerWave: 0.04, maxChance: 0.35, durationMs: 25000, warnMs: 1000, hpMult: 1.5, speedMult: 1.3 },
  pizza: { cost: 50, cooldownMs: 20000, speed: 160, radius: 40, damage: 15, saucedMs: 4000, saucedSpeedMult: 0.6, saucedDamageMult: 1.5 },
};
export default CONFIG;
