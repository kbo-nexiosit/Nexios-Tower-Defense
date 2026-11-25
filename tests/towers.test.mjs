import { test } from 'node:test'; import assert from 'node:assert/strict';
import { makeEnemyState, towerStats, upgradeCost, applySlow, applyStun } from '../src/logic/combat.js';
const near = (a, b) => Math.abs(a - b) < 1e-9;
// level is 0-based internally: 0 = Lv1 (just bought) ... 9 = Lv10 (max).
test('level 0 is the kid as bought', () => { const s = towerStats('slingshot', 0); assert.equal(s.damage, 6); assert.equal(s.range, 110); });
test('each upgrade adds 50% of starting damage', () => { assert.ok(near(towerStats('slingshot', 1).damage, 6 * 1.5)); assert.ok(near(towerStats('psychic', 9).damage, 45 * 5.5)); });
test('range grows 3% per level', () => assert.ok(near(towerStats('psychic', 5).range, 160 * 1.15)));
test('walkie slows harder with level, never below 0.25', () => { assert.ok(near(towerStats('walkie', 0).slow, 0.5)); assert.ok(towerStats('walkie', 9).slow < towerStats('walkie', 4).slow); assert.ok(towerStats('walkie', 9).slow >= 0.25); });
test('lights stun longer with level', () => assert.ok(towerStats('lights', 9).stunMs > towerStats('lights', 0).stunMs));
test('upgrade cost is relative to the kid price: (0.5 + 0.25 x Lv) x price', () => {
  assert.equal(upgradeCost('psychic', 0), 60); assert.equal(upgradeCost('psychic', 1), 80); assert.equal(upgradeCost('slingshot', 8), 69);
});
test('max level is 10: no upgrade beyond it', () => { assert.equal(upgradeCost('slingshot', 9), null); assert.ok(upgradeCost('slingshot', 8) !== null); });
test('stronger slow wins', () => { const e = makeEnemyState('brute'); applySlow(e,0.5,1000,0); applySlow(e,0.7,2000,0); assert.equal(e.slowFactor,0.5); assert.equal(e.slowUntil,2000); });
test('expired slow is replaced', () => { const e = makeEnemyState('brute'); applySlow(e,0.3,100,0); applySlow(e,0.5,1000,500); assert.equal(e.slowFactor,0.5); });
test('stun extends', () => { const e = makeEnemyState('brute'); applyStun(e,600,0); applyStun(e,300,0); assert.equal(e.stunUntil,600); });
