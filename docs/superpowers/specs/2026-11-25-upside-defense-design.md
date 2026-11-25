# Nexios Tower Defense — "Stranger Things"-inspired — Design

Date: 2026-11-25 · Owner: kbo-nexiosit (solo) · Deadline: today, 15:45 (demo prep), 16:00 showcase

## Intent and why

A browser tower defense game for the Intent Engineering Bootcamp Day 5 hackathon ("Defend the Codebase" brief). Built solo, in one day, demoed live to judges and the cohort; a judge plays it live. Judging: most features, most fun, most polished, best Nexios references (gameplay references score highest). Bart (CEO) may attend the final presentations.

Theme: inspired by *Stranger Things* — a dark 1980s small town at night, a mirror "Upside Down" world, monsters coming through a rift, and kids fighting back.

## Goals

- A complete, playable tower defense loop in the browser, opened from a GitHub Pages link.
- At least three Nexios references woven into gameplay: the Victory Bell, the Nexios Sword, Pizza Hut — plus Bart as final boss.
- A memorable demo: the Upside Down flip, the sword, Bart's fight, the bell.
- Something playable exists at every point of the day (build in priority order, below).
- `REGRET.md` kept during the day for the 16:30 retro.

## Non-goals

- Multiple maps, save games, accounts, leaderboards, mobile/touch tuning.
- Perfect balance. "Fun and survivable by a first-time judge" is the bar.

## Anti-goals (failure even if it technically works)

- Not live/working at 15:45.
- Uses the show's names, characters, logos, or ripped art — the page is public. Inspired-by only; original names and art.
- Bart portrayed in anything unfit for a big screen; Bart not asked first.
- Unreadable visuals: towers, enemies and path must be distinguishable at a glance, including during the Upside Down.
- Secrets or client content in the public repo.

## Constraints

- Browser only, opens from a link. Phaser 3 loaded from CDN (cdnjs, pinned exact version). No npm, no build step.
- Hosting: GitHub Pages from `kbo-nexiosit/Nexios-Tower-Defense`. **The repo is currently private and must be made public** for free Pages (owner's action; confirm before flipping).
- Fallback demo: open locally from the laptop over HDMI (needs a local static server, e.g. `python3 -m http.server`, because ES modules don't load from `file://`).
- Hard stops: be in the room at 12:00 and 14:30; lunch 12:45.

## Approaches considered

- **A. Phaser 3 via CDN, plain ES modules, no build — chosen.** Phaser covers path following, sprites, tweens, camera effects, sound. GitHub Pages serves the repo as-is; deploy = push. Trade-off: no hot reload or TypeScript, minor for one day.
- B. Phaser + Vite via npm. Hot reload, but adds a build, a GitHub Action, and the `base: '/<repo>/'` pitfall the brief warns about. More to break.
- C. Plain canvas. No dependency, but hours of plumbing (sprites, collisions, tweens, audio) instead of features.

Owner picked A.

## The game (decided by owner unless marked *proposal*)

### World and look
- Top-down 80s small town at night, one map, one winding road from the **Rift** (spawn) to the **base** (*proposal:* the school/lab, call it "Hawkins-ish" only by original name, e.g. "Maplewood Middle School").
- *Proposal:* 80s pixel art (`pixelArt: true`), one dark palette with neon accents. Start with coloured shapes; swap in art (generated or kenney.nl) later.

### Economy
- Currency: **arcade tokens** (owner). Earned per monster killed; spent on placing and upgrading kids.

### Towers — the kids (*proposal*, original names)
- Slingshot kid — cheap, fast, low damage.
- Walkie-talkie kid — slows enemies in range.
- Psychic kid — expensive, slow, heavy damage (nosebleed cooldown flavour).
- Christmas-lights — area stun pulse.
- Each tower has 1–2 upgrade levels.

### Enemies — from the Upside Down (*proposal*)
- Fast weak creature, tanky creature, flying/swarm variant; occasional mini-boss.
- Lose condition: base health reaches 0 (each leaked enemy costs health).

### Waves
- *Proposal:* ~8–10 waves, final wave = Bart. Start-wave button between waves.

### Nexios Victory Bell (owner)
- Rings when a wave/round is won: bell sound + "WAVE CLEARED" moment. Big final ring when Bart dies (game won).

### Nexios Sword (owner)
- A bonus you **win**; when used, it slays through all enemies on screen "like butter" (GoT-style sword).
- *Proposal:* earned by clearing a wave with zero leaks; one stored charge; player chooses when to use it. Against Bart it deals heavy damage but does not one-shot him.

### Pizza Hut (owner: intertwined with the story)
- *Proposal:* the kids are holed up for the night and ordered pizza. Between waves a Pizza Hut van can be called for tokens; delivering it restores base health or gives towers a short damage buff.

### The Upside Down (owner)
- A **penalty that strikes by chance**: the board flips and worse enemies reign for a while.
- *Proposal:* chance rises each wave; a one-second flicker warning; lasts ~20–30 s; visual = colour drain to cold red/blue tint, drifting ash particles, board flip transition; enemies spawned during it are tougher/faster. Readability must survive the tint.

### Bart — the supervillain (owner)
- Bart, Nexios CEO, as a Vecna-like final boss; **very hard to kill**.
- *Proposal:* appears in the final wave; huge health bar; phases — at each health threshold he forces an Upside Down flip; sword hurts but doesn't finish him. Depiction stays good-natured and big-screen safe. **Owner to ask Bart before the demo.**

### Menus and sound
- Title screen (start), game-over and victory screens. Sound: bell, shots, flip, ambient synth. Mute toggle.

## Build order (owner agreed)
Each step leaves a playable game:
1. Core loop: map, path, enemies walking, one tower, tokens, base health, lose.
2. Waves + bell + win screen. **Deploy to Pages here** (late morning).
3. Remaining towers + upgrades.
4. Bart final boss.
5. Nexios Sword.
6. Upside Down flip.
7. Pizza Hut.
8. Art/sound polish, menus.

## Calls made after the builder check (Claude's calls, owner may override)
- **Who builds:** Claude writes the code; the owner steers, playtests, and handles the in-room events. Work continues while the owner is away.
- **Proposals above:** treated as accepted (owner didn't correct them in playback). Still, keep the sword, pizza, flip and Bart as separate systems that talk through events, so any one can be changed or cut cheaply.
- **Repo history:** one commit (README). Nothing to scrub. Making it public is the owner's action, asked at the step-2 deploy.
- **Scope cut line:** steps 1–5 are must-haves. Steps 6–8 are stretch goals, cut from the bottom if time runs short.
- **Pizza Hut:** shown by name in text and dialogue only. The van is original pixel art with no Pizza Hut logo.
- **Bart's look (owner):** an original pixel-art caricature, no photo. Dark hair, glasses, well built, drawn as a looming villain in Vecna style. His name and title ("Bart, CEO") sell the joke.
- **Nexios material (owner pointed to nexiosit.com):** use the white Nexios logo (`https://nexiosit.com/_ipx/_/images/nexios-white-transparant.webp`, saved into `assets/`) on the title screen, the victory screen, and the sword's hilt or pommel. Use the tagline "Your partner for software, cloud & AI solutions" for a joke line (e.g. the victory screen). The site shows no bell, sword or brand colours, so Claude makes a pixel bell, a synthesised bell sound and a pixel GoT-style sword. Neon accents stay in the game's own palette.
- **Bart fallback:** Bart is a config-driven "skin" (name, title, sprite). If he says no, one change turns him into an original villain.

## Left to the builder
- Exact numbers: costs, damage, ranges, health, wave composition, flip odds and duration.
- File/module structure, asset sources (license-clean only), exact original names for kids/monsters/town.
- Whether the base is the school or the lab.
