import { test } from 'node:test'; import assert from 'node:assert/strict';
import { pointAt, roadLength, ROAD } from '../src/logic/path.js';
const pts = [{x:0,y:0},{x:100,y:0},{x:100,y:50}];
test('length', () => assert.equal(roadLength(pts), 150));
test('midway on 2nd segment', () => assert.deepEqual(pointAt(pts, 125), { x: 100, y: 25, done: false }));
test('clamps at end', () => assert.deepEqual(pointAt(pts, 999), { x: 100, y: 50, done: true }));
test('ROAD stays inside 1280x720 and starts at left edge', () => { assert.equal(ROAD[0].x, 0); assert.ok(ROAD.every(p => p.x >= 0 && p.x <= 1280 && p.y >= 0 && p.y <= 720)); });
