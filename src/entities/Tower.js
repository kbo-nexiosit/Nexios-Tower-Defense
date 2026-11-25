import { towerStats, applySlow, applyStun, pickTargetFrom, inRangeOfAny } from '../logic/combat.js';
import { edgeCells } from '../logic/grid.js';

// A tower is a dropped Tetris block run by one kid. Only its edge squares fire;
// squares boxed in by other blocks become plain walls.
export function placeBlock(scene, type, cells, id) {
  const b = { id, type, level: 0, cells, lastFire: -Infinity, ...towerStats(type, 0) };
  const pts = cells.map(c => scene.cellCenter(c));
  b.x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  b.y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  b.tiles = pts.map(p => scene.add.image(p.x, p.y, 'tile-' + type).setDepth(4));
  b.kid = scene.add.image(b.x, b.y, type).setDepth(4.3).setScale(0.72);
  scene.tweens.add({ targets: b.kid, scaleY: 0.69, duration: 600 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  b.pips = scene.add.text(b.x, b.y, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffc94a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(4.4);
  refreshBlock(scene, b);
  return b;
}

// Recompute which squares fire (call after any block is placed).
export function refreshBlock(scene, b) {
  const edges = edgeCells(scene.grid, b.cells);
  const isEdge = new Set(edges.map(([c, r]) => c + ',' + r));
  b.edges = edges.map(c => scene.cellCenter(c));
  b.cells.forEach(([c, r], i) => b.tiles[i].setTexture(isEdge.has(c + ',' + r) ? 'tile-' + b.type : 'tile-wall'));
  // The kid stands on the edge square nearest the block's middle (greyed out if fully walled in).
  const spot = b.edges.length ? b.edges.reduce((a, p) => (Math.hypot(p.x - b.x, p.y - b.y) < Math.hypot(a.x - b.x, a.y - b.y) ? p : a)) : { x: b.x, y: b.y };
  b.kid.setPosition(spot.x, spot.y - 6).setAlpha(b.edges.length ? 1 : 0.35);
  b.pips.setPosition(spot.x, spot.y + 12);
}

export function upgradeTowerStats(t) {
  t.level++;
  Object.assign(t, towerStats(t.type, t.level));
  t.pips.setText('★'.repeat(t.level));
}

// The boss shrugs off stuns and most of a slow, or lights would lock him in place.
const BOSS_MIN_SLOW = 0.75;

// Fires if ready. `hit(target, damage)` applies damage and pays rewards.
export function stepTower(scene, t, enemies, now, hit) {
  if (!t.edges.length) return;
  const every = t.fireMs ?? t.pulseMs;
  if (now - t.lastFire < every) return;

  if (t.type === 'walkie' || t.type === 'lights') {
    const targets = inRangeOfAny(t.edges, t.range, enemies);
    if (!targets.length) return;
    t.lastFire = now;
    for (const e of targets) {
      if (t.type === 'walkie') applySlow(e, e.type === 'boss' ? Math.max(t.slow, BOSS_MIN_SLOW) : t.slow, t.slowMs, now);
      else { if (e.type !== 'boss') applyStun(e, t.stunMs, now); hit(e, t.damage); }
    }
    const from = pickTargetFrom(t.edges, t.range, targets)?.origin ?? t.edges[0];
    ring(scene, from, t.range, t.type === 'walkie' ? 0x6bff9a : 0xffdd33);
    if (t.type === 'walkie') scene.sfx?.pulse(); else scene.sfx?.shot();
    return;
  }

  const pick = pickTargetFrom(t.edges, t.range, enemies);
  if (!pick) return;
  const { target, origin } = pick;
  t.lastFire = now;
  if (t.type === 'psychic') {
    const g = scene.add.graphics().setDepth(8);
    g.lineStyle(6, 0xd94adf, 0.5).lineBetween(origin.x, origin.y, target.x, target.y);
    g.lineStyle(2, 0xffffff, 1).lineBetween(origin.x, origin.y, target.x, target.y);
    scene.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    scene.cameras.main.shake(80, 0.003);
    scene.sfx?.zap();
    hit(target, t.damage);
    return;
  }
  const shot = scene.add.image(origin.x, origin.y, 'pebble').setDepth(8);
  scene.tweens.add({
    targets: shot, x: target.x, y: target.y, duration: 120,
    onComplete: () => { shot.destroy(); hit(target, t.damage); },
  });
  scene.sfx?.shot();
}

function ring(scene, p, range, color) {
  const c = scene.add.circle(p.x, p.y, 8).setStrokeStyle(3, color, 0.9).setDepth(3.9);
  scene.tweens.add({ targets: c, radius: range, alpha: 0, duration: 450, onComplete: () => c.destroy() });
}
