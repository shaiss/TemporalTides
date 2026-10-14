# Nexus intro episode (Ink + Three.js spike)

Ability-mode intro for the **Time Nexus** MVP: **Ink / `story.json` owns rules**; **Three.js renders a fixed-camera chamber diorama** with HUD, display-only mode chips, and a bottom choice rail.

Design locks: [`docs/design/intro-episode-nexus-foil.md`](../../docs/design/intro-episode-nexus-foil.md), [`docs/design/intro-episode-nexus-storyboards-foil.md`](../../docs/design/intro-episode-nexus-storyboards-foil.md). Prose in `nexus-intro.ink` is foil scratch — not WorldBible canon.

## Run the playable (v0)

From repo root or this folder:

```bash
cd scratch/nexus-intro
npm install && npm start
```

`npm start` compiles Ink (`story.json`, inkVersion 21) and serves the **Vite + Three.js + inkjs** app at **http://localhost:4173/**.

### Hosted (Vercel)

Every Vercel deployment bundles this playable at **`/play/`** on the deployment origin; docs stay at `/`.

- **Production:** [temporaltides.com/play/](https://temporaltides.com/play/)
- **PR previews:** `https://<preview-host>.vercel.app/play/` (pattern: `https://temporal-tides-git-<branch>-shaiss-projects.vercel.app/play/`)

The root `npm run build:vercel` runs `scripts/build-nexus-play.mjs`, which builds this folder with `VITE_BASE=/play/` and copies `dist/` into `.vitepress/dist/play/`. No clone is required to play — Ink + chamber run entirely from static assets under `/play/`.

- Locked wide camera (no OrbitControls / free roam).
- Same chamber; per-mode **3D overlay groups** in `src/lenses.js` (Anne / Maya / Eli / Vibrion) driven by Ink `active` — no full-screen lens tint.
- Beat / HUD cues from Ink tags (`# beat:N`, `# mode:…`, `# ui:mode_switch`).
- Entropy = CSS edge vignette only.
- Beat 5: four clocks animate desynced until `beat5_step` / `beat5_clear` from Ink; optional camera nudge toward the gate on beat 5.

Legacy **HTML-only** ink preview (no WebGL) remains at `preview/index.html` — use `npm run preview:ink-only` (port 4174) if needed.

Production static build: `npm run build` → `dist/`; `npm run preview:static` to serve the build.

Root VitePress docs are unaffected; dependencies live only under this folder.

## Cast and abilities (dossier names only)

| Character | Ability | Solo beat |
|-----------|---------|-----------|
| Anne | Foresight | 1 — hazard corridor |
| Maya | Pattern Sense | 2 — echo / lever markings |
| Eli | Kinetic Rush | 3 — closing window |
| Vibrion | Vibrational Manipulation | 4 — dead panel / energy |

Beat **5** requires a valid switch sequence **Anne → Maya → Eli → Vibrion** (`beat5_step` 0→4). Beat **6** exits with resonance tease; Entropy unresolved.

## Verify beat 5 solo failure

Goal: prove the coordination gate **cannot** clear in a single active mode (clocks stay desynced until every lens speaks).

1. Play through beats 1–4 (switch as needed per table above).
2. At beat 5, stay on **one** character (e.g. Anne) without switching through all four lenses.
3. Complete Anne's timing tick if active is Anne (`beat5_step` becomes 1).
4. Choose **「Force the seal closed from one lens alone」**.

**Expected:** story returns to beat 5 with refusal text; `beat5_clear` stays false until you switch through Maya, Eli, and Vibrion in order and finish Vibrion's power step. Clocks in the diorama keep disagreeing until `beat5_clear` is true.

**Wrong-order check:** With `beat5_step == 1`, stay on Anne and pick any non-Maya action. **Expected:** wrong-order messaging; gate does not advance.

## Interaction and feedback (art pass v1)

Props in the chamber are **tap targets for choices Ink is already offering** — never a parallel rules path. `src/bindings.js` maps the current beat's action choice onto one prop; tapping that prop is identical to clicking its rail button (which shows a small lens-colored marker).

| Beat | Tap target | Bound choice |
|------|-----------|--------------|
| 0 | Gate, then corridor | "Step into…", then "Continue as …" |
| 1 | Hazard corridor | Current lens's corridor action |
| 2 / 3 | Lever console | Current lens's lever action |
| 4 | Dead panel | Current lens's panel action |
| 5 | Current step's clock (`clock0`…`clock3`) | Current lens's clock action |

- **Affordance:** bound props get a breathing floor ring; hover (mouse) or rail-button hover/focus highlights the prop and its button together.
- **Wrong lens = the room pushes back:** acting with the wrong lens (e.g. tapping the corridor as Vibrion, or clock 1 out of order) stays an Ink decision; the UI reads the unchanged state as a failure and plays a fail cue (prop jitter + warning flash, rail shake, low buzz).
- **Clears** pulse the prop in the acting lens's color with a bloom flash and a chime; **lens switches** fire a short activation burst + whoosh; the **beat-5 seal** runs all hands to XII with a chord and a deep portal chime.
- **Sound** is synthesized WebAudio (drone, chimes, per-clock ticks at desynced tempos — they converge as steps lock). It starts on the first gesture; the top-right toggle persists in `localStorage` (`nexus-sound`).
- **Reduced motion** (`prefers-reduced-motion`) disables rail/HUD animations and halves light flashes.

### Quality and debug

| Param | Effect |
|-------|--------|
| `?quality=low\|medium\|high` | Pin a render tier (DPR, bloom, shadows, mote count). Unpinned: `high` on desktop, `medium` on coarse-pointer / small screens, with automatic downgrade if frame time stays above ~32 ms. |
| `?debug` | Exposes `window.__nexusDebug` (`state()`, `bindings()`, `propScreenPoint(id)`, `quality()`) on production builds; always on in the dev server. |
| `?dtcap=1` | Raises the per-frame time cap (default 0.1 s) so very slow software-GL captures advance in real time. Screenshot harnesses only. |

### Headless checks

`npm test` runs `test/bindings.test.mjs` (Node test runner) against the compiled `story.json`: golden path driven only by prop taps, bindings only ever target rail action choices, wrong-lens / solo-seal / out-of-order taps report failure without advancing Ink.

### Beat captures (visual regression by eye)

`tools/capture-beats.mjs` plays the whole intro in headless Chromium (SwiftShader WebGL) and saves one still per beat / lens for desktop (1440×900) and phone (390×844). With `--tap` it drives beats 1–5 by tapping props instead of rail buttons, and fails if a tap does not advance Ink.

```bash
npm i --no-save playwright && npx playwright install chromium   # one-time, keeps package.json / lock untouched
npm start                                                       # in another shell (port 4173)
node tools/capture-beats.mjs "http://localhost:4173/?quality=high&dtcap=1" ./captures both --tap
```

Before / after sheets from the art pass live in `docs/art-pass/`.

## Layout

| Path | Role |
|------|------|
| `nexus-intro.ink` | Source story |
| `story.json` | Compiled Ink (committed) |
| `index.html` | Vite entry |
| `src/main.js` | inkjs + UI wiring, outcome → feedback dispatch, sound toggle |
| `src/inkStory.js` | Tag + variable bridge (read-only; adds choice `kind` and clear flags) |
| `src/bindings.js` | Prop ↔ choice bindings and before/after outcome detection (pure functions) |
| `src/chamber.js` | Scene wiring: Ink hooks → room / gate / props / clocks / lenses / camera / framing |
| `src/palette.js` | Canon colors (ColorPalettes.md) + lens colors |
| `src/layout.js` | Shared world positions for props, clocks, gate, beat focus points |
| `src/textures.js` | Procedural canvas textures (floor inlay, dial faces, streaks, soft dots) |
| `src/materials.js` | Crystal / structure / glow / overlay material helpers |
| `src/room.js` | Crystalline rotunda shell, floor, crystal clusters, aurora, lighting + shadows |
| `src/gate.js` | Crystal arch + membrane shader (dormant → active) |
| `src/props.js` | Beat props (corridor, lever console, panel + conduits), affordance rings, clear / fail pulses |
| `src/clocks.js` | Lintel ↔ hero clocks: luminous dials, jumping minute hands, per-clock tempo, step rings |
| `src/lenses.js` | Per-mode 3D overlays (Anne / Maya / Eli / Vibrion) with crossfades |
| `src/particles.js` | Temporal motes (speed follows the active lens) |
| `src/post.js` | Bloom + output pass, quality tiers, auto-downgrade |
| `src/framing.js` | Portrait / narrow crop: pans the fixed 16:9 frame to the beat's subject |
| `src/interact.js` | Pointer raycast → prop ids (hover + tap) |
| `src/audio.js` | Procedural WebAudio |
| `src/cameraBeat.js` | Beat-5 camera push (wide ↔ clock wall) |
| `test/bindings.test.mjs` | Headless Ink + bindings checks (`npm test`) |
| `tools/capture-beats.mjs` | Headless per-beat screenshot harness (Playwright, not a dependency) |
| `docs/art-pass/` | Before / after captures from the art + game-feel pass |
| `preview/index.html` | Legacy ink-only preview |

## Ink variables

- `active` — `anne` \| `maya` \| `eli` \| `vibrion`
- `beat1_clear` … `beat4_clear`, `beat5_step`, `beat5_clear`
- `idle_hint_shown` — stub for idle-threshold hint (CoreLoop accessibility placeholder)

Mode chips in the UI are **display-only**; switching lens still happens only through Ink choices.

## Verify mode lenses (issue #23)

1. `cd scratch/nexus-intro && npm install && npm start` → http://localhost:4173/
2. At beat 0, use **Switch active character** (or play to a beat with mode choices) and cycle **Anne → Maya → Eli → Vibrion** via Ink choices only (chips do not switch mode).
3. For each mode, pause on a still and compare the chamber (ignore chip labels):

| Mode | What you should see in the room |
|------|----------------------------------|
| **Anne** (Foresight, red / steel blue) | Translucent "possible future" blades cycling over the trap plates (the live one flashes red), hazard footprints, a metronome tick row, a dashed future path, and red corner brackets on the beat's subject |
| **Maya** (Pattern Sense, cyan) | Sequence gems with rank pips over the levers lighting in rhythm, connecting arcs, a structural lattice over console and panel, echo rings on trap plates and clocks |
| **Eli** (Kinetic Rush, orange) | Speed streaks off levers and plates, faster motes, and a closing-window band — on the lever row, or around the current clock on beat 5 |
| **Vibrion** (Vibrational Manipulation, blue → white) | Floor grid with heat shimmer and pulse rings from the panel (and the gate on beat 5), Lichtenberg arcs to the panel, coupling beams, panel aura |

4. Only one overlay set is visible at a time (crossfade on switch); entropy stays the CSS edge vignette (unchanged).

Hosted: same check at **`/play/`** on any Vercel deployment.

## inkVersion / inkjs

`npm run compile` uses `inkjs`’s bundled compiler so `story.json` **`inkVersion` matches inkjs 2.x (21)**.
