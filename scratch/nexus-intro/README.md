# Nexus intro episode (Ink scratch)

Ability-mode intro scaffold for the **Time Nexus** MVP. Design is locked in [`docs/design/intro-episode-nexus-foil.md`](../../docs/design/intro-episode-nexus-foil.md). Storyboard HUD cues: [`docs/design/intro-episode-nexus-storyboards-foil.md`](../../docs/design/intro-episode-nexus-storyboards-foil.md). **Three.js is out of scope** for this tree.

Prose here is **foil-sourced scratch placeholder**, not WorldBible canon.

## One-command browser play

From repo root or this folder:

```bash
cd scratch/nexus-intro
npm install && npm start
```

`npm start` runs `compile` (via inkjs’s cross-platform compiler) and serves this folder on **http://localhost:4173/preview/** using `serve`. Open that URL in a browser.

The preview shows **mode chips** (Anne / Maya / Eli / Vibrion) with the active lens lit, a beat/HUD strip driven by Ink tags (`# beat:N`, `# mode:…`, `# ui:mode_switch`) and the `active` variable, plus large choice buttons in the temporal blue/purple scratch palette.

## Play with inklecate (CLI, optional)

Requires a native [inklecate](https://github.com/inkle/ink) on your PATH (the npm `inklecate` package wraps OS-specific binaries and may not work on every platform).

```bash
cd scratch/nexus-intro
npm run compile   # preferred: inkjs-compiler, writes story.json inkVersion 21
inklecate nexus-intro.ink   # interactive terminal play (if inklecate on PATH)
```

A committed `story.json` is included so preview works without a local compiler. Regenerate after editing `nexus-intro.ink`.

Root VitePress docs are unaffected; this `package.json` lives only under `scratch/nexus-intro/`.

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

**Expected:** story returns to beat 5 with refusal text; `beat5_clear` stays false until you switch through Maya, Eli, and Vibrion in order and finish Vibrion's power step.

**Wrong-order check:** With `beat5_step == 1`, stay on Anne and pick any non-Maya action (e.g. try to mark timing again or force solo). **Expected:** wrong-order / clock-sync messaging; gate does not advance.

## Beat map (foil)

| Beat | Knot | Gating |
|------|------|--------|
| 0 | `beat_0` | Vibrion frame; Entropy light touch |
| 1 | `beat_1` | `active == "anne"` |
| 2 | `beat_2` | `active == "maya"` |
| 3 | `beat_3` | `active == "eli"` |
| 4 | `beat_4` | `active == "vibrion"` |
| 5 | `beat_5` | Ordered `beat5_step`; solo-force choice fails |
| 6 | `beat_6` | Team exit; Entropy open |

Mode switch UI: tunnel knot `mode_switch` between beats and at beat 5 (diverting `+` choices — unchanged).

## Ink variables

- `active` — `anne` \| `maya` \| `eli` \| `vibrion`
- `beat1_clear` … `beat4_clear`, `beat5_step`, `beat5_clear`
- `idle_hint_shown` — stub for idle-threshold hint (CoreLoop accessibility placeholder)

## inkVersion / inkjs

`npm run compile` uses `inkjs`’s bundled compiler so `story.json` **`inkVersion` matches inkjs 2.x (21)**, avoiding the “engine 21 vs story 19” console warning.
