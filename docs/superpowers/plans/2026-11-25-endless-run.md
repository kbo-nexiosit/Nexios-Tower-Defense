# Endless Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 10-wave game into an endless run of growing levels with IT-parody bosses, a local 3-letter arcade leaderboard, and Bart cheering from the NexiosIT roof.

**Architecture:** New pure modules (`src/logic/run.js`, `src/logic/leaderboard.js`, `src/logic/bossTimers.js`) hold the rules and are unit-tested. `GameScene` drives levels, `src/entities/bosses.js` holds one behaviour per boss, `EndScene` and `TitleScene` show and edit the leaderboard, and `src/art/sprites.js` gains the boss and Bart sprites.

**Tech Stack:** Phaser 3.90.0 (CDN), ES modules, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-endless-run-design.md`

## Global Constraints
- No real company or person names, faces or logos. Bart has no name label.
- Boss order: itPartner, agileFirm, serviceBus, javaOverlord, sirDotNet, cloudConsultant, bsodPreventer, big5. After those they repeat (lap + 1).
- Boss health = 1200 × (1 + 0.35 × (level − 1)) × 1.5^lap.
- The maze, kids, upgrades and tokens carry over between levels. Office health carries over, +5 per boss beaten (max 20).
- Score = bosses beaten (primary), waves survived (tie-break). The leaderboard keeps the top 10 in localStorage under the key `upside-defense-scores`, each entry with 3 uppercase letters.
- Must be live by 15:45. Each stage is deployed as soon as it works.

## Review Focus
1. A broken or blocked localStorage (private window), or bad JSON, must not crash the game. The leaderboard just comes up empty. Covered by the leaderboard tests.
2. Untargetable bosses (Cloud offline, BSOD shield) must not be picked by kids and must take no damage from the sword or the van. Covered by the bossTimers tests and a `hit()` guard.
3. The Big 5 IT split: the level must clear only when all five minis are dead, and the minis must not count as a boss kill. Checked in the browser.
4. Losing during a boss wave goes to the end screen with the correct score: bosses = level − 1.
5. Play Again starts a fresh run (level 1, 160 tokens, empty board) with the leaderboard intact.

---

### Task 1: Run rules (`src/logic/run.js`) — test-first
**Produces:**
- `BOSS_ORDER: string[]`
- `BOSS_NAMES: {key: name}`
- `bossFor(level) -> { key, name, lap }`
- `bossHp(level) -> number`
- `levelWaves(level) -> number` (= level)
- `compareScores(a, b) -> number` (descending by bosses, then waves)

- [ ] Tests (`tests/run.test.mjs`):
  - `bossFor(1).key === 'itPartner'`
  - `bossFor(9)` is `{ key: 'itPartner', lap: 1 }`
  - `bossHp(1) === 1200`
  - `bossHp(3) === 1200 * 1.7`
  - `bossHp(9) === 1200 * (1 + 0.35 * 8) * 1.5`
  - `levelWaves(4) === 4`
  - Sorting `[{b:1,w:3},{b:2,w:1},{b:1,w:5}]` gives bosses 2, then 1/5, then 1/3.
- [ ] Watch them fail, implement, watch them pass, commit.

### Task 2: Leaderboard rules (`src/logic/leaderboard.js`) — test-first
**Produces:**
- `loadBoard(storage) -> Entry[]` (returns `[]` if storage throws, or on bad JSON or a non-array)
- `saveBoard(storage, board)` (swallows errors)
- `qualifies(board, score) -> bool`
- `insertScore(board, { initials, bosses, waves }) -> { board, rank }` (sorted, max 10; initials cleaned to `[A-Z]`, padded with `A` to length 3)
- `KEY = 'upside-defense-scores'`

- [ ] Tests (`tests/leaderboard.test.mjs`):
  - Bad JSON gives `[]`.
  - A throwing storage gives `[]`.
  - `qualifies` returns true while the board has fewer than 10 entries.
  - On a full board, a worse score than the last entry doesn't qualify.
  - Insert keeps the board sorted and cuts it to 10.
  - `rank` is the 0-based index.
  - `'ab'` becomes `'ABA'`.
- [ ] Watch them fail, implement, watch them pass, commit.

### Task 3: Boss twist timers (`src/logic/bossTimers.js`) — test-first
**Produces** (`t` = ms since the boss spawned):
- `partnerSpeedMult(t) = min(1.5, 1 + 0.05 * floor(t / 5000))`
- `agileSprinting(t) = t % 4000 < 1000`
- `cloudOffline(t) = t % 6000 >= 4000`
- `bsodShielded(t) = t % 7000 >= 5000`
- `crossedEvery(prevT, t, period)` (true when a multiple of `period` lies in `(prevT, t]`)

- [ ] Tests (`tests/bossTimers.test.mjs`), one per function, with boundary values:
  - `partnerSpeedMult`: 0 → 1, 5000 → 1.05, 60000 → 1.5
  - `agileSprinting`: 500 → true, 1500 → false
  - `cloudOffline`: 4500 → true
  - `bsodShielded`: 5500 → true
  - `crossedEvery(7900, 8100, 8000) === true`, `crossedEvery(8100, 8200, 8000) === false`
- [ ] Watch them fail, implement, watch them pass, commit.

### Task 4: Level loop in GameScene + HUD (stage 1) — deploy
- [ ] Game state:
  - `level = 1`, `waveInLevel = 0`, `globalWave = 0`, `bossesBeaten = 0`, `bossStage = false`
  - SPACE starts the next stage. While `waveInLevel < levelWaves(level)`, it starts a normal wave: `waveSchedule(min(globalWave, 9))`, with hpScale from `globalWave`, and no boss.
  - After that it starts the boss stage: one boss (`e.bossKey`, `maxHp = bossHp(level)`, flying except `serviceBus`) plus 4 crawlers as escorts.
- [ ] Wave and level outcomes:
  - A normal wave cleared gives the bell and bonus as now.
  - A cleared boss stage gives:
    - `bossesBeaten++` and health +5 (max 20)
    - `level++`, `waveInLevel = 0`
    - the banner `LEVEL {n} — {NAME} IS COMING`
    - Bart cheers (Task 7 hook: `this.events.emit('bossBeaten')`)
  - The run never ends in a win; `endGame(false)` is the only end.
- [ ] Remove the flip-on-boss-phase; keep `bossPhase` for the bus drops.
- [ ] HUD: `LEVEL n · WAVE w/n`, or `LEVEL n · BOSS`, plus `Next boss: NAME`. Emit `game.events 'run'` with `{level, waveInLevel, waves, bossName, bossStage}`.
- [ ] Send the end scene `{ won: false, score: { bosses, waves: globalWave survived } }`.
- [ ] Browser check: level 1 = 1 wave, then a boss. Beating it leads into level 2 with the maze kept. Commit and deploy.

### Task 5: Arcade leaderboard UI (stage 2) — deploy
- [ ] EndScene:
  - Show "GAME OVER", bosses beaten and waves survived.
  - If the score qualifies: initials entry. Three slots: ←/→ select a slot, ↑/↓ change the letter, typing a letter sets it and moves on, Enter saves.
  - Then the top 10 table, with the new rank flashing, and "PLAY AGAIN".
- [ ] TitleScene: top-5 table plus a "Reset scores" text button that needs a second click within 3 s to confirm.
- [ ] Browser check: lose → enter "KBO" → listed. Commit and deploy.

### Task 6: Bart on the roof (stage 3) — deploy
- [ ] `sprites.js`: `friendlyBart()`, a 2-frame sprite (idle; arms up): dark hair, glasses, broad build, a white Nexios shirt, a smile. Add a small roof-bell prop.
- [ ] GameScene: Bart stands on the office roof next to the logo, at about (1235, 270).
  - On run start: waves (arm tween).
  - On `waveCleared`: rings the roof bell (bell swings, Bart frame 1).
  - On `bossBeaten`: 3 jumps.
  - On leak: shakes, tinted blue.
- [ ] Remove the old boss texture's use as Bart.
- [ ] Browser check, commit, deploy.

### Task 7: The 8 bosses (stage 4) — deploy each
- [ ] `sprites.js`: one 2-frame sprite per boss key, from the spec's looks, at about 30×40 pixels (scale 3). Texture key `boss-<key>`, animation `boss-<key>-walk`.
- [ ] `src/entities/bosses.js`: `BEHAVIOUR[key] = { update(scene, e, dtMs), canBeHit(e) -> bool }`. `e.age` is in ms.
  - itPartner: escorts and live walkers get speed × `partnerSpeedMult`
  - agileFirm: `e.speed = base × (agileSprinting ? 3 : 1)`
  - serviceBus: walks the maze; every boss threshold spawns 4 crawlers at the bus's cell
  - javaOverlord: every 8 s heals 6% of max, with a steam puff
  - sirDotNet: every 6 s, the nearest block gets `jammedUntil = now + 3000`, which `stepTower` skips; a net overlay is shown
  - cloudConsultant: while offline, `e.untargetable = true` and alpha 0.35
  - bsodPreventer: while shielded, `e.untargetable = true` with a blue ring
  - big5: on first crossing 50%, it's removed without a kill and spawns 5 minis (`type 'mini'`, 8% max health each, flying, speed 14, leak 4, reward 0)
- [ ] The `pickTargetFrom` and `inRangeOfAny` callers skip `e.untargetable`. `hit()` returns early when `e.untargetable`. The sword and the van respect it too.
- [ ] UI: the boss name shows over the boss health bar.
- [ ] Browser check per boss (debug: `?debug` + B jumps to the next boss stage). Commit and deploy.
