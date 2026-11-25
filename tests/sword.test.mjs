import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createSword } from '../src/logic/sword.js';
test('perfect wave grants charge', () => { const s = createSword(); s.onWaveCleared(0); assert.equal(s.charges, 1); });
test('leaky wave grants nothing', () => { const s = createSword(); s.onWaveCleared(2); assert.equal(s.charges, 0); });
test('max one charge', () => { const s = createSword(); s.onWaveCleared(0); s.onWaveCleared(0); assert.equal(s.charges, 1); });
test('use consumes', () => { const s = createSword(); s.onWaveCleared(0); assert.equal(s.use(), true); assert.equal(s.use(), false); });
test('onWaveCleared reports a new grant', () => { const s = createSword(); assert.equal(s.onWaveCleared(0), true); assert.equal(s.onWaveCleared(0), false); });
