# FOIL — Nexus Intro Episode: Puzzle Logic Freeze

> **Status:** FOIL for admiral crest — puzzle logic freeze candidate (2026-09-21)  
> **Working Agreement:** Admiral authors lore and creative decisions. Tide drafts foils and scribes after acceptance — **no WorldBible authorship**. This FOIL freezes **Ink-implemented gate logic** only; prose remains placeholder scratch until admiral revises.  
> **Cite:** Playtest `scratch/nexus-intro/playtest/PLAYTEST_REPORT.md` (2026-09-21) — 33/33 programmatic checks PASS; recommendation **FREEZE**.  
> **Parent design:** `docs/design/intro-episode-nexus-foil.md` (design locked).  
> **Proposed path:** `docs/design/intro-episode-nexus-puzzle-freeze-foil.md`

---

## Intent

Freeze the **ability-mode puzzle sequence** proven in the Nexus intro Ink scratch so eng and narrative share one gate contract: what must clear, who must be active, and what must fail.

This is not a lore lock and not a UI/Three.js lock.

---

## Frozen ability-mode rules

1. **One active character** at a time (`VAR active`).
2. Visible clear choices are **filtered by `active`** (and by `beat5_step` on the coordination gate).
3. **Mode switch is non-sticky:** `mode_switch` always offers the other three MVP cast members plus Keep current; prior switches do not remove options.
4. MVP cast (locked parent FOIL): Anne (Foresight), Maya (Pattern Sense), Eli (Kinetic Rush), Vibrion (Vibrational Manipulation).

---

## Frozen sequence table (beats 0–6)

| Beat | Who (clear lens) | Puzzle type | Clear condition (as implemented) |
|------|------------------|-------------|------------------------------|
| 0 | Vibrion frame | Narrative | Enter chamber; optional early mode switch; continue → beat 1 |
| 1 | **Anne** | Perception / hazard | `active == "anne"` + Foresight trap-overlay choice → `beat1_clear` |
| 2 | **Maya** | Sequence | `active == "maya"` + Pattern Sense lever-mark choice → `beat2_clear` |
| 3 | **Eli** | Speed / coordination prep | `active == "eli"` + Kinetic Rush window choice → `beat3_clear` |
| 4 | **Vibrion** | Energy | `active == "vibrion"` + Vibrational Manipulation panel choice → `beat4_clear`. Eli partner stub may assist textually but **does not clear**. |
| 5 | **All four (ordered)** | Coordination | Ordered gate below → `beat5_clear` |
| 6 | Team / exit | Resonance tease | Reached only after beat 5 clear; episode `END` (Entropy not solved) |

Wrong-mode choices on beats 1–4 return to the same beat with clear flags unchanged.

---

## Beat 5 — ordered gate (exact)

**Valid order (clock sync):**

1. **Anne** — Foresight marks timing tick (`beat5_step` 0→1)  
2. **Maya** — Pattern Sense locks sequence to that tick (1→2)  
3. **Eli** — Kinetic Rush hits sync window (2→3)  
4. **Vibrion** — Vibrational Manipulation powers seal (3→4, `beat5_clear = true`) → beat 6  

**Solo-fail rule:** While `beat5_step < 3`, choice *Force the seal closed from one lens alone* is offered and **must fail** (no step advance, `beat5_clear` stays false). Clearing in a single mode is impossible.

**Wrong-order rule:** At each step, non-required `active` only sees a fail choice that returns to beat 5 without advancing `beat5_step`.

Playtest evidence: `happy.b5.*`, `solo.fail`, `order.*` — all PASS.

---

## Mode switch rules (frozen)

- Knot: `mode_switch(-> return_knot)` with tag `# ui:mode_switch`.
- Offers: Anne / Maya / Eli / Vibrion **excluding current `active`**, plus Keep current.
- After each solo clear (beats 1–4) and after each successful beat 5 step (except final), flow routes through `mode_switch` before the next beat/step.
- Non-sticky verified across repeated switches (`mode.nonsticky.*`).

---

## Accessibility hint (stub — in freeze as behavior, not timer)

- Variable: `idle_hint_shown` (starts false).
- Beats 1–3 and 5 offer a one-shot “hint stub” choice while flag is false; choosing it sets the flag and shows lens guidance.
- **In freeze:** stub presence + one-shot flag behavior.  
- **Out of freeze:** real idle-threshold timer UX (parent FOIL “after idle threshold”).

---

## Explicitly **out of freeze**

| Item | Why |
|------|-----|
| HUD polish (ability label lag vs chips; cumulative “Active character” log lines) | Preview-only; post-freeze polish per playtest report |
| Three.js / Vercel playable vertical slice | Parent FOIL: deferred until admiral calls playable build |
| Lore / WorldBible authorship / final prose | Working Agreement — admiral authors; Ink lines are scratch placeholders |
| Real idle timer, art, audio, combat, out-of-MVP cast | Not in Ink scratch scope |
| Changing beat 5 order or solo-fail rule | Would require new FOIL + re-playtest |

---

## Crest checklist (admiral)

- [ ] Accept frozen beat table (0–6) and clear conditions above  
- [ ] Accept beat 5 order Anne → Maya → Eli → Vibrion and solo-fail rule  
- [ ] Accept non-sticky one-active mode switch  
- [ ] Accept hint as stub (flag/choice), timer UX later  
- [ ] Confirm HUD/Three.js/lore remain out of this freeze  
- [ ] Crest → eng may treat this as puzzle contract for scaffold PRs  

---

## Playtest citation

- **Date:** 2026-09-21  
- **Report:** `scratch/nexus-intro/playtest/PLAYTEST_REPORT.md`  
- **Runner:** `scratch/nexus-intro/playtest/run-playtest.js` against `scratch/nexus-intro/story.json`  
- **Result:** FOIL criteria 1–3 PASS; playtime estimate near 10–15m band; **FREEZE** recommended  
- **Blockers:** none for puzzle logic  

---

## After crest

1. Land this FOIL under `docs/design/intro-episode-nexus-puzzle-freeze-foil.md` via PR.  
2. Keep Ink gates aligned; any order/clear change needs admiral re-crest.  
3. Preview HUD polish and Three.js remain separate tracks.
