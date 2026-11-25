// Wiring test for selling: drives the real GameScene / Tower / UIScene code against a stand-in for
// Phaser's drawing calls, so the board state (grid, route, wallet, HUD) is checked without a browser.
import { test } from 'node:test'; import assert from 'node:assert/strict';

globalThis.Phaser = { Scene: class {}, BlendModes: {}, Math: {} };
const { default: GameScene } = await import('../src/scenes/GameScene.js');
const { default: UIScene } = await import('../src/scenes/UIScene.js');
const { default: CONFIG } = await import('../src/config.js');
const { createWallet } = await import('../src/logic/economy.js');
const { createGrid, distanceField, routeFrom, isOpen } = await import('../src/logic/grid.js');
const { BEHAVIOUR } = await import('../src/entities/bosses.js');

// A game object that accepts any chained call (setDepth().setScale()...) and remembers a few things.
function thing(log, kind) {
  const state = { kind, destroyed: false, texture: null, text: '', visible: true, tinted: false };
  const p = new Proxy(state, { get(t, k) {
    if (k in t) return t[k];
    if (k === 'destroy') return () => { t.destroyed = true; };
    if (k === 'setTexture') return v => { t.texture = v; return p; };
    if (k === 'setText') return v => { t.text = v; return p; };
    if (k === 'setVisible') return v => { t.visible = v; return p; };
    if (k === 'setTint') return () => { t.tinted = true; return p; };
    if (k === 'clearTint') return () => { t.tinted = false; return p; };
    if (typeof k === 'symbol') return undefined;
    return () => p;
  } });
  log.push(p);
  return p;
}

function makeScene() {
  const M = CONFIG.maze, s = Object.create(GameScene.prototype);
  s.objects = []; s.emitted = []; s.floats = []; s.timers = [];
  const make = kind => (...a) => { const o = thing(s.objects, kind); if (kind === 'image') o.texture = a[2]; return o; };
  s.add = { rectangle: make('rect'), image: make('image'), text: make('text'), graphics: make('gfx'), circle: make('circle') };
  s.tweens = { add() {}, killTweensOf() {} };
  s.time = { delayedCall: (ms, fn) => s.timers.push(fn) };
  s.cameras = { main: { shake() {}, zoomY: 1 } };
  s.game = { events: { emit: (...a) => s.emitted.push(a) } };
  s.rangeGfx = thing([], 'gfx'); s.routeGfx = thing([], 'gfx'); s.previewGfx = thing([], 'gfx'); s.previewTxt = thing([], 'text');
  s.burst = () => {}; s.puff = () => {}; s.float = (x, y, text) => s.floats.push(text);
  Object.defineProperty(s, 'ui', { value: { toast() {} } });
  s.grid = createGrid(M.cols, M.rows); s.dist = distanceField(s.grid, M.goal);
  s.wallet = createWallet(1000); s.towers = []; s.enemies = []; s.nextId = 1; s.now = 0;
  s.bag = { next: () => 'O', peek: () => 'O' }; s.shape = 'O'; s.rot = 0;
  return s;
}
const drop = (s, type, cells) => { s.picking = { cells }; s.chooseKid(type); return s.towers.at(-1); };
const routeLen = s => routeFrom(s.grid, s.dist, CONFIG.maze.spawn).length;
// A wall across the route, one square short of the bottom, so the monsters must walk around it.
const wall = c => Array.from({ length: 19 }, (_, r) => [c, r]);

test('selling refunds 60%, frees the squares and removes every sprite of the block', () => {
  const s = makeScene();
  const b = drop(s, 'psychic', [[10, 9], [10, 10], [10, 11], [11, 10]]);
  assert.equal(s.wallet.tokens, 920);
  s.selectTower(b); s.upgradeSelected();                     // 60 for Lv2
  assert.equal(s.wallet.tokens, 860);
  s.sellSelected();
  assert.equal(s.wallet.tokens, 860 + 84);                    // floor(0.6 x 140)
  assert.equal(s.towers.length, 0);
  assert.equal(s.selected, null);
  b.cells.forEach(([c, r]) => assert.ok(isOpen(s.grid, c, r)));
  [...b.tiles, ...b.shadows, b.kid, b.pips].forEach(o => assert.ok(o.destroyed));
  assert.deepEqual(s.floats.at(-1), 'SOLD +84');
  assert.deepEqual(s.emitted.filter(e => e[0] === 'tokens').at(-1), ['tokens', 944]);
  assert.deepEqual(s.emitted.filter(e => e[0] === 'towerSelected').at(-1), ['towerSelected', null]);
});

test('the route is recomputed: selling a wall gives the monsters their short cut back', () => {
  const s = makeScene(), open = routeLen(s);
  const b = drop(s, 'slingshot', wall(15));
  assert.ok(routeLen(s) > open);
  s.selectTower(b); s.sellSelected();
  assert.equal(routeLen(s), open);
});

test('a neighbour that was walled in fires again after the sale', () => {
  const s = makeScene();
  const mid = drop(s, 'slingshot', [[0, 0]]);                 // corner square: only two open sides
  const right = drop(s, 'slingshot', [[1, 0]]), below = drop(s, 'slingshot', [[0, 1]]);
  assert.equal(mid.edges.length, 0); assert.equal(mid.tiles[0].texture, 'tile-wall');
  s.selectTower(right); s.sellSelected();
  assert.equal(mid.edges.length, 1); assert.equal(mid.tiles[0].texture, 'tile-slingshot');
  assert.equal(below.edges.length, 1);
});

test('nothing happens with no block selected, while choosing a kid, or after game over', () => {
  const s = makeScene();
  const b = drop(s, 'walkie', [[5, 5]]);
  s.sellSelected(); assert.equal(s.towers.length, 1);         // nothing selected
  s.selectTower(b);
  s.picking = { cells: [[7, 7]] }; s.sellSelected(); assert.equal(s.towers.length, 1);
  s.picking = null; s.over = true; s.sellSelected(); assert.equal(s.towers.length, 1);
  s.over = false; s.sellSelected(); assert.equal(s.towers.length, 0);
  s.sellSelected(); assert.equal(s.wallet.tokens, 1000 - 40 + 24);   // a second X pays nothing more
});

test('a block netted by Sir .Net can be sold: the net goes, the late timer leaves it alone', () => {
  const s = makeScene();
  const b = drop(s, 'lights', [[20, 10]]);
  BEHAVIOUR.sirDotNet.update(s, { age: 6000, x: 0, y: 0 }, 16);
  assert.ok(b.jammedUntil > 0 && b.net && !b.net.destroyed);
  const net = b.net;
  s.selectTower(b); s.sellSelected();
  assert.ok(net.destroyed);
  s.timers.forEach(fn => fn());                                // the 3 s un-net timer fires on a sold block
  assert.ok(b.sold);
});

test('a block netted twice keeps its second net until that one runs out', () => {
  const s = makeScene();
  const b = drop(s, 'lights', [[20, 10]]);
  BEHAVIOUR.sirDotNet.update(s, { age: 6000, x: 0, y: 0 }, 16);
  const first = b.net, firstTimer = s.timers.at(-1);
  BEHAVIOUR.sirDotNet.update(s, { age: 12000, x: 0, y: 0 }, 16);
  assert.ok(first.destroyed && b.net !== first);
  firstTimer(); assert.ok(b.tiles[0].tinted && !b.net.destroyed);
  s.timers.at(-1)(); assert.ok(!b.tiles[0].tinted && b.net === null);
});

test('HUD: the sell button shows the refund for the selected block and hides with it', () => {
  const ui = Object.create(UIScene.prototype), log = [];
  ui.upBtn = thing(log); ui.upTxt = thing(log); ui.sellBtn = thing(log); ui.sellTxt = thing(log); ui.tokens = 500;
  ui.selectedTower = { type: 'psychic', level: 2 }; ui.refreshUpgrade();
  assert.equal(ui.sellTxt.text, 'SELL [X]\n+132 tok'); assert.ok(ui.sellBtn.visible);
  ui.selectedTower = { type: 'slingshot', level: 9 }; ui.refreshUpgrade();    // maxed kids can still be sold
  assert.ok(ui.sellBtn.visible && ui.sellTxt.text.startsWith('SELL [X]'));
  ui.selectedTower = null; ui.refreshUpgrade();
  assert.ok(!ui.sellBtn.visible && !ui.sellTxt.visible);
});
