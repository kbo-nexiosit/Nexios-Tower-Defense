# Endless run, arcade leaderboard, Bart on the roof, IT bosses — Design (short)

Date: 2026-11-25 · Owner: kbo-nexiosit · Deadline: live by 15:45 today (≈85 min)

## Why
The game is judged on gameplay and on how much players want to keep playing. A fixed 10-wave run with no score gives no reason to play again.

## Decided by the owner
- **Run of growing levels:** level N = N waves, then a boss. The run ends only when the office falls. Score = bosses beaten, then waves survived.
- **Between levels (option B):** the maze, kids, upgrades and tokens all carry over; only the monsters reset.
- **Bosses (IT parodies, no real names, faces or logos),** in this order: The IT Partner, The Agile Firm, Captain Service Bus, The Java Overlord, Sir .Net, The Cloud Consultant, The BSOD Preventer, The Big 5 IT. After the eighth they repeat, harder.
- **Bart is no longer a boss.** He's a friendly figure on top of the NexiosIT building, with no name label.
- **Local arcade leaderboard:** top 10 in the browser, 3-letter initials like an 80s cabinet.

## Approved proposals (owner: "all ok")
- Office health carries over; each boss beaten repairs +5 (max 20).
- Monster toughness scales with total waves played in the run.
- A breather banner before each level ("LEVEL 3 — THE AGILE FIRM IS COMING"); SPACE starts it.
- HUD: "LEVEL n · WAVE w/n" plus the next boss's name.
- Bart: waves at the start, rings the VICTORY bell on wave clear, cheers at a boss kill, despairs at a leak.
- Leaderboard shown on the game-over and title screens, new entry flashing; "Reset scores" on the title screen.
- Bart's phase flips are removed. The Upside Down stays random; the sword, pizza and bell are unchanged.

## Boss twists (each boss flies straight over the maze, except the bus)
| # | Boss | Twist |
|---|---|---|
| 1 | The IT Partner | the longer he's alive, the faster his minions run (+5% speed per 5 s, max +50%) |
| 2 | The Agile Firm | sprints: 3× speed for 1 s every 4 s |
| 3 | Captain Service Bus | walks the maze; drops 4 crawlers at 75 / 50 / 25% health |
| 4 | The Java Overlord | coffee break every 8 s: heals 6% of max health |
| 5 | Sir .Net | every 6 s nets the block nearest him, which stops firing for 3 s |
| 6 | The Cloud Consultant | "offline" (untargetable, half-transparent) for 2 s every 6 s |
| 7 | The BSOD Preventer | blue shield blocks all damage for 2 s every 7 s |
| 8 | The Big 5 IT | at 50% health splits into 5 mini-bosses (8% max health each) |

Boss health: 1200 × (1 + 0.35 × (level − 1)), plus +50% on every lap after the eighth boss.

## Approaches
Owner picked **staged extension of the current game** (run → leaderboard → Bart → bosses). Rejected: look-only bosses, which play the same; a separate endless mode, which doubles the code.

## Left to the builder
Exact sprites, wave makeup per level (reuse `waveSchedule` with a global wave index), timing values within reason, banner text.
