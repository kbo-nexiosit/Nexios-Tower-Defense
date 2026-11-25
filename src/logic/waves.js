import CONFIG from '../config.js';

function counts(n) {
  return {
    crawler: 6 + 2 * n,
    brute: n >= 3 ? n - 2 : 0,
    swarm: n >= 5 ? 2 * (n - 4) + 2 : 0,
  };
}

// Interleave types so a wave isn't all one kind in a row.
function interleave(c) {
  const out = [];
  const left = { ...c };
  while (Object.values(left).some(v => v > 0)) {
    for (const type of ['crawler', 'crawler', 'swarm', 'brute']) {
      if (left[type] > 0) { out.push(type); left[type]--; }
    }
  }
  return out;
}

export function waveSchedule(n) {
  const { hpScalePerWave, gapMs, count } = CONFIG.waves;
  const hpScale = 1 + hpScalePerWave * (n - 1);
  if (n >= count) {
    const escorts = interleave({ crawler: 10, brute: 4, swarm: 6 })
      .map((type, i) => ({ type, atMs: 3000 + i * gapMs, hpScale }));
    return [{ type: 'boss', atMs: 0, hpScale: 1 }, ...escorts];
  }
  return interleave(counts(n)).map((type, i) => ({ type, atMs: i * gapMs, hpScale }));
}
