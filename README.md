# Timber Tycoon 3D (Three.js rendering prototype)

**Live:** https://semihkislar.github.io/timber-tycoon-3d/ · 2D game: https://semihkislar.github.io/timber-tycoon/

This is a side prototype. It renders the **real Timber Tycoon v2.22 simulation** with Three.js, using an orthographic 3/4 camera, soft shadows, day/night from the in-game clock, procedural low-poly buildings, tier columns that grow downward, helper buildings on the right, and forklift → belt → drone logistics.

- `legacy/` is an unmodified copy of the v2.22 game logic, run headless in a hidden iframe. Three changes were made: its own save key, no canvas drawing, and no service worker.
- `js/sim-bridge.js` provides the read model and commands. `js/main.js` holds the scene, camera, HUD and sheet. `js/buildings.js`, `js/world.js` and `js/logistics.js` build the procedural models. `js/kit.js` merges geometry.
- `vendor/three/` is three.js r180 (MIT), vendored, so there's no build step.
- `demo-save.json` is a real save produced by the 2D balance bot (2 hours of greedy play).
- URL flags: `?fresh` resets the demo, `?fps` shows the meter, `?q=low|mid|high` sets quality, and `?nofallback` turns off adaptive resolution.
- Tests: `python3 test/functional.py`, `test/perf.py` and `test/shots.py`. Run them against `python3 -m http.server 8765`.

See [docs/three-migration.md](docs/three-migration.md) for the architecture, coupling points, asset pipeline, performance, effort estimate and the Spacefast plan.
