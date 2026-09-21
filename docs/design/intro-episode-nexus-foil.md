# FOIL — Nexus Intro Episode (beat sheet)

> **Status:** FOIL — not canon until the admiral redlines and accepts.
> **Working Agreement:** Admiral authors lore and creative decisions. Tide/Dial propose foils and scribe after acceptance.
> **Operating model:** This PR is the province of ideas — admiral comments; agents react in-thread; crest what the admiral guards.

## Intent

First deliverable for Temporal Tides: an **intro episode** that teaches the world by forcing cooperation across characters’ mental abilities (neuro-temporal lenses), not a lore dump.

## Packaging (locked)

1. **Near-term:** Design / prove puzzles in **Ink or Twine** with **ability modes** (active character filters what choices/tags are visible).
2. **Later:** Web playable on **Vercel** with **Three.js** — deferred until the admiral calls the playable build.

## MVP cast (locked)

| Character | Ability (published dossier) | Role in intro |
|-----------|----------------------------|---------------|
| Anne | Foresight | Hazard / timing overlay |
| Maya | Pattern Sense | Sequence / order restoration |
| Eli | Kinetic Rush | Timed window / rush span |
| Vibrion | Vibrational / energy manipulation | Energy gate / leadership frame |

Out of MVP: Dave, Iris, full combat systems, Lair campaign, multiplayer netcode. Co-op = ability co-op in single-player via character switch.

## Ability-mode rule

One active character at a time. Same Nexus chamber; visible choices/tags change on switch. Solo beats teach one lens. The coordination gate requires a valid sequence across modes — it must be impossible to clear in a single mode.

## Zone

**Time Nexus** — per `WorldBible/09_GameplayMechanics/PuzzleDesign.md` (tutorial / multi-type, low–medium).

## Beat sheet

| # | Beat | Puzzle type (bible) | Who | Player learns |
|---|------|---------------------|-----|---------------|
| 0 | Arrive / stakes whisper | Narrative | Vibrion frame | Time is subjective; Entropy shadow (light touch) |
| 1 | Hazard corridor | Perception / hazard | **Anne** | Foresight reveals trap options others don’t see |
| 2 | Echo out of order | Sequence | **Maya** | Pattern Sense restores correct temporal order |
| 3 | Closing window | Speed / coordination prep | **Eli** | Rush clears a timed span others miss |
| 4 | Dead panel | Energy | **Vibrion** | Charge/route energy to open a path |
| 5 | **Coordination gate** | Coordination (must fail solo) | All four | Anne marks timing → Maya locks sequence → Eli hits the window → Vibrion powers the seal |
| 6 | Resonance tease | Team / exit | All | Synergy works; Entropy isn’t solved — episode ends |

Puzzle type names map to existing Part IX docs (`PuzzleDesign.md`, `TeamMechanics.md`, `CoreLoop.md`, `CharacterGameplay.md`). Do not invent new ability names.

## Success criteria (Ink/Twine scratch)

- Player cannot clear beat 5 without switching through all four modes in a valid order
- Each solo beat (1–4) completable in that character’s mode only
- Hint after idle threshold (accessibility per CoreLoop)
- Target playtime ~15–25 minutes

## Hard content rules

- Follow `AGENTS.md` Working Agreement and `WorldBible/06_Narrative/WritingGuidelines.md`
- No cure narratives / inspiration porn
- Use approved terminology from `WorldBible/02_CivilizationalElements/04_Terminology.md` §9.12
- Cite published dossier abilities only

## After acceptance

1. Admiral redlines via PR comments; Tide/Dial respond in-thread
2. Ink/Twine scaffold (eng via Dial / CloudAgent)
3. Playtest → freeze puzzle logic
4. Three.js vertical slice only when admiral calls playable build
