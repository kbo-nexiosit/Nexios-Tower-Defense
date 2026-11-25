import CONFIG from './config.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import EndScene from './scenes/EndScene.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.world.width,
  height: CONFIG.world.height,
  pixelArt: true,
  backgroundColor: '#0b0b14',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [GameScene, UIScene, EndScene],
});
