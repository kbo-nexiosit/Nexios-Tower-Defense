import { test } from 'node:test'; import assert from 'node:assert/strict';
import { loadBoard, saveBoard, qualifies, insertScore, KEY } from '../src/logic/leaderboard.js';
const mem = init => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const entry = (b, w, i = 'AAA') => ({ initials: i, bosses: b, waves: w });
test('bad JSON loads as empty', () => assert.deepEqual(loadBoard(mem({ [KEY]: '{oops' })), []));
test('non-array loads as empty', () => assert.deepEqual(loadBoard(mem({ [KEY]: '{"a":1}' })), []));
test('throwing storage loads as empty and saving does not throw', () => {
  const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadBoard(bad), []); assert.doesNotThrow(() => saveBoard(bad, []));
});
test('save then load round-trips', () => { const s = mem({}); saveBoard(s, [entry(1, 2, 'KBO')]); assert.deepEqual(loadBoard(s), [entry(1, 2, 'KBO')]); });
test('any score qualifies on a short board', () => assert.equal(qualifies([], { bosses: 0, waves: 0 }), true));
test('a worse score than the 10th does not qualify', () => {
  const full = Array.from({ length: 10 }, () => entry(3, 3));
  assert.equal(qualifies(full, { bosses: 1, waves: 9 }), false); assert.equal(qualifies(full, { bosses: 4, waves: 0 }), true);
});
test('insert keeps the board sorted, max 10, and reports the rank', () => {
  let board = Array.from({ length: 10 }, (_, i) => entry(10 - i, 0));
  const r = insertScore(board, { initials: 'kbo', bosses: 5, waves: 9 });
  assert.equal(r.board.length, 10); assert.equal(r.rank, 5); assert.equal(r.board[5].initials, 'KBO');
});
test('initials are cleaned to 3 capital letters', () => assert.equal(insertScore([], { initials: 'a1b', bosses: 0, waves: 0 }).board[0].initials, 'ABA'));
