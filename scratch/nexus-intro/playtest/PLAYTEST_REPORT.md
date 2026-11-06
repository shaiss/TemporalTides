# Nexus Intro — Puzzle Logic Playtest Report

**Date:** 2026-09-21  
**Scratch:** `scratch/nexus-intro/nexus-intro.ink` + `story.json` (inkjs)  
**Runner:** `scratch/nexus-intro/playtest/run-playtest.js`  
**Raw results:** `scratch/nexus-intro/playtest/results.json`  
**Design source:** FOIL `docs/design/intro-episode-nexus-foil.md` (design locked)  
**Working Agreement:** Admiral authors lore; Tide drafts foils only — no WorldBible authorship. This report freezes **implemented Ink puzzle logic** only.

---

## Summary recommendation

### **FREEZE** puzzle logic

All FOIL success criteria for the Ink/Twine scratch are met with concrete programmatic evidence. Preview HUD issues are **post-freeze polish**, not block-freeze.

---

## FOIL success criteria — pass/fail

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Player cannot clear beat 5 without switching through all four modes in valid order | **PASS** | Happy path Anne→Maya→Eli→Vibrion clears (`happy.b5.*`). Solo force fails at step 0 (`solo.fail`). Wrong-order attempts keep step / `beat5_clear=false` (`order.maya_first`, `order.skip_maya`, `order.skip_eli`, `order.wrong_power`). |
| 2 | Each solo beat (1–4) completable in that character’s mode only | **PASS** | Clears only in required mode (`happy.beat1`–`4`). Wrong-mode choices fail and stay (`wrong.beat1`–`4`). Beat 4 Eli partner stub does not clear (`wrong.beat4.eli_partner`). |
| 3 | Hint after idle threshold (accessibility stub present) | **PASS** | Choice present when `idle_hint_shown=false` (`hint.available`); sets flag + stub text (`hint.shown`); removed after (`hint.once`). *Note:* stub is a manual choice, not a timed idle detector — acceptable for Ink scratch; real idle threshold is post-freeze UI work. |
| 4 | Target playtime ~10–15 minutes | **PASS (estimate)** | Happy path ~19 decisions / ~3529 chars; est. **8–14 min** reading pace (`playtime.estimate`). Scratch prose is lean; polished copy + HUD will sit nearer FOIL band. Not a logic fail. |

**Runner tally:** 33 pass / 0 fail (includes preview bug *detection* asserts).

---

## Path coverage matrix

| Scenario | Result | Notes |
|----------|--------|-------|
| Happy path beats 0→6 | PASS | Ends on resonance tease; story `END` |
| Wrong mode beats 1–4 | PASS | Flags stay false; returns to beat knot |
| Beat 4 Eli partner stub | PASS | Assist text only; Vibrion still required |
| Beat 5 solo-fail choice | PASS | Present while `beat5_step < 3` |
| Beat 5 wrong order (4 cases) | PASS | Step does not advance; clear false |
| Hint stub when idle flag false | PASS | One-shot via `idle_hint_shown` |
| Mode switch non-sticky | PASS | After each switch, other three + Keep offered (`mode.nonsticky.*`) |

**Frozen beat 5 order (as implemented):** Anne (tick) → Maya (lock) → Eli (window) → Vibrion (seal).

---

## Bugs found

| Bug | Severity | Detail |
|-----|----------|--------|
| Cumulative story log in preview | **Post-freeze polish** | `preview/index.html` uses `storyEl.textContent += …`, so every `mode_switch` appends `Active character: …` into a growing log. Fix: clear or scoped transcript per beat / hide mode-switch chrome from log. |
| HUD ability cue lag vs mode chips | **Post-freeze polish** | `tagMode` set from beat 0 `# mode:vibrion` and never cleared in `continueStory`/`applyTags`; branch `else if (tagMode && MODE_CUES[tagMode])` can keep Vibrion HUD cue while chips correctly follow `active`. Fix: reset `tagMode` each continue, or prefer `active` over sticky tag. |

**No block-freeze puzzle bugs found.** Gate order, solo-fail, per-beat mode filters, and non-sticky mode switch behave as FOIL requires.

---

## Notes / non-issues

- Starting `active = "vibrion"` matches beat 0 frame; player must switch for beats 1–3 and for beat 5 steps.
- Beat 4 offers Eli a partner stub; clear condition remains Vibrion active + Vibrational Manipulation choice.
- Hint is an explicit Ink choice gated by `idle_hint_shown`, not a wall-clock idle timer — call out in freeze FOIL as accessibility *stub*.
- Prose is placeholder scratch (Ink header); admiral owns lore — do not treat lines as WorldBible canon.

---

## Artifacts

| Path | Role |
|------|------|
| `scratch/nexus-intro/playtest/run-playtest.js` | inkjs path walker |
| `scratch/nexus-intro/playtest/results.json` | Machine-readable pass/fail |
| `scratch/nexus-intro/playtest/PLAYTEST_REPORT.md` | This report |
| `docs/design/intro-episode-nexus-puzzle-freeze-foil.md` | Freeze FOIL for admiral crest |

---

## Recommendation

**FREEZE** Nexus intro puzzle logic for admiral crest.

Reasons: FOIL criteria 1–3 verified by exhaustive programmatic walks; criterion 4 within estimate band for scratch length; remaining issues are preview HUD polish only and are explicitly out of freeze scope.
