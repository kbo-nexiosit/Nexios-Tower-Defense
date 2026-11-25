import { test } from 'node:test'; import assert from 'node:assert/strict';
import { makeEnemyState, sauce, effectiveSpeed } from '../src/logic/combat.js';
test('sauce damages and marks', () => { const e = makeEnemyState('brute'); sauce(e, 0); assert.equal(e.saucedUntil, 4000); assert.equal(e.hp, 90 - 15 * 1.5); });
test('sauced enemy is slower', () => { const e = makeEnemyState('crawler'); sauce(e, 0); assert.ok(Math.abs(effectiveSpeed(e, 100) - 54) < 1e-9); });
test('sauce can kill', () => { const e = makeEnemyState('swarm'); assert.equal(sauce(e, 0).killed, true); });
