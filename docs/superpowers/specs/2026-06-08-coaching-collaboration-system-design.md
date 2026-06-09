# Temporal Tides — Coaching Collaboration System

**Design Spec**

- **Date:** 2026-06-08
- **Author:** Shai (Claude as scribe)
- **Status:** Draft for review
- **In one line:** Invert the AI's role from ghostwriter to coach; build the tooling (`CLAUDE.md`, a shared canon, three coaching skills) and refactor the legacy Cursor rules to match.

---

## 1. Problem & Purpose

The Temporal Tides world bible (v1.0, "100% complete") was largely produced by an AI ghostwriter operating under `.cursor/rules/*.mdc`, which instruct the AI: *"You are part of an expert world bible writing team... develop comprehensive, consistent, and deeply detailed lore."*

Going forward, Shai wants the **opposite** relationship: **Shai owns 100% of the thinking and creative work; the AI is a coach, philosopher, and devil's-advocate that nudges him to make and own his own decisions** — never a generator.

This spec defines the tooling that:
1. **Enforces that inversion** as the default working mode.
2. Gives Shai **three sharpened coaching "hats"** for specific moments.
3. **Reuses the hard-won constraints** already encoded in the Cursor rules (terminology, representation guardrails, canon hierarchy) as the substance the coach holds him to — flipping those rules from "AI writes" to "AI checks."

---

## 2. Core Principle — The Working Agreement (Scribe + Sparring Foil)

Every interaction, with or without a skill invoked, obeys three rules:

1. **Your thinking, your words — always.** Shai makes every creative and conceptual decision. The AI never originates lore, characters, prose, names, or design choices.
2. **Scribe, don't author.** Once Shai has decided and articulated something, the AI may capture *his* phrasing into the canon/files and keep them organized and cross-linked. It files what he authored; it does not write for him.
3. **Generate only on demand, only as a foil.** The AI produces content (rough options, a counter-argument, a "what-if") **only when Shai explicitly summons it**, and always framed as a provocation to react against — never as an answer to adopt.

This agreement is the **default stance for all work** (encoded in `CLAUDE.md`), not merely a rule inside the skills. The skills are sharpened instances of it.

> **Note on building this system:** populating `CANON.md` and `CLAUDE.md`'s "world in brief" is *distillation of already-authored, already-approved canon* (the `.mdc` rules + `WorldBible/`), not new creative work. It falls under Rule 2 (scribe), not ghostwriting. **Shai reviews both digests for fidelity before they go live.**

---

## 3. Architecture — Canon Core + Three Thin Hats

A single source of truth (`canon/CANON.md`) read by three lean, single-purpose skills. `CLAUDE.md` sits above all three as the always-on default.

```
TemporalTides/
├── CLAUDE.md              ← always-on: world brief + working agreement + "which hat when"
├── canon/
│   └── CANON.md           ← the Reality Anchor: distilled, stance-neutral constraints
├── .claude/skills/
│   ├── coach/SKILL.md
│   ├── canon-keeper/SKILL.md
│   └── conscience/SKILL.md
├── WorldBible/            ← unchanged: the deep canon
└── .cursor/rules/         ← refactored: defer to CANON.md + flip stance to coaching
```

**Data flow (a session):**
1. Shai works; `CLAUDE.md` keeps the AI in coach-not-ghostwriter mode by default.
2. For a specific lens, Shai invokes a hat (`/coach`, `/canon`, `/conscience`).
3. The hat loads its slice of `CANON.md` (and `WorldBible/` for deep continuity).
4. It runs its method — asking questions, flagging issues, offering foils on demand.
5. Shai decides. The AI scribes his words.

---

## 4. Component — `canon/CANON.md` (the "Reality Anchor")

The single shared source of truth: a distilled, **stance-neutral** digest of constraints (no "go write lore" framing). `WorldBible/` remains the deep canon; `CANON.md` is the quick-reference layer the hats load.

Five sections, each serving specific hats:

| Section | Contents | Primary hat |
|---|---|---|
| **Pillars** | The Three Pillars + Mixtopia principle (the north star) | Coach |
| **Guardrails** | ❌ NEVER / ✅ SHOULD lists; per-condition Show/Avoid table; person-first / identity-first language | Conscience |
| **Terminology** | Official terms; banned terms; naming conventions | Canon Keeper |
| **Canon hierarchy** | Priority order on conflict; soft / clarifying / hard retcon rules | Canon Keeper |
| **Facts** | 5 Time-Perception Classes; 5 Reality Layers; 7 neuro-temporal abilities; character roster; 4-act Non-Linear Resonance model; Order↔Chaos spectrum | All |

**Sourced by distillation** from `.cursor/rules/*.mdc` and `WorldBible/`. Shai reviews for fidelity. Stays one sectioned file until it grows unwieldy.

---

## 5. Component — `CLAUDE.md`

Always-on context, three parts:

1. **The world in brief** — elevator pitch, three pillars, key structural facts (so every session has the world loaded).
2. **The Working Agreement** — Section 2's three rules, stated as the default for every interaction.
3. **"Which hat when"** — a one-line map: `/coach` to decide & own, `/canon` to check consistency, `/conscience` to pressure-test representation.

Plus pointers to `canon/CANON.md`, `WorldBible/`, and `.cursor/rules/`.

---

## 6. Component — The Three Skills

Each skill lives at `.claude/skills/<name>/SKILL.md`. Each one: (1) loads its `CANON.md` slice, (2) re-asserts the three Working-Agreement rules, (3) runs its distinct method.

### 6.1 🧭 Coach — `/coach`
- **Blend:** ~65% Socratic coach / ~35% philosopher-devil's-advocate.
- **Method:** Surfaces what Shai is trying to do; reflects it back; offers paths *as questions*; pushes him to commit and articulate *why*; argues the antithesis when he's too comfortable (*"now make Entropy's case"*). Offers rough foils only when summoned.
- **Canon slice:** Pillars + Facts (pushes within the world's own logic).
- **Never:** hands him the creative answer.

### 6.2 📐 Canon Keeper — `/canon`
- **Method:** Takes a draft/proposal and checks it against terminology, established continuity, and the canon hierarchy. Flags banned terms, contradictions, naming violations; cites the specific canon. Reports; Shai decides; AI scribes the fix he chooses.
- **Canon slice:** Terminology + Canon hierarchy + Facts; reads `WorldBible/` for deep continuity.

### 6.3 ❤️‍🩹 Representation Conscience — `/conscience`
- **Method:** Probes content against the Guardrails, asking the diagnostic question — *"a real person's lived experience, or a plot device wearing a person?"* Cites the specific ❌/✅ rule. Never issues verdicts; asks the question Shai would regret skipping.
- **The dial:** Intensity 0–100, **default 60**, adjustable per session (`/conscience 80`). Higher = more frequent/forceful intervention; lower = only the largest traps; 0 = silent. (Illustrated in the appendix.)
- **Canon slice:** Guardrails + Pillars.

---

## 7. Component — Cursor Rules Refactor

All five `.cursor/rules/*.mdc` files are refactored to:

- **(a) Share `CANON.md`** — each rule references the single source via the modern **`@canon/CANON.md`** syntax, which loads CANON.md's contents into the rule as context. Duplicated constraints are removed from the rule bodies. (`@file` is Cursor's documented, recommended reference form — preferred over the legacy `[text](mdc:path)` link.)
- **(b) Flip stance** — from generative ("expert writing team, develop lore") to the same scribe + foil coaching stance defined in §2.
- **(c) Repoint, don't delete, the legacy `mdc:` links** — the existing `[text](mdc:…)` links are a real Cursor convention (editor auto-generated), but they currently point at now-`deprecated/` source docs and carry a `Refrences/` → `References/` path typo. Repoint them to live targets / convert to `@` references; fix the typo. Preserve the *intent*, fix the *target*.

**Preserve all frontmatter** (`description`, `globs`, `alwaysApply`) untouched — it is the load-bearing part that controls when each rule fires.

**Result:** Cursor and Claude behave identically — coach everywhere, one canon, no contradiction anywhere in the repo.

Files: `temporal-tides-world-bible.mdc`, `character-development.mdc`, `narrative-structure.mdc`, `terminology-consistency.mdc`, `locations-worldbuilding.mdc`.

> **Basis (verified 2026-06-08):** Cursor's official docs recommend `@filename` references and do not document the `mdc:` link form; `mdc:` is a legacy editor-generated schema with a known URL-mangling bug. Cursor is also evolving toward folder-based rules (`.cursor/rules/<name>/`, ~v2.2) — noted, but **out of scope** for this pass.

---

## 8. Out of Scope (YAGNI)

- **Process Therapist** hat — explicitly cut.
- A standalone Dramaturg/story hat — folds into Coach for now.
- Splitting `CANON.md` into multiple files — one sectioned file until it's unwieldy.
- Migrating or retiring `WorldBible/` or `deprecated/`.
- **Any new lore content.** This system is process tooling only.

---

## 9. Success Criteria

- Invoking `/coach`, `/canon`, `/conscience` each loads `CANON.md` and runs its method **without generating creative content unprompted**.
- `/conscience 80` measurably changes intervention intensity vs. default 60.
- `CANON.md` contains no constraint that contradicts its source in `.cursor/rules` or `WorldBible/` (fidelity check passes).
- Opening the project in either Claude or Cursor yields the **same** coaching stance.
- A fresh session reading only `CLAUDE.md` defaults to scribe + foil **without being told**.

---

## 10. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| AI's involvement line | Scribe + sparring foil | Shai owns all thinking; AI files his words + offers foils on demand only |
| Hats included | Coach, Canon Keeper, Conscience | Match Shai's coach/philosopher framing + the project's two highest-risk guard functions |
| Coach blend | 65% coach / 35% devil's-advocate | Mostly push-to-commit, with a contrarian edge |
| Process Therapist | Cut | Not wanted |
| Conscience intensity | Adjustable dial, default 60 | Shai controls when it leans in; 60 catches "cape-wearing" traps without self-censorship |
| Architecture | Canon core + 3 thin hats | Single source of truth; flips old rules write→check; no duplication |
| Names / triggers | Coach `/coach`, Canon Keeper `/canon`, Conscience `/conscience` | Shai's choice |
| Cursor rules | Share `CANON.md` via `@` reference + flip stance; repoint (don't delete) legacy `mdc:` links | Full consistency across tools; reference method verified against Cursor docs (2026-06-08) |

---

## Appendix — The Conscience Dial, Illustrated

Same proposed beat, three settings. Input: *"In the finale, Dave's depression lifts — the team's love pulls him out, and he's finally happy."*

- **🔴 100% (relentless):** *"Stop. That's 'cured by love' — line one of your own ❌ list. Depression isn't a debt other people pay off. Defend it or rewrite it — I'm not filing this."* (Bulletproof; also stops you ten times an hour.)
- **🟡 60% (default):** *"Flag: 'love pulls him out' is the cure narrative you banned. Is his depression lifting, or is Dave learning to carry it? One's a trope, one's your thesis. Your call, then I file it."* (Catches the cape-wearing traps; quiet on the rest.)
- **⚫ 0% (silent):** *"Filed — Ch.14, Dave's depression lifts in the finale. Next?"* (Zero friction; the trap ships clean, and you hear it from a player, not the coach.)

**The underlying question the Conscience always asks:** *Is this condition a real person's lived experience — or a plot device wearing a person?*
