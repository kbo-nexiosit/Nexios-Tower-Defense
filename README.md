# Upside Defense

A Stranger Things–inspired tower defense game built in one day for the Intent Engineering Bootcamp (Day 5 hackathon, 2026-11-25).
The kids of a small 80s town defend the **NexiosIT office** from monsters pouring out of a Rift to the Upside Down.

### ▶ [Play it in your browser](https://kbo-nexiosit.github.io/Nexios-Tower-Defense/)

No install or sign-up. It runs on desktop browsers and needs a keyboard and mouse.

---

## How to play

Monsters walk the road from the Rift on the left to the office door on the right. Each one that gets through costs the office health (20 to start). Survive **10 waves**, the last of which is a boss.

1. **Place kids.** Pick a kid from the HUD, then click beside the road. You can't build on the road or right on top of another kid.
2. **Upgrade.** Click a kid you've placed to upgrade it. Each kid has two upgrade levels.
3. **Start the wave.** Press **SPACE**. Every monster you stop pays out **arcade tokens**. You start with 150.
4. **Clear the wave.** The **Nexios victory bell** rings and you get bonus tokens (20 + 5 × the wave number).

### Controls

| Key | Action |
|---|---|
| Click | Place a kid, or select one to upgrade |
| **SPACE** | Start the next wave |
| **S** | Swing the **Nexios Sword** (if you've earned it) |
| **P** | Call the **Pizza Hut** van (50 tokens, 20 s cooldown) |

### Specials

- **Nexios Sword.** Clear a wave without letting a single monster through and you get one charge. Press **S** to wipe everything on screen. Against the boss it takes off 15% of its health. Clearing a wave *with* the sword doesn't earn it back.
- **Pizza Hut van.** It drives down the road spraying tomato sauce. Sauced monsters move 40% slower and take 50% more damage for 4 seconds.
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
| Swarm | Fragile but fast, arrives in packs. Shows up from wave 5 |
| Boss | Wave 10. 4,000 HP, with escorts. Letting it through ends the game |

Monsters get 12% more health every wave.

---

## Run it locally

There's no build step. The game is plain ES modules, and Phaser 3.90.0 loads from cdnjs.

```bash
node serve.mjs
```

Then open http://localhost:8080 (set `PORT` to use a different port).

URL flags:

- `?canvas` uses the Canvas renderer instead of WebGL. The game switches to it on its own if WebGL fails to start, which some GPUs do.
- `?debug` turns on **B**, which jumps straight to the boss wave with 2,000 extra tokens.

## Tests

The game rules (combat, economy, waves, the boss, the sword, the flip, the pizza van and the road path) live in `src/logic/` and don't depend on Phaser, so they're unit-tested with Node's built-in test runner:

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
