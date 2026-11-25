# REGRET.md

Things that worked, then broke, and why. Bootcamp Day 5, 2026-11-25.

- Phaser WebGL 'Link Shader failed' on first Pages load (GPU). Fix: render.maxTextures=1 + auto reload with ?canvas.
- Automated test browser runs at ~1fps (throttled window); stepping the game by hand with real RAF still running made time go backwards and towers stopped firing. Fix: sleep the loop when frame-stepping; game logic now uses its own frame clock.
- Nexios Sword cleared a whole wave, which counted as a perfect wave and handed the sword straight back (infinite sword). Fix: a wave where the sword was used never grants it.
- Streetlight glows first shipped as flat grey discs (ADD blend on a single circle). Fix: stacked rings for a soft falloff.
- HUD ran out of room once Pizza + Sword + Upgrade buttons existed. Fix: narrower tower buttons, "X-mas Lights" → "Lights".
- Upside Down first rotated the board 180° (left-to-right). Owner wanted the movie feel: a bottom-to-top card flip revealing the backside. Fix: tween camera zoomY 1 → 0 → -1 (culling off), swap to vines + red tint edge-on.
- First art pass was code-drawn circles and blocks — "immature". Fix: small pixel engine (low-res drawing + auto outline/shading, nearest-neighbour upscale), pre-rendered pixel town, animated monsters, pixel fonts.
- Title flashlight beams pointed back at the kids (triangle origin quirk). Fix: define the tip at the left edge.
- The low Upside Down drone was the shared background hum, only turned down on flip-back, so it seemed to hang. Fix: separate Upside Down drone that fades to silence and stops; normal world now has its own (original) synth music.
- Maze rework: first balance sim lost on wave 4 — with only a few blocks the open-field route is short. Fix: start with 160 tokens (sim: good build wins 11/20).
