import { pickTarget, towerStats, applySlow, applyStun } from '../logic/combat.js';

export function placeTower(scene, type, x, y) {
  const t = { type, level: 0, x, y, lastFire: -Infinity, ...towerStats(type, 0) };
  t.sprite = scene.add.image(x, y, type).setDepth(4).setInteractive({ useHandCursor: true });
  // a little idle bob so the kids feel alive
  scene.tweens.add({ targets: t.sprite, y: y - 2, duration: 600 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  t.pips = scene.add.text(x, y + 26, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffc94a' }).setOrigin(0.5).setDepth(4);
  t.sprite.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); scene.selectTower(t); });
  t.sprite.on('pointerover', () => { if (!scene.selected) scene.rangeRing.setPosition(t.x, t.y).setRadius(t.range).setVisible(true); scene.ghost.setAlpha(0); });
  t.sprite.on('pointerout', () => { if (!scene.selected) scene.rangeRing.setVisible(false); scene.ghost.setAlpha(1); });
  return t;
}

export function upgradeTowerStats(t) {
  t.level++;
  Object.assign(t, towerStats(t.type, t.level));
  t.pips.setText('★'.repeat(t.level));
  t.sprite.setScale(1 + t.level * 0.1);
}

const inRange = (t, enemies) => enemies.filter(e => e.alive && Math.hypot(e.x - t.x, e.y - t.y) <= t.range);

// The boss shrugs off stuns and most of a slow, or lights would lock him in place.
const BOSS_MIN_SLOW = 0.75;

// Fires if ready. `hit(target, damage)` applies damage and pays rewards.
export function stepTower(scene, t, enemies, now, hit) {
  const every = t.fireMs ?? t.pulseMs;
  if (now - t.lastFire < every) return;

  if (t.type === 'walkie' || t.type === 'lights') {
    const targets = inRange(t, enemies);
    if (!targets.length) return;
    t.lastFire = now;
    for (const e of targets) {
      if (t.type === 'walkie') applySlow(e, e.type === 'boss' ? Math.max(t.slow, BOSS_MIN_SLOW) : t.slow, t.slowMs, now);
      else { if (e.type !== 'boss') applyStun(e, t.stunMs, now); hit(e, t.damage); }
    }
    ring(scene, t, t.type === 'walkie' ? 0x6bff9a : 0xffdd33);
    if (t.type === 'walkie') scene.sfx?.pulse(); else scene.sfx?.shot();
    return;
  }

  const target = pickTarget(t, enemies);
  if (!target) return;
  t.lastFire = now;
  if (t.type === 'psychic') {
    const g = scene.add.graphics().setDepth(8);
    g.lineStyle(6, 0xd94adf, 0.5).lineBetween(t.x, t.y, target.x, target.y);
    g.lineStyle(2, 0xffffff, 1).lineBetween(t.x, t.y, target.x, target.y);
    scene.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    scene.cameras.main.shake(80, 0.003);
    scene.sfx?.zap();
    hit(target, t.damage);
    return;
  }
  const shot = scene.add.image(t.x, t.y, 'pebble').setDepth(8);
  scene.tweens.add({
    targets: shot, x: target.x, y: target.y, duration: 120,
    onComplete: () => { shot.destroy(); hit(target, t.damage); },
  });
  scene.sfx?.shot();
}

function ring(scene, t, color) {
  const c = scene.add.circle(t.x, t.y, 8).setStrokeStyle(3, color, 0.9).setDepth(3);
  scene.tweens.add({ targets: c, radius: t.range, alpha: 0, duration: 450, onComplete: () => c.destroy() });
}
