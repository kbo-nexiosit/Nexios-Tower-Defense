import CONFIG from '../config.js';
import { HUD_H } from './GameScene.js';
import * as sfx from '../audio/sfx.js';
import { upgradeCost } from '../logic/combat.js';
import { SHAPES, rotate } from '../logic/tetromino.js';

const FONT = { fontFamily: '"VT323", monospace', fontSize: '22px', color: '#e8e8f0' };
export const TOWER_INFO = [
  { type: 'slingshot', label: 'Slingshot' },
  { type: 'walkie', label: 'Walkie' },
  { type: 'psychic', label: 'Psychic' },
  { type: 'lights', label: 'Lights' },
];

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.add.rectangle(0, 0, 1280, HUD_H, 0x07070d, 0.94).setOrigin(0);
    this.add.rectangle(0, 0, 1280, 2, 0x2a2a44, 0.9).setOrigin(0);
    this.add.rectangle(0, HUD_H - 14, 1280, 14, 0x1a0a22, 0.6).setOrigin(0);
    this.add.rectangle(0, HUD_H, 1280, 2, 0xff3fa4, 0.9).setOrigin(0);
    this.add.rectangle(0, HUD_H + 2, 1280, 4, 0xff3fa4, 0.18).setOrigin(0);      // neon bleed
    this.coin = this.add.image(22, 18, 'coin');
    this.add.image(22, 42, 'heart');
    this.tokensText = this.add.text(40, 5, '', { ...FONT, color: '#ffb627', fontSize: '24px' });
    this.healthText = this.add.text(40, 31, '', { ...FONT, color: '#6bff6b' });
    this.waveText = this.add.text(150, 32, '', { ...FONT, color: '#ff8fc8' });

    this.towerButtons = TOWER_INFO.map((info, i) => this.makeTowerButton(info, 300 + i * 100));
    this.refreshButtons();
    this.waveText.setText('LV 1 · WAVE 0/1');
    this.nextBossText = this.add.text(12, 60, '', { ...FONT, fontSize: '18px', color: '#ff6a6a', stroke: '#000', strokeThickness: 3 });
    this.bossNameText = this.add.text(640, 76, '', { ...FONT, fontSize: '16px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2).setVisible(false);

    // Start-wave button (also: SPACE).
    this.startBtn = this.add.rectangle(1112, 28, 150, 44, 0x3a0d1f).setStrokeStyle(2, 0xff3fa4).setInteractive({ useHandCursor: true });
    this.startTxt = this.add.text(1112, 28, '▶ START WAVE', { ...FONT, fontSize: '20px', color: '#ff3fa4' }).setOrigin(0.5);
    this.startBtn.on('pointerdown', () => this.scene.get('Game').startWave());
    this.tweens.add({ targets: this.startTxt, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    // Upgrade panel for the selected kid.
    this.upBtn = this.add.rectangle(710, 28, 110, 44, 0x2a2310).setStrokeStyle(2, 0xffc94a).setInteractive({ useHandCursor: true }).setVisible(false);
    this.upTxt = this.add.text(710, 28, '', { ...FONT, fontSize: '18px', color: '#ffc94a', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.upBtn.on('pointerdown', () => this.scene.get('Game').upgradeSelected());

    // Boss health bar (no name, no title).
    this.bossBarBg = this.add.rectangle(640, 76, 604, 16, 0x000000, 0.8).setStrokeStyle(2, 0xff2a3a).setVisible(false);
    this.bossBar = this.add.rectangle(340, 76, 600, 12, 0xff2a3a).setOrigin(0, 0.5).setVisible(false);

    // Pizza Hut van (also: P), with a cooldown bar.
    this.pizzaBtn = this.add.rectangle(830, 28, 120, 44, 0x2a0e0c).setStrokeStyle(2, 0xd1201a).setInteractive({ useHandCursor: true });
    this.pizzaCool = this.add.rectangle(770, 28, 120, 44, 0x000000, 0.65).setOrigin(0, 0.5).setScale(0, 1);
    this.pizzaTxt = this.add.text(830, 28, `🍕 PIZZA [P]\n${CONFIG.pizza.cost} tok`, { ...FONT, fontSize: '16px', color: '#ffd6cf', align: 'center' }).setOrigin(0.5);
    this.pizzaBtn.on('pointerdown', () => this.scene.get('Game').callPizza());

    // Nexios Sword button (also: S).
    this.swordBtn = this.add.rectangle(955, 28, 120, 44, 0x10141c).setStrokeStyle(2, 0x3a3a55).setInteractive({ useHandCursor: true });
    this.swordTxt = this.add.text(955, 28, '⚔ SWORD [S]', { ...FONT, fontSize: '18px', color: '#dfe6ee' }).setOrigin(0.5);
    this.swordBtn.on('pointerdown', () => this.scene.get('Game').useSword());
    this.swordGlow = this.tweens.add({ targets: this.swordBtn, alpha: 0.55, duration: 400, yoyo: true, repeat: -1, paused: true });
    this.setSword(0);

    // Upside Down alert.
    this.upsideTxt = this.add.text(640, 100, '', { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#ff2a3a', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5).setShadow(0, 0, '#ff2a3a', 16, true, true).setVisible(false);
    this.upsidePulse = this.tweens.add({ targets: this.upsideTxt, alpha: 0.4, duration: 450, yoyo: true, repeat: -1, paused: true });

    // Block preview (current + next), bottom-left; and the "choose a kid" hint.
    this.shapePanel = this.add.rectangle(8, 712, 196, 70, 0x07070d, 0.8).setOrigin(0, 1).setStrokeStyle(1, 0xff3fa4, 0.6);
    this.add.text(16, 648, 'BLOCK', { ...FONT, fontSize: '16px', color: '#ffd84a' });
    this.add.text(112, 648, 'NEXT', { ...FONT, fontSize: '16px', color: '#9aa0b8' });
    this.add.text(16, 694, 'R / right-click: rotate', { ...FONT, fontSize: '13px', color: '#9aa0b8' });
    this.shapeGfx = this.add.graphics();
    this.pickHint = this.add.text(640, 84, 'Choose a kid for this block  (1-4)  •  Esc cancels', { ...FONT, fontSize: '22px', color: '#ffd84a', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setVisible(false);

    // Mute toggle.
    const mute = this.add.text(1254, 28, sfx.isMuted() ? '🔇' : '🔊', { fontSize: '22px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => { sfx.setMuted(!sfx.isMuted()); mute.setText(sfx.isMuted() ? '🔇' : '🔊'); });

    // Music only (sound effects keep playing). Also: M.
    const note = this.add.text(1216, 28, '🎵', { fontSize: '22px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const slash = this.add.rectangle(1216, 28, 30, 3, 0xff3a3a).setAngle(-45);
    const showMusic = () => { note.setAlpha(sfx.isMusicMuted() ? 0.4 : 1); slash.setVisible(sfx.isMusicMuted()); };
    const toggleMusic = () => { sfx.setMusicMuted(!sfx.isMusicMuted()); showMusic(); };
    note.on('pointerdown', toggleMusic);
    this.input.keyboard.on('keydown-M', toggleMusic);
    showMusic();

    this.input.on('pointerdown', () => sfx.unlock());
    const ev = this.game.events;
    const on = (name, fn) => { ev.on(name, fn, this); this.events.once('shutdown', () => ev.off(name, fn, this)); };
    on('tokens', n => {
      if (n > this.tokens) this.tweens.add({ targets: this.coin, scale: 1.35, duration: 90, yoyo: true });   // coin bounces on income
      this.tokens = n; this.tokensText.setText(`${n} tokens`); this.refreshButtons(); this.refreshUpgrade();
    });
    on('health', n => this.healthText.setText(`${n}/${CONFIG.baseHealth}`).setColor(n > CONFIG.baseHealth * 0.5 ? '#6bff6b' : n > CONFIG.baseHealth * 0.25 ? '#ffd84a' : '#ff4a4a'));
    on('run', r => {
      this.waveText.setText(r.bossStage ? `LV ${r.level} · BOSS` : `LV ${r.level} · WAVE ${r.waveInLevel}/${r.waves}`);
      this.nextBossText.setText((r.bossStage ? 'Boss: ' : 'Next boss: ') + r.bossName + (r.bosses ? `   •   bosses beaten: ${r.bosses}` : ''));
    });
    on('bossName', n => this.bossNameText.setText(n));
    on('bossHp', (hp, max) => {
      const show = hp > 0;
      this.bossBarBg.setVisible(show); this.bossBar.setVisible(show); this.bossNameText.setVisible(show);
      this.bossBar.width = 600 * Math.max(0, hp / max);
    });
    on('sword', n => this.setSword(n));
    on('pizza', ms => {
      this.pizzaCool.setScale(1, 1);
      this.tweens.add({ targets: this.pizzaCool, scaleX: 0, duration: ms });
    });
    on('upsideWarn', () => { this.upsideTxt.setText('something is wrong…').setVisible(true); this.upsidePulse.resume(); });
    on('upside', active => {
      if (active) { this.upsideTxt.setText('THE UPSIDE DOWN'); this.upsideTxt.setVisible(true); this.upsidePulse.resume(); }
      else { this.upsideTxt.setVisible(false); this.upsidePulse.pause(); }
    });
    on('picking', on => {
      this.picking = on; this.refreshButtons();
      this.pickHint.setVisible(on);
      this.towerButtons.forEach(b => { this.tweens.killTweensOf(b.bg); b.bg.setAlpha(1); if (on && this.tokens >= b.cost) this.tweens.add({ targets: b.bg, alpha: 0.55, duration: 300, yoyo: true, repeat: -1 }); });
    });
    on('shapes', ({ current, next, rot }) => this.drawShapes(current, next, rot));
    on('towerSelected', t => { this.selectedTower = t; this.refreshUpgrade(); });
    on('waveState', active => {
      this.startBtn.setVisible(!active); this.startTxt.setVisible(!active);
    });
    this.tokens = 0;
    this.scene.get('Game').emitAll();   // UI starts a frame after Game; pull current values
    this.scene.get('Game').emitShapes();
    this.scene.get('Game').emitRun();
  }

  makeTowerButton(info, x) {
    const cost = CONFIG.towers[info.type].cost;
    const bg = this.add.rectangle(x, 28, 94, 44, 0x1b1b2a).setStrokeStyle(2, 0x3a3a55).setInteractive({ useHandCursor: true });
    const icon = this.add.image(x - 30, 28, info.type);
    icon.setScale(Math.min(30 / icon.width, 38 / icon.height));
    const label = this.add.text(x - 12, 12, `${info.label}\n${cost} tok`, { ...FONT, fontSize: '16px' });
    bg.on('pointerdown', () => this.scene.get('Game').chooseKid(info.type));
    return { ...info, cost, bg, icon, label };
  }

  setSword(n) {
    const ready = n > 0;
    this.swordBtn.setStrokeStyle(2, ready ? 0xdfe6ee : 0x3a3a55).setFillStyle(ready ? 0x2a3550 : 0x10141c).setAlpha(1);
    this.swordTxt.setAlpha(ready ? 1 : 0.35);
    if (ready) this.swordGlow.resume(); else { this.swordGlow.pause(); this.swordBtn.setAlpha(1); }
  }

  drawShapes(current, next, rot) {
    const g = this.shapeGfx.clear();
    const draw = (name, r, x, y, size, col) => {
      rotate(SHAPES[name], r).forEach(([c, rr]) => { g.fillStyle(col, 1).fillRect(x + c * size, y + rr * size, size - 2, size - 2); });
    };
    draw(current, rot, 18, 668, 7, 0xffd84a);
    draw(next, 0, 114, 668, 7, 0x6a6e80);
  }

  refreshUpgrade() {
    const t = this.selectedTower;
    const show = !!t;
    this.upBtn?.setVisible(show); this.upTxt?.setVisible(show);
    if (!show) return;
    const cost = upgradeCost(t.type, t.level);
    if (cost === null) { this.upTxt.setText('MAX  Lv10'); this.upBtn.setAlpha(0.5); return; }
    this.upTxt.setText(`UPGRADE [U]\nLv${t.level + 1}→${t.level + 2}  ${cost} tok`);
    this.upBtn.setAlpha(this.tokens >= cost ? 1 : 0.4);
  }

  refreshButtons() {
    this.pizzaTxt?.setAlpha(this.tokens >= CONFIG.pizza.cost ? 1 : 0.45);
    for (const b of this.towerButtons ?? []) {
      const afford = this.tokens >= b.cost;
      b.bg.setStrokeStyle(2, this.picking && afford ? 0xffd84a : 0x3a3a55);
      b.icon.setAlpha(afford ? 1 : 0.35); b.label.setAlpha(afford ? 1 : 0.45);
    }
  }

  banner(text, color = '#ffffff', sub = '', withBell = true) {
    const bell = this.add.image(640, 240, 'bell').setDepth(30).setScale(1.6).setAngle(-25).setVisible(withBell);
    const t = this.add.text(640, 340, text, { fontFamily: '"Press Start 2P", monospace', fontSize: '34px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(30);
    const st = this.add.text(640, 392, sub, { fontFamily: '"VT323", monospace', fontSize: '27px', color: '#ffffff', stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: bell, angle: 25, duration: 220, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [bell, t, st], alpha: 0, delay: 1800, duration: 500, onComplete: () => { bell.destroy(); t.destroy(); st.destroy(); } });
  }

  tip(text) {
    const t = this.add.text(640, 660, text, { fontFamily: '"VT323", monospace', fontSize: '24px', color: '#ffc94a', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, delay: 4000, duration: 800, onComplete: () => t.destroy() });
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

  toast(text) {
    const t = this.add.text(640, 660, text, { fontFamily: '"VT323", monospace', fontSize: '27px', color: '#ffffff', stroke: '#d1201a', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, y: 630, delay: 1800, duration: 600, onComplete: () => t.destroy() });
  }

}
