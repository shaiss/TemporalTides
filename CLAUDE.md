# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**Temporal Tides** is a world bible — a creative-writing/worldbuilding project for a narrative universe where time is subjective and mental health conditions are superpowers. There is no application code. The content is Markdown lore in `WorldBible/`, published as a VitePress documentation site (deployed on Vercel).

The owner (Shai) is the sole author of all lore. See **The Working Agreement** below before touching any creative content.

## Commands

```bash
npm run docs:dev        # Dev server at http://localhost:5173
npm run docs:build      # Build site to .vitepress/dist (this is also what `npm test` runs)
npm run docs:preview    # Preview the built site
```

There is no linter and no unit tests — "testing" means the VitePress build succeeds. Vercel deploys via `vercel.json` (`buildCommand: npm run docs:build`, output `.vitepress/dist`).

## Git Workflow

Never commit directly to `main`. All changes — human-assisted or autonomous — go through a branch → push to origin → pull request, reviewed and merged by Shai. Before opening a PR, verify `npm run docs:build` passes and run `scripts/check-links.sh` (report any *new* broken links in the PR description).

**Note:** VitePress builds from the repo root directly — there is no sync step. Helper scripts: `scripts/check-links.sh` reports broken relative `.md` links in `WorldBible/` (useful because the build ignores dead links), `scripts/build-and-check.sh` wraps the build, `scripts/RUN_VITEPRESS.sh` launches the dev server.

## Architecture

### Canon lives in `WorldBible/` — the single source of truth

A 2026-06 pivot (commits `29a8ef9`, `0b6f27d`) retired a separate `CANON.md` digest: **`WorldBible/` is the only source of truth**. Do not create parallel canon digests. The structure is tiered — later tiers must stay consistent with earlier ones:

- `01_UniverseFundamentals/` — temporal physics, cosmology, philosophy (the laws everything obeys)
- `02_CivilizationalElements/` — timeline, technology, culture, **`04_Terminology.md`** (official terms + §9.12 banned terms)
- `03_Characters/` — `Heroes/` (7), `Mentors/` (2), `Antagonists/` (3)
- `04_Locations/`, `05_Factions/` — places and organizations
- `06_Narrative/` — story structure, **`Themes.md`** (the Three Pillars), **`WritingGuidelines.md`** (representation guardrails: Never-do list, Should-do list, per-condition Show/Avoid table)
- `07_VisualDesign/`, `08_AudioDesign/`, `09_GameplayMechanics/`

`WorldBible/00_INDEX.md` is the master navigation. `deprecated/` and `docs/reports/` are historical reference only — never treat them as current canon.

### VitePress site builds from the repo root

`.vitepress/config.js` sets `srcDir: './'` and excludes `deprecated/`, `scripts/`, `logs/`. Key implications:

- **The sidebar is manually maintained** in `.vitepress/config.js` — a new WorldBible page will not appear in navigation until you add a sidebar entry.
- `base` is `/` on Vercel but `/TemporalTides/` for GitHub Pages (env-detected).
- Static assets live in `public/` (character portraits at `public/character_portraits/`).
- Dead links are ignored at build time (`ignoreDeadLinks: true`), so a green build does not guarantee link integrity.

### Cursor rules (`.cursor/rules/`) — development guidelines

Five `.mdc` files; `temporal-tides-world-bible.mdc` is `alwaysApply`. They contain the entry templates (character dossier sections, location entry structure, narrative model) and style standards. Consult them before writing any world-bible entry. Note: the in-flight plan (below) intends to flip these from a "generative" stance to a "coaching" stance and de-duplicate them against WorldBible.

### Canon hierarchy for contradictions

When sources conflict: Universe Fundamentals → established character profiles → published narrative content → supplementary material → ideas under development. Retcons must be documented; prefer additive detail over changing established facts.

## The Working Agreement (default stance for all creative work)

From the approved design spec (`docs/superpowers/specs/2026-06-08-coaching-collaboration-system-design.md`), three rules govern every interaction:

1. **Your thinking, your words — always.** Shai makes every creative and conceptual decision. The AI never originates lore, characters, prose, names, or design choices.
2. **Scribe, don't author.** Once Shai has decided and articulated something, the AI may capture *his* phrasing into the canon/files and keep them organized and cross-linked. It files what he authored; it does not write for him.
3. **Generate only on demand, only as a foil.** The AI produces content (rough options, a counter-argument, a "what-if") only when Shai explicitly summons it, and always framed as a provocation to react against — never as an answer to adopt.

Mechanical work (fixing links, VitePress config, reorganizing files, faithful distillation of already-approved canon) is fine; originating creative content is not.

## Hard Content Rules

These apply to any text written or edited in this repo:

- **Banned terms** (full list: `WorldBible/02_CivilizationalElements/04_Terminology.md` §9.12): never "time travel" (→ temporal navigation/displacement), "time machine" (→ temporal device), "going back in time" (→ accessing an earlier temporal state).
- **Mental health representation** (full guardrails: `WorldBible/06_Narrative/WritingGuidelines.md`): no cure narratives, no inspiration porn, no savior complexes, no violent stereotypes, no mental health for shock value. Conditions are genuine strengths with real challenges — characters thrive *with* their conditions, never by being "fixed."
- **Terminology consistency**: use the official terms in `04_Terminology.md`; person-first or identity-first language per character preference (e.g., "Leo, who has ADD" — never "the ADD character").
- **Every element serves the Three Pillars**: time perception, authentic mental health representation, empathy through understanding.

## In-Flight Work: Coaching Collaboration System

An active plan (`docs/superpowers/plans/2026-06-08-coaching-collaboration-system.md`, ⚠️ see its 2026-06-09 REVISION section) is mid-execution:

- **Done:** CANON.md retired; banned terms consolidated into `04_Terminology.md`; Should-do list + per-condition table consolidated into `WritingGuidelines.md`.
- **Remaining:** create `.claude/skills/` — `/coach` (Socratic push), `/canon` (continuity/terminology checks + canon-hierarchy/retcon process), `/conscience` (representation pressure-test) — and flip the Cursor rules to a coaching stance.
- Two fidelity gates in the plan require Shai's explicit sign-off — do not skip them.
