import CONFIG from './config.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import EndScene from './scenes/EndScene.js';

// Some GPUs fail to link Phaser's multi-texture shader ("Link Shader failed").
// maxTextures: 1 avoids that; ?canvas forces the Canvas renderer as a last resort.
const params = new URLSearchParams(location.search);
const forceCanvas = params.has('canvas');

// Wait (briefly) for the pixel fonts so Phaser doesn't bake text in a fallback font.
await Promise.race([
  Promise.all([document.fonts.load('22px "VT323"'), document.fonts.load('16px "Press Start 2P"')]),
  new Promise(r => setTimeout(r, 2500)),
]).catch(() => {});

export const game = new Phaser.Game({
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: CONFIG.world.width,
  height: CONFIG.world.height,
  pixelArt: true,
  backgroundColor: '#0b0b14',
  render: { maxTextures: 1 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, GameScene, UIScene, EndScene],
});

// If WebGL dies on startup anyway, reload once in Canvas mode.
window.addEventListener('error', ev => {
  if (!forceCanvas && /Shader|WebGL/i.test(String(ev.message))) {
    location.replace(location.pathname + '?canvas' + (params.has('debug') ? '&debug' : ''));
  }
});

if (params.has('debug')) window.__game = game;   // test hook, only with ?debug
