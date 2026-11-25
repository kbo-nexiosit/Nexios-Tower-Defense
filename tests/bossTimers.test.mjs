import { test } from 'node:test'; import assert from 'node:assert/strict';
import { partnerSpeedMult, agileSprinting, cloudOffline, bsodShielded, crossedEvery } from '../src/logic/bossTimers.js';
const near = (a, b) => Math.abs(a - b) < 1e-9;
test('IT Partner: minions +5% per 5 s, max +50%', () => { assert.equal(partnerSpeedMult(0), 1); assert.ok(near(partnerSpeedMult(5000), 1.05)); assert.equal(partnerSpeedMult(60000), 1.5); });
test('Agile Firm sprints 1 s out of every 4', () => { assert.equal(agileSprinting(500), true); assert.equal(agileSprinting(1500), false); assert.equal(agileSprinting(4200), true); });
test('Cloud Consultant offline 2 s out of every 6', () => { assert.equal(cloudOffline(4500), true); assert.equal(cloudOffline(3900), false); });
test('BSOD shield 2 s out of every 7', () => { assert.equal(bsodShielded(5500), true); assert.equal(bsodShielded(4000), false); });
test('crossedEvery fires once per period', () => { assert.equal(crossedEvery(7900, 8100, 8000), true); assert.equal(crossedEvery(8100, 8200, 8000), false); assert.equal(crossedEvery(0, 10, 8000), false); });
