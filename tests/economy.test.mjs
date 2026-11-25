import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createWallet } from '../src/logic/economy.js';
test('earn and spend', () => { const w = createWallet(100); w.earn(5); assert.equal(w.tokens, 105); assert.equal(w.spend(25), true); assert.equal(w.tokens, 80); });
test('cannot overspend', () => { const w = createWallet(10); assert.equal(w.spend(25), false); assert.equal(w.tokens, 10); });
