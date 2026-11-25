import { test } from 'node:test'; import assert from 'node:assert/strict';
import { bossFor, bossHp, levelWaves, compareScores, BOSS_ORDER } from '../src/logic/run.js';
const near = (a, b) => Math.abs(a - b) < 1e-6;
test('eight bosses in order', () => assert.deepEqual(BOSS_ORDER, ['itPartner', 'agileFirm', 'serviceBus', 'javaOverlord', 'sirDotNet', 'cloudConsultant', 'bsodPreventer', 'big5']));
test('level 1 boss is The IT Partner', () => { assert.equal(bossFor(1).key, 'itPartner'); assert.equal(bossFor(1).name, 'The IT Partner'); assert.equal(bossFor(1).lap, 0); });
test('bosses repeat after eight, one lap harder', () => { const b = bossFor(9); assert.equal(b.key, 'itPartner'); assert.equal(b.lap, 1); });
test('boss health grows per level and per lap', () => { assert.ok(near(bossHp(1), 1200)); assert.ok(near(bossHp(3), 1200 * 1.7)); assert.ok(near(bossHp(9), 1200 * (1 + 0.35 * 8) * 1.5)); });
test('level N has N waves', () => assert.equal(levelWaves(4), 4));
test('scores rank by bosses, then waves', () => {
  const s = [{ bosses: 1, waves: 3 }, { bosses: 2, waves: 1 }, { bosses: 1, waves: 5 }].sort(compareScores);
  assert.deepEqual(s.map(x => x.bosses + '/' + x.waves), ['2/1', '1/5', '1/3']);
});
