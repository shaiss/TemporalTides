# Nexus intro episode (Ink + Three.js spike)

Open-room intro for the **Time Nexus** MVP. **Ink (`story.json`) owns the rules and every spoken line**; **Three.js renders the chamber**; the UI is a portrait strip, one subtitle line, a **Room** button inside a place, and the gate's plan slots.

Design: [`intro-episode-nexus-foil.md`](../../docs/design/intro-episode-nexus-foil.md) (beat sheet, puzzles locked), [`intro-episode-nexus-interaction-foil.md`](../../docs/design/intro-episode-nexus-interaction-foil.md) (how the player looks and acts), [`intro-episode-nexus-lines-foil.md`](../../docs/design/intro-episode-nexus-lines-foil.md) (character lines). Lines in `nexus-intro.ink` are FOIL, not WorldBible canon.

## Run it

```bash
cd scratch/nexus-intro
npm install && npm start
```

`npm start` compiles Ink (`story.json`, inkVersion 21) and serves the Vite + Three.js + inkjs app at **http://localhost:4173/**.

### Hosted (Vercel)

Every Vercel deployment bundles this playable at **`/play/`**; docs stay at `/`.

- **Production:** [temporaltides.com/play/](https://temporaltides.com/play/)
- **PR previews:** `https://temporal-tides-git-<branch>-shaiss-projects.vercel.app/play/`

The root `npm run build:vercel` runs `scripts/build-nexus-play.mjs`, which builds this folder with `VITE_BASE=/play/` and copies `dist/` into `.vitepress/dist/play/`.

**Checking which build is live.** `/play/` loads one hashed bundle, `/play/assets/index-<hash>.js`. Compare the live hash with a local build of the same commit; the two normally match:

```bash
curl -s https://temporaltides.com/play/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
npm run build:vercel && ls .vitepress/dist/play/assets/index-*.js
```

A push to `main` normally shows up as a **Production** deployment on its GitHub commit within a minute. If the hashes still differ and no Production deployment appears, Vercel missed the push. Redeploy `main` from the Vercel dashboard (Deployments → Redeploy). Don't push to `main` directly to trigger it.

Production static build: `npm run build` → `dist/`; `npm run preview:static` serves it. Root VitePress docs are unaffected; dependencies live only under this folder.

## How it plays

One open chamber, four places: **hazard corridor**, **echo levers**, **dead panel**, **coordination gate**. Nothing on screen names beats, steps or puzzles.

| Input | Meaning |
|---|---|
| Tap a portrait (or keys **1–4**) | See and hear the room as that character. Free, any time |
| Tap a place in the chamber | Walk up to it; the active character says what they see |
| **Room** (or **Esc**) | Back out to the room. Progress is kept |
| Tap what is lit | Act. Only a character who can act there sees something lit |
| Drag portraits into the four slots, then **Sync** | Gate only: plan who goes in what order |

- **Looking:** inside a place, switching portraits makes the new character look and say one line about what they see and what they can't do. They never say who should do it.
- **Acting:** the lit thing breathes a ring and brightens on hover. A finished place hands the player back to the room once its line has landed, and can't be re-entered.
- **The gate:** tap an empty slot to drop the active character in, tap a filled slot to empty it, drag a slot onto another to swap, drag it out to clear. **Sync** plays the plan clock by clock; it stops at the first slot that can't happen, and that character says why. Four of one character grinds the clocks. The right plan seals the gate, then the resonance ending plays and **Play again** appears.
- **Narrow screens:** the 16:9 room is cropped to the screen. In the room, drag sideways (or use the **‹ ›** arrows) to look around; inside a place the camera steps back with a wider lens so the whole place fits (all five levers, the whole corridor), and the crop follows what you're looking at — at a live panel, the jammed lever.
- **Keyboard / screen readers:** a hidden "In the chamber" list (visible on focus) offers the same taps as the chamber: each open place in the room, and the act inside a place when the active character can act.

### Who does what (spoilers)

| Place | Who acts | What it leaves |
|---|---|---|
| Hazard corridor | Anne | Corridor crossed (safe line stays drawn) |
| Echo levers | Maya marks the order, then Eli throws all five before the window closes | Strain marks stay on the console; levers clear |
| Dead panel | Vibrion couples it to the floor grid, then Eli shoves the jammed lever | Panel live, then the feed runs to the gate |
| Coordination gate | Plan **Anne → Maya → Eli → Vibrion**, with the panel finished | Seal, resonance ending |

The places can be done in any order, and the gate can be tried at any time. Before the panel is finished, the right plan stops at Vibrion with a line about the dead feed.

### Planted details (spoilers)

Three details read as set dressing and pay off later (design: `docs/design/intro-episode-nexus-planted-details-foil.md`, in FOIL PR #44). None adds a tap, a flag or a hint.

| Plant | Where it's seen | Where it fires |
|---|---|---|
| **The corridor's rhythm.** The plates spark on a real schedule, left → far right → center with gaps of 2.1, 5.8, 0.9, 3.3 s: exactly what Anne and Maya say there. The first gate clock's minute hand jumps on every spark, with the same sound | Corridor (and the first clock, from the room) | Gate: Maya recognizes the intervals, Anne reads the next tick |
| **The lever window.** The closing slot on the lever console | Levers | Gate: the third clock has the same slot, below its pivot; Eli: "that's the lever window!" |
| **The crystal that doesn't sing.** The rim crystals chime in a ragged ripple at arrival and every 13–21 s after; one dark, smooth cluster left of the gate never joins. Each lens sees it as slightly wrong | Room, all lenses | Seal: the chime runs once in phase and skips it, and the camera finds it. Vibrion: "That crystal isn't ours." Its cause stays unsaid |

## Feedback

- **Clears** pulse the place in the acting character's color with a bloom flash and a chime. **Lens switches** fire a short activation burst and whoosh. **Walking** in or out plays a soft bell. A **broken plan** marks the slot that broke, jitters the clocks and flashes a warning. The **seal** runs all hands to XII with a chord and a deep portal chime.
- **Subtitles** sit above the portrait strip with a caret pointing at the speaker, whose portrait pulses while they talk. Tap the subtitle to skip ahead. Lines carrying the `entropy` effect darken the room's edge for a moment.
- **Sound** is synthesized WebAudio: drone, chimes, per-clock ticks at the gate, the corridor's sparks (loudest at the corridor, quieter at the gate and in the room) and the crystal chime. It starts on the first gesture; the top-right toggle persists in `localStorage` (`nexus-sound`).
- **Reduced motion** (`prefers-reduced-motion`) turns off subtitle, speaker and slot animations and halves light flashes.

## Lenses

Only one overlay set is visible at a time (crossfade on switch).

| Character | What you see in the room |
|---|---|
| **Anne** (Foresight, red) | "Possible future" blades over the trap plates that fire ahead of each scheduled spark, hazard footprints, a metronome tick row, a dashed safe line, branch lines over the crystals that sing (none over the outlier), and red corner brackets on what she's looking at (the first clock at the gate) |
| **Maya** (Pattern Sense, cyan) | Sequence gems with rank pips over the five levers lighting in order, connecting arcs, a lattice over console and panel, echo rings on plates (flashing on each spark) and clocks, rings at the base of every crystal except the outlier |
| **Eli** (Kinetic Rush, orange) | Speed streaks (slowing as they pass the outlier), faster motes, and a closing-window band: on the lever row, on the jammed lever at a live panel, or on the third clock at the gate |
| **Vibrion** (Vibrational Manipulation, blue → white) | Floor grid with heat shimmer and pulse rings from the panel (and from the gate once the panel is finished), bending around the outlier, arcs to the panel, coupling beams, panel aura |

## Quality and debug

| Param | Effect |
|---|---|
| `?quality=low\|medium\|high` | Pin a render tier (DPR, bloom, shadows, mote count). Unpinned: `high` on desktop, `medium` on coarse-pointer / small screens, with automatic downgrade if frame time stays above ~32 ms |
| `?debug` | Exposes `window.__nexusDebug` (`view()`, `line()`, `playing()`, `propScreenPoint(id)`, `panToPlace(id)`, `settled()`, `quality()`, `shot()`, `sparks()`, plus `chamber` and `game`) on production builds; always on in the dev server |
| `?dtcap=1` | Raises the per-frame time cap (default 0.1 s) so very slow software-GL captures advance in real time. Screenshot harnesses only |

## Checks

### Headless rules (`npm test`)

`test/game.test.mjs` drives `src/game.js` (the same flow the browser uses, no DOM) against the compiled `story.json`:

- every place is open from the start; each place answers only to its character(s), in its order
- the gate can't be acted on directly; of all 256 four-slot plans, only Anne → Maya → Eli → Vibrion seals, and only with the panel finished
- four of one character breaks with the solo line; the right plan before the panel is finished stops at Vibrion
- backing out keeps progress; finished places can't be re-entered; the three solo places work in every order; the gate can be failed, left and come back to
- look lines are always spoken by the active character; every line has a speaker and id, stays short, and avoids designer vocabulary

`test/planted.test.mjs` checks the planted details against the lines that name them:

- the spark schedule walks the plates left → far right → center with the corridor gaps, and only repeats every 12 sparks (Maya: "No repeating sequence yet")
- Anne's timing calls can be made true without breaking the order; her plate names match what the camera shows
- Maya's corridor intervals and her first-clock intervals are the schedule's gaps; the gate lines keep their clock numbers
- the outlier is planted at arrival and named only by what it did, never by a cause

### Play-through captures (visual check by eye)

`tools/capture-play.mjs` plays the episode in headless Chromium (SwiftShader WebGL) the way a player does (taps places, portraits and lit props, drags portraits into slots, presses Sync, including one wrong plan) and saves a still at each moment for desktop (1440×900) and phone (390×844), plus a `log.json` of who was speaking.

```bash
npm i --no-save playwright && npx playwright install chromium   # one-time, keeps package.json / lock untouched
npm start                                                       # in another shell (port 4173)
node tools/capture-play.mjs "http://localhost:4173/?quality=high&dtcap=1" ./captures both
```

The latest desktop and phone play-through sheets are in `docs/planted-details/` (the room in each lens, the clock slot, the outlier at the end); the first open-room sheets are in `docs/open-room/`. Before / after sheets from the earlier art pass (still the old menu UI) live in `docs/art-pass/`.

## Layout

| Path | Role |
|---|---|
| `nexus-intro.ink` | Rules and lines: room hub, per-place look / act, gate plan playback, resonance |
| `story.json` | Compiled Ink (committed) |
| `index.html` | Vite entry: canvas, Room / sound buttons, plan slots, subtitle, portrait strip |
| `src/main.js` | UI wiring: portraits, places, act, plan drag / Sync playback, subtitles, sound |
| `src/game.js` | DOM-free game flow over Ink (room ↔ place, lens, act, plan) — what the tests drive |
| `src/inkStory.js` | inkjs adapter: runs knots, parses `#say:` / `#id:` / `#fx:` tags into lines |
| `src/subtitles.js` | One-line-at-a-time subtitle queue with reading-time pacing and skip |
| `src/chamber.js` | Scene wiring: game view → room / gate / props / clocks / lenses / camera / framing |
| `src/stationCamera.js` | One camera pose per place (plus wider phone poses) and the ending's outlier shot, damped moves between them |
| `src/framing.js` | Narrow-screen crop: pans the 16:9 frame to the subject, or to the player's look-around in the room |
| `src/interact.js` | Pointer raycast → place ids (hover, tap, drag) |
| `src/palette.js` | Canon colors (ColorPalettes.md) + lens colors |
| `src/layout.js` | Shared world positions (five levers and their true order, panel, gate, clocks, crystal spots and the outlier, focus points) and the corridor's spark rhythm |
| `src/sparks.js` | DOM-free spark schedule: plates, first-clock ticks and Anne's foresight all read it |
| `src/textures.js` | Procedural canvas textures (floor inlay, dial faces, streaks, soft dots) |
| `src/materials.js` | Crystal / structure / glow / overlay material helpers |
| `src/room.js` | Crystalline rotunda shell, floor, crystal clusters (and the outlier), the crystal chime, aurora, lighting + shadows |
| `src/gate.js` | Crystal arch + membrane shader (dormant → active) |
| `src/props.js` | Corridor, lever console (with Maya's lasting marks), panel + jammed lever + conduits, lit rings, clear / fail pulses |
| `src/clocks.js` | Lintel ↔ hero clocks: dials, jumping minute hands, per-clock tempo (the first on the spark schedule), the third clock's slot, playback rings |
| `src/lenses.js` | Per-character 3D overlays with crossfades |
| `src/particles.js` | Temporal motes (speed follows the active lens) |
| `src/post.js` | Bloom + output pass, quality tiers, auto-downgrade |
| `src/audio.js` | Procedural WebAudio |
| `src/assets/portraits/` | Head-and-shoulders crops of the four dossier portraits (WebP) |
| `test/game.test.mjs` | Headless rules and line checks (`npm test`) |
| `test/planted.test.mjs` | Spark schedule and the lines that must be visibly true (`npm test`) |
| `tools/capture-play.mjs` | Headless play-through screenshot harness (Playwright, not a dependency) |
| `docs/planted-details/` | Latest desktop and phone play-through sheets from `tools/capture-play.mjs` |
| `docs/open-room/` | First open-room play-through sheets |
| `docs/art-pass/` | Before / after captures from the art + game-feel pass (old menu UI) |

## Ink

- **Set by the UI:** `lens` (`anne` \| `maya` \| `eli` \| `vibrion`), `at` (`room`, a place, or `end`), `plan1`…`plan4`.
- **Flags:** `corridor_clear`, `levers_marked`, `levers_clear`, `panel_live`, `panel_clear`, `gate_clear`.
- **Functions:** `can_enter(place)`, `can_act()`.
- **Knots the UI runs:** `arrive`, `look`, `act`, `gate_begin`, `gate_step` (one per slot; sets `gate_result` to `ok`, `break` or `sealed`), `resonance`.
- **Lines** are Ink text tagged `#say:<character>`, `#id:<line id>` and optionally `#fx:<effect>` (`done` ends a place, `entropy` darkens the edge, `foresee` makes Anne's next-spark call come true, `chime` / `chime-sync` ring the crystals ragged / in phase, `outlier` moves the camera to the outlier). There is no choice list; Ink never offers menu options.

`npm run compile` uses inkjs's bundled compiler so `story.json` **`inkVersion` matches inkjs 2.x (21)**.
