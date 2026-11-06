# FOIL — Nexus Intro: Planted Details (Chekhov's Guns)

> **Status:** Decided 2026-10-13 and built in the playable. Candidates 1, 2 and 4 are in; the dark cluster's cause stays unsaid; the gate lines keep their clock numbers. The five rewritten lines are canon-checked (see [Canon check](#canon-check)).
> **Scope:** Puzzles, flags and dependencies are as locked in the [beat sheet](intro-episode-nexus-foil.md). Nothing here changes what clears what. It changes what the player has already seen when they get there.

## Intent

> **Chekhov's gun:** if a detail is introduced, it must eventually have a purpose. In a puzzle game, it is the moment the player realizes an odd detail was never set dressing.

In this episode that moment has two jobs:

1. **The gate becomes a realization, not a search.** The four-clock plan is the one place where a player can still fall back on trying orders. If the solo places plant what each clock needs, the player walks up to the gate already holding the answer without knowing it.
2. **The ending becomes a discovery, not a line.** The Entropy shadow is said at arrival and said again at the end. A planted object turns the second mention into something the player finds.

## Rules for a planted detail

1. **Planted by perception, not by a tap.** It is seen through a lens, or said in a look line the player already hears. No new tappable props, no inventory, no hint.
2. **It reads as set dressing.** It sits where the player is looking for something else, and nothing glows or pulses to say "important."
3. **It fires on its own.** The payoff names the detail, so a player who missed the plant still follows it, and a player who noticed gets the "of course."
4. **It is visibly true.** If a line gives numbers or an order, the room shows exactly that.
5. **It rhymes; it does not link.** A plant may repeat a shape, rhythm or color from somewhere else. Nothing draws a line between places (see [Not in the MVP](intro-episode-nexus-interaction-foil.md#not-in-the-mvp)).
6. **It is canon-safe.** It uses canon mysteries without solving them. Any new cause is an admiral decision.
7. **It is fired in this episode, or ledgered.** A plant that pays off in a later chapter goes in the ledger with its intended payoff.

## What the room planted before this pass

| Detail | Where it is | Fired? |
|---|---|---|
| "Something brushed the edge of the chamber… Gone now." (`arrive-2`) | Arrival, Vibrion | Yes: "That shadow's still at the edge" (`res-vibrion`). Words only, no object |
| Conduits from the panel to the gate's right jamb | Floor, all lenses | Yes: Vibrion's gate lines name the panel feed |
| Maya's corridor intervals: "2.1, 5.8, 0.9, 3.3 seconds. No repeating sequence yet." (`corr-maya`) | Corridor, Maya | No. Flavor only, and the plates do not actually spark on those intervals |
| Anne's corridor order: "Left plate sparks in four seconds, then far right, then center." (`corr-anne`) | Corridor, Anne | Used by her crossing. The plates flicker on noise, not in that order |
| Carvings in an unknown script along the gate arch | Gate | No |
| Crystal clusters around the rim | Room | No; built as set dressing |
| Twelve crystal ribs at the clock positions | Room wall | No |

The gate look lines number the clocks ("the first clock", "the second clock", "third clock"). That tells the player the order instead of letting them see it. Candidates 1 and 2 give that order a reason the player has already witnessed. Decision 3: the numbers stay, so the gate stays readable for a player who missed a plant.

## Candidates

### 1. The corridor keeps the first clock's time

| | |
|---|---|
| **Plant** | The corridor plates spark on a real schedule: 2.1, 5.8, 0.9, 3.3 seconds, in Anne's order (left, far right, center). Maya's corridor line reads the intervals and calls them a dead end. She can't act there, so it sounds like flavor. The first clock on the lintel ticks on the same schedule with the same spark sound: heard from the corridor, seen from the room. |
| **Fire** | At the gate, Maya recognizes the numbers. The corridor was never random; it was running on the first clock. Whoever read the corridor can read that clock. |
| **Lines** | `gate-maya`: "The first clock keeps the corridor's intervals: 2.1, 5.8, 0.9, 3.3. I can lock the second to it, but I cannot predict its next tick." (25 words)<br>`gate-anne`: "Okay, so — the first clock runs on the corridor's rhythm. Next tick in about three seconds, eighty percent sure. I can mark it." (23 words) |
| **Changes** | A corridor spark schedule (props), clock 1's tempo matched to it (clocks), two gate lines revised. No new flags. |
| **Built** | One schedule (`src/sparks.js`, gaps and plate order in `layout.js`) drives the plates, the first clock and the lenses. Each spark flashes its plate white-gold, plays the spark sound (loudest at the corridor, then the gate, then the room) and jumps the first clock's minute hand. Anne's lens shows the next sparks ahead of time; Maya's rings flash on each spark. A test checks that `corr-maya`, `corr-anne` and `gate-maya` say exactly what the schedule does. |
| **Canon** | Maya reads pattern convergences across timelines and is soothed by portal cycle rhythms; Anne's Foresight works exceptionally well in the Nexus (`TimeNexus.md` §2). Maya: Requires Observation. Beat 5: Anne marks timing → Maya locks sequence. |
| **Also settles** | Open decision 2 in the interaction model (corridor payoff): the corridor leaves something used elsewhere, and it is knowledge, not an object. |
| **Risk** | Low. The plates must spark exactly as both lines say (rule 4). |

### 2. The lever window is on the third clock

| | |
|---|---|
| **Plant** | The closing window slot on the lever console is the thing Eli beats once Maya has marked the order. The third clock's face has the same slot, in the same accent, cut across the dial. From the room it reads as a clock detail. |
| **Fire** | At the gate, Eli recognizes the slot, and his line echoes what he said at the levers before Maya marked them ("I'd just be fast and wrong"). The player remembers what fixed it there. |
| **Line** | `gate-eli`: "Hey — that's the lever window! Same slot, third clock. But it won't sit still. I'd just be fast and wrong again." (21 words) |
| **Changes** | A slot shape on clock 3's face (clocks). One gate line revised. |
| **Built** | The slot sits below the dial's pivot like a date window, in the lever window's accent and with its blink, so it never reads as a third hand. It slides and tilts in its cut until the second clock is locked, then holds; it opens fully at the seal. |
| **Canon** | Beat 3: Eli completes Maya's identified sequence faster (Kinetic Rush). Beat 5: Maya locks sequence → Eli hits the window. |
| **Risk** | Low. It is a visual rhyme, not a link (rule 5). |

### 3. Power goes in last

| | |
|---|---|
| **Plant** | Already in the room: the conduits from the panel stay dark until Eli frees the jammed lever, then carry power to the gate. |
| **Fire** | Already in Vibrion's gate lines. |
| **Option** | Run the conduits up to the fourth clock instead of the jamb, so "power last" is readable on the lintel. |
| **Recommendation** | Leave it as it is. Rerouting the conduits to a clock turns a rhyme into a drawn dependency link, which the interaction model rules out. With 1 and 2 in, the gate already explains itself. |

### 4. The crystal that doesn't sing

| | |
|---|---|
| **Plant** | Canon's **Singing Crystals**: every so often the rim clusters chime and a faint shimmer travels around the room, with no trigger. It's ambience. One cluster near the rim, in frame at arrival but never centered, is slightly darker. Its growth is smoother and less faceted, and it never joins the chime. Each lens sees it as slightly wrong, without a word: Vibrion's floor grid bends around it, Maya's pattern marks skip it, and Eli's streaks slow as they pass it. Anne's lens shows nothing branching from it. |
| **Fire** | At the seal, the chime goes around the whole room in phase for the first time and skips that one cluster. The camera drifts to it. Maya sees it; Vibrion names what it is to them, not what it is in the world. |
| **Lines** | `res-maya`: "The four clocks share one sequence now. I can see it running through every crystal in the chamber. Except one, by the rim." (23 words)<br>`res-vibrion`: "Good work, all of you. That crystal isn't ours. It's what brushed the edge when we came in. We're not finished — but we're in phase." (25 words) |
| **Changes** | One crystal cluster variant (room), a chime shimmer and sound (room, audio), small lens-overlay exceptions (lenses), an ending camera move, and two ending lines revised. |
| **Canon** | Singing Crystals: harmonic resonance from the walls, no apparent trigger, recordings always fail (`TimeNexus.md` §7). Chronos Catalyst appearance: dark crystalline structure, organic-seeming growth patterns (`DrEntropy.md`). His first Nexus attack used an early entropy device, and he can predict and exploit Nexus defense weaknesses (`DrEntropy.md`). Chapter 11, "Attack": Dr. Entropy targets the Nexus (`ChapterBreakdown.md`). Beat 0: Entropy shadow, light touch. Beat 6: Entropy isn't solved. |
| **Built** | The outlier is the rim cluster left of the gate: dark, glossy, rounded growths instead of cut facets. The ragged chime rings at arrival (`arrive-2`) and then every 13–21 s; each cluster flashes in turn and the outlier never does. Lens tells: Vibrion's floor grid bends around it, Maya's crystal rings and Anne's branch lines skip it, Eli's streaks slow near it. At `res-maya` the chime runs once in phase, skipping it; 1.8 s later the camera moves to it and holds there through the ending. After the seal the other clusters breathe in unison. |
| **Series promise** | Chapter 11 can open on that cluster. |
| **Risk** | The cause is a lore decision; decided: unsaid in the intro. The lines never name Dr. Entropy or the Catalyst. The chime must also be visible (the shimmer), not only audible, so the fire still lands with sound off. |

### 5. The script on the arch

| | |
|---|---|
| **Plant** | The carvings in an unknown script on the gate arch, already modeled. Nobody comments. |
| **Fire** | At the seal, the carvings light in four groups, one group per clock. Nothing is said. |
| **Series promise** | Canon's **Locked Chambers**: seven sealed doors with untranslated ancient script and unknown unlocking conditions (`TimeNexus.md` §7). If the gate's script is the same script, the intro hints at how the doors open. |
| **Risk** | High for the series: it points at the answer to an open canon mystery. Hold for the admiral; do not build for the MVP. |

### 6. The heartbeat

| | |
|---|---|
| **Plant** | Canon's **Heartbeat**: a deep pulse felt throughout the Nexus that matches the frequency of time's flow, which some claim is speeding up (`TimeNexus.md` §7). It sits under the room audio, with a matching slow swell in the floor inlay so it is not sound-only. When something brushes the edge at arrival, the pulse skips once. |
| **Fire** | Not in this episode. |
| **Series promise** | Whether the pulse is speeding up, and why. |
| **Risk** | An unfired plant in the MVP. Hold, or fold the arrival skip into candidate 4 as one more sign that something is out of phase. |

## How 1, 2 and 4 play together

1. **Arrival.** Vibrion feels something brush the edge. The screen edge darkens and the crystals around the rim chime. A player might register that one cluster stayed quiet; most won't.
2. **Corridor.** Maya rattles off intervals and gives up, and the plates spark exactly on them, each spark answered by a tick from the first clock above the gate. Anne reads the order and crosses.
3. **Levers.** Maya marks the order and can't throw five levers in time; Eli can, once the marks are there. The window slot opens fully and holds.
4. **Panel.** Vibrion brings the panel live; Eli shoves the jammed lever.
5. **Gate.** Maya: "The first clock keeps the corridor's intervals." Eli: "That's the lever window!" The player already knows who reads the corridor and what Eli needed before he could beat the window. The plan comes from memory, not from trying orders. Wrong plans still break and still say why.
6. **Seal.** The chime runs around the room in phase, skips the dark cluster, and the camera finds it. "That crystal isn't ours."

Playtime stays within the beat sheet's 10–15 minutes. The plants add attention, not steps.

## Canon check

The five rewritten lines went through the same two-judge check as the rest of the set ([lines and canon check](intro-episode-nexus-lines-foil.md#canon-check)).

| Test | Result |
|---|---|
| Blind attribution (speaker named from the line alone) | 38/38 for both judges; each of the five new lines went to the right speaker (confidence 0.74–1.0) |
| Canon compliance | 0 violations. Both risks this run are on unchanged Vibrion lines (`pan-vibrion`, `gate-vibrion-dead`); none on the new lines |

One new gap came out of it: canon does not say whether Pattern Sense gives *when* (phase) as well as *what* (sequence). `gate-maya` assumes it gives the sequence only, which is why she needs Anne's tick (gap 12 in the lines doc).

## Ledger

Every plant in the episode with candidates 1, 2 and 4 in:

| Plant | Seen in | Fired at | Status |
|---|---|---|---|
| Brush at the edge (`arrive-2`) | Arrival | Seal: the dark cluster (`res-vibrion`) | Fired in episode |
| Dark cluster that never chimes | Room, all lenses | Seal: the in-phase chime skips it | Fired in episode; Chapter 11 promise |
| Corridor intervals (`corr-maya`) and spark order (`corr-anne`) | Corridor | Gate: `gate-maya`, `gate-anne` | Fired in episode |
| First clock ticking with the corridor | Room (seen), corridor (heard) | Gate | Fired in episode |
| Lever window slot | Levers | Gate: slot on the third clock (`gate-eli`) | Fired in episode |
| Panel conduits to the gate | Floor | Gate: Vibrion's feed lines | Fired in episode |
| Script on the arch | Gate | — | Set dressing unless candidate 5 is picked |
| Twelve ribs at the clock positions | Room wall | — | Set dressing (the Nexus's portal geometry) |

## Considered and left out

- **Tappable curiosities** (extra props that say a line when tapped). They bring back tapping around to find things.
- **Inventory** (pick something up at one place and use it at the gate). That's a new mechanic, and it changes the dependencies.
- **Ghost images of the opened gate in Anne's lens.** A hint system in disguise.
- **A dim six o'clock rib for the Frontier portal and Vibrion's memorial visits.** True to canon, but it doesn't fire in this episode and it is Vibrion's story, not the team's.

## Decisions (admiral, 2026-10-13)

1. **Which candidates?** 1, 2 and 4, built. 3 stays as it is; 5 and 6 are held.
2. **The dark cluster's cause:** unsaid in the intro. No line names Dr. Entropy, the Catalyst or a device.
3. **Clock numbers in the gate lines:** kept ("first / second / third clock").
4. **Series promises:** candidate 4's Chapter 11 hook comes with candidate 4 (it also fires in this episode). Nothing is planted that only fires later; 5 and 6 stay held.
