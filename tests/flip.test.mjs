import { test } from 'node:test'; import assert from 'node:assert/strict';
import { flipChance, rollFlip, flipModifiers } from '../src/logic/flip.js';
test('no flips early', () => { assert.equal(flipChance(1), 0); assert.equal(flipChance(2), 0); });
test('grows then caps', () => { assert.ok(Math.abs(flipChance(5) - 0.2) < 1e-9); assert.equal(flipChance(10), 0.35); });
test('roll uses rng', () => { assert.equal(rollFlip(5, () => 0.1), true); assert.equal(rollFlip(5, () => 0.3), false); });
test('never rolls before firstWave', () => assert.equal(rollFlip(2, () => 0), false));
test('modifiers', () => { assert.deepEqual(flipModifiers(true), { hpMult: 1.5, speedMult: 1.3 }); assert.deepEqual(flipModifiers(false), { hpMult: 1, speedMult: 1 }); });
