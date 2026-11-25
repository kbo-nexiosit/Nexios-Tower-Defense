import { makeTextures } from '../art/textures.js';
import { makeTitleBackdrop, makeGlow } from '../art/environment.js';
import * as sfx from '../audio/sfx.js';
import { loadBoard, saveBoard } from '../logic/leaderboard.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  preload() {
    this.load.image('logo', './assets/nexios-logo.webp');
  }

  create() {
    makeTextures(this);
    const cx = 640;
    makeTitleBackdrop(this); makeGlow(this);
    this.add.rectangle(0, 0, 1280, 720, 0x05050a).setOrigin(0);
    this.add.image(0, 0, 'title-bg').setOrigin(0).setScale(2);
    const ADD = Phaser.BlendModes.ADD;
    const moon = this.add.image(1040, 124, 'glow').setTint(0xc8d0ff).setBlendMode(ADD).setScale(7).setAlpha(0.22);
    this.tweens.add({ targets: moon, alpha: 0.12, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let i = 0; i < 22; i++) {   // twinkling stars
      const st = this.add.image(Phaser.Math.Between(10, 1270), Phaser.Math.Between(10, 440), 'dot').setScale(0.5).setAlpha(0.9);
      this.tweens.add({ targets: st, alpha: 0.1, duration: Phaser.Math.Between(500, 1600), delay: Phaser.Math.Between(0, 2000), yoyo: true, repeat: -1 });
    }
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
    this.add.text(cx, 345, 'Defend the NexiosIT office. Every level brings more waves and a new boss.',
      { fontFamily: '"VT323", monospace', fontSize: '27px', color: '#e8e8f0' }).setOrigin(0.5);
    this.add.text(cx, 430,
      'Drop Tetris blocks to build a maze  •  Pick a kid for every block  •  Ring the bell\nOnly edge squares fire  •  No leaks = the Nexios Sword  •  Beware the Upside Down\n\nR rotate   •   1-4 pick kid   •   U upgrade (Lv10 max)   •   X sell   •   SPACE wave   •   S sword   •   P pizza   •   M music',
      { fontFamily: '"VT323", monospace', fontSize: '20px', color: '#9aa0b8', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    // A little standoff: the kids with flashlights facing monsters by the Rift.
    const kids = ['slingshot', 'walkie', 'psychic'];
    kids.forEach((k, i) => {
      const x = 190 + i * 90, y = 636;
      this.add.image(x, y + 38, 'shadow').setScale(2.2, 1.6).setAlpha(0.45);
      const beam = this.add.triangle(x + 14, y - 8, 0, 40, 300, 0, 300, 80, 0xfff2c4, 0.10).setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: beam, alpha: 0.04, duration: 900 + i * 200, yoyo: true, repeat: -1 });
      this.add.image(x, y, k).setScale(1.6);
    });
    this.add.image(110, 632, 'lights').setScale(1.6);
    const riftGlow = this.add.image(1190, 590, 'glow').setTint(0xff2a3a).setBlendMode(ADD).setScale(8, 11).setAlpha(0.5);
    this.tweens.add({ targets: riftGlow, alpha: 0.25, scaleX: 9.5, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    const rift = this.add.sprite(1190, 590, 'rift', 0).setScale(1.5).play('rift-shimmer');
    this.tweens.add({ targets: rift, scaleX: 1.7, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    this.add.particles(1190, 590, 'dot', {
      x: { min: -12, max: 12 }, y: { min: -70, max: 70 }, speedX: { min: -60, max: -10 }, speedY: { min: -30, max: 6 },
      lifespan: { min: 900, max: 2200 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: 0xff6a50, frequency: 110, blendMode: ADD,
    });
    this.add.image(1040, 674, 'shadow').setScale(2.4, 1.6).setAlpha(0.45);
    this.add.image(930, 660, 'shadow').setScale(2.6, 1.4).setAlpha(0.45);
    this.add.sprite(1040, 630, 'brute', 0).setScale(1.5).setFlipX(true).play('brute-walk');
    this.add.sprite(930, 644, 'crawler', 0).setScale(1.5).setFlipX(true).play('crawler-walk');
    this.add.sprite(1110, 560, 'swarm', 0).setScale(1.5).play('swarm-walk');

    const start = this.add.text(cx, 560, 'CLICK TO START', { fontFamily: '"Press Start 2P", monospace', fontSize: '26px', color: '#ff3fa4' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // Arcade hall of fame (this browser only).
    let storage = null; try { storage = window.localStorage; } catch {}
    const board = storage ? loadBoard(storage) : [];
    const VT = '"VT323", monospace';
    this.add.rectangle(1040, 24, 220, 168, 0x07070d, 0.72).setOrigin(0).setStrokeStyle(1, 0xff3fa4, 0.6);
    this.add.text(1150, 32, 'HIGH SCORES', { fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#ffd84a' }).setOrigin(0.5, 0);
    for (let i = 0; i < 5; i++) {
      const e = board[i];
      this.add.text(1150, 56 + i * 22, e ? `${i + 1}. ${e.initials}  ${e.bosses} bosses  ${e.waves} w` : `${i + 1}. ---`, { fontFamily: VT, fontSize: '21px', color: e ? '#e8e8f0' : '#4a4e60' }).setOrigin(0.5, 0);
    }
    const reset = this.add.text(1150, 170, 'reset scores', { fontFamily: VT, fontSize: '18px', color: '#6a6e80' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    let armed = 0;
    reset.on('pointerdown', () => {
      if (Date.now() - armed < 3000) { if (storage) saveBoard(storage, []); this.scene.restart(); return; }
      armed = Date.now(); reset.setText('click again to wipe').setColor('#ff6a6a');
      this.time.delayedCall(3000, () => reset.active && reset.setText('reset scores').setColor('#6a6e80'));
    });

    this.input.on('pointerdown', (p, over) => {
      if (over.includes(reset)) return;
      sfx.unlock();
      this.scene.start('Game');
    });
  }
}
