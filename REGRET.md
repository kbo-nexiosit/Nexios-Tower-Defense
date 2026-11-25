# REGRET.md

Things that worked, then broke, and why. Bootcamp Day 5, 2026-11-25.

- Phaser WebGL 'Link Shader failed' on first Pages load (GPU). Fix: render.maxTextures=1 + auto reload with ?canvas.
- Automated test browser runs at ~1fps (throttled window); stepping the game by hand with real RAF still running made time go backwards and towers stopped firing. Fix: sleep the loop when frame-stepping; game logic now uses its own frame clock.
