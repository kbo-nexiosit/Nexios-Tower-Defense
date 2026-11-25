// Timing rules for the boss twists. t = ms since the boss appeared.
export const partnerSpeedMult = t => Math.min(1.5, 1 + 0.05 * Math.floor(t / 5000));
export const agileSprinting = t => t % 4000 < 1000;
export const cloudOffline = t => t % 6000 >= 4000;
export const bsodShielded = t => t % 7000 >= 5000;
// True when a multiple of `period` (> 0) falls in (prevT, t].
export const crossedEvery = (prevT, t, period) => Math.floor(t / period) > Math.floor(prevT / period);
