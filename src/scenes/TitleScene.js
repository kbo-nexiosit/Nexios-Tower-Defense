import { makeTextures } from '../art/textures.js';
import * as sfx from '../audio/sfx.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  preload() {
    this.load.image('logo', './assets/nexios-logo.webp');
  }

  create() {
    makeTextures(this);
    const cx = 640;
    this.add.rectangle(0, 0, 1280, 720, 0x05050a).setOrigin(0);
    // Drifting ash for mood.
    for (let i = 0; i < 60; i++) {
      const a = this.add.image(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), 'ash').setAlpha(0.4);
      this.tweens.add({ targets: a, y: a.y + 760, x: a.x + Phaser.Math.Between(-60, 60), duration: Phaser.Math.Between(6000, 12000), repeat: -1,
        onRepeat: () => { a.y = -20; } });
    }
    const title = this.add.text(cx, 200, 'UPSIDE DEFENSE', {
      fontFamily: 'Georgia, serif', fontSize: '96px', color: '#05050a', fontStyle: 'bold',
      stroke: '#ff2a3a', strokeThickness: 4,
    }).setOrigin(0.5).setShadow(0, 0, '#ff2a3a', 24, true, true);
    this.tweens.add({ targets: title, alpha: 0.75, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2600 });   // neon flicker

    const logo = this.add.image(cx, 300, 'logo');
    logo.setScale(Math.min(260 / logo.width, 50 / logo.height));
    this.add.text(cx, 345, 'The kids must defend the NexiosIT office until dawn.',
      { fontFamily: 'monospace', fontSize: '20px', color: '#e8e8f0' }).setOrigin(0.5);
    this.add.text(cx, 430,
      'Place kids beside the road  •  Earn arcade tokens  •  Ring the bell\nClear a wave with no leaks to win the Nexios Sword  •  Beware the Upside Down',
      { fontFamily: 'monospace', fontSize: '15px', color: '#9aa0b8', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    const start = this.add.text(cx, 560, 'CLICK TO START', { fontFamily: 'monospace', fontSize: '32px', color: '#ff3fa4' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => {
      sfx.unlock();
      this.scene.start('Game');
    });
  }
}
