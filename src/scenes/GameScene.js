import CONFIG from '../config.js';
import { ROAD } from '../logic/path.js';
import { createWallet } from '../logic/economy.js';
import { applyDamage, canPlace } from '../logic/combat.js';
import { makeTextures, PALETTE } from '../art/textures.js';
import { spawnEnemy, stepEnemy, removeEnemy, enemyReward, enemyLeak } from '../entities/Enemy.js';
import { placeTower, stepTower, upgradeTowerStats } from '../entities/Tower.js';
import { upgradeCost } from '../logic/combat.js';
import { crossedThresholds } from '../logic/boss.js';
import { createSword } from '../logic/sword.js';
import { waveSchedule, clearBonus } from '../logic/waves.js';
import * as sfx from '../audio/sfx.js';

export const HUD_H = 56;
// Areas where kids cannot stand: the HUD, the office, the DPG building, the rift.
const BLOCKED = [
  { x: 0, y: 0, w: 1280, h: HUD_H + 8 },
  { x: 1080, y: 60, w: 200, h: 205 },   // DPG Media
  { x: 1080, y: 285, w: 200, h: 250 },  // NexiosIT office
  { x: 0, y: 100, w: 50, h: 100 },      // the Rift
];
const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    makeTextures(this);
    this.wallet = createWallet(CONFIG.startTokens);
    this.health = CONFIG.baseHealth;
    this.enemies = [];
    this.towers = [];
    this.over = false;
    this.now = 0;
    this.bossDefeated = false;
    this.sword = createSword();
    this.boss = null;
    this.sfx = sfx;
    this.wave = 0;
    this.waveActive = false;
    this.pendingSpawns = 0;
    this.leaksThisWave = 0;
    this.registry.set('selected', 'slingshot');

    this.drawMap();
    this.ghost = this.add.circle(0, 0, 10, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.5).setDepth(20).setVisible(false);
    this.rangeRing = this.add.circle(0, 0, 10).setStrokeStyle(2, PALETTE.neonCyan, 0.8).setDepth(3).setVisible(false);

    this.input.on('pointermove', p => this.updateGhost(p));
    this.input.on('pointerdown', p => this.tryPlace(p));

    this.scene.launch('UI');
    this.input.keyboard.on('keydown-SPACE', () => this.startWave());
    this.input.keyboard.on('keydown-S', () => this.useSword());
    if (new URLSearchParams(location.search).has('debug')) {
      // Debug: B jumps straight to the boss wave.
      this.input.keyboard.on('keydown-B', () => { if (!this.waveActive) { this.wave = CONFIG.waves.count - 1; this.wallet.earn(2000); this.emitAll(); this.startWave(); } });
    }
    this.emitAll();
    sfx.ambient(true);
  }

  // Modifiers for newly spawned enemies (the Upside Down changes these).
  spawnMods() { return { hpMult: 1, speedMult: 1 }; }

  startWave() {
    if (this.over || this.waveActive || this.wave >= CONFIG.waves.count) return;
    this.wave++;
    this.waveActive = true;
    this.leaksThisWave = 0;
    const schedule = waveSchedule(this.wave);
    this.pendingSpawns = schedule.length;
    for (const s of schedule) {
      // Scene time pauses while the tab is hidden, so no burst on return.
      this.time.delayedCall(s.atMs, () => {
        if (this.over || this.bossDefeated) { this.pendingSpawns--; return; }
        const e = spawnEnemy(this, s.type, s.hpScale, this.spawnMods());
        if (e.type === 'boss') this.bossEntrance(e);
        this.enemies.push(e);
        this.pendingSpawns--;
        this.events.emit('spawned', e);
      });
    }
    this.game.events.emit('wave', this.wave);
    this.game.events.emit('waveState', true);
  }

  waveCleared() {
    this.waveActive = false;
    const info = { wave: this.wave, leaks: this.leaksThisWave };
    this.events.emit('waveCleared', info);
    this.game.events.emit('waveCleared', info);
    sfx.bell();
    const bonus = clearBonus(this.wave);
    this.wallet.earn(bonus);
    this.game.events.emit('tokens', this.wallet.tokens);
    this.banner('WAVE CLEARED', '#ffc94a', `+${bonus} tokens`);
    if (this.sword.onWaveCleared(this.leaksThisWave)) {
      this.game.events.emit('sword', this.sword.charges);
      this.time.delayedCall(2300, () => {
        if (this.over) return;
        this.banner('PERFECT WAVE', '#dfe6ee', 'THE NEXIOS SWORD IS YOURS — press S', false);
        this.swordSprite(640, 470, 1.4).setAlpha(0).setDepth(31);
      });
    }
    if (this.wave >= CONFIG.waves.count) { this.endGame(true); return; }
    this.game.events.emit('waveState', false);
  }

  // The GoT-style Nexios Sword with the Nexios wordmark etched on the blade.
  swordSprite(x, y, scale) {
    const blade = this.add.image(0, 0, 'sword');
    const logo = this.add.image(40, 0, 'logo').setTint(0x1c2433);
    logo.setScale(Math.min(110 / logo.width, 9 / logo.height));
    const c = this.add.container(x, y, [blade, logo]).setScale(scale);
    this.tweens.add({ targets: c, alpha: 1, duration: 300, hold: 1400, yoyo: true, onComplete: () => c.destroy() });
    return c;
  }

  useSword() {
    if (this.over || !this.enemies.some(e => e.alive) || !this.sword.use()) return;   // never wasted on an empty board
    this.game.events.emit('sword', this.sword.charges);
    sfx.sword();
    const c = this.add.container(-400, 380, [this.add.image(0, 0, 'sword')]).setScale(3).setDepth(40).setAngle(-12);
    const logo = this.add.image(40, 0, 'logo').setTint(0x1c2433);
    logo.setScale(Math.min(110 / logo.width, 9 / logo.height));
    c.add(logo);
    this.tweens.add({ targets: c, x: 1700, angle: 12, duration: 600, ease: 'Cubic.easeIn', onComplete: () => c.destroy() });
    const slash = this.add.rectangle(640, 380, 1280, 10, 0xffffff, 0.9).setDepth(39).setScale(0, 1);
    this.tweens.add({ targets: slash, scaleX: 1, duration: 450, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: slash, alpha: 0, scaleY: 8, delay: 450, duration: 400, onComplete: () => slash.destroy() });
    this.time.delayedCall(420, () => {
      this.cameras.main.flash(250, 255, 255, 255);
      this.cameras.main.shake(300, 0.01);
      for (const e of [...this.enemies]) {
        if (!e.alive) continue;
        if (e.type === 'boss') this.hit(e, CONFIG.sword.bossDamagePct * e.maxHp);
        else this.hit(e, e.hp * 10 + 1);   // slices through like butter
      }
    });
  }

  bossEntrance(e) {
    this.boss = e;
    sfx.boss();
    this.cameras.main.shake(900, 0.012);
    this.cameras.main.flash(400, 120, 0, 0);
    this.tweens.add({ targets: e.sprite, scaleX: 1.08, scaleY: 0.94, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.game.events.emit('bossHp', e.hp, e.maxHp);
  }

  bossPhase() {
    this.events.emit('bossPhase');
    sfx.boss();
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(300, 160, 0, 30);
  }

  bossDefeat(e) {
    this.bossDefeated = true;
    this.boss = null;
    this.game.events.emit('bossHp', 0, e.maxHp);
    this.cameras.main.shake(1200, 0.02);
    this.cameras.main.flash(800, 255, 255, 255);
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 120, () => this.puff(e.x + Phaser.Math.Between(-30, 30), e.y + Phaser.Math.Between(-40, 40), 0xff3030));
    // The rest of the horde flees back through the Rift.
    for (const o of this.enemies) if (o.alive && o !== e) { this.puff(o.x, o.y, 0x8a3a3a); removeEnemy(o); }
  }

  banner(text, color = '#ffffff', sub = '', withBell = true) {
    const bell = this.add.image(640, 250, 'bell').setDepth(30).setScale(2).setAngle(-25).setVisible(withBell);
    const t = this.add.text(640, 340, text, { fontFamily: 'monospace', fontSize: '48px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(30);
    const st = this.add.text(640, 392, sub, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: bell, angle: 25, duration: 220, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [bell, t, st], alpha: 0, delay: 1800, duration: 500, onComplete: () => { bell.destroy(); t.destroy(); st.destroy(); } });
  }

  emitAll() {
    this.game.events.emit('tokens', this.wallet.tokens);
    this.game.events.emit('health', this.health);
  }

  drawMap() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(PALETTE.grass); g.fillRect(0, 0, 1280, 720);
    // Little town: dark houses with a few warm windows, kept off the road.
    const rnd = new Phaser.Math.RandomDataGenerator(['upside']);
    for (let i = 0; i < 70; i++) {
      const x = rnd.between(60, 1040), y = rnd.between(80, 690);
      if (!canPlace({ x, y }, [], ROAD, 50, 0)) continue;
      g.fillStyle(0x1d1a24); g.fillRect(x - 14, y - 10, 28, 20);
      g.fillStyle(0x2a2433); g.fillTriangle(x - 17, y - 10, x + 17, y - 10, x, y - 22);
      if (rnd.frac() < 0.5) { g.fillStyle(PALETTE.amber, 0.8); g.fillRect(x - 8, y - 4, 5, 5); }
    }
    // Road.
    const road = this.add.graphics().setDepth(1);
    road.lineStyle(52, PALETTE.roadEdge); road.strokePoints(ROAD.map(p => new Phaser.Math.Vector2(p.x, p.y)));
    road.lineStyle(44, PALETTE.road); road.strokePoints(ROAD.map(p => new Phaser.Math.Vector2(p.x, p.y)));
    for (let i = 0; i < ROAD.length; i++) { road.fillStyle(PALETTE.road); road.fillCircle(ROAD[i].x, ROAD[i].y, 22); }
    // The Rift.
    const rift = this.add.ellipse(14, 150, 34, 90, PALETTE.rift).setDepth(2);
    this.add.ellipse(14, 150, 14, 70, 0x2a0008).setDepth(2);
    this.tweens.add({ targets: rift, scaleX: 1.25, alpha: 0.7, yoyo: true, repeat: -1, duration: 700 });
    this.drawBuildings();
  }

  drawBuildings() {
    const g = this.add.graphics().setDepth(2);
    // DPG Media: big grey media block.
    g.fillStyle(0x3b3f4a); g.fillRect(1095, 70, 170, 185);
    g.fillStyle(0x2a2d36); for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) g.fillRect(1105 + c * 26, 104 + r * 24, 18, 14);
    g.fillStyle(0xffe08a, 0.7); [[1, 2], [3, 0], [4, 4], [0, 5]].forEach(([r, c]) => g.fillRect(1105 + c * 26, 104 + r * 24, 18, 14));
    this.add.text(1180, 86, 'DPG MEDIA', { fontFamily: 'monospace', fontSize: '16px', color: '#e8e8f0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    // NexiosIT office: 4 storeys of glass.
    const ox = 1095, oy = 300, ow = 170, oh = 225, floor = oh / 4;
    g.fillStyle(PALETTE.glassDark); g.fillRect(ox, oy, ow, oh);
    for (let f = 0; f < 4; f++) {
      for (let c = 0; c < 6; c++) {
        g.fillStyle(PALETTE.glass, (f + c) % 3 === 0 ? 0.95 : 0.55);
        g.fillRect(ox + 6 + c * 27, oy + 8 + f * floor, 23, floor - 14);
      }
      g.fillStyle(PALETTE.steel); g.fillRect(ox, oy + (f + 1) * floor - 4, ow, 4);
    }
    g.fillStyle(0x0b0b14); g.fillRect(ox - 6, 388, 12, 24);           // entrance where the road ends
    const logo = this.add.image(ox + ow / 2, oy - 14, 'logo').setDepth(3);
    logo.setScale(Math.min(150 / logo.width, 26 / logo.height));
    this.officeFlash = this.add.rectangle(ox + ow / 2, oy + oh / 2, ow, oh, 0xff0000, 0).setDepth(3);
  }

  isFree(p) {
    if (p.x < 16 || p.x > 1264 || p.y > 704) return false;
    if (BLOCKED.some(r => inRect(p, r))) return false;
    return canPlace(p, this.towers, ROAD);
  }

  updateGhost(p) {
    const type = this.registry.get('selected');
    if (!type || p.y < HUD_H) { this.ghost.setVisible(false); return; }
    const ok = this.isFree(p) && this.wallet.tokens >= CONFIG.towers[type].cost;
    this.ghost.setPosition(p.x, p.y).setRadius(CONFIG.towers[type].range).setVisible(true)
      .setFillStyle(ok ? 0xffffff : 0xff3030, 0.12).setStrokeStyle(2, ok ? 0xffffff : 0xff3030, 0.5);
  }

  tryPlace(p) {
    if (this.over || p.y < HUD_H) return;
    this.selectTower(null);
    const type = this.registry.get('selected');
    if (!type || !this.isFree(p)) return;
    if (!this.wallet.spend(CONFIG.towers[type].cost)) return;
    this.towers.push(placeTower(this, type, p.x, p.y));
    this.game.events.emit('tokens', this.wallet.tokens);
    this.updateGhost(p);
  }

  selectTower(t) {
    this.selected = t;
    if (!t) { this.rangeRing.setVisible(false); this.game.events.emit('towerSelected', null); return; }
    this.rangeRing.setPosition(t.x, t.y).setRadius(t.range).setVisible(true);
    this.game.events.emit('towerSelected', t);
  }

  upgradeSelected() {
    const t = this.selected;
    if (!t || this.over) return;
    const cost = upgradeCost(t.type, t.level);
    if (cost === null || !this.wallet.spend(cost)) return;
    upgradeTowerStats(t);
    this.game.events.emit('tokens', this.wallet.tokens);
    this.selectTower(t);
    this.puff(t.x, t.y, 0xffc94a);
  }

  hit(target, damage) {
    const prevHp = target.hp;
    const { killed } = applyDamage(target, damage, this.now);
    if (target.type === 'boss') {
      crossedThresholds(prevHp, target.hp, target.maxHp).forEach(() => this.bossPhase());
      this.game.events.emit('bossHp', Math.max(0, target.hp), target.maxHp);
      if (killed) { this.bossDefeat(target); removeEnemy(target); return; }
    }
    if (!killed) return;
    this.wallet.earn(enemyReward(target));
    this.game.events.emit('tokens', this.wallet.tokens);
    this.puff(target.x, target.y, 0xd94a6a);
    removeEnemy(target);
  }

  puff(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const d = this.add.image(x, y, 'dot').setTint(color).setDepth(9);
      this.tweens.add({ targets: d, x: x + Phaser.Math.Between(-24, 24), y: y + Phaser.Math.Between(-24, 24), alpha: 0, duration: 350, onComplete: () => d.destroy() });
    }
  }

  leak(e) {
    this.health = Math.max(0, this.health - enemyLeak(e));
    this.leaksThisWave++;
    removeEnemy(e);
    this.game.events.emit('health', this.health);
    this.cameras.main.shake(150, 0.006);
    this.officeFlash.setAlpha(0.35);
    this.tweens.add({ targets: this.officeFlash, alpha: 0, duration: 300 });
    if (this.health <= 0) this.endGame(false);
  }

  endGame(won) {
    if (this.over) return;
    this.over = true;
    sfx.ambient(false);
    this.time.delayedCall(600, () => { this.scene.stop('UI'); this.scene.start('End', { won }); });
  }

  update(time, delta) {
    if (this.over) return;
    const dt = Math.min(delta, 50);
    this.now += dt;   // game clock: only advances with frames, never jumps
    const now = this.now;
    for (const e of this.enemies) {
      if (e.alive && stepEnemy(this, e, dt, now)) this.leak(e);
    }
    this.enemies = this.enemies.filter(e => e.alive);
    const hit = (t, d) => this.hit(t, d);
    for (const t of this.towers) stepTower(this, t, this.enemies, now, hit);
    if (this.waveActive && this.pendingSpawns === 0 && this.enemies.length === 0) this.waveCleared();
  }
}
