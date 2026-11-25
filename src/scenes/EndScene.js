import * as sfx from '../audio/sfx.js';

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create({ won, wave = 0 }) {
    const cx = 640;
    this.add.rectangle(0, 0, 1280, 720, won ? 0x0b1020 : 0x1a0005).setOrigin(0);
    this.add.text(cx, 220, won ? 'OFFICE SAVED' : 'THE GATE IS OPEN',
      { fontFamily: 'monospace', fontSize: '64px', color: won ? '#6bff6b' : '#ff2a3a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 300, won ? 'The kids held the line. The Upside Down retreats.' : `The monsters overran the NexiosIT office on wave ${wave}.`,
      { fontFamily: 'monospace', fontSize: '20px', color: '#e8e8f0' }).setOrigin(0.5);
    this.extra(won, cx);
    const btn = this.add.text(cx, 520, '[ PLAY AGAIN ]', { fontFamily: 'monospace', fontSize: '28px', color: '#ff3fa4' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#ff3fa4'));
    btn.on('pointerdown', () => this.scene.start('Game'));
  }

  extra(won, cx) {
    if (!won) return;
    const logo = this.add.image(cx, 390, 'logo');
    logo.setScale(Math.min(240 / logo.width, 46 / logo.height));
    this.add.text(cx, 440, 'Your partner for software, cloud & AI solutions — and monster removal.',
      { fontFamily: 'monospace', fontSize: '16px', color: '#9aa0b8' }).setOrigin(0.5);
    const bell = this.add.image(cx, 110, 'bell').setScale(1.6);
    this.tweens.add({ targets: bell, angle: { from: -25, to: 25 }, duration: 260, yoyo: true, repeat: 5, ease: 'Sine.easeInOut' });
    [0, 0.9, 1.8].forEach(t => sfx.bell(t));
  }
}
