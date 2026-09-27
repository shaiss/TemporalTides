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

- Locked wide camera (no OrbitControls / free roam).
- Same chamber; per-mode overlay groups (Anne / Maya / Eli / Vibrion) driven by Ink `active`.
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

## Layout

| Path | Role |
|------|------|
| `nexus-intro.ink` | Source story |
| `story.json` | Compiled Ink (committed) |
| `index.html` | Vite entry |
| `src/main.js` | inkjs + UI wiring |
| `src/chamber.js` | Three.js room / overlays / clocks |
| `src/inkStory.js` | Tag + variable bridge |
| `preview/index.html` | Legacy ink-only preview |

## Ink variables

- `active` — `anne` \| `maya` \| `eli` \| `vibrion`
- `beat1_clear` … `beat4_clear`, `beat5_step`, `beat5_clear`
- `idle_hint_shown` — stub for idle-threshold hint (CoreLoop accessibility placeholder)

Mode chips in the UI are **display-only**; switching lens still happens only through Ink choices.

## inkVersion / inkjs

`npm run compile` uses `inkjs`’s bundled compiler so `story.json` **`inkVersion` matches inkjs 2.x (21)**.
