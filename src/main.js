import CONFIG from './config.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.world.width,
  height: CONFIG.world.height,
  pixelArt: true,
  backgroundColor: '#0b0b14',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
});
