export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create({ won }) {
    const cx = 640;
    this.add.rectangle(0, 0, 1280, 720, won ? 0x0b1020 : 0x1a0005).setOrigin(0);
    this.add.text(cx, 220, won ? 'OFFICE SAVED' : 'THE GATE IS OPEN',
      { fontFamily: 'monospace', fontSize: '64px', color: won ? '#6bff6b' : '#ff2a3a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 300, won ? 'The kids held the line. The Upside Down retreats.' : 'The monsters overran the NexiosIT office.',
      { fontFamily: 'monospace', fontSize: '20px', color: '#e8e8f0' }).setOrigin(0.5);
    this.extra(won, cx);
    const btn = this.add.text(cx, 520, '[ PLAY AGAIN ]', { fontFamily: 'monospace', fontSize: '28px', color: '#ff3fa4' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#ff3fa4'));
    btn.on('pointerdown', () => this.scene.start('Game'));
  }

  extra() {}
}
