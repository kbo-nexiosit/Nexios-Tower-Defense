import CONFIG from '../config.js';
import { HUD_H } from './GameScene.js';
import * as sfx from '../audio/sfx.js';
import { upgradeCost } from '../logic/combat.js';

const FONT = { fontFamily: 'monospace', fontSize: '16px', color: '#e8e8f0' };
export const TOWER_INFO = [
  { type: 'slingshot', label: 'Slingshot' },
  { type: 'walkie', label: 'Walkie' },
  { type: 'psychic', label: 'Psychic' },
  { type: 'lights', label: 'X-mas Lights' },
];

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.add.rectangle(0, 0, 1280, HUD_H, 0x07070d, 0.92).setOrigin(0);
    this.add.rectangle(0, HUD_H, 1280, 2, 0xff3fa4, 0.8).setOrigin(0);
    this.tokensText = this.add.text(14, 8, '', { ...FONT, color: '#ffb627', fontSize: '18px' });
    this.healthText = this.add.text(14, 32, '', { ...FONT, color: '#6bff6b' });
    this.waveText = this.add.text(150, 32, '', { ...FONT, color: '#ff8fc8' });

    this.towerButtons = TOWER_INFO.map((info, i) => this.makeTowerButton(info, 300 + i * 108));
    this.refreshButtons();
    this.waveText.setText(`Wave 0/${CONFIG.waves.count}`);

    // Start-wave button (also: SPACE).
    this.startBtn = this.add.rectangle(1130, 28, 150, 44, 0x3a0d1f).setStrokeStyle(2, 0xff3fa4).setInteractive({ useHandCursor: true });
    this.startTxt = this.add.text(1130, 28, '▶ START WAVE', { ...FONT, fontSize: '15px', color: '#ff3fa4' }).setOrigin(0.5);
    this.startBtn.on('pointerdown', () => this.scene.get('Game').startWave());
    this.tweens.add({ targets: this.startTxt, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    // Upgrade panel for the selected kid.
    this.upBtn = this.add.rectangle(810, 28, 130, 44, 0x2a2310).setStrokeStyle(2, 0xffc94a).setInteractive({ useHandCursor: true }).setVisible(false);
    this.upTxt = this.add.text(810, 28, '', { ...FONT, fontSize: '13px', color: '#ffc94a', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.upBtn.on('pointerdown', () => this.scene.get('Game').upgradeSelected());

    // Boss health bar (no name, no title).
    this.bossBarBg = this.add.rectangle(640, 76, 604, 16, 0x000000, 0.8).setStrokeStyle(2, 0xff2a3a).setVisible(false);
    this.bossBar = this.add.rectangle(340, 76, 600, 12, 0xff2a3a).setOrigin(0, 0.5).setVisible(false);

    // Mute toggle.
    const mute = this.add.text(1246, 28, sfx.isMuted() ? '🔇' : '🔊', { fontSize: '22px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => { sfx.setMuted(!sfx.isMuted()); mute.setText(sfx.isMuted() ? '🔇' : '🔊'); });

    const ev = this.game.events;
    const on = (name, fn) => { ev.on(name, fn, this); this.events.once('shutdown', () => ev.off(name, fn, this)); };
    on('tokens', n => { this.tokens = n; this.tokensText.setText(`Tokens: ${n}`); this.refreshButtons(); this.refreshUpgrade(); });
    on('health', n => this.healthText.setText(`Office: ${n}/${CONFIG.baseHealth}`));
    on('wave', w => this.waveText.setText(`Wave ${w}/${CONFIG.waves.count}`));
    on('bossHp', (hp, max) => {
      const show = hp > 0;
      this.bossBarBg.setVisible(show); this.bossBar.setVisible(show);
      this.bossBar.width = 600 * Math.max(0, hp / max);
    });
    on('towerSelected', t => { this.selectedTower = t; this.refreshUpgrade(); });
    on('waveState', active => {
      this.startBtn.setVisible(!active); this.startTxt.setVisible(!active);
    });
    this.tokens = 0;
    this.scene.get('Game').emitAll();   // UI starts a frame after Game; pull current values
  }

  makeTowerButton(info, x) {
    const cost = CONFIG.towers[info.type].cost;
    const bg = this.add.rectangle(x, 28, 100, 44, 0x1b1b2a).setStrokeStyle(2, 0x3a3a55).setInteractive({ useHandCursor: true });
    const icon = this.add.image(x - 32, 28, info.type).setScale(0.9);
    const label = this.add.text(x - 12, 12, `${info.label}\n${cost} tok`, { ...FONT, fontSize: '12px' });
    bg.on('pointerdown', () => { this.registry.set('selected', info.type); this.refreshButtons(); });
    return { ...info, cost, bg, icon, label };
  }

  refreshUpgrade() {
    const t = this.selectedTower;
    const show = !!t;
    this.upBtn?.setVisible(show); this.upTxt?.setVisible(show);
    if (!show) return;
    const cost = upgradeCost(t.type, t.level);
    if (cost === null) { this.upTxt.setText('MAX LEVEL'); this.upBtn.setAlpha(0.5); return; }
    this.upTxt.setText(`UPGRADE ▲${t.level + 1}\n${cost} tok`);
    this.upBtn.setAlpha(this.tokens >= cost ? 1 : 0.4);
  }

  refreshButtons() {
    const sel = this.registry.get('selected');
    for (const b of this.towerButtons ?? []) {
      const afford = this.tokens >= b.cost;
      b.bg.setStrokeStyle(2, b.type === sel ? 0xff3fa4 : 0x3a3a55);
      b.icon.setAlpha(afford ? 1 : 0.35); b.label.setAlpha(afford ? 1 : 0.45);
    }
  }
}
