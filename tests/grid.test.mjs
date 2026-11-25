import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createGrid, distanceField, canPlace, placeBlock, edgeCells, routeFrom, routeWith, setObstacles } from '../src/logic/grid.js';

const spawn = [0, 2], goal = [6, 2];
const fresh = () => createGrid(7, 5);
const at = (g, d, c, r) => d[r * g.cols + c];

test('open grid: distance from goal is Manhattan', () => {
  const g = fresh(); const d = distanceField(g, goal);
  assert.equal(at(g, d, 6, 2), 0); assert.equal(at(g, d, 0, 2), 6); assert.equal(at(g, d, 0, 0), 8);
});
test('obstacles are unreachable (-1)', () => {
  const g = fresh(); setObstacles(g, [[3, 2]]); const d = distanceField(g, goal);
  assert.equal(at(g, d, 3, 2), -1); assert.equal(at(g, d, 2, 2), 6);
});
test('placement on free cells is allowed', () => {
  assert.deepEqual(canPlace(fresh(), [[3, 1], [3, 2]], { spawn, goal }), { ok: true });
});
test('placement off the grid is refused', () => {
  assert.equal(canPlace(fresh(), [[7, 2]], { spawn, goal }).reason, 'off-grid');
});
test('placement on a block or obstacle is refused', () => {
  const g = fresh(); placeBlock(g, [[3, 2]], 1);
  assert.equal(canPlace(g, [[3, 2], [3, 3]], { spawn, goal }).reason, 'occupied');
});
test('placement on spawn or goal is refused', () => {
  assert.equal(canPlace(fresh(), [[0, 2]], { spawn, goal }).reason, 'occupied');
  assert.equal(canPlace(fresh(), [[6, 2]], { spawn, goal }).reason, 'occupied');
});
test('a placement that fully blocks the path is refused', () => {
  assert.equal(canPlace(fresh(), [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], { spawn, goal }).reason, 'blocks-path');
});
test('a placement on a cell with a monster is refused', () => {
  assert.equal(canPlace(fresh(), [[3, 1]], { spawn, goal, occupied: [[3, 1]] }).reason, 'enemy');
});
test('a placement that traps a monster in a pocket is refused', () => {
  const g2 = fresh(); placeBlock(g2, [[1, 1], [0, 1]], 1);
  assert.equal(canPlace(g2, [[1, 0]], { spawn, goal, occupied: [[0, 0]] }).reason, 'blocks-path');
});
test('edge cells: inner squares of a merged structure are walls', () => {
  const g = fresh();
  const cells = []; for (let c = 2; c <= 4; c++) for (let r = 1; r <= 3; r++) cells.push([c, r]);
  placeBlock(g, cells, 1);
  const edges = edgeCells(g, cells);
  assert.equal(edges.length, 8);
  assert.ok(!edges.some(([c, r]) => c === 3 && r === 2));
});
test('edge cells: grid border does not count as open', () => {
  const g = createGrid(2, 1); placeBlock(g, [[0, 0]], 1);
  assert.deepEqual(edgeCells(g, [[0, 0]]), [[0, 0]]);           // open neighbour (1,0)
  placeBlock(g, [[1, 0]], 2);
  assert.deepEqual(edgeCells(g, [[0, 0], [1, 0]]), []);
});
test('route goes around a wall to the goal', () => {
  const g = fresh(); placeBlock(g, [[3, 1], [3, 2], [3, 3]], 1);
  const route = routeFrom(g, distanceField(g, goal), spawn);
  assert.deepEqual(route[0], spawn); assert.deepEqual(route[route.length - 1], goal);
  assert.equal(route.length, 6 + 4 + 1);                         // 6 steps + 4 detour (2 up, 2 down), inclusive
  assert.ok(!route.some(([c, r]) => c === 3 && r >= 1 && r <= 3));
});

test('routeWith: a block on the route gives the detour, grid untouched', () => {
  const g = fresh(); const before = Array.from(g.cells);
  const r = routeWith(g, [[3, 1], [3, 2], [3, 3]], spawn, goal);
  assert.deepEqual(r[0], spawn); assert.deepEqual(r.at(-1), goal);
  assert.ok(r.length > 7); assert.ok(!r.some(([c, rr]) => c === 3 && rr >= 1 && rr <= 3));
  assert.deepEqual(Array.from(g.cells), before);
});
test('routeWith: a block off the route leaves it as it was', () => {
  const g = fresh();
  assert.deepEqual(routeWith(g, [[3, 0]], spawn, goal), routeFrom(g, distanceField(g, goal), spawn));
});
test('routeWith: null when the block would seal the path or sits on something', () => {
  const g = fresh();
  assert.equal(routeWith(g, [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], spawn, goal), null);
  placeBlock(g, [[2, 2]], 5);
  assert.equal(routeWith(g, [[2, 2]], spawn, goal), null);
  assert.equal(g.cells[2 * g.cols + 2], 5);
});
