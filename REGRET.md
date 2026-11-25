# REGRET.md

Things that worked, then broke, and why. Bootcamp Day 5, 2026-11-25.

- Phaser WebGL 'Link Shader failed' on first Pages load (GPU). Fix: render.maxTextures=1 + auto reload with ?canvas.
