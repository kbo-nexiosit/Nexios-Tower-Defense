// All game textures, generated as pixel art at startup (see pixel.js / sprites.js).
import { pixTexture, Pix } from './pixel.js';
import * as S from './sprites.js';

export const PALETTE = {
  night: 0x0b0b14, grass: 0x14201a, road: 0x2b2633, roadEdge: 0x4a4256,
  rift: 0xff2a3a, glass: 0x3fa9f5, glassDark: 0x1c4f7a, steel: 0x8892a6,
  neonPink: 0xff3fa4, neonCyan: 0x3ff2ff, amber: 0xffb627, white: 0xffffff,
};

export const PIXEL_FONT = '"Press Start 2P", monospace';
export const UI_FONT = '"VT323", monospace';

function tiny(scene, key, w, h, color) {
  if (scene.textures.exists(key)) return;
  pixTexture(scene, key, [new Pix(w, h).rect(0, 0, w, h, color)], 1);
}

export function makeTextures(scene) {
  pixTexture(scene, 'slingshot', [S.kidSlingshot()]);
  pixTexture(scene, 'walkie', [S.kidWalkie()]);
  pixTexture(scene, 'psychic', [S.kidPsychic()]);
  pixTexture(scene, 'lights', [S.lightsPost()]);
  pixTexture(scene, 'crawler', S.crawlerFrames());
  pixTexture(scene, 'brute', S.bruteFrames());
  pixTexture(scene, 'swarm', S.swarmFrames());
  pixTexture(scene, 'boss', S.bossFrames(), 3);
  pixTexture(scene, 'bart', S.friendlyBartFrames(), 2);
  Object.keys(S.BOSS_ART).forEach(k => pixTexture(scene, 'boss-' + k, S.bossArtFrames(k), 2));
  pixTexture(scene, 'van', [S.van()]);
  pixTexture(scene, 'bell', [S.bell()]);
  pixTexture(scene, 'sword', [S.sword()]);
  pixTexture(scene, 'pebble', [S.pebble()]);
  Object.entries(S.KID_COLOURS).forEach(([k, col]) => pixTexture(scene, 'tile-' + k, [S.crateTile(col)]));
  pixTexture(scene, 'tile-wall', [S.wallTile()]);
  pixTexture(scene, 'rift', S.riftFrames());
  pixTexture(scene, 'shadow', [S.shadowBlob()]);
  pixTexture(scene, 'spark', [S.spark()]);
  pixTexture(scene, 'smoke', [S.smoke()]);
  pixTexture(scene, 'psybolt', [S.psyBolt()]);
  pixTexture(scene, 'coin', [S.coin()]);
  pixTexture(scene, 'heart', [S.heart()]);
  tiny(scene, 'dot', 4, 4, '#ffffff');
  tiny(scene, 'ash', 3, 3, '#cfc8d6');
  if (!scene.textures.exists('sauce')) pixTexture(scene, 'sauce', [new Pix(4, 4).rect(1, 0, 2, 4, '#d1201a').rect(0, 1, 4, 2, '#d1201a')], 1);

  const anims = scene.anims;
  if (!anims.exists('rift-shimmer')) anims.create({ key: 'rift-shimmer', frames: [0, 1, 2].map(frame => ({ key: 'rift', frame })), frameRate: 7, repeat: -1 });
  [['crawler', 8], ['brute', 4], ['swarm', 10], ['boss', 2], ...Object.keys(S.BOSS_ART).map(k => ['boss-' + k, 3])].forEach(([key, rate]) => {
    if (!anims.exists(key + '-walk')) anims.create({ key: key + '-walk', frames: [{ key, frame: 0 }, { key, frame: 1 }], frameRate: rate, repeat: -1 });
  });
}
