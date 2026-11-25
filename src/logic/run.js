// The endless run: level N = N waves, then a boss. Bosses repeat (harder) after eight.
export const BOSS_ORDER = ['itPartner', 'agileFirm', 'serviceBus', 'javaOverlord', 'sirDotNet', 'cloudConsultant', 'bsodPreventer', 'big5'];
export const BOSS_NAMES = {
  itPartner: 'The IT Partner', agileFirm: 'The Agile Firm', serviceBus: 'Captain Service Bus', javaOverlord: 'The Java Overlord',
  sirDotNet: 'Sir .Net', cloudConsultant: 'The Cloud Consultant', bsodPreventer: 'The BSOD Preventer', big5: 'The Big 5 IT',
};

export function bossFor(level) {
  const i = (level - 1) % BOSS_ORDER.length, key = BOSS_ORDER[i];
  return { key, name: BOSS_NAMES[key], lap: Math.floor((level - 1) / BOSS_ORDER.length) };
}

export function bossHp(level) {
  return 1200 * (1 + 0.35 * (level - 1)) * Math.pow(1.5, bossFor(level).lap);
}

export const levelWaves = level => level;

// Best first: more bosses beaten, then more waves survived.
export function compareScores(a, b) {
  return (b.bosses - a.bosses) || (b.waves - a.waves);
}
