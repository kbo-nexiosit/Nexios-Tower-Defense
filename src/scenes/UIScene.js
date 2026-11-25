import CONFIG from '../config.js';
import { HUD_H } from './GameScene.js';
import * as sfx from '../audio/sfx.js';

const FONT = { fontFamily: 'monospace', fontSize: '16px', color: '#e8e8f0' };
export const TOWER_INFO = [
  { type: 'slingshot', label: 'Slingshot' },
];

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.add.rectangle(0, 0, 1280, HUD_H, 0x07070d, 0.92).setOrigin(0);
    this.add.rectangle(0, HUD_H, 1280, 2, 0xff3fa4, 0.8).setOrigin(0);
    this.tokensText = this.add.text(14, 10, '', { ...FONT, color: '#ffb627', fontSize: '18px' });
    this.healthText = this.add.text(14, 32, '', { ...FONT, color: '#6bff6b' });
    this.waveText = this.add.text(170, 10, '', FONT);

    this.towerButtons = TOWER_INFO.map((info, i) => this.makeTowerButton(info, 330 + i * 110));
    this.refreshButtons();
    this.waveText.setText(`Wave 0/${CONFIG.waves.count}`);

    // Start-wave button (also: SPACE).
    this.startBtn = this.add.rectangle(1130, 28, 150, 44, 0x3a0d1f).setStrokeStyle(2, 0xff3fa4).setInteractive({ useHandCursor: true });
    this.startTxt = this.add.text(1130, 28, '▶ START WAVE', { ...FONT, fontSize: '15px', color: '#ff3fa4' }).setOrigin(0.5);
    this.startBtn.on('pointerdown', () => this.scene.get('Game').startWave());
    this.tweens.add({ targets: this.startTxt, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    // Mute toggle.
    const mute = this.add.text(1246, 28, sfx.isMuted() ? '🔇' : '🔊', { fontSize: '22px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => { sfx.setMuted(!sfx.isMuted()); mute.setText(sfx.isMuted() ? '🔇' : '🔊'); });

    const ev = this.game.events;
    const on = (name, fn) => { ev.on(name, fn, this); this.events.once('shutdown', () => ev.off(name, fn, this)); };
    on('tokens', n => { this.tokens = n; this.tokensText.setText(`Tokens: ${n}`); this.refreshButtons(); });
    on('health', n => this.healthText.setText(`Office: ${n}/${CONFIG.baseHealth}`));
    on('wave', w => this.waveText.setText(`Wave ${w}/${CONFIG.waves.count}`));
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

  refreshButtons() {
    const sel = this.registry.get('selected');
    for (const b of this.towerButtons ?? []) {
      const afford = this.tokens >= b.cost;
      b.bg.setStrokeStyle(2, b.type === sel ? 0xff3fa4 : 0x3a3a55);
      b.icon.setAlpha(afford ? 1 : 0.35); b.label.setAlpha(afford ? 1 : 0.45);
    }
  }
}
