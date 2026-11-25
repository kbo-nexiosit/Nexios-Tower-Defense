import { test } from 'node:test'; import assert from 'node:assert/strict';
import { SHAPES, rotate, createBag, cellsAt } from '../src/logic/tetromino.js';
const key = cells => cells.map(([c, r]) => c + ',' + r).sort().join(' ');
test('seven shapes of four squares', () => {
  assert.deepEqual(Object.keys(SHAPES).sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  for (const s of Object.values(SHAPES)) assert.equal(s.length, 4);
});
test('rotating I makes it vertical, normalised to 0,0', () => assert.equal(key(rotate(SHAPES.I, 1)), key([[0, 0], [0, 1], [0, 2], [0, 3]])));
test('four rotations return the shape', () => { for (const s of Object.values(SHAPES)) assert.equal(key(rotate(s, 4)), key(s)); });
test('O does not change under rotation', () => assert.equal(key(rotate(SHAPES.O, 1)), key(SHAPES.O)));
test('7-bag deals every shape once per seven', () => {
  let x = 1; const rng = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const bag = createBag(rng); const seen = new Set(); for (let i = 0; i < 7; i++) seen.add(bag.next());
  assert.equal(seen.size, 7);
});
test('peek shows the next shape without dealing it', () => { const bag = createBag(() => 0.5); const p = bag.peek(); assert.equal(bag.next(), p); });
test('cellsAt offsets a shape to a grid position', () => assert.equal(key(cellsAt(SHAPES.O, 0, 5, 3)), key([[5, 3], [6, 3], [5, 4], [6, 4]])));
