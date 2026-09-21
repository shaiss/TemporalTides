# Nexus intro episode (Ink scratch)

Ability-mode intro scaffold for the **Time Nexus** MVP. Design is locked in [`docs/design/intro-episode-nexus-foil.md`](../../docs/design/intro-episode-nexus-foil.md). **Three.js is out of scope** for this tree.

Prose here is **foil-sourced scratch placeholder**, not WorldBible canon.

## Cast and abilities (dossier names only)

| Character | Ability | Solo beat |
|-----------|---------|-----------|
| Anne | Foresight | 1 — hazard corridor |
| Maya | Pattern Sense | 2 — echo / lever markings |
| Eli | Kinetic Rush | 3 — closing window |
| Vibrion | Vibrational Manipulation | 4 — dead panel / energy |

Beat **5** requires a valid switch sequence **Anne → Maya → Eli → Vibrion** (`beat5_step` 0→4). Beat **6** exits with resonance tease; Entropy unresolved.

## Play with inklecate (CLI)

Requires [inklecate](https://github.com/inkle/ink) (or `npx inklecate`).

```bash
cd scratch/nexus-intro
npx inklecate -o story.json nexus-intro.ink
inklecate nexus-intro.ink   # interactive play in terminal (if inklecate on PATH)
```

A committed `story.json` is included for preview without a local compiler. Regenerate after editing `nexus-intro.ink`.

Compile and pipe to an Ink player of your choice, or use the optional browser preview below.

## Optional browser preview (inkjs)

```bash
cd scratch/nexus-intro
npm install
npm run compile
npm run preview
```

Open the URL printed by `vite` (static server over `preview/`). The page loads `story.json` produced from `nexus-intro.ink`.

Root VitePress docs are unaffected; this `package.json` lives only under `scratch/nexus-intro/`.

## Verify beat 5 solo failure

Goal: prove the coordination gate **cannot** clear in a single active mode.

1. Play through beats 1–4 (switch as needed per README table).
2. At beat 5, stay on **one** character (e.g. Anne) without switching.
3. Complete Anne's timing step if active is Anne (`beat5_step` becomes 1).
4. Choose **「Force the seal closed from one lens alone」**.

**Expected:** story returns to beat 5 with refusal text; `beat5_clear` stays false until you switch through Maya, Eli, and Vibrion in order and finish Vibrion's power step.

**Wrong-order check:** With `beat5_step == 1`, stay on Anne and pick any non-Maya action (e.g. try to mark timing again or force solo). **Expected:** 「wrong order」 messaging; gate does not advance.

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

Mode switch UI: tunnel knot `mode_switch` between beats and at beat 5.

## Ink variables

- `active` — `anne` \| `maya` \| `eli` \| `vibrion`
- `beat1_clear` … `beat4_clear`, `beat5_step`, `beat5_clear`
- `idle_hint_shown` — stub for idle-threshold hint (CoreLoop accessibility placeholder)
