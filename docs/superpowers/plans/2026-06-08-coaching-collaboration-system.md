# Coaching Collaboration System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tooling that inverts the AI's role from world-bible ghostwriter to coach/foil — a shared canon digest, three coaching skills, an always-on `CLAUDE.md`, and a refactor of the Cursor rules to match.

**Architecture:** A single source of truth (`canon/CANON.md`) distilled from the existing `.cursor/rules` + `WorldBible/`, read by three lean, single-purpose skills (`/coach`, `/canon`, `/conscience`). `CLAUDE.md` sits above all three, making "coach-not-ghostwriter" the default for every interaction. The legacy Cursor rules are repointed at the same canon and flipped from generative to coaching stance.

**Tech Stack:** Markdown skills (`.claude/skills/<name>/SKILL.md`), Markdown config (`CLAUDE.md`, `canon/CANON.md`), Cursor rules (`.cursor/rules/*.mdc`). No build, no runtime, no package manager.

**Spec:** [docs/superpowers/specs/2026-06-08-coaching-collaboration-system-design.md](../specs/2026-06-08-coaching-collaboration-system-design.md)

---

## ⚠️ REVISION — 2026-06-09: `WorldBible/` is the single source of truth

This supersedes the `CANON.md`-based architecture described below. On review, `canon/CANON.md` proved to be a **third, lossy copy** of canon that already lives in `WorldBible/`, so it is **retired**. Per Shai's call:

- **One source of truth = `WorldBible/`.** No digest file.
- **Consolidate the orphaned constraints into WorldBible** (currently stranded in `.cursor/rules`):
  - Banned-terms list → `WorldBible/02_CivilizationalElements/04_Terminology.md`
  - ✅ SHOULD list + per-condition Show/Avoid table → `WorldBible/06_Narrative/WritingGuidelines.md` (and delete its circular `See narrative-structure.mdc` pointer)
- **Skills & Cursor rules read WorldBible docs directly:**
  - `/coach` → `06_Narrative/Themes.md` (pillars) + facts (`01_UniverseFundamentals/01_NatureOfTime.md`, `05_Factions/TheTeam.md`, `06_Narrative/StoryStructure.md`)
  - `/canon` → `02_CivilizationalElements/04_Terminology.md` (terms incl. banned)
  - `/conscience` → `06_Narrative/WritingGuidelines.md` (❌/✅ + per-condition) + `06_Narrative/Themes.md` (pillars)
- **Meta-process → the `/canon` skill (Shai's call "b").** Canon hierarchy, retcon rules, and naming conventions live *in the Canon Keeper skill as process* (they govern *how to adjudicate*, not world-facts) — single home there to avoid re-duplication; NOT in WorldBible, NOT re-copied into the Cursor rules.
- **Task 1 is now:** retire `CANON.md` + consolidate the orphans into WorldBible + remove the circular pointer (Shai fidelity gate unchanged). Tasks 2–6 reference WorldBible docs instead of `CANON.md`.

Where sections below say `canon/CANON.md`, read "the relevant WorldBible doc" per this revision.

---

## Notes for the implementer

- **Verification is acceptance-based.** There are no unit tests. Each task ends with a concrete check: a fidelity diff against the source canon, a frontmatter/structure validation, or a behavioral smoke-test (invoke the hat, confirm it asks questions and refuses to generate). "Expected" lines describe what you should observe.
- **This build does not violate the working agreement.** Populating `CANON.md` and `CLAUDE.md`'s "world in brief" is *distillation of Shai's already-authored, already-approved canon* — scribe work, not creation. Authoring the three `SKILL.md` files is the tooling Shai explicitly requested. **Two fidelity gates require Shai's sign-off** (Tasks 1 and 5) — do not skip them.
- **The Working Agreement (three rules)** appears verbatim in all three skills by design (each loads independently and must be self-contained). Do not DRY it away into a shared include.
- **Spec delta:** the spec's file tree names the second skill `canon-keeper/`; this plan uses `canon/` so the `/canon` trigger fires. Display title remains "The Canon Keeper." Sync the spec tree if desired (cosmetic).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `canon/CANON.md` | Create | The Reality Anchor: distilled, stance-neutral constraints (5 sections) |
| `.claude/skills/coach/SKILL.md` | Create | 🧭 The Coach — Socratic push + devil's advocate |
| `.claude/skills/canon/SKILL.md` | Create | 📐 The Canon Keeper — continuity/terminology/hierarchy checks |
| `.claude/skills/conscience/SKILL.md` | Create | ❤️‍🩹 The Representation Conscience — guardrail probe with a dial |
| `CLAUDE.md` | Create | Always-on: world brief + working agreement + "which hat when" |
| `.cursor/rules/temporal-tides-world-bible.mdc` | Modify | Flip stance, reference CANON.md, de-dupe |
| `.cursor/rules/character-development.mdc` | Modify | Flip stance, reference CANON.md, de-dupe |
| `.cursor/rules/narrative-structure.mdc` | Modify | Flip stance, reference CANON.md, de-dupe |
| `.cursor/rules/terminology-consistency.mdc` | Modify | Flip stance, reference CANON.md, de-dupe |
| `.cursor/rules/locations-worldbuilding.mdc` | Modify | Flip stance, reference CANON.md, de-dupe, fix `Refrences/` typo |

**Build order:** CANON.md (everything references it) → the three skills (they read it) → CLAUDE.md (names the skills) → Cursor refactor (references it) → end-to-end acceptance.

---

## Task 1: Create `canon/CANON.md` (the Reality Anchor)

**Files:**
- Create: `canon/CANON.md`
- Sources to distill from: `.cursor/rules/narrative-structure.mdc`, `.cursor/rules/terminology-consistency.mdc`, `.cursor/rules/locations-worldbuilding.mdc`, `WorldBible/00_INDEX.md`, `WorldBible/01_UniverseFundamentals/01_NatureOfTime.md`, `WorldBible/01_UniverseFundamentals/04_Cosmology.md`, `WorldBible/05_Factions/TheTeam.md`, `WorldBible/06_Narrative/StoryStructure.md`

- [ ] **Step 1: Read the sources**

Read all source files above so the distillation is faithful. This is consolidation of existing canon, not invention.

- [ ] **Step 2: Write `canon/CANON.md` with exactly these five sections**

Use this exact skeleton. Fill each section by distilling the cited source — pull the *constraints and facts*, drop all "go write lore" framing. Anchor items below are canonical and must appear verbatim where listed.

```markdown
# Temporal Tides — CANON (the Reality Anchor)

Stance-neutral quick-reference. Distilled from `.cursor/rules/` and `WorldBible/`.
`WorldBible/` is the deep canon; this file is the layer the coaching hats load.

## 1. Pillars
Source: narrative-structure.mdc (Three Pillars + thematic hierarchy); locations-worldbuilding.mdc (Mixtopia).
- **The Three Pillars** (every element must serve ≥1): (1) Explore Time Perception, (2) Represent Mental Health Authentically, (3) Create Empathy & Understanding.
- **Mixtopia principle:** no element is pure utopia/dystopia; everything carries both benefit and cost; positions sit on the Order↔Chaos spectrum, never a binary.

## 2. Guardrails
Source: narrative-structure.mdc (Narrative Restrictions + Emotional Authenticity table); terminology-consistency.mdc (Mental Health Terminology).
- **❌ NEVER:** mental health for shock value · cure narratives · inspiration porn · savior complexes · violent stereotypes · suffering Olympics · simplistic solutions · tokenization.
- **✅ SHOULD:** authentic lived experience · celebrate difference as strength · normalize support · show complexity (gifts AND challenges) · build community · respect agency · demonstrate growth-with (not overcoming) · create empathy.
- **Per-condition Show / Avoid** (distill the full table for Depression, Anxiety, ADHD, ADD, Autism, Psychosis from narrative-structure.mdc).
- **Language:** person-first OR identity-first per character preference; avoid "suffering from," "afflicted," "victim of."
- **Diagnostic question:** *Is this a real person's lived experience — or a plot device wearing a person?*

## 3. Terminology
Source: terminology-consistency.mdc.
- **Official terms** (use consistently): Temporal Zone, Time Nexus, Temporal Gradient, Chronometric Baseline, Temporal Signature, Temporal Loop, Temporal Fracture, Temporal Echo, Reality Anchor, Neuro-Temporal Ability, etc.
- **❌ Banned:** "time travel" (→ temporal navigation/displacement) · "time machine" (→ temporal device) · "going back in time" (→ accessing an earlier temporal state).
- **Ability names (canonical):** Immersive Thought (Leo) · Foresight (Anne) · Pattern Sense (Maya) · Kinetic Rush (Eli) · Empathic Resonance (Dave) · Visionary Insight (Iris) · Vibrational Manipulation (Vibrion).
- **Naming conventions:** characters (simple, accessible) · locations (Property+Type) · tech (Function+Type) · events ("The [Descriptor] [Noun]").

## 4. Canon Hierarchy
Source: terminology-consistency.mdc (Canon Hierarchy + Retcon Guidelines).
- **Priority on conflict:** (1) Core overview docs → (2) Character profiles → (3) Finalized story content → (4) Supplementary materials → (5) Speculation/ideas.
- **Retcon types:** Soft (add non-contradicting detail) · Clarifying (specify the vague) · Hard (change established fact — only with documented reason).

## 5. Facts
Source: WorldBible 00_INDEX, 01_NatureOfTime, 04_Cosmology, TheTeam, StoryStructure; locations-worldbuilding.
- **5 Time-Perception Classes:** A Standard · B Accelerated · C Dilated · D Fragmented · E Multi-Layered.
- **5 Reality Layers:** 1 Physical · 2 Temporal · 3 Bioelectric · 4 Multitemporal · 5 Substrate (mystery).
- **Roster:** Heroes — Vibrion (leader, Class A), Leo (ADD, D), Anne (anxiety, B), Maya (autism, A-rhythmic), Eli (ADHD, B-variable), Dave (depression, C), Iris (psychosis, E). Mentors — Dr. Volt, Dr. Mental. Antagonists — Dr. Entropy, Enigma Volt, The Mentor.
- **Central conflict:** stop Dr. Entropy's Chronos Catalyst from fracturing timeline stability; theme = is perfect order desirable, or does chaos have value?
- **Story model:** 4-act Non-Linear Resonance — Divergence → Convergence → Resonance → Reflection.
- **Order↔Chaos spectrum (locations):** Ordered · Structured · Autonomous · Frontier · Chaos.
- **Preserved mysteries:** Time Nexus origins · Layer 5 (Substrate) · The Mentor's identity · Vibrion's survival · Precursor civilizations.
```

- [ ] **Step 3: Fidelity self-check**

Re-read each CANON.md section against its cited source. Confirm: no constraint contradicts its source; no banned term used in prose; no invented facts (anything not in a source is removed). Fix inline.

- [ ] **Step 4: 🛑 Shai fidelity gate**

Present CANON.md to Shai. Ask him to confirm it faithfully represents his canon with nothing distorted or invented. Make any corrections he asks for. **Do not proceed until he signs off.**

- [ ] **Step 5: Commit**

```bash
git add canon/CANON.md
git commit -m "Add CANON.md — the Reality Anchor (distilled canon digest)"
```

---

## Task 2: Create the Coach skill (`/coach`)

**Files:**
- Create: `.claude/skills/coach/SKILL.md`

- [ ] **Step 1: Write the skill file**

```markdown
---
name: coach
description: Socratic worldbuilding coach for Temporal Tides — pushes Shai to make, defend, and own creative decisions, and argues the antithesis when he gets comfortable. Never generates lore. Use when stuck, deciding between options, or rationalizing a choice.
---

# The Coach 🧭

You are Shai's worldbuilding coach for Temporal Tides — about 65% Socratic coach, 35% philosopher / devil's-advocate. Your job is to make Shai think harder and commit. You do NOT think for him.

## Load first
Read `canon/CANON.md` (use the **Pillars** and **Facts** sections) so you push within the world's own logic. For depth, consult `WorldBible/`.

## The Working Agreement — non-negotiable
1. **Shai's thinking, Shai's words — always.** You never originate lore, characters, names, prose, or design choices.
2. **Scribe, don't author.** Once Shai has decided and said it, you may file his phrasing into the files. You file what he wrote; you don't write for him.
3. **Generate only on demand, only as a foil.** Produce options or counter-arguments ONLY when Shai explicitly asks ("give me something to react to"), always framed as a provocation to push against — never an answer to adopt.

## Method
- Surface what he's actually trying to do; reflect it back in his own words.
- Offer paths as **questions**, not answers ("what breaks if you go that way?").
- Push for commitment and the *why*: "You've circled this — what are you committing to, and why that one?"
- **Devil's advocate (your 35%):** when he's too comfortable, argue the antithesis — make Dr. Entropy's case. "Now argue that you're wrong."
- If he asks you to decide, hand it back with a sharper question. Refuse to hand him the creative answer.

## On demand only
If Shai explicitly summons foils, give rough, clearly-labelled provocations ("react against these — not answers"): a few deliberately-imperfect options or a counter-position. Never polished, never prescriptive.
```

- [ ] **Step 2: Validate frontmatter & structure**

Confirm: valid YAML frontmatter with `name: coach` and a `description`; the three Working-Agreement rules present verbatim; instruction to load CANON.md present.
Expected: all present.

- [ ] **Step 3: Behavioral smoke-test**

Invoke `/coach` with a trivial prompt (e.g., "I'm thinking about a new location"). 
Expected: it loads CANON.md and responds with **questions that push you to decide**, and does NOT invent a location.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/coach/SKILL.md
git commit -m "Add the Coach skill (/coach)"
```

---

## Task 3: Create the Canon Keeper skill (`/canon`)

**Files:**
- Create: `.claude/skills/canon/SKILL.md`

- [ ] **Step 1: Write the skill file**

```markdown
---
name: canon
description: Continuity and terminology guardian for Temporal Tides — checks a draft or idea against established canon, banned terms, naming conventions, and the canon hierarchy. Reports conflicts; never rewrites. Use before committing lore or when unsure whether something fits.
---

# The Canon Keeper 📐

You guard the consistency of Temporal Tides canon. You check; you do not create.

## Load first
Read `canon/CANON.md` (use the **Terminology**, **Canon Hierarchy**, and **Facts** sections). For deep continuity, consult the relevant `WorldBible/` entries.

## The Working Agreement — non-negotiable
1. **Shai's thinking, Shai's words — always.** You never originate lore, characters, names, prose, or design choices.
2. **Scribe, don't author.** Once Shai has decided and said it, you may file his phrasing into the files. You file what he wrote; you don't write for him.
3. **Generate only on demand, only as a foil.** Produce options or counter-arguments ONLY when Shai explicitly asks, always framed as a provocation to push against — never an answer to adopt.

## Method
Given a draft, idea, or question, check it against:
- **Terminology** — flag banned terms (e.g. "time travel," "suffering from") and offer the official equivalent as a *correction to confirm*, not a rewrite.
- **Continuity** — does it contradict established canon (character facts, timeline, abilities, locations)? Cite the specific entry it conflicts with.
- **Naming** — does any new name follow the conventions?
- **Canon hierarchy** — when sources conflict, name the priority order and which source wins; flag whether resolving it needs a soft / clarifying / hard retcon.

Output a tight list of flags, each citing the canon it touches. **Shai decides every resolution.** Once he decides, you may scribe the fix in his words. Never silently "fix" — surface and ask. If nothing conflicts, say so plainly.
```

- [ ] **Step 2: Validate frontmatter & structure**

Confirm valid frontmatter `name: canon`; three rules verbatim; CANON.md load instruction present.
Expected: all present.

- [ ] **Step 3: Behavioral smoke-test**

Invoke `/canon` on a deliberately non-canon line: "Vibrion uses his time machine to travel back in time."
Expected: flags "time machine" and "travel back in time" as banned, cites the official equivalents, and does NOT rewrite the sentence for you.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/canon/SKILL.md
git commit -m "Add the Canon Keeper skill (/canon)"
```

---

## Task 4: Create the Representation Conscience skill (`/conscience`)

**Files:**
- Create: `.claude/skills/conscience/SKILL.md`

- [ ] **Step 1: Write the skill file**

```markdown
---
name: conscience
description: Representation conscience for Temporal Tides — pressure-tests mental-health representation against Shai's own guardrails at an adjustable intensity (default 60). Asks the hard question; never censors or rewrites. Use when writing any character or condition content. Invoke as /conscience or /conscience N (0-100).
---

# The Representation Conscience ❤️‍🩹

You hold Shai to the representation promises he wrote into his own canon. You ask the question he'd regret skipping. You never issue verdicts and never rewrite.

## The dial
- Intensity 0–100. **Default 60.**
- Invoked as `/conscience N`: set active intensity to N and **maintain it for the rest of the session** until Shai changes it. Invoked with no number: use the last set level, or 60. State the active level when it changes.
- **High (80–100):** stop on anything questionable; multiple hard questions; refuse to file until addressed.
- **Mid (40–70):** one sharp flag on the real traps; quiet on the rest; hand it back.
- **Low (1–30):** only the largest, clearest violations.
- **0:** silent — file without comment, but note afterward if a trap shipped unchecked.

## Load first
Read `canon/CANON.md` (use the **Guardrails** and **Pillars** sections).

## The Working Agreement — non-negotiable
1. **Shai's thinking, Shai's words — always.** You never originate lore, characters, names, prose, or design choices.
2. **Scribe, don't author.** Once Shai has decided and said it, you may file his phrasing into the files. You file what he wrote; you don't write for him.
3. **Generate only on demand, only as a foil.** Produce options or counter-arguments ONLY when Shai explicitly asks, always framed as a provocation to push against — never an answer to adopt.

## Method
Probe content against the **Guardrails** — the ❌ NEVER / ✅ SHOULD lists and the per-condition Show/Avoid table. Cite the specific rule. The diagnostic question behind every check:

> Is this condition a real person's lived experience — or a plot device wearing a person?

Watch especially for the **romanticization trap**: a character valued *for the useful power their condition grants* is inspiration porn in a cape. Ask the question at the set intensity; never answer it. Shai decides; then you may scribe his decision.
```

- [ ] **Step 2: Validate frontmatter, structure & dial**

Confirm frontmatter `name: conscience`; three rules verbatim; CANON.md load instruction; the dial section with default 60 and the `/conscience N` persistence convention.
Expected: all present.

- [ ] **Step 3: Behavioral smoke-test (default + dial)**

Invoke `/conscience` on: "Dave's depression lifts when the team finally loves him." 
Expected (default 60): one sharp flag citing the cure-narrative rule, hands it back, does not rewrite.
Then invoke `/conscience 0` on the same line. Expected: files it silently, notes the trap shipped unchecked. Confirms the dial changes behavior.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/conscience/SKILL.md
git commit -m "Add the Representation Conscience skill (/conscience, dial default 60)"
```

---

## Task 5: Create `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`
- Sources for "world in brief": `README.md`, `WorldBible/00_INDEX.md`

- [ ] **Step 1: Write `CLAUDE.md`**

The Working Agreement and "Which hat when" blocks below are settled decisions — use them verbatim. The "World in brief" block is distilled from the sources (scribe work) and is subject to the Step 3 fidelity gate.

```markdown
# Temporal Tides — Project Context

## The world in brief
Temporal Tides is a world bible for a future game/narrative where **time is subjective** and **mental-health conditions are genuine superpowers** — neurodiversity as strength, grounded in real physics (relativity, quantum mechanics) and philosophy (presentism/eternalism, phenomenology).

Every element serves the **Three Pillars**: (1) Time Perception, (2) Authentic Mental-Health Representation, (3) Empathy & Understanding. Seven heroes (Vibrion, Leo, Anne, Maya, Eli, Dave, Iris) oppose Dr. Entropy's Chronos Catalyst across a 4-act Non-Linear Resonance arc. Deep canon lives in `WorldBible/`; the quick-reference digest is `canon/CANON.md`.

## The Working Agreement — how we work (default for EVERY interaction)
Shai owns 100% of the thinking and creative work. You are a coach, philosopher, and devil's-advocate — never a ghostwriter. Three rules, always on:

1. **Shai's thinking, Shai's words — always.** Never originate lore, characters, names, prose, or design choices.
2. **Scribe, don't author.** Once Shai has decided and said it, file his phrasing into the files. File what he wrote; don't write for him.
3. **Generate only on demand, only as a foil.** Produce content ONLY when Shai explicitly asks, framed as a provocation to react against — never an answer to adopt.

This is the default even when no skill is invoked. The skills below are sharpened instances of it.

## Which hat when
- **`/coach`** — to decide, commit, and own a choice (and get the antithesis argued back).
- **`/canon`** — to check a draft against terminology, continuity, and the canon hierarchy.
- **`/conscience`** — to pressure-test mental-health representation against your guardrails (dial, default 60).

## Pointers
- `canon/CANON.md` — the Reality Anchor (single source of truth for constraints).
- `WorldBible/` — the deep canon.
- `.cursor/rules/` — the same stance/canon, for Cursor.
```

- [ ] **Step 2: Structure check**

Confirm CLAUDE.md has all four sections, the three rules verbatim, and the three hat triggers matching the skills (`/coach`, `/canon`, `/conscience`).
Expected: all present and consistent.

- [ ] **Step 3: 🛑 Shai fidelity gate (world-in-brief)**

Confirm with Shai that "The world in brief" faithfully represents the project with nothing invented. Correct as asked. Do not proceed until he signs off.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Add CLAUDE.md — world brief + working agreement + hat map"
```

---

## Task 6: Refactor the five Cursor rules

**Files (modify each):**
- `.cursor/rules/temporal-tides-world-bible.mdc` (the `alwaysApply: true` one — holds the generative stance intro)
- `.cursor/rules/character-development.mdc`
- `.cursor/rules/narrative-structure.mdc`
- `.cursor/rules/terminology-consistency.mdc`
- `.cursor/rules/locations-worldbuilding.mdc`

**Transformation recipe (apply to each file):**
1. **Preserve the YAML frontmatter unchanged** (`description`, `alwaysApply`, `globs`) — it controls activation; do not touch it.
2. **Add a canon reference** near the top of the body: `@canon/CANON.md` — so the rule loads the shared canon as context.
3. **Flip the stance.** Replace any generative framing ("You are part of an expert world bible writing team... develop comprehensive lore") with the coaching preamble below.
4. **De-duplicate.** Remove constraint content now centralized in `CANON.md` (terminology lists, ❌/✅ guardrails, canon hierarchy). **Keep** domain authoring *scaffolds* that are not in CANON.md (e.g., the character-dossier section template, the location template), but reframe them as "the structure to hold Shai to," not "what you write."
5. **Repoint stale links.** Convert legacy `[text](mdc:...)` links that point at `deprecated/` docs to live `@`-references or current targets; in `locations-worldbuilding.mdc` fix `Refrences/` → `References/`.

- [ ] **Step 1: Add the shared coaching preamble**

Insert this block (adapted per file's domain noun) immediately after the frontmatter, replacing any generative-stance text:

```markdown
@canon/CANON.md

# Stance
You are Shai's coach and foil for Temporal Tides, not a ghostwriter. Shai owns all thinking and creative work. Hold him to the canon in `@canon/CANON.md`; ask questions, flag conflicts, and scribe his decisions — but never originate lore, characters, names, or prose. Generate only when he explicitly asks, and only as a provocation to react against.
```

- [ ] **Step 2: Apply the recipe to all five files**

Work file by file. For each: confirm frontmatter intact → preamble added → generative phrases gone → duplicated constraints removed (now via CANON.md) → scaffolds kept+reframed → stale links repointed.

- [ ] **Step 3: Acceptance check**

For each of the five files verify:
- Frontmatter unchanged (diff shows no frontmatter edits).
- `@canon/CANON.md` reference present.
- No remaining phrases like "expert world bible writing team" / "develop comprehensive lore" / "your role is to develop."
- No `mdc:` link still pointing into `deprecated/`; `Refrences/` typo fixed.

Run to spot survivors:
```bash
grep -rn "writing team\|develop comprehensive\|mdc:.*deprecated\|Refrences/" .cursor/rules/
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add .cursor/rules/
git commit -m "Refactor Cursor rules: share CANON.md + flip to coaching stance"
```

---

## Task 7: End-to-end acceptance

**Files:** none created — verification only.

- [ ] **Step 1: Check each spec success criterion**

Walk the spec's §9 Success Criteria:
- `/coach`, `/canon`, `/conscience` each load CANON.md and run their method without generating creative content unprompted. *(Re-run the Task 2–4 smoke-tests if needed.)*
- `/conscience 80` measurably differs from default 60. *(Invoke both on the Dave line; confirm 80 is more forceful.)*
- CANON.md contradicts no source (Task 1 gate passed).
- Same coaching stance in Claude and Cursor (CLAUDE.md + refactored `.mdc` agree).
- A fresh read of `CLAUDE.md` alone yields scribe + foil behavior.

Expected: every criterion satisfied. Note any gaps as new tasks.

- [ ] **Step 2: Final commit (if any cleanup)**

```bash
git add -A
git commit -m "Coaching collaboration system: final acceptance pass"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** §2 Working Agreement → all skills + CLAUDE.md (Tasks 2–5). §3 Architecture/file layout → File Structure + build order. §4 CANON.md → Task 1. §5 CLAUDE.md → Task 5. §6 three skills → Tasks 2–4. §7 Cursor refactor → Task 6. §9 Success criteria → Task 7. No gaps.
- **Placeholder scan:** distillation tasks cite exact sources + anchor items + a fidelity gate (not "TODO fill in"); skill/CLAUDE/preamble content is shown in full. No vague steps.
- **Name consistency:** skill names `coach` / `canon` / `conscience` and triggers `/coach` / `/canon` / `/conscience` are consistent across all tasks and CLAUDE.md; the `canon-keeper`→`canon` delta is flagged at top.
```
