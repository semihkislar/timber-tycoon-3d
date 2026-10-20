# Timber Tycoon → Three.js: prototype notes and migration plan

_Prototype date: 20 Oct 2026. It is built against the v2.22 simulation._

## 1. What the prototype proves

| Area | What runs in the prototype | Status |
|---|---|---|
| Game logic | The **unchanged v2.22 simulation** (`legacy/js/*`, 40 files) runs in a hidden same-origin iframe (`legacy/sim.html`). Its own `setInterval` tick loop drives production, staff, power, research, orders and replant exactly as in the 2D game. | **Real** |
| Rendering | A new Three.js renderer (`js/`) reads the sim state about 5 times a second and draws it: buildings and levels, which lines are working, starved or off, forest coverage, the day/night clock, staff count and helper levels. | **Real** (reads live state) |
| Commands | Tapping a building opens a sheet with live level, status, recipe and transport. **Build/Upgrade** calls the real `TT.buyBuilding` / `buyPower` / `buyStation` / `buyBuilders`. The model is swapped in right away, and new drone or forklift links appear. | **Real** |
| Layout | Tier columns grow **downward**: Phase I, then the lane, Phase II, Phase III, and the helper column on the right. The log yard sits on top and the export dock at the bottom. This is the layout requested on 20 Oct. | New layout |
| Logistics | Phase I → II forklifts accelerate and brake smoothly and turn at a limited rate. They only move while the consuming line actually runs. Belts carry visible items on sawmill→carpentry and chipper→pellet. Drones fly the Phase II → III links, with hover, rotor spin, banking and a ground shadow. | Visual layer **driven by real links and run state**; the 2D sim has no transport-tier rules yet (see §5) |
| Saves | The prototype has its own save slot, `timberTycoon3d_proto_v1`. The menu item "Load a copy of my 2D save" **reads** `timberTycoon_save_v1` (same origin on github.io) and never writes it. | Real, isolated |
| Mocked or simplified | Helper buildings have no model-specific animations beyond cranes and smoke. Staff HQ "manage" stays in the 2D UI. The forklift and drone counts per link are visual (1 per link, not scaled by throughput). There are no harvesters, crews, fires, weather, golden log or market vans yet. Ship and trucks are ambient. | Mocked |

**Layering:** `sim-bridge.js` (read model plus commands) feeds `main.js` (scene, camera, HUD, sheet). That uses `buildings.js` / `world.js` / `logistics.js` (procedural models) and `kit.js` (geometry baking).
The renderer never touches `S` directly except through `SimBridge.read()`, `links()`, `buy()` and `nextCost()`.

## 2. How separable is the existing code? (coupling points)

The simulation is *mostly* separable already. `tick(dt)` only mutates `S`, and the debug API `window.TT` exposes nearly everything a renderer needs. Here is what is still coupled:

1. **Global scripts and lexical globals.** About 40 classic scripts share top-level `const`/`let` (`S`, `M`, `BTIER`, `RMAP`, …). The prototype reaches the ones missing from `TT` via `iframe.contentWindow.eval(name)`. For v3.0: move the sim files into ES modules (`sim/*.js`) with explicit exports.
2. **Side effects inside the sim.** `buyBuilding` and others call `toast()`, `sfx()`, `confettiBurst()` and `buildPoof()`. `shipping.js`, `staff.js` and `premium.js` push into `scene.floats` / `scene.shipDeparted`. Replace these with an event bus (`emit('built',{id})`, `emit('coinFloat',{at,val})`) that the renderer and UI subscribe to. There are about 25 call sites.
3. **Scene state used as game state.** A few systems keep agents in `scene.*` (`scene.forklifts`, `scene.marketVans`, the builders' trucks in `scene.by`). These are visual today, but tests and some UI read them (`TT.vehicles()`, `byTrucks()`). They should become renderer-owned.
4. **Coordinates.** The 2D code has iso lot coordinates (`LOTS[id].ci/cj`, `P()`, `w2s()`) baked into UI helpers such as `focusLot`, `flyTo`, jump chips and attention arrows. The 3D layout (`js/layout.js`) is a separate table. UI fly-to calls need a renderer-agnostic `focus(id)` hook.
5. **UI = DOM, independent of the canvas.** `ui.js`, `staff.js`, `research.js` and the rest render sheets into the DOM. These can sit **unchanged** on top of a WebGL canvas, as the prototype's sheet shows. The one canvas-drawn UI piece is the workstation interior (`wsDrawInterior`), a small 2D canvas that can stay as is.
6. **Tests.** The Playwright suites use `TT.lotScreen()`, `forestScreen()` and `w2s`. These need 3D equivalents (`T3.screenOf(id)`), but the sim assertions keep working.

**Bottom line:** no rewrite of the game logic is needed. The work is (a) modularising and de-side-effecting the sim, and (b) rewriting the ~5,000 lines of Canvas 2D scene code (`scene1–13`, `sprites`, `chimney`, `facade`, `forestveh`, `marketfleet`, `staffworld`, plus the scene parts of `power`/`builders`/`shipping`/`tiers`/`premium`) as Three.js.

## 3. Asset pipeline: what changes

| Today (2D) | Three.js |
|---|---|
| Hand-coded canvas drawing per building (`bSawmill(ctx,…)`, ~100–300 lines each), plus sprite atlases for trees, plus a sprite cache. | **Procedural low-poly kits in code** (as in this prototype): ~15–40 lines per building, built from boxes, prisms, cylinders and lathes, merged into **one vertex-coloured mesh per building** (+1 glass mesh). There are no asset files and diffs stay reviewable. |
| Every new look means redrawing every facing, level and night variant. | Light, shadows, night windows, rotation and zoom come for free. Level growth is parametric (height, extra floors and props by milestone stars). |
| Pixel-art consistency is hard to keep across contributors. | Optional **glTF/GLB** models (Blender, Kenney, Quaternius, Synty-style packs, or AI-generated meshes) load via `GLTFLoader`. Mix them freely with procedural ones. Use Draco/meshopt compression and keep a hero building at ≤ 30–60 KB. |
| Hundreds of sprite draws per frame. | **Instancing**: trees (~880), stumps, belt items, smoke puffs, wave glints and lamp light pools are each **one draw call**. The whole factory is about 105–120 draw calls and ~110k triangles. |

Suggested rule: procedural for buildings and props (fast iteration in the daily routine), glTF only for a few hero assets (ship, drone, fire engine) if we want more detail later.

## 4. Performance (prototype)

Measured in headless Chromium **without a GPU** (SwiftShader software WebGL), so only the relative numbers matter. Real phones and desktops rasterise on the GPU.

| Scenario | 3D prototype | 2D v2.22 (same box) |
|---|---|---|
| Desktop 1440×900, pixel ratio 1 | 8–27 fps (software GL, varies with box load; 27 on the live URL run) | ~35 fps (CPU canvas) |
| Mobile 390×844 @3x (pixel ratio 2, mid quality) | 8–27 fps (software GL) | ~44 fps |
| Mobile, `?q=low` (pixel ratio 1, 1024 shadow map) | ~15 fps (software GL) | – |
| JS work per frame (sim read + animation update) | **~0.3 ms** | – |
| `renderer.render()` CPU submit time | **~1.3–2 ms** | – |
| Draw calls / triangles | 103–117 / ~108k | – |

Interpretation: on the CPU side the 3D frame costs about 2 ms. On this GPU-less box the bottleneck is software rasterisation of a 2048-px shadow map plus MSAA. On any WebGL device with a GPU, ~110 calls and ~110k triangles is a light load: comfortable 60 fps on recent phones, and probably 30–60 on 2019-era Android. Safeguards are already built in:
- **Quality tiers** (`?q=low|mid|high`): phones with dpr ≥ 2 drop MSAA and use a 1536 shadow map.
- **Adaptive resolution**: if fps stays under 40 for 3 seconds, the pixel ratio steps down from 2 to 1.5 to 1.

**Must do before v3.0:** measure on real devices (Semih's phone plus one low-end Android) with the in-app meter (`⋯ → Toggle FPS meter` or `?fps`).

## 5. Effort estimate for a v3.0 migration

| Step | Work | Estimate |
|---|---|---|
| A | Turn the sim into ES modules, add the event bus for toasts/sfx/floats, `T3.screenOf(id)` test hooks, and move layout tables out of the 2D scene | 2–3 days |
| B | Renderer parity: forest crews, harvesters, planters, log/market/dock trucks, staff walkers, fires and the fire engine, golden log, weather (rain/snow/fog), seasons (tree tints), harbour/trade ships, premium area, power/builders animations, build "poof", coin floats | 8–12 days |
| C | Camera/UI parity: jump chips, `focusLot` fly-to above the half sheet, attention arrows, hold-to-buy, landscape rail mode; port the Playwright suites | 3–4 days |
| D | Real-device performance pass, low-end fallback (keep the 2D renderer as "Classic view"?), PWA cache/versioning | 2–3 days |
| E | Spacefast: auth, cloud saves, leaderboard and publishing pipeline (after Semih claims access) | 3–5 days |
| | **Total** | **≈ 18–27 working days (4–6 weeks at the daily-routine pace)** |

The daily routine can keep shipping logic features in parallel, since steps A–D don't change game rules. The visual items in today's queue (item 7: column layout; item 8: forklift → belt → drone transport tiers) should be built once, in 3D, rather than first in 2D and then again.

Transport tiers in the sim (item 8) still need rules. For example: belts unlock per adjacent pair by research or level, they give +x% throughput and no forklift wages, and drones unlock with Phase III. The prototype only visualises them.

## 6. Spacefast: how it would fit

Based on the Spacefast docs (Database / Functions / Storage):
- **Hosting:** the game is a static site, so these exact files publish as-is. Same-origin rules change, though: on a new domain the github.io localStorage save isn't readable, so v3.0 needs a one-time "export code → import" path, or cloud save from day one.
- **Cloud saves:** a Zero capsule with `saves: table({ownerId: string(), data: string(), ver: string()}).index('by_owner',['ownerId'])`. The `save` mutation upserts by `ctx.auth.userId`, and `load` is a query. On the client, keep localStorage as the primary store (offline play) and sync every ~30 s and on `pagehide`. Resolve conflicts by `playTime`/`lastSave`, never by blind overwrite.
- **Leaderboard:** Zero tables only declare `string()`, `boolean()` and `id()` fields, so numeric ranking needs care. Either store zero-padded or log-scaled strings, or run the leaderboard read in a **Functions** worker with SQL (`env.DB.prepare('select … order by cast(score as decimal) desc limit 50')`). Validate on the server (rate limits, plausibility vs. playtime) to stop trivially forged scores.
- **Auth:** the platform's sign-in gives `ctx.auth.userId`. Guests keep playing locally and sign in to sync.
- **Risks:** research preview and invite-based (the account must be Semih's); there's no external DB connection string by design; limits and pricing may change. Mitigation: keep the GitHub Pages build as a mirror and keep saves exportable.

## 7. Recommendation

Migrate, **incrementally**. The prototype shows the simulation doesn't need a rewrite: 3D can be a new render layer under the same DOM UI. The visual result (lighting, shadows, night windows, readable vehicles, the requested column layout) is clearly ahead of the hand-drawn canvas, and new buildings or vehicles are much cheaper to add.

Order:
1. Finish the queued logic/UI items in 2D (staff bugs, train-all, orders, bad luck, fuel).
2. Do steps A–D as v3.0-beta at `/timber-tycoon-3d` behind a "Try 3D" link, with real-device FPS checks.
3. Switch the default renderer.
4. Add Spacefast cloud saves and leaderboard (v3.1) once access is claimed.
