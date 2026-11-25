# Upside Defense

A Stranger Things–inspired tower defense game built in one day for the Intent Engineering Bootcamp (Day 5 hackathon, 2026-11-25).
The kids of a small 80s town defend the **NexiosIT office** from monsters pouring out of a Rift to the Upside Down.

### ▶ [Play it in your browser](https://kbo-nexiosit.github.io/Nexios-Tower-Defense/)

No install or sign-up. It runs on desktop browsers and needs a keyboard and mouse.

---

## How to play

Monsters walk from the Rift on the left to the office door on the right, finding their own way around whatever you build. Each one that gets through costs the office health (20 to start). The run never ends on its own: **level N is N waves and then a boss**. Beat the boss and the next level starts with your maze, kids and tokens intact (and +5 office health). How far can you get? Your score — bosses beaten, then waves survived — goes on the **local arcade leaderboard** with your three initials.

1. **Drop blocks.** You get random **Tetris blocks** (current and next are shown bottom-left). Rotate with **R**, right-click or the mouse wheel, then click to drop. Monsters walk around your blocks, so you're building the maze. A drop that would fully block the path, or land on a monster, is refused.
2. **Pick a kid.** A dropped block waits for the kid who runs it: press **1-4** or click a kid in the HUD. The kid's price pays for the block; **Esc** cancels. There's no skipping blocks.
3. **Edge squares fire.** Only a block's squares that touch open ground shoot. Squares boxed in by other blocks, houses or trees turn to stone walls.
4. **Upgrade.** Click a block and press **U** (or the HUD button). Kids level up from Lv1 to **Lv10**; each level adds +50% of the starting damage (the walkie slows harder, the lights stun longer). Going up from Lv L costs (0.5 + 0.25 × L) × the kid's price.
5. **Start the wave.** Press **SPACE**. Every monster you stop pays out **arcade tokens**. You start with 160.
6. **Clear the wave.** The **Nexios victory bell** rings and you get bonus tokens (10 + 3 × the wave number).

### Controls

| Key | Action |
|---|---|
| Click | Drop the current block, or select a block |
| **R** / right-click / wheel | Rotate the block |
| **1-4** | Pick the kid for a dropped block |
| **Esc** | Cancel a drop |
| **U** | Upgrade the selected block's kid |
| **SPACE** | Start the next wave |
| **S** | Swing the **Nexios Sword** (if you've earned it) |
| **P** | Call the **Pizza Hut** van (50 tokens, 20 s cooldown) |
| **M** / 🎵 | Music on/off (🔊 mutes everything) |

### Specials

- **Nexios Sword.** Clear a wave without letting a single monster through and you get one charge. Press **S** to wipe everything on screen. Against the boss it takes off 15% of its health. Clearing a wave *with* the sword doesn't earn it back.
- **Pizza Hut van.** It drives the monsters' current route spraying tomato sauce. Sauced monsters move 40% slower and take 50% more damage for 4 seconds.
- **The Upside Down.** From wave 3 on, the board can flip at random. The chance grows each wave, up to 35%. While it's flipped (25 s), monsters have 1.5× health and move 1.3× faster.

## The kids

| Kid | Cost | Does |
|---|---|---|
| Slingshot | 25 | Cheap and fast, low damage |
| Walkie-talkie | 40 | Slows every monster in range |
| Psychic | 80 | Long-range, slow, heavy beam |
| Christmas lights | 60 | Stuns everything in range for a moment |

## The monsters

| Monster | Notes |
|---|---|
| Crawler | The basic one. They come in every wave |
| Brute | Slow and tanky. Costs 3 health if it gets through. Shows up from wave 3 |
| Swarm | Fragile bats that fly straight over the maze. Show up from wave 5 |
| Boss | One per level, with its own twist (see below). Flies straight over the maze, except the bus |

Monsters get 12% more health every wave you play.

## The bosses (IT parodies)

| Level | Boss | Twist |
|---|---|---|
| 1 | The IT Partner | Bills by the hour: his minions speed up the longer he's alive |
| 2 | The Agile Firm | Sprints: 3× speed for 1 s every 4 s |
| 3 | Captain Service Bus | Drives the maze and drops off crawlers at 75 / 50 / 25% health |
| 4 | The Java Overlord | Coffee break every 8 s: heals 6% |
| 5 | Sir .Net | Nets your nearest block every 6 s: it stops firing for 3 s |
| 6 | The Cloud Consultant | Goes "offline" (can't be hit) 2 s out of every 6 |
| 7 | The BSOD Preventer | Blue shield blocks all damage 2 s out of every 7 |
| 8 | The Big 5 IT | Splits into five smaller partners at 50% health |

After the eighth they come round again, 50% tougher each lap. Bart, on the roof of the NexiosIT office, rings the victory bell for every wave you clear.

---

## Run it locally

There's no build step. The game is plain ES modules. Phaser 3.90.0 loads from cdnjs, and if that fails (no internet, for example) it falls back to the copy in `vendor/phaser.min.js`.

```bash
node serve.mjs
```

Then open http://localhost:8080 (set `PORT` to use a different port).

URL flags:

- `?canvas` uses the Canvas renderer instead of WebGL. The game switches to it on its own if WebGL fails to start, which some GPUs do.
- `?debug` turns on **B**, which jumps straight to the boss wave with 2,000 extra tokens.

## Tests

The game rules (combat, upgrades, economy, waves, the maze grid and pathfinding, Tetris blocks, the boss, the sword, the flip and the pizza van) live in `src/logic/` and don't depend on Phaser, so they're unit-tested with Node's built-in test runner:

```bash
node --test tests/
```

## Project layout

```
index.html          Entry page (loads Phaser + src/main.js)
src/config.js       Every tuning number in one place
src/logic/          Pure game rules, unit-tested
src/entities/       Tower, Enemy, PizzaVan sprites
src/scenes/         Title, Game, UI (HUD) and End scenes
src/art/            Textures generated at runtime
src/audio/          Sound effects
tests/              node:test suites for src/logic/
docs/superpowers/   Design spec and implementation plan
REGRET.md           What broke during the build, and how it was fixed
```

To rebalance the game, edit `src/config.js`. Tower costs, enemy stats, wave sizes, flip odds and pizza numbers all live there.

## Deployment

The site is served by GitHub Pages straight from the repository's files. There's no build or workflow, and `.nojekyll` makes Pages serve them exactly as they are. Pages publishes the root of the `game` branch, so pushing to `game` updates the live game.

## Classic version

The original winding-road version is kept at `/classic/` (https://kbo-nexiosit.github.io/Nexios-Tower-Defense/classic/) and tagged `classic-road`.
