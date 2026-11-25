import { test } from 'node:test'; import assert from 'node:assert/strict';
import CONFIG from '../src/config.js';
import { totalSpent, sellValue, upgradeCost } from '../src/logic/combat.js';
import { createGrid, setObstacles, placeBlock, removeBlock, distanceField, edgeCells, isOpen } from '../src/logic/grid.js';

test('a fresh kid has cost exactly its price', () => { assert.equal(totalSpent('slingshot', 0), 25); assert.equal(totalSpent('psychic', 0), 80); });
test('total spent adds every upgrade paid so far', () => {
  assert.equal(totalSpent('psychic', 2), 80 + upgradeCost('psychic', 0) + upgradeCost('psychic', 1));   // 80 + 60 + 80
  assert.equal(totalSpent('psychic', 2), 220);
});
test('selling refunds 60% of everything spent, rounded down', () => {
  assert.equal(CONFIG.sell.refundPct, 0.6);
  assert.equal(sellValue('slingshot', 0), 15);
  assert.equal(sellValue('walkie', 0), 24);
  assert.equal(sellValue('psychic', 2), 132);
});
test('selling never pays back more than was spent (no money loop)', () => {
  for (const type of Object.keys(CONFIG.towers)) for (let lv = 0; lv < CONFIG.upgrade.maxLevel; lv++) assert.ok(sellValue(type, lv) < totalSpent(type, lv));
});
test('buy, upgrade, sell always loses tokens compared with never buying', () => {
  const spent = totalSpent('lights', 9);
  assert.ok(spent - sellValue('lights', 9) >= spent * 0.4 - 1e-9);
});

test('removeBlock opens exactly that block\'s squares', () => {
  const g = createGrid(7, 5); setObstacles(g, [[0, 0]]);
  placeBlock(g, [[2, 1], [2, 2]], 4); placeBlock(g, [[3, 1], [3, 2]], 5);
  assert.equal(removeBlock(g, 4), 2);
  assert.ok(isOpen(g, 2, 1) && isOpen(g, 2, 2));
  assert.ok(!isOpen(g, 3, 1) && !isOpen(g, 3, 2));   // the neighbour stays
  assert.ok(!isOpen(g, 0, 0));                        // houses and trees stay
});
test('removeBlock on an unknown id changes nothing', () => {
  const g = createGrid(7, 5); placeBlock(g, [[2, 1]], 4);
  assert.equal(removeBlock(g, 9), 0); assert.ok(!isOpen(g, 2, 1));
  assert.equal(removeBlock(g, 0), 0); assert.equal(removeBlock(g, -1), 0);
});
test('selling a block shortens (never lengthens) the route', () => {
  const g = createGrid(7, 5), goal = [6, 2];
  placeBlock(g, [[3, 0], [3, 1], [3, 2], [3, 3]], 1);
  const before = distanceField(g, goal)[2 * g.cols + 0];
  removeBlock(g, 1);
  const after = distanceField(g, goal)[2 * g.cols + 0];
  assert.ok(before > after); assert.equal(after, 6);
});
test('a walled-in square fires again once its neighbour is sold', () => {
  const g = createGrid(5, 1);                       // one row: the middle of three blocks is boxed in
  placeBlock(g, [[1, 0]], 1); placeBlock(g, [[2, 0]], 2); placeBlock(g, [[3, 0]], 3);
  assert.deepEqual(edgeCells(g, [[2, 0]]), []);
  removeBlock(g, 3);
  assert.deepEqual(edgeCells(g, [[2, 0]]), [[2, 0]]);
});
