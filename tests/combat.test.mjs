import { test } from 'node:test'; import assert from 'node:assert/strict';
import CONFIG from '../src/config.js';
const CRAWLER = CONFIG.enemies.crawler.speed;
import { makeEnemyState, applyDamage, effectiveSpeed, pickTarget, canPlace } from '../src/logic/combat.js';
test('kill reported once', () => { const e = makeEnemyState('crawler'); assert.equal(applyDamage(e, 20, 0).killed, true); assert.equal(applyDamage(e, 5, 0).killed, false); });
test('sauced takes 1.5x', () => { const e = makeEnemyState('brute'); e.saucedUntil = 100; applyDamage(e, 10, 50); assert.equal(e.hp, 75); });
test('hpScale scales hp', () => { const e = makeEnemyState('brute', 2); assert.equal(e.hp, 180); assert.equal(e.maxHp, 180); });
test('stun -> speed 0', () => { const e = makeEnemyState('crawler'); e.stunUntil = 100; assert.equal(effectiveSpeed(e, 50), 0); });
test('expired statuses ignored', () => { const e = makeEnemyState('crawler'); e.stunUntil = 10; e.slowUntil = 10; e.slowFactor = 0.5; assert.equal(effectiveSpeed(e, 50), CRAWLER); });
test('slow and sauce stack', () => { const e = makeEnemyState('crawler'); e.slowUntil = 100; e.slowFactor = 0.5; e.saucedUntil = 100; assert.ok(Math.abs(effectiveSpeed(e, 50) - CRAWLER * 0.5 * 0.6) < 1e-9); });
test('targets furthest along', () => { const a = {...makeEnemyState('crawler'), x:10,y:0,distance:50}, b = {...makeEnemyState('crawler'), x:20,y:0,distance:80}; assert.equal(pickTarget({x:0,y:0,range:100},[a,b]), b); });
test('ignores dead and out of range', () => { const a = {...makeEnemyState('crawler'), x:10,y:0,distance:90, alive:false}, b = {...makeEnemyState('crawler'), x:500,y:0,distance:80}; assert.equal(pickTarget({x:0,y:0,range:100},[a,b]), null); });
test('no placement on road', () => { const road=[{x:0,y:100},{x:400,y:100}]; assert.equal(canPlace({x:200,y:110}, [], road), false); assert.equal(canPlace({x:200,y:200}, [], road), true); });
test('no placement on tower', () => assert.equal(canPlace({x:200,y:200}, [{x:210,y:200}], [{x:0,y:0},{x:1,y:0}]), false));
import { pickTargetFrom, inRangeOfAny } from '../src/logic/combat.js';
test('block targets the furthest enemy in range of any edge square, firing from the nearest edge', () => {
  const edges = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
  const a = { ...makeEnemyState('crawler'), x: 10, y: 0, distance: 50 }, b = { ...makeEnemyState('crawler'), x: 130, y: 0, distance: 80 };
  const r = pickTargetFrom(edges, 40, [a, b]);
  assert.equal(r.target, b); assert.deepEqual(r.origin, { x: 100, y: 0 });
});
test('block with no edge squares never fires', () => assert.equal(pickTargetFrom([], 999, [{ ...makeEnemyState('crawler'), x: 0, y: 0, distance: 1 }]), null));
test('inRangeOfAny finds enemies near any edge', () => {
  const e1 = { ...makeEnemyState('crawler'), x: 0, y: 50 }, e2 = { ...makeEnemyState('crawler'), x: 500, y: 0 };
  assert.deepEqual(inRangeOfAny([{ x: 0, y: 0 }], 60, [e1, e2]), [e1]);
});
