# Upside Defense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Stranger Things–inspired browser tower defense game in which kids defend the NexiosIT office from Upside Down monsters, live on GitHub Pages by 15:45 today.

**Architecture:** A static site: `index.html` loads Phaser 3.90.0 from cdnjs and `src/main.js` as an ES module. Game rules live in pure, Phaser-free modules (`src/logic/*.js`) with all tuning numbers in `src/config.js`, and they're unit-tested with `node --test`. Phaser scenes and entities (`src/scenes`, `src/entities`) are thin wrappers that call the logic, and they're verified by playing in the browser.

**Tech Stack:** Phaser 3.90.0 (CDN), vanilla ES modules, Web Audio API, Node 20 (`node --test`, plus `serve.mjs` for serving locally). No npm and no build step.

**Spec:** `docs/superpowers/specs/2026-11-25-upside-defense-design.md`

## Global Constraints

- Phaser is loaded only from `https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js`. No other libraries, no `package.json`.
- Every path is relative (`./src/...`, `./assets/...`) so the game works under `https://kbo-nexiosit.github.io/Nexios-Tower-Defense/`.
- Inspired-by only: no show names, characters, logos or ripped art. Pizza Hut appears by name in text only, never its logo.
- The boss looks like Bart (dark hair, glasses, well built, Vecna-like) with **no name or title on screen**.
- Currency is shown as **"Tokens"** (arcade tokens).
- The base is the **NexiosIT office** (4 storeys, glass, Nexios logo). The **DPG Media** building next to it is decoration only.
- Pixel art: `pixelArt: true`. Towers, enemies and the road must stay distinguishable at a glance, including in Upside Down mode.
- No secrets or client content anywhere in the repo, because the repo is public.
- Build order is the priority. Tasks 1–6 are must-haves (Task 3 ends with the first deploy). Tasks 7–9 are stretch goals, cut from the bottom.
- After every task, add a line to `REGRET.md` for anything that worked and then broke.

## Review Focus

1. **Browser blocks audio until the first click.** The Web Audio context must resume on the title-screen click, or the victory bell stays silent during the demo. Covered by Task 3 (sfx unlock).
2. **Invalid tower placement:** clicking the road, the buildings, an occupied slot, or with too few tokens must not place a tower or spend anything. Covered by Task 2 (`canPlace`) and Task 1 (`spend` returns false).
3. **A target dies while a shot is in flight**, or two towers kill the same enemy in one frame. The reward must be paid exactly once and nothing may crash. Covered by Task 2 (`applyDamage` reports `killed` only on the transition).
4. **Switching tabs or a laptop sleeping during the demo** must not spawn a burst of monsters on return. Spawning uses scene time (`this.time`), not wall-clock time. Covered by Task 3 (`waveSchedule` is time-offset based, and the scene uses `this.time.delayedCall`).
5. **Projector resolution:** the game must fit any screen without cropping. Covered by Task 1 (`Phaser.Scale.FIT` at 1280×720, centred).

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Page shell, Phaser CDN tag, loads `src/main.js` |
| `serve.mjs` | Dependency-free static server for the laptop fallback (`node serve.mjs` → http://localhost:8080) |
| `REGRET.md` | Retro log |
| `src/main.js` | Phaser game config and scene list |
| `src/config.js` | All tuning numbers: towers, enemies, waves, flip, sword, pizza, boss |
| `src/logic/economy.js` | Token wallet |
| `src/logic/path.js` | Road waypoints, position along the road |
| `src/logic/combat.js` | Damage, statuses (slow/stun/sauced), targeting, placement rules |
| `src/logic/waves.js` | Wave composition and spawn schedule |
| `src/logic/sword.js` | Sword charge state |
| `src/logic/boss.js` | Boss phase thresholds |
| `src/logic/flip.js` | Upside Down roll and modifiers |
| `src/art/textures.js` | Generates placeholder textures with Phaser Graphics (later swapped for PNGs) |
| `src/audio/sfx.js` | Web Audio synth: bell, shot, flip, sword, splat; unlock and mute |
| `src/entities/Enemy.js`, `Tower.js`, `PizzaVan.js` | Phaser game objects wrapping the logic |
| `src/scenes/TitleScene.js`, `GameScene.js`, `UIScene.js`, `EndScene.js` | Title screen, gameplay, HUD/shop, win/lose screens |
| `assets/nexios-logo.webp` | White Nexios logo, downloaded from nexiosit.com |
| `tests/*.test.mjs` | `node --test` unit tests for `src/logic` |

Run all tests with: `node --test tests/`. Every test file starts with `import { test } from 'node:test'; import assert from 'node:assert/strict';` plus an import of its module under test. Snippets below omit those imports after Task 1.

---

### Task 1: Scaffold, config, economy, path

**Files:**
- Create: `index.html`, `serve.mjs`, `REGRET.md`, `src/main.js`, `src/config.js`, `src/logic/economy.js`, `src/logic/path.js`, `assets/nexios-logo.webp`
- Test: `tests/economy.test.mjs`, `tests/path.test.mjs`

**Interfaces:**
- Produces:
  - `createWallet(start: number) -> { get tokens(): number, earn(n: number): void, spend(n: number): boolean }`. `spend` returns false and changes nothing when `n > tokens`.
  - `ROAD: Array<{x,y}>` (exported from `path.js`), `roadLength(points) -> number`, and `pointAt(points, distance) -> { x, y, done: boolean }`. `done` is true once `distance >= roadLength`, and the point then clamps to the last waypoint.
  - `CONFIG` (the default export of `config.js`) with the keys `world`, `startTokens`, `baseHealth`, `towers`, `enemies`, `waves`, `boss`, `sword`, `flip`, `pizza`, using exactly the values below.

`src/config.js` values (spec numbers, decided here):

```js
world: { width: 1280, height: 720 },
startTokens: 100, baseHealth: 20,
towers: {
  slingshot: { cost: 25, range: 110, damage: 6,  fireMs: 400,  levels: [{ cost: 30, damage: 10 }, { cost: 50, damage: 16, range: 130 }] },
  walkie:    { cost: 40, range: 90,  slow: 0.5,  slowMs: 1500, pulseMs: 1000, levels: [{ cost: 35, slow: 0.4 }, { cost: 55, slow: 0.3, range: 110 }] },
  psychic:   { cost: 80, range: 160, damage: 45, fireMs: 1800, levels: [{ cost: 70, damage: 80 }, { cost: 110, damage: 130 }] },
  lights:    { cost: 60, range: 80,  damage: 3,  stunMs: 600,  pulseMs: 3000, levels: [{ cost: 50, stunMs: 900 }, { cost: 80, stunMs: 1200, range: 100 }] },
},
enemies: {
  crawler: { hp: 20, speed: 90,  reward: 3, leak: 1 },
  brute:   { hp: 90, speed: 45,  reward: 8, leak: 3 },
  swarm:   { hp: 10, speed: 120, reward: 2, leak: 1 },
  boss:    { hp: 4000, speed: 20, reward: 0, leak: 20 },
},
waves: { count: 10, hpScalePerWave: 0.12, gapMs: 700 },
boss: { thresholds: [0.75, 0.5, 0.25] },
sword: { bossDamagePct: 0.15 },
flip: { firstWave: 3, rollEveryMs: 10000, chancePerWave: 0.04, maxChance: 0.35, durationMs: 25000, warnMs: 1000, hpMult: 1.5, speedMult: 1.3 },
pizza: { cost: 50, cooldownMs: 20000, speed: 160, radius: 40, damage: 15, saucedMs: 4000, saucedSpeedMult: 0.6, saucedDamageMult: 1.5 },
```

- [ ] **Step 1: Write the failing tests**

```js
// tests/economy.test.mjs
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createWallet } from '../src/logic/economy.js';
test('earn and spend', () => { const w = createWallet(100); w.earn(5); assert.equal(w.tokens, 105); assert.equal(w.spend(25), true); assert.equal(w.tokens, 80); });
test('cannot overspend', () => { const w = createWallet(10); assert.equal(w.spend(25), false); assert.equal(w.tokens, 10); });
// tests/path.test.mjs
import { pointAt, roadLength } from '../src/logic/path.js';
const pts = [{x:0,y:0},{x:100,y:0},{x:100,y:50}];
test('length', () => assert.equal(roadLength(pts), 150));
test('midway on 2nd segment', () => assert.deepEqual(pointAt(pts, 125), { x: 100, y: 25, done: false }));
test('clamps at end', () => assert.deepEqual(pointAt(pts, 999), { x: 100, y: 50, done: true }));
```

- [ ] **Step 2: Run `node --test tests/`.** Expected: FAIL (modules not found).
- [ ] **Step 3: Implement `economy.js`, `path.js` and `config.js`.** `ROAD` is a winding path with 8–10 waypoints inside 1280×720. It starts at the Rift (left edge, x=0) and ends at the NexiosIT office (right side, around x=1120, y=360). Leave room beside the road for tower slots.
- [ ] **Step 4: Run `node --test tests/`.** Expected: PASS.
- [ ] **Step 5: Shell and server.** `index.html` has `<title>Upside Defense</title>`, a black body, the Phaser CDN `<script>`, and `<script type="module" src="./src/main.js">`. `main.js` creates `new Phaser.Game({ type: AUTO, width: 1280, height: 720, pixelArt: true, backgroundColor: '#0b0b14', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [] })`. `serve.mjs` uses `node:http` and `node:fs` to serve the repo root on port 8080 with correct MIME types for `.html`, `.js`, `.mjs`, `.webp`, `.png` and `.css`. Download the logo: `curl -sL "https://nexiosit.com/_ipx/_/images/nexios-white-transparant.webp" -o assets/nexios-logo.webp`. Create `REGRET.md` with a heading and the date.
- [ ] **Step 6: Verify.** Run `node serve.mjs &` and `curl -s localhost:8080 | grep "Upside Defense"`. Expected: a match. `file assets/nexios-logo.webp` should report Web/P image.
- [ ] **Step 7: Commit:** `git add -A && git commit -m "feat: scaffold, config, economy, road path"`

---

### Task 2: Core loop — map, enemies, slingshot kid, tokens, base health, lose

**Files:**
- Create: `src/logic/combat.js`, `src/art/textures.js`, `src/entities/Enemy.js`, `src/entities/Tower.js`, `src/scenes/GameScene.js`, `src/scenes/UIScene.js`, `src/scenes/EndScene.js`
- Modify: `src/main.js` (scene list)
- Test: `tests/combat.test.mjs`

**Interfaces:**
- Consumes: `createWallet`, `ROAD`, `pointAt`, `roadLength`, `CONFIG`.
- Produces (`combat.js`):
  - `makeEnemyState(type: string, hpScale = 1) -> { type, hp, maxHp, speed, distance: 0, alive: true, slowUntil: 0, slowFactor: 1, stunUntil: 0, saucedUntil: 0 }`
  - `applyDamage(e, amount: number, now: number) -> { killed: boolean }`. Multiplies the damage by `CONFIG.pizza.saucedDamageMult` while `now < e.saucedUntil`. Returns `killed: true` only when hp crosses from >0 to ≤0; damage to an enemy that is already dead returns `killed: false`.
  - `effectiveSpeed(e, now) -> number`. Returns 0 while stunned. Otherwise it is speed × slowFactor (while slowed) × `saucedSpeedMult` (while sauced).
  - `pickTarget(tower: {x,y,range}, enemies) -> enemy | null`. Picks the alive enemy in range with the greatest `distance` (the one closest to the base).
  - `canPlace(slot: {x,y}, towers: Array<{x,y}>, road: Array<{x,y}>, minRoadDist = 32, minTowerDist = 40) -> boolean`
- Produces (scenes): `GameScene` emits `'tokens'`, `'health'` and `'wave'` events on `this.game.events`. `UIScene` listens to them. `EndScene` takes `{ won: boolean }`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/combat.test.mjs
test('kill reported once', () => { const e = makeEnemyState('crawler'); assert.equal(applyDamage(e, 20, 0).killed, true); assert.equal(applyDamage(e, 5, 0).killed, false); });
test('sauced takes 1.5x', () => { const e = makeEnemyState('brute'); e.saucedUntil = 100; applyDamage(e, 10, 50); assert.equal(e.hp, 75); });
test('stun -> speed 0', () => { const e = makeEnemyState('crawler'); e.stunUntil = 100; assert.equal(effectiveSpeed(e, 50), 0); });
test('slow and sauce stack', () => { const e = makeEnemyState('crawler'); e.slowUntil = 100; e.slowFactor = 0.5; e.saucedUntil = 100; assert.ok(Math.abs(effectiveSpeed(e, 50) - 27) < 1e-9); });
test('targets furthest along', () => { const a = {...makeEnemyState('crawler'), x:10,y:0,distance:50}, b = {...makeEnemyState('crawler'), x:20,y:0,distance:80}; assert.equal(pickTarget({x:0,y:0,range:100},[a,b]), b); });
test('no placement on road', () => { const road=[{x:0,y:100},{x:400,y:100}]; assert.equal(canPlace({x:200,y:110}, [], road), false); assert.equal(canPlace({x:200,y:200}, [], road), true); });
test('no placement on tower', () => assert.equal(canPlace({x:200,y:200}, [{x:210,y:200}], [{x:0,y:0},{x:1,y:0}]), false));
```

- [ ] **Step 2: Run `node --test tests/combat.test.mjs`.** Expected: FAIL.
- [ ] **Step 3: Implement `combat.js`.** Use point-to-segment distance for the road check in `canPlace`.
- [ ] **Step 4: Run `node --test tests/`.** Expected: PASS.
- [ ] **Step 5: Implement the scenes and entities.**
  - `textures.js` exports `makeTextures(scene)`, which draws placeholder textures: `road`, `rift` (a red glowing gash), `office` (a 4-storey blue glass block with the logo image on top), `dpg` (a grey block labelled "DPG MEDIA"), and `crawler`/`brute`/`swarm`/`boss`/`slingshot` as distinct shapes and colours.
  - In `GameScene`, draw the night town, the road from `ROAD`, the rift, the office and the DPG building. Spawn a test stream of crawlers.
  - `Enemy` advances `distance += effectiveSpeed * dt/1000` and positions itself with `pointAt`. When `done`, it subtracts `leak` from base health and is destroyed.
  - Clicking empty ground with the slingshot selected places a tower if `canPlace` passes and `wallet.spend(cost)` succeeds. The tower fires at `pickTarget` every `fireMs`, with a visible projectile. On `killed`, earn the reward.
  - `UIScene` shows "Tokens: N", base health, and the tower button.
  - When health reaches 0, go to `EndScene({won:false})`, which shows "THE GATE IS OPEN" and a Restart button.
- [ ] **Step 6: Verify in the browser.** Open `http://localhost:8080`. Placing a slingshot next to the road kills crawlers and tokens go up. Clicking the road does nothing. Letting crawlers leak lowers health and leads to the lose screen. The browser console shows no errors.
- [ ] **Step 7: Commit:** `git commit -am "feat: core loop with slingshot kid"`

---

### Task 3: Waves, victory bell, title and win screens — then deploy

**Files:**
- Create: `src/logic/waves.js`, `src/audio/sfx.js`, `src/scenes/TitleScene.js`
- Modify: `src/scenes/GameScene.js`, `src/scenes/UIScene.js`, `src/scenes/EndScene.js`, `src/main.js`
- Test: `tests/waves.test.mjs`

**Interfaces:**
- Produces:
  - `waveSchedule(n: number) -> Array<{ type: string, atMs: number, hpScale: number }>`. Waves 1–9 mix the types in increasing amounts. Wave 10 is `boss` at `atMs: 0` plus escorts. `hpScale = 1 + hpScalePerWave*(n-1)`, `atMs` is spaced by `gapMs`, and the list is sorted by `atMs`.
  - `sfx`: `unlock()` (resumes the AudioContext), `setMuted(b)`, `bell()`, `shot()`, `flip()`, `sword()`, `splat()`, `boss()`. Every call is a no-op while muted or before `unlock`.
  - `GameScene` emits `'waveCleared'` with `{ wave, leaks }`.

- [ ] **Step 1: Write the failing tests**

```js
test('wave 1 crawlers only, hpScale 1', () => { const s = waveSchedule(1); assert.ok(s.length >= 6); assert.ok(s.every(x => x.type === 'crawler' && x.hpScale === 1)); });
test('sorted by time', () => { const s = waveSchedule(5); assert.deepEqual(s.map(x=>x.atMs), [...s.map(x=>x.atMs)].sort((a,b)=>a-b)); });
test('later waves bigger', () => assert.ok(waveSchedule(9).length > waveSchedule(2).length));
test('wave 10 has exactly one boss', () => assert.equal(waveSchedule(10).filter(x=>x.type==='boss').length, 1));
test('waves 1-9 have no boss', () => { for (let n=1;n<10;n++) assert.ok(!waveSchedule(n).some(x=>x.type==='boss')); });
```

- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement `waves.js`.** Wave 1–2 are crawlers, brutes join from wave 3, swarms from wave 5.
- [ ] **Step 4: Run `node --test tests/`.** Expected: PASS.
- [ ] **Step 5: Wire up the game.**
  - Add a "Start wave" button in `UIScene`, enabled between waves. `GameScene` schedules spawns with `this.time.delayedCall(atMs, ...)` (scene time, which pauses while the tab is hidden).
  - When the wave's spawns are done and no enemies are alive, emit `waveCleared`, play `sfx.bell()`, and show a big "WAVE CLEARED" banner with a pixel bell that swings in.
  - After wave 10, go to `EndScene({won:true})`, which shows "OFFICE SAVED", the Nexios logo, the line "Your partner for software, cloud & AI solutions — and monster removal", and a triple bell ring.
  - `sfx.bell()` is a synthesised bell: a sum of decaying sine partials at 1, 2.76 and 5.4 × ~520 Hz over ~2.5 s.
  - `TitleScene` shows the title "UPSIDE DEFENSE", the logo and "Click to start". Its click calls `sfx.unlock()` and then starts `GameScene` and `UIScene`. Add a mute toggle in `UIScene`.
- [ ] **Step 6: Verify in the browser.** You can play waves 1–3 (a temporary placeholder boss is fine for wave 10 until Task 5). The bell is audible after the title click. Switching tabs for 10 s mid-wave and coming back doesn't produce a burst of monsters.
- [ ] **Step 7: Commit:** `git commit -am "feat: waves, victory bell, title and end screens"`
- [ ] **Step 8: Deploy. Ask the owner first:** "OK to make kbo-nexiosit/Nexios-Tower-Defense public now for GitHub Pages?" On yes, run:

```bash
gh repo edit kbo-nexiosit/Nexios-Tower-Defense --visibility public --accept-visibility-change-consequences
gh api -X POST repos/kbo-nexiosit/Nexios-Tower-Defense/pages -f "source[branch]=main" -f "source[path]=/"
git push
```

- [ ] **Step 9: Verify the deploy.** `gh api repos/kbo-nexiosit/Nexios-Tower-Defense/pages --jq .status` should report `built`. Opening `https://kbo-nexiosit.github.io/Nexios-Tower-Defense/` loads the title screen, and the browser console has no 404s. Post the link to the owner.

---

### Task 4: All kids and upgrades

**Files:**
- Modify: `src/logic/combat.js`, `src/entities/Tower.js`, `src/scenes/UIScene.js`, `src/art/textures.js`
- Test: `tests/combat.test.mjs` (extend)

**Interfaces:**
- Produces:
  - `towerStats(type: string, level: 0|1|2) -> { cost, range, damage?, fireMs?, slow?, slowMs?, stunMs?, pulseMs? }`. This is the base config merged with each `levels[i]` up to `level`.
  - `upgradeCost(type, level) -> number | null`. Returns null at the maximum level.
  - `applySlow(e, factor, ms, now)` keeps the stronger (lower) factor and the later end time. `applyStun(e, ms, now)` sets `stunUntil = max(stunUntil, now+ms)`.

- [ ] **Step 1: Write the failing tests**

```js
test('stats merge levels', () => { assert.deepEqual([towerStats('slingshot',2).damage, towerStats('slingshot',2).range], [16, 130]); });
test('upgrade cost then null', () => { assert.equal(upgradeCost('psychic',0), 70); assert.equal(upgradeCost('psychic',2), null); });
test('stronger slow wins', () => { const e = makeEnemyState('brute'); applySlow(e,0.5,1000,0); applySlow(e,0.7,2000,0); assert.equal(e.slowFactor,0.5); assert.equal(e.slowUntil,2000); });
test('stun extends', () => { const e = makeEnemyState('brute'); applyStun(e,600,0); applyStun(e,300,0); assert.equal(e.stunUntil,600); });
```

- [ ] **Step 2: Run the tests.** Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `node --test tests/`. Expected: PASS.
- [ ] **Step 5: Wire up the kids.**
  - The walkie-talkie kid pulses `applySlow` on every enemy in range, with radio-wave rings.
  - The psychic kid fires a slow, heavy beam with a small shake on hit.
  - The Christmas lights pulse `applyStun` plus damage, with a coloured bulb flash.
  - Each kid gets a distinct shape and colour.
  - Shop buttons show the costs and grey out when you can't afford them. Clicking a placed tower opens an upgrade button showing `upgradeCost`, with a level shown as pips. Buying spends tokens and does nothing when you can't afford it.
- [ ] **Step 6: Verify in the browser.** All four kids place, fire and upgrade, and wave 5 is beatable with a mix.
- [ ] **Step 7: Commit:** `git commit -am "feat: all kids and upgrades"` and `git push`.

---

### Task 5: The final boss

**Files:**
- Create: `src/logic/boss.js`
- Modify: `src/art/textures.js`, `src/entities/Enemy.js`, `src/scenes/GameScene.js`, `src/scenes/UIScene.js`
- Test: `tests/boss.test.mjs`

**Interfaces:**
- Produces: `crossedThresholds(prevHp, hp, maxHp, thresholds = CONFIG.boss.thresholds) -> number[]`. Returns the thresholds crossed by this hit, highest first. GameScene emits `'bossPhase'` once per crossed threshold; Task 7 listens to it.

- [ ] **Step 1: Write the failing tests**

```js
test('one crossing', () => assert.deepEqual(crossedThresholds(4000, 2900, 4000), [0.75]));
test('big hit crosses two', () => assert.deepEqual(crossedThresholds(3100, 1800, 4000), [0.75, 0.5]));
test('no re-cross', () => assert.deepEqual(crossedThresholds(2900, 2800, 4000), []));
```

- [ ] **Step 2: Run the tests.** Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `node --test tests/`. Expected: PASS.
- [ ] **Step 5: Wire up the boss.**
  - The boss texture is a large (about 3× crawler size) looming figure: dark hair, glasses, broad build, pale Vecna-like skin with tendrils, and a red glow. **No name or text.**
  - Its entrance comes with `sfx.boss()`, a screen shake and a big HP bar at the top of the HUD (no label).
  - On each crossed threshold, emit `bossPhase`. Until Task 7 exists, that means a flash and a shake.
  - Boss death means the game is won.
- [ ] **Step 6: Verify in the browser.** Use a debug key `B` that jumps straight to wave 10. Remove it before the demo or put it behind `?debug`. The boss is very hard to kill but beatable with upgraded kids.
- [ ] **Step 7: Commit and push:** `git commit -am "feat: final boss"`

---

### Task 6: The Nexios Sword

**Files:**
- Create: `src/logic/sword.js`
- Modify: `src/scenes/GameScene.js`, `src/scenes/UIScene.js`, `src/art/textures.js`
- Test: `tests/sword.test.mjs`

**Interfaces:**
- Produces: `createSword() -> { get charges(): 0|1, onWaveCleared(leaks: number): void, use(): boolean }`. The sword holds at most 1 charge. A charge is granted only when `leaks === 0`. `use()` returns false with no charge.
- Effect, applied in GameScene: every alive non-boss enemy is killed (with rewards paid), and the boss takes `CONFIG.sword.bossDamagePct × maxHp` through `applyDamage`, which also feeds `crossedThresholds`.

- [ ] **Step 1: Write the failing tests**

```js
test('perfect wave grants charge', () => { const s = createSword(); s.onWaveCleared(0); assert.equal(s.charges, 1); });
test('leaky wave grants nothing', () => { const s = createSword(); s.onWaveCleared(2); assert.equal(s.charges, 0); });
test('max one charge', () => { const s = createSword(); s.onWaveCleared(0); s.onWaveCleared(0); assert.equal(s.charges, 1); });
test('use consumes', () => { const s = createSword(); s.onWaveCleared(0); assert.equal(s.use(), true); assert.equal(s.use(), false); });
```

- [ ] **Step 2: Run the tests.** Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `node --test tests/`. Expected: PASS.
- [ ] **Step 5: Wire up the sword.**
  - After a perfect wave, show "PERFECT WAVE — THE NEXIOS SWORD IS YOURS".
  - The HUD sword button glows when charged. The hotkey is `S`.
  - On use: a GoT-style pixel sword with the Nexios logo on the pommel sweeps across the whole screen in about 0.6 s, followed by a white flash, `sfx.sword()`, and enemies splitting or popping.
- [ ] **Step 6: Verify in the browser.** A perfect wave grants the charge and using it clears the screen. Against the boss it deals about 15% of his health.
- [ ] **Step 7: Commit and push:** `git commit -am "feat: Nexios sword"`

**Must-haves end here. Push and confirm Pages is live before starting stretch tasks.**

---

### Task 7 (stretch): Upside Down flip

**Files:**
- Create: `src/logic/flip.js`
- Modify: `src/scenes/GameScene.js`, `src/entities/Enemy.js`
- Test: `tests/flip.test.mjs`

**Interfaces:**
- Produces:
  - `flipChance(wave) -> number`. Returns 0 below `firstWave`. Otherwise it is `min(maxChance, chancePerWave * wave)`.
  - `rollFlip(wave, rng = Math.random) -> boolean`, which is `rng() < flipChance(wave)`.
  - `flipModifiers(active: boolean) -> { hpMult, speedMult }`, which is {1, 1} when not active.
- Consumes: the `'bossPhase'` event from Task 5, which forces a flip.

- [ ] **Step 1: Write the failing tests**

```js
test('no flips early', () => assert.equal(flipChance(2), 0));
test('grows then caps', () => { assert.equal(flipChance(5), 0.2); assert.equal(flipChance(10), 0.35); });
test('roll uses rng', () => { assert.equal(rollFlip(5, () => 0.1), true); assert.equal(rollFlip(5, () => 0.3), false); });
test('modifiers', () => assert.deepEqual(flipModifiers(true), { hpMult: 1.5, speedMult: 1.3 }));
```

- [ ] **Step 2: Run the tests.** Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `node --test tests/`. Expected: PASS.
- [ ] **Step 5: Wire up the flip.**
  - During a wave, roll every `rollEveryMs`. A hit starts a warning flicker for `warnMs`.
  - The flip itself: the camera does a vertical squash-flip tween, a cold red/blue tint goes over the world, ash particles drift, and `sfx.flip()` plays.
  - Enemies spawned while the flip is active use `flipModifiers`. It lasts `durationMs`, then flips back.
  - Each `bossPhase` forces a flip, or extends one already running.
  - Keep the road, kids and enemies readable: the tint applies to the background and buildings only, and enemies get a bright outline.
- [ ] **Step 6: Verify in the browser.** Flips happen from wave 3, enemies get tougher during a flip, everything stays readable, and the boss phases trigger flips.
- [ ] **Step 7: Commit and push:** `git commit -am "feat: Upside Down flip"`

---

### Task 8 (stretch): Pizza Hut sauce van

**Files:**
- Create: `src/entities/PizzaVan.js`
- Modify: `src/scenes/GameScene.js`, `src/scenes/UIScene.js`, `src/art/textures.js`
- Test: `tests/combat.test.mjs` (extend)

**Interfaces:**
- Consumes: `pointAt`, `ROAD`, `applyDamage`, `CONFIG.pizza`.
- Produces: `sauce(e, now)` in `combat.js` sets `e.saucedUntil = now + CONFIG.pizza.saucedMs`, then calls `applyDamage(e, CONFIG.pizza.damage, now)` and returns its result.

- [ ] **Step 1: Write the failing test**

```js
test('sauce damages and marks', () => { const e = makeEnemyState('brute'); sauce(e, 0); assert.equal(e.saucedUntil, 4000); assert.equal(e.hp, 90 - 15 * 1.5); });
```

(Damage is applied after marking, so the multiplier applies, which is the intended effect.)

- [ ] **Step 2: Run the test.** Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `node --test tests/`. Expected: PASS.
- [ ] **Step 5: Wire up the van.**
  - A "Call Pizza Hut (50)" shop button, with a cooldown sweep shown on it.
  - The van is red and white, pixel art, with no logo. It drives from the office back along the road toward the rift at `speed`.
  - It calls `sauce` once on each enemy within `radius` and leaves red splats on the road.
  - Sauced enemies get a red tint and drip particles.
  - Add a toast: "The kids ordered pizza. Extra sauce."
- [ ] **Step 6: Verify in the browser.** Each enemy gets sauced only once per van run, sauced enemies are visibly slower and die faster, and the cooldown works.
- [ ] **Step 7: Commit and push:** `git commit -am "feat: Pizza Hut sauce van"`

---

### Task 9 (stretch): Polish

**Files:** `src/art/textures.js` (or PNGs in `assets/`), `src/audio/sfx.js`, the scenes, and `REGRET.md`

- [ ] **Step 1: Improve the art.**
  - Pixel sprites for the kids, the monsters, the office (with lit windows) and the DPG building.
  - Streetlights with light cones, plus a CRT-style vignette on the title screen.
  - One palette throughout.
- [ ] **Step 2: Improve the sound.** A low synth ambient drone, louder during flips, plus hit sounds.
- [ ] **Step 3: Remove rough edges.** Show tower ranges on hover, and add a short how-to-play line on the title screen. Remove the debug key, or put it behind `?debug`.
- [ ] **Step 4: Do a full playthrough on Pages** at projector resolution (1920×1080 and 1366×768). Check that it's winnable, the bell rings, and there are no console errors.
- [ ] **Step 5: Bring `REGRET.md` up to date, then commit and push:** `git commit -am "polish: art, sound, UX"`
