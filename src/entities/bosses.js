import CONFIG from '../config.js';
import { partnerSpeedMult, agileSprinting, cloudOffline, bsodShielded, crossedEvery } from '../logic/bossTimers.js';
import { spawnEnemy, removeEnemy } from './Enemy.js';

// One twist per boss. update() runs every frame; onPhase(threshold) at 75/50/25% health.
const ring = (scene, e, color) => {
  if (!e.ring) e.ring = scene.add.circle(e.x, e.y, 46).setStrokeStyle(4, color, 0.9).setDepth(6.5);
  e.ring.setPosition(e.x, e.y);
  return e.ring;
};

export const BEHAVIOUR = {
  // Bills by the hour: his minions speed up the longer he's alive.
  itPartner: {
    update(scene, e) {
      const m = partnerSpeedMult(e.age);
      for (const o of scene.enemies) if (o !== e && o.alive) o.speed = o.baseSpeed * m;
    },
  },
  // Sprints: 3x speed for 1 s out of every 4.
  agileFirm: {
    update(scene, e) {
      const sprint = agileSprinting(e.age);
      e.speed = e.baseSpeed * (sprint ? 3 : 1);
      e.sprite.setAngle(sprint ? 8 : 0);
    },
  },
  // Drives the maze; every phase unloads 4 crawlers at its stop.
  serviceBus: {
    onPhase(scene, e) {
      scene.ui.toast('Captain Service Bus delivers a batch of messages!');
      for (let i = 0; i < 4; i++) scene.time.delayedCall(i * 250, () => {
        if (!e.alive || scene.over) return;
        const m = spawnEnemy(scene, 'crawler', 1 + CONFIG.waves.hpScalePerWave * scene.wave, scene.spawnMods());
        m.cell = [...e.cell]; m.next = e.next; m.x = e.x; m.y = e.y; m.sprite.setPosition(e.x, e.y);
        scene.enemies.push(m);
      });
    },
  },
  // Coffee break every 8 s: heals 6% of max health.
  javaOverlord: {
    update(scene, e, dt) {
      if (crossedEvery(e.age - dt, e.age, 8000)) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.06);
        scene.game.events.emit('bossHp', e.hp, e.maxHp);
        scene.puff(e.x, e.y - 30, 0xd8d8e8);
        scene.ui.toast('The Java Overlord takes a coffee break (+6% health)');
      }
    },
  },
  // Every 6 s nets the nearest block: it stops firing for 3 s.
  sirDotNet: {
    update(scene, e, dt) {
      if (!crossedEvery(e.age - dt, e.age, 6000) || !scene.towers.length) return;
      const b = scene.towers.reduce((a, t) => (Math.hypot(t.x - e.x, t.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? t : a));
      b.jammedUntil = scene.now + 3000;
      b.tiles.forEach(t => t.setTint(0x777777));
      const net = scene.add.graphics().setDepth(4.5);
      net.lineStyle(2, 0xc8b080, 0.9);
      b.cells.forEach(c => { const p = scene.cellCenter(c); for (let k = -16; k <= 16; k += 8) { net.lineBetween(p.x - 16, p.y + k, p.x + 16, p.y + k); net.lineBetween(p.x + k, p.y - 16, p.x + k, p.y + 16); } });
      const line = scene.add.graphics().setDepth(4.5).lineStyle(2, 0xc8b080, 0.8).lineBetween(e.x, e.y, b.x, b.y);
      scene.tweens.add({ targets: line, alpha: 0, duration: 400, onComplete: () => line.destroy() });
      scene.time.delayedCall(3000, () => { net.destroy(); b.tiles.forEach(t => t.clearTint()); });
    },
  },
  // Goes "offline" 2 s out of every 6: can't be targeted or hurt.
  cloudConsultant: {
    update(scene, e) {
      e.untargetable = cloudOffline(e.age);
      e.sprite.setAlpha(e.untargetable ? 0.3 : 1);
    },
  },
  // Blue shield 2 s out of every 7: blocks all damage.
  bsodPreventer: {
    update(scene, e) {
      e.untargetable = bsodShielded(e.age);
      ring(scene, e, 0x4a8aff).setVisible(e.untargetable);
    },
    cleanup(e) { e.ring?.destroy(); },
  },
  // At 50% health splits into five smaller partners; the level clears when all five fall.
  big5: {
    onPhase(scene, e, t) {
      if (t !== 0.5 || e.split) return;
      e.split = true;
      scene.ui.toast('The Big 5 IT splits up!');
      const hp = e.maxHp * 0.08;
      for (let i = 0; i < 5; i++) {
        const m = spawnEnemy(scene, 'mini', 1, scene.spawnMods());
        m.hp = m.maxHp = hp;
        m.from = { x: e.x + (i - 2) * 26, y: e.y + (i % 2 ? 20 : -20) };
        m.len = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y); m.flown = 0;
        m.x = m.from.x; m.y = m.from.y;
        scene.enemies.push(m);
      }
      scene.boss = null;
      scene.game.events.emit('bossHp', 0, e.maxHp);
      scene.puff(e.x, e.y, 0xaaaaaa);
      removeEnemy(e);
    },
  },
};
