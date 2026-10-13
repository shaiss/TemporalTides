# FOIL — Nexus Intro Interaction Model

> **Status:** FOIL — for admiral redline. Not canon until accepted.
> **Pairs with:** [`intro-episode-nexus-foil.md`](./intro-episode-nexus-foil.md) (beat sheet, design locked), [`intro-episode-nexus-storyboards-foil.md`](./intro-episode-nexus-storyboards-foil.md), [`intro-episode-nexus-lines-foil.md`](./intro-episode-nexus-lines-foil.md) (character lines).
> **Scope:** How the player moves, looks and acts in the Nexus intro playable (`scratch/nexus-intro`, `/play/`). Puzzles, cast, abilities and step dependencies are as locked in the beat sheet.

## Intent

The intro is an MVP that showcases the idea, the visuals and the characters. Play is about **what each character sees**. The player works things out by looking at the room through each character's eyes, not by picking options from a list.

## The room

- One open chamber with four stations: **Hazard corridor**, **Echo levers**, **Dead panel**, **Coordination gate**.
- The player picks any station, goes in, and can back out at any time to try another.
- Stuck on one station? Back out and try another. That is the MVP's help system.
- Nothing on screen names beats, steps or puzzles.

## Everything the player has to learn

| Input | Meaning |
|---|---|
| Tap a portrait | See and hear the room as that character. Free, instant, any time |
| Tap a station / **Back** | Go in / leave |
| Tap what is lit | Act. Only a character who can act there sees something lit |
| Drag portraits into slots, then **Sync** | Coordination gate only: plan who goes in what order |

That is the whole control set. Every action is a single tap.

## Not in the MVP

- Action menus or choice lists
- Per-station gestures (timing taps, holds, traced paths)
- A hint system. Later, for the full game: perception hints for a part the player has not figured out
- Ability meters, cooldowns or switch delays
- Visible dependency links between stations or clocks
- Beat numbers, step counters or designer text on screen
- More than one character speaking at a time

## Looking

When the active character looks at a station:

- They say **one line about what they see**: their perception and their limits. They never say who should do it.
- If they can act, their lens shows something **lit** to tap.
- If they cannot, nothing is lit. The line is the information.
- Switching portraits inside a station looks again as the new character.

## Stations

| Station | Who acts | What their lens lights | What happens | What it leaves behind |
|---|---|---|---|---|
| Hazard corridor | Anne | Ghost firings a beat ahead and the safe line between them | Tap the line: the corridor is crossed | Corridor clear |
| Echo levers | Maya, then Eli | **Maya:** strain marks giving the lever order. **Eli,** once marked: the marked order with the closing window slowed | Maya marks the order; the window closes too fast for careful hands; Eli completes it | Levers clear |
| Dead panel | Vibrion, then Eli | **Vibrion:** grid current under the floor and the break in the panel. **Eli,** once live: the jammed lever | Vibrion couples the panel; the lever is jammed; Eli shoves it free | Panel live; the gate's seal can now draw power |
| Coordination gate | All four, by plan | Each clock's state as that character perceives it | Plan, Sync, playback | Episode ending |

## Dependencies the player discovers by looking

No links or locks are drawn on screen. Characters say what is missing.

- **Inside Echo levers:** Eli sees nothing he can act on until Maya's marks exist. After marking, Maya says she cannot move through five levers before the window closes.
- **Inside Dead panel:** Eli's shove only matters once Vibrion has coupled the panel. Vibrion then says the jammed lever needs one fast, hard shove.
- **Coordination gate needs the Dead panel:** while the panel is dead, Vibrion at the gate says the seal needs more than he is carrying, and its grid feed runs through the dead panel.
- **Coordination gate order:** each character's look at the gate says what they need. Anne can mark the first clock's tick. Maya needs a steady reference beat. Eli needs a beat that holds still. Vibrion needs the clocks in phase.

## Coordination gate

1. Enter the gate and look through each character (one line each).
2. Drag portraits into four ordered slots. A portrait can go in more than one slot.
3. Press **Sync**. The plan plays out step by step on the clocks.
4. At the first step that cannot happen, playback stops and that character says why. Later slots stay unplayed.
5. One character in every slot: the clocks grind against each other, and Vibrion says it takes all four.
6. Anne → Maya → Eli → Vibrion with a live panel: the seal powers, then the resonance ending plays.
7. **Back** leaves the gate at any time. The plan stays in the slots.

## On screen

| Element | When |
|---|---|
| Portrait strip (four characters, active one lit) | Always |
| One spoken line, as a subtitle at the speaker's portrait | On look, on act, on a broken plan |
| **Back** | Inside a station |
| Four slots and **Sync** | Coordination gate only |
| Sound toggle | Always |

## Ink
- Ink stays the rules engine. Station gates and flags are as locked: corridor, levers, window, panel, and the four ordered gate steps.
- There is no choice list. The UI sets three things — the active character (`lens`), where the player is (`at`), and the gate plan (`plan1`…`plan4`) — and runs a knot: `arrive`, `look`, `act`, `gate_begin`, `gate_step` (once per slot), `resonance`.
- Two Ink functions decide what is lit: `can_enter(place)` and `can_act()`. The UI never decides who can do what.
- Lines are Ink text tagged `#say:<character>` and `#id:<line id>`, plus `#fx:` cues (`done` ends a place, `fail`, `clear`, `entropy`). The UI shows them as subtitles.
- `npm test` drives the same flow headlessly:
  - each station clears only with its character(s), in its order
  - of all 256 gate plans, only Anne → Maya → Eli → Vibrion seals, and only with the panel finished
  - stations can be cleared in any order; backing out keeps progress; the gate can be failed and come back to
  - look lines are always spoken by the active character

## Ability-mode rule, as this model reads it

The beat sheet's rule reads: *"One active character at a time. Same Nexus chamber; visible choices/tags change on switch."* For a playable with no choice list, this model reads it as:

> One active character at a time. Same Nexus chamber; **what you see, hear and can act on** changes on switch.

The intent (one lens at a time, same room, different truth) is unchanged; only the wording moves from menu terms to world terms.

## Open decisions
The open-room playable (`scratch/nexus-intro`) takes a provisional answer to each, so the decisions can be judged in play:

1. **Gate availability:** open from the start, with Vibrion's line covering the dead panel (recommended), or only after the three solo stations are clear? *Playable: open from the start.*
2. **Corridor payoff:** is crossing the corridor self-contained, or should it lead to or leave something used elsewhere in the room? *Playable: self-contained; Anne's safe line stays drawn on the floor.*
3. **Team staging:** do the three inactive characters appear in the chamber? The lines assume the team is together, as in storyboard Panel 6. *Playable: not staged; the team is the portrait strip.*
