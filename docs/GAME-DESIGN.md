# Upside Defense — game design and decisions

This file is the single source of truth for what the game is, why it is that way, and how it's run. It replaces the scattered conversation history. The older documents in `docs/superpowers/` are kept as history; where they disagree with this file, this file wins.

- **Live game:** https://kbo-nexiosit.github.io/Nexios-Tower-Defense/
- **Fallback (old road version):** https://kbo-nexiosit.github.io/Nexios-Tower-Defense/classic/
- **Repo:** `kbo-nexiosit/Nexios-Tower-Defense` (public). GitHub Pages publishes the root of the **`game`** branch.
- **Context:** built for Day 5 of the Intent Engineering Bootcamp hackathon ("Defend the Codebase" brief), 2026-11-25, by kbo-nexiosit with Claude. Judges score the demo on features, fun, polish, Nexios references, and how much people want to keep playing.

---

## 1. The game in one paragraph

An 80s small town at night, inspired by *Stranger Things* but with no names, characters or logos from the show. Monsters pour out of a Rift on the left and head for the **NexiosIT office** on the right. You build a maze out of **Tetris blocks**, and each block is run by a kid who fights back. The run never ends on its own. **Level N is N waves and then a boss.** The bosses are IT-industry parodies. Your maze carries over from level to level. The score is how far you get, and it goes on a local **80s arcade leaderboard** with your three initials.

---

## 2. Core gameplay (as built)

### 2.1 The board
- **The grid:** 33 × 20 squares of 32 px, from y = 64 down to the bottom of the screen. Monsters spawn at square (0,10), the Rift, and head for (32,10), the office entrance.
- **Fixed obstacles:** 7 houses (2×2 squares each) and 12 trees (1 square each), set in `config.maze`.
- **To the right of the grid:** the **NexiosIT office** (4 storeys, glass, Nexios logo) and the **DPG Media** building next to it, which is only decoration.
- **The route trail:** the monsters' current route is drawn as a dirt trail.

### 2.2 Tetris blocks and the maze (owner's spec)
1. **Blocks:** towers come as random Tetris blocks (the 7 standard shapes, dealt from a fair 7-bag). The current and next blocks show bottom-left. **R**, right-click or the mouse wheel rotates.
2. **Never fully blocked:** monsters walk **around** blocks. A drop that would leave no route is refused, and so is a drop on a monster or one that would trap a monster in a pocket.
3. **Edge squares fire:** only a block's edge squares fire; the inner squares are walls.
   - **Owner's choice "1a":** blocks that touch merge. A square counts as **inner** when none of its 4 sides opens onto walkable ground: it's enclosed by other blocks, houses, trees or the edge of the field. Inner squares turn to grey stone and never fire.
   - A lone Tetris block therefore never has inner squares. Walls only appear when blocks are packed together.
4. **Choosing the kid (owner):** a dropped block waits for its kid. Press **1–4** or click a kid in the HUD; the kid's price pays for the block. **Esc** cancels. There's no skipping blocks ("what you see is what you get").
   - **Claude's call:** you can't drop a block without paying for a kid, otherwise blocks would be free walls.
5. **One kid per block (Claude's call):** a block fires like one kid, at that kid's normal rate. Each shot comes from the edge square nearest the target, and range is measured from edge squares only. Edge squares don't each fire on their own, which would mean 3–4× the firepower and need a new balance.
6. **Path preview (merged from a parallel session):** while hovering a block, a cyan dashed line shows the detour the monsters would take, with "+N steps" above the block. The label hides in the Upside Down.

### 2.3 The kids (towers)
| Kid | Price | Base stats | Effect |
|---|---|---|---|
| Slingshot | 25 | range 110, damage 6, every 400 ms | cheap and fast |
| Walkie-talkie | 40 | range 90, slows to 50% for 1.5 s, pulse every 1 s | slows everything in range |
| Psychic | 80 | range 160, damage 45, every 1.8 s | heavy beam |
| Christmas lights | 60 | range 80, damage 3, stun 0.6 s, pulse every 3 s | stuns everything in range |

**Upgrades (owner: up to Lv10, gradual damage, price relative to the kid):**
- Click a block and press **U** (or the HUD button). Kids go from Lv1 (just bought) to **Lv10**, and the block shows "LvN".
- **Per level:** +50% of the starting damage, +3% range. The walkie slows 0.025 harder (never below 0.25) and the lights stun 8% longer.
- **Price:** going from Lv L to L+1 costs **(0.5 + 0.25 × L) × the kid's price**.
- **Tuning history:** the first try (+35% damage, 0.75 + 0.25 × L) lost on wave 6 in simulation and was retuned.
- **The boss resists:** it can't be stunned and is slowed no lower than 75% speed, so the lights can't lock it in place.

### 2.4 Monsters
| Type | HP | Speed | Reward | Leak damage | Notes |
|---|---|---|---|---|---|
| Crawler | 20 | 80 | 4 | 1 | four-legged, red flower-petal head; walks the maze |
| Brute | 90 | 42 | 9 | 3 | tall flower-faced monster; from wave 3 |
| Swarm (bat) | 10 | 55 | 2 | 1 | **flies straight over the maze** (owner); from wave 5 |
| Boss | per level | 9 | 0 | 20 | flies straight over the maze, except Captain Service Bus |
| Mini (Big 5 split) | 8% of the boss | 14 | 0 | 4 | flies |

- **Wave makeup:** 6 + 2n crawlers, n − 2 brutes from wave 3, 2(n − 4) + 2 swarms from wave 5, interleaved and spaced 700 ms apart. After wave 9 the makeup stops growing; only health keeps rising.
- **Health:** +12% for every wave played in the run, counted across the whole run.

### 2.5 Economy
- **Start:** 160 tokens and 20 office health.
  - **Tuning history:** the road version started with 150 and then 120 (the owner said "too easy, fewer points"). The maze version needed 160, because 120 lost on wave 4 in simulation.
- **Rewards:** 4 / 9 / 2 tokens per monster. **Clearing a wave** rings the bell and pays **10 + 3 × wave** (capped at wave 12 for the bonus).
- **Simulated result:** a good build wins the classic 10 waves with 11–14 of 20 office health. That's "tight but winnable", which the owner approved.

---

## 3. The endless run (owner, for replay value)

- **Levels:** level N = **N waves, then a boss**. SPACE starts each stage. The run never ends in a win; it ends when the office falls.
- **Between levels (owner's choice "B"):** the maze, kids, upgrades and tokens all carry over; only the monsters reset.
- **Office health carries over;** each boss beaten repairs **+5** (max 20).
- **Banners:** "BOSS NAME DEFEATED", then "LEVEL n — boss name is coming — N waves first". The boss's entrance shows its name.
- **HUD:** "LV n · WAVE w/n", or "LVn · BOSS", plus "Next boss: …" and "bosses beaten: k". The boss's name sits on its health bar.
- **Score:** bosses beaten first, then waves survived (tie-break).

### 3.1 Bosses (owner chose the names; Claude proposed the twists)
All bosses are IT parodies, with **no real company or person names, faces or logos**. Boss health = **1200 × (1 + 0.35 × (level − 1)) × 1.5^lap**, where the lap goes up by 1 after every 8 bosses. Each boss stage brings 4 crawler escorts.

| Level | Boss | Look | Twist (`src/entities/bosses.js`) |
|---|---|---|---|
| 1 | The IT Partner | pinstripe suit, stopwatch | minions +5% speed per 5 s he's alive (max +50%) |
| 2 | The Agile Firm | hoodie covered in sticky notes | sprints: 3× speed for 1 s out of every 4 |
| 3 | Captain Service Bus | yellow bus with a captain's cap | **walks the maze**; drops 4 crawlers at 75/50/25% health |
| 4 | The Java Overlord | crowned steaming coffee cup | coffee break every 8 s: heals 6% of max health |
| 5 | Sir .Net | knight with a fishing net | every 6 s nets the nearest block, which stops firing for 3 s |
| 6 | The Cloud Consultant | cloud with a tie | "offline" 2 s out of every 6: can't be targeted or hurt |
| 7 | The BSOD Preventer | blue-screen monitor creature | blue shield 2 s out of every 7 blocks all damage |
| 8 | The Big 5 IT | five grey suits stacked together | splits into 5 minis at 50% health; the level clears when all 5 fall |

From level 9 the bosses repeat, 50% tougher per lap. Bosses that can't be hit at the moment are ignored by kids, the sword and the van.

### 3.2 Bart (owner)
- **Bart (the Nexios CEO) is not a boss.** He's the **friendly guy on the NexiosIT roof**: dark hair, glasses, broad build, white Nexios shirt, smiling. **No name or title is ever shown.**
- **Behaviour:** he waves at the start, rings the roof bell for every cleared wave, jumps 3 times when a boss falls, and turns blue and shudders when a monster gets in.
- **History:** Bart started as a Vecna-style final boss, later shown without his name, and was then moved to the roof. **Open item: the owner should still ask Bart if he's OK appearing in the game.**

### 3.3 Arcade leaderboard (owner)
- **Local only, like an 80s cabinet:** the top 10 is stored in the browser's `localStorage` under the key `upside-defense-scores`, so each machine (e.g. the demo laptop) has its own hall of fame.
- **Game over:** if the score makes the top 10, you enter **3 initials** (type them, or use ←/→ for the slot and ↑/↓ for the letter, then Enter or SAVE). The top-10 table shows, with the new entry flashing.
- **Title screen:** the top 5, plus **"reset scores"**, which needs a second click within 3 s.
- **Storage that fails** (private window) or holds bad data gives an empty board, never a crash.

---

## 4. Nexios references (judged; gameplay references score highest)
- **Nexios victory bell:** rings on every cleared wave (double "ting ting"). VICTORY is engraved on it, it swings in the banner, and Bart rings it on the roof. It pays the clear bonus.
- **Nexios Sword:** earned by a wave with **zero leaks** (max 1 charge). **S** sweeps a giant GoT-style longsword with the NEXIOS IT wordmark on the blade across the screen: it kills everything except bosses, which take 15% of their max health.
  - A wave cleared *with* the sword never earns it back; this was found in testing as an "infinite sword".
  - The sword can't be used on an empty board.
- **Pizza Hut van:** **P**, 50 tokens, 20 s cooldown. It drives the monsters' current route from the office back to the Rift, spraying tomato sauce. Each monster is sauced once per trip: 15 damage, 40% slower and +50% damage taken for 4 s.
  - "Pizza Hut" appears as **text only, with no logo** (decided at the start because the page is public).
- **NexiosIT office** as the base, with the real white logo from nexiosit.com. The win and end screens used the tagline "Your partner for software, cloud & AI solutions — and monster removal".
- **Bart** on the roof (see 3.2).

## 5. The Upside Down
- **When it strikes:**
  - Only during a wave, from wave 3 on. Every 10 s there's a chance of **min(35%, 4% × wave)**.
  - "something is wrong…" flickers for 1 s first.
  - It lasts **25 s**.
  - Boss health thresholds no longer trigger it; that was a Bart-boss feature, removed with him.
- **How it looks (owner):** the board **flips from bottom to top like a card** and shows its **mirrored backside**, as in the show. The camera zoomY tweens 1 → 0 → −1, with dark red vines, a red/cold tint, ash and red lightning flashes.
  - Messages (banners, tips, toasts) render in the UI scene so they stay readable.
  - **Inverted mouse (owner):** while the board is flipped, the vertical mouse axis is inverted: moving the mouse up moves the block down, and a click drops (or selects) where the block is, not under the cursor. Horizontal stays normal. Switch off with `CONFIG.flip.invertMouseY`.
- **Gameplay:** monsters that spawn during it have **1.5× health and 1.3× speed** and keep them.
- **Sound:** the game music goes muffled and a low drone plays. The drone fades out fully when the board flips back; an earlier bug left it hanging.

## 6. Audio (all synthesised with the Web Audio API, no audio files)
- **Music:** an **original** dark 80s synth track: D minor, 106 bpm, a tom groove, a warm snare (the first gated-noise snare sounded like "paper tearing"), pulsing bass, brass stabs and a sparse lead.
  - **Not "Running Up That Hill":** the owner asked twice. A recording or a synth version of the melody would still be the copyrighted song on a public page, so Claude declined. The suggestion stands to play the real song from the laptop alongside the game, with the music muted.
  - Nothing sustains in the drone's low register, so the music can't be confused with the Upside Down.
- **Controls:** 🎵 or **M** turns the music on/off while effects keep playing; 🔊 mutes everything.
- **Effects:** sounds for the bell, shots, the psychic zap, pulses, the sword, sauce splats, the boss growl, the flip and thunder.
- **Unlocking audio:** the browser blocks sound until a click or key press, so every click and key re-unlocks it.

## 7. Visual style
- **Detailed pixel art**, the owner's pick over code-drawn shapes ("too immature"). Sprites are drawn at low resolution with automatic outlines and shading, then upscaled (`src/art/pixel.js`, `sprites.js`, `environment.js`). A parallel session then added moonlit baked lighting, an animated Rift, combat effects, shadows and hit flashes, and a title backdrop.
- **Fonts:** Press Start 2P for headlines, VT323 for the HUD (Google Fonts).
- **Title screen:** the kids with flashlights facing the monsters at the Rift, the high-score panel, and the controls line.

## 8. Controls
| Input | Action |
|---|---|
| Mouse move | Preview the block and its reroute |
| Click | Drop the block / select a block |
| R, right-click, wheel | Rotate the block |
| 1–4 or HUD kid | Choose the kid for a dropped block |
| Esc | Cancel a drop |
| U | Upgrade the selected block |
| SPACE | Start the next wave or boss |
| S | Nexios Sword |
| P | Pizza Hut van |
| M / 🎵 | Music on/off |
| 🔊 | Mute all |

URL flags: `?debug` exposes `window.__game` and makes **B** jump to the current level's boss stage (+2000 tokens). `?canvas` forces the Canvas renderer.

---

## 9. Constraints and anti-goals (keep these)
- **No real names, faces or logos:** none from *Stranger Things*, and no real competitors or their CEOs. Real competitor CEOs as bosses were rejected because of client, partner and legal risk on a public page; the IT parodies are the replacement.
- **Bart:** no name or title shown; the owner asks Bart for consent.
- **No secrets or client content** in the repo; it's public.
- **Copyright:** no copyrighted music or art.
- **Readability:** towers, monsters and the route must stay readable, including in the Upside Down.

## 10. Tech and operations
- **Stack:** Phaser **3.90.0** from cdnjs, with a byte-identical offline copy in `vendor/phaser.min.js` that loads automatically if the CDN fails. Plain ES modules, no build step, no npm.
- **WebGL:** some GPUs fail Phaser's shader ("Link Shader failed"), so `render.maxTextures = 1` and an automatic reload into `?canvas`.
- **Local run:** `node serve.mjs` → http://localhost:8080 (Node 20; Python isn't installed in the dev container).
- **Deploy:** push to `game`, and Pages rebuilds in about 1 minute. Hard-reload with **Ctrl+Shift+R**, because Pages caches files for 10 minutes.
- **Branches:**
  - `game` is live.
  - `main` only has the initial README and docs; it was never merged, and the owner decides.
  - `graphics-upgrade` and `path-preview` came from parallel sessions and are merged into `game`.
  - The tag `classic-road` and the folder `/classic/` hold the old road version.
- **Code layout:**
  - `src/config.js`: every tuning number.
  - `src/logic/`: pure rules, unit-tested — grid and pathfinding, tetromino, combat and upgrades, economy, waves, run, leaderboard, bossTimers, boss thresholds, sword, flip, path.
  - `src/entities/`: Enemy, Tower (blocks), PizzaVan, bosses.
  - `src/scenes/`: Title, Game, UI (HUD), End.
  - `src/art/`: the pixel engine and sprites.
  - `src/audio/sfx.js`: audio.
- **Tests:** `node --test tests/`, 98 passing at the time of writing.
- **Balance testing method:** load `?debug`, sleep the Phaser loop (`game.loop.sleep()`), then step it frame by frame (`game.step(t, 16.667)`) from the browser console to fast-forward whole games with a scripted build. The test browser runs at about 1 fps, so real-time play can't be judged there. Phaser tweens run on wall-clock time, so these simulations slightly under-count slingshot damage.
- **`REGRET.md`:** a log of what broke and how it was fixed, for the retro.

## 11. Open items and known minor issues
- **Owner:** ask Bart for consent; play one full run at real speed on the demo laptop to judge difficulty from level 2 on, which has **not been re-simulated** since the bosses were added; clear the leaderboard before the demo if needed.
- **Not yet verified:** Captain Service Bus's crawler drop-offs weren't clearly seen in the fast-forwarded test.
- **Deferred minors from the code review:**
  - On very slow machines the spawn and movement clocks drift, and the pizza cooldown bar can look ready a moment early.
  - The global "WebGL error → reload into canvas" handler is active all game, not just at startup.
- **Possible next ideas, none agreed:**
  - A shared online leaderboard (needs a service).
  - Every edge square firing on its own (needs a rebalance).
  - More maps.
