# Upside Defense

A Stranger Things–inspired tower defense game built in one day for the Intent Engineering Bootcamp (Day 5 hackathon).
The kids of a small 80s town defend the **NexiosIT office** from monsters pouring out of a Rift to the Upside Down.

**Play:** https://kbo-nexiosit.github.io/Nexios-Tower-Defense/

## How to play

- Click beside the road to place kids; click a kid to upgrade it. Earn **arcade tokens** for every monster stopped.
- **SPACE** starts the next wave. Clearing a wave rings the **Nexios victory bell** (+bonus tokens).
- Clear a wave with zero leaks to win the **Nexios Sword** — **S** slices through everything on screen.
- **P** calls a **Pizza Hut** van that drives down the road spraying tomato sauce: monsters slow down and take extra damage.
- Beware the **Upside Down**: by bad luck the board flips and tougher monsters reign for a while.
- Survive 10 waves, including the very hard final boss.

## Kids

| Kid | Does |
|---|---|
| Slingshot | Cheap, fast, low damage |
| Walkie-talkie | Slows monsters in range |
| Psychic | Slow, heavy beam |
| Christmas lights | Stuns everything in range |

## Run locally

No build step. Phaser 3.90.0 loads from cdnjs.

```bash
node serve.mjs
```

Then open http://localhost:8080. If WebGL misbehaves on a machine, add `?canvas`.

## Tests

Game rules live in `src/logic/` and are unit-tested:

```bash
node --test tests/
```

Design and plan: `docs/superpowers/`. Retro notes: `REGRET.md`.
