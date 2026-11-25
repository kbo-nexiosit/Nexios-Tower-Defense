import * as sfx from '../audio/sfx.js';
import { makeTitleBackdrop } from '../art/environment.js';
import { loadBoard, saveBoard, qualifies, insertScore } from '../logic/leaderboard.js';

const PIX = '"Press Start 2P", monospace', VT = '"VT323", monospace';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const store = () => { try { return window.localStorage; } catch { return null; } };

// Draws a top-N arcade table; returns the text objects so a row can flash.
export function drawBoard(scene, board, x, y, { rows = 10, highlight = -1, size = 26 } = {}) {
  const out = [];
  scene.add.text(x, y, 'RANK  NAME  BOSSES  WAVES', { fontFamily: VT, fontSize: size + 'px', color: '#9aa0b8' }).setOrigin(0.5, 0);
  for (let i = 0; i < rows; i++) {
    const e = board[i];
    const line = e ? `${String(i + 1).padStart(2, ' ')}.   ${e.initials}    ${String(e.bosses).padStart(3, ' ')}    ${String(e.waves).padStart(4, ' ')}` : `${String(i + 1).padStart(2, ' ')}.   ---     --     --`;
    const t = scene.add.text(x, y + (i + 1) * (size + 2), line, { fontFamily: VT, fontSize: size + 'px', color: i === highlight ? '#ffd84a' : e ? '#e8e8f0' : '#4a4e60' }).setOrigin(0.5, 0);
    if (i === highlight) scene.tweens.add({ targets: t, alpha: 0.25, duration: 300, yoyo: true, repeat: -1 });
    out.push(t);
  }
  return out;
}

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create({ score = { bosses: 0, waves: 0 } }) {
    const cx = 640;
    this.score = score;
    makeTitleBackdrop(this);
    this.add.rectangle(0, 0, 1280, 720, 0x1a0005).setOrigin(0);
    this.add.image(0, 0, 'title-bg').setOrigin(0).setScale(2).setTint(0xff5a5a);
    this.add.rectangle(0, 0, 1280, 720, 0x140004, 0.62).setOrigin(0);
    this.add.text(cx, 70, 'GAME OVER', { fontFamily: PIX, fontSize: '40px', color: '#ff2a3a' }).setOrigin(0.5);
    this.add.text(cx, 122, `Bosses beaten: ${score.bosses}     Waves survived: ${score.waves}`, { fontFamily: VT, fontSize: '32px', color: '#ffd84a' }).setOrigin(0.5);

    const storage = store();
    this.board = storage ? loadBoard(storage) : [];
    if (qualifies(this.board, score)) this.enterInitials(storage);
    else this.showBoard(-1);
  }

  // 80s cabinet style: three letters, arrows or typing, Enter to save.
  enterInitials(storage) {
    const cx = 640;
    sfx.bell(); sfx.bell(0.4);
    const title = this.add.text(cx, 190, 'NEW HIGH SCORE!  ENTER YOUR INITIALS', { fontFamily: PIX, fontSize: '18px', color: '#6bff6b' }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    const letters = [0, 0, 0];
    let slot = 0;
    const slots = [0, 1, 2].map(i => this.add.text(cx - 90 + i * 90, 290, 'A', { fontFamily: PIX, fontSize: '64px', color: '#ffffff' }).setOrigin(0.5));
    const caret = this.add.rectangle(cx - 90, 336, 60, 6, 0xff3fa4);
    this.add.text(cx, 380, '← → choose letter slot   •   ↑ ↓ or type a letter   •   ENTER to save', { fontFamily: VT, fontSize: '24px', color: '#9aa0b8' }).setOrigin(0.5);
    const render = () => slots.forEach((t, i) => { t.setText(LETTERS[letters[i]]); t.setColor(i === slot ? '#ffd84a' : '#ffffff'); caret.x = cx - 90 + slot * 90; });
    render();
    let done = false;
    const save = () => {
      if (done) return; done = true;
      const initials = letters.map(i => LETTERS[i]).join('');
      const r = insertScore(this.board, { initials, ...this.score });
      this.board = r.board;
      if (storage) saveBoard(storage, this.board);
      [title, caret, ...slots].forEach(o => o.destroy());
      this.children.list.filter(o => o.text && o.text.startsWith('← →')).forEach(o => o.destroy());
      this.input.keyboard.removeAllListeners();
      this.showBoard(r.rank);
    };
    this.input.keyboard.on('keydown', ev => {
      if (done) return;
      const k = ev.key;
      if (k === 'ArrowLeft') slot = (slot + 2) % 3;
      else if (k === 'ArrowRight') slot = (slot + 1) % 3;
      else if (k === 'ArrowUp') letters[slot] = (letters[slot] + 1) % 26;
      else if (k === 'ArrowDown') letters[slot] = (letters[slot] + 25) % 26;
      else if (k === 'Enter') return save();
      else if (k === 'Backspace') slot = Math.max(0, slot - 1);
      else if (/^[a-z]$/i.test(k)) { letters[slot] = LETTERS.indexOf(k.toUpperCase()); slot = Math.min(2, slot + 1); }
      render();
    });
    const ok = this.add.text(cx, 440, '[ SAVE ]', { fontFamily: VT, fontSize: '34px', color: '#ff3fa4' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    ok.on('pointerdown', () => { ok.destroy(); save(); });
  }

  showBoard(highlight) {
    const cx = 640;
    drawBoard(this, this.board, cx, 180, { highlight });
    const btn = this.add.text(cx, 640, '[ PLAY AGAIN ]', { fontFamily: VT, fontSize: '38px', color: '#ff3fa4' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#ff3fa4'));
    btn.on('pointerdown', () => this.scene.start('Game'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Game'));
  }
}
