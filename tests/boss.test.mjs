import { test } from 'node:test'; import assert from 'node:assert/strict';
import { crossedThresholds } from '../src/logic/boss.js';
test('one crossing', () => assert.deepEqual(crossedThresholds(4000, 2900, 4000), [0.75]));
test('big hit crosses two', () => assert.deepEqual(crossedThresholds(3100, 1800, 4000), [0.75, 0.5]));
test('no re-cross', () => assert.deepEqual(crossedThresholds(2900, 2800, 4000), []));
test('landing exactly on threshold counts', () => assert.deepEqual(crossedThresholds(3100, 3000, 4000), [0.75]));
test('death does not add a phase below 0.25 twice', () => assert.deepEqual(crossedThresholds(900, -50, 4000), []));
