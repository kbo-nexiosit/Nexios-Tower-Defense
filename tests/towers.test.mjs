import { test } from 'node:test'; import assert from 'node:assert/strict';
import { makeEnemyState, towerStats, upgradeCost, applySlow, applyStun } from '../src/logic/combat.js';
test('stats merge levels', () => { assert.deepEqual([towerStats('slingshot',2).damage, towerStats('slingshot',2).range], [16, 130]); });
test('level 0 is base stats', () => { assert.equal(towerStats('walkie',0).slow, 0.5); assert.equal(towerStats('walkie',1).slow, 0.4); });
test('upgrade cost then null', () => { assert.equal(upgradeCost('psychic',0), 70); assert.equal(upgradeCost('psychic',1), 110); assert.equal(upgradeCost('psychic',2), null); });
test('stronger slow wins', () => { const e = makeEnemyState('brute'); applySlow(e,0.5,1000,0); applySlow(e,0.7,2000,0); assert.equal(e.slowFactor,0.5); assert.equal(e.slowUntil,2000); });
test('expired slow is replaced', () => { const e = makeEnemyState('brute'); applySlow(e,0.3,100,0); applySlow(e,0.5,1000,500); assert.equal(e.slowFactor,0.5); });
test('stun extends', () => { const e = makeEnemyState('brute'); applyStun(e,600,0); applyStun(e,300,0); assert.equal(e.stunUntil,600); });
