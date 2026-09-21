// Nexus intro episode — ability-mode scratch (foil: docs/design/intro-episode-nexus-foil.md)
// Prose is placeholder scratch aligned to the locked beat sheet; not WorldBible canon.

VAR active = "vibrion"

// Beat progress
VAR beat1_clear = false
VAR beat2_clear = false
VAR beat3_clear = false
VAR beat4_clear = false
VAR beat5_step = 0
VAR beat5_clear = false
VAR idle_hint_shown = false

-> beat_0

// —— Beat 0: Arrive / stakes whisper (Vibrion frame) ——
=== beat_0 ===
# beat:0 # mode:vibrion
The Time Nexus holds its breath around you. Time feels subjective here — not wrong, just unwilling to agree with itself.

A shadow of Entropy passes the chamber edge. Light touch only; it does not settle.

Vibrion keeps the frame: "One lens at a time. Same room — different choices."

+ [Step into the Nexus chamber] -> beat_0_enter

=== beat_0_enter ===
You are in the chamber. The corridor ahead waits; the coordination gate beyond that is still dark.

+ [Switch active character before moving on] -> mode_switch(-> beat_1)
+ [Continue as Vibrion] -> beat_1

// —— Beat 1: Hazard corridor (Anne / Foresight) ——
=== beat_1 ===
# beat:1
The hazard corridor flickers. Trap timing is buried in noise unless something overlays the future hazard.

{ beat1_clear:
    -> beat_1_done
}

{ active == "anne":
    + [Use Foresight — read the trap timing overlay] -> beat_1_anne_clear
}
{ active != "anne":
    + [Press forward without the hazard overlay] -> beat_1_wrong_mode
}

+ [Switch active character] -> mode_switch(-> beat_1)
+ {idle_hint_shown == false} [Pause — accessibility hint stub (idle)] -> beat_1_hint

=== beat_1_anne_clear ===
~ beat1_clear = true
Foresight lays the trap options bare. You choose the clean line through.

-> beat_1_done

=== beat_1_wrong_mode ===
Without Foresight, the corridor punishes guesswork. Back out and try another lens.

-> beat_1

=== beat_1_hint ===
~ idle_hint_shown = true
(Hint stub) Try Anne — Foresight reveals hazard options others do not see.

-> beat_1

=== beat_1_done ===
The corridor is behind you.

-> mode_switch(-> beat_2)

// —— Beat 2: Echo out of order (Maya / Pattern Sense) ——
=== beat_2 ===
# beat:2
Echo levers answer in the wrong order. Relative strain and markings hide the true sequence unless someone marks what others cannot see.

{ beat2_clear:
    -> beat_2_done
}

{ active == "maya":
    + [Use Pattern Sense — mark the lever strain sequence] -> beat_2_maya_clear
}
{ active != "maya":
    + [Pull levers by guess] -> beat_2_wrong_mode
}

+ [Switch active character] -> mode_switch(-> beat_2)
+ {idle_hint_shown == false} [Pause — hint stub] -> beat_2_hint

=== beat_2_maya_clear ===
~ beat2_clear = true
Pattern Sense marks the sequence. The echo falls into place — marked, not merely "restored."

-> beat_2_done

=== beat_2_wrong_mode ===
The levers fight you. Maya's lens is needed to mark the pattern.

-> beat_2

=== beat_2_hint ===
~ idle_hint_shown = true
(Hint stub) Switch to Maya — Pattern Sense marks patterns others cannot see.

-> beat_2

=== beat_2_done ===
The echo chamber settles.

-> mode_switch(-> beat_3)

// —— Beat 3: Closing window (Eli / Kinetic Rush) ——
=== beat_3 ===
# beat:3
Maya's marked sequence still needs speed: a closing window will not wait for careful hands.

{ beat3_clear:
    -> beat_3_done
}

{ active == "eli":
    + [Use Kinetic Rush — bend your timeline to complete Maya's sequence in the window] -> beat_3_eli_clear
}
{ active != "eli":
    + [Try to finish the sequence at ordinary pace] -> beat_3_wrong_mode
}

+ [Switch active character] -> mode_switch(-> beat_3)
+ {idle_hint_shown == false} [Pause — hint stub] -> beat_3_hint

=== beat_3_eli_clear ===
~ beat3_clear = true
Kinetic Rush bends your temporal timeline; Maya's identified sequence completes inside the window.

-> beat_3_done

=== beat_3_wrong_mode ===
The window slams shut. Eli's lens is required to move fast enough.

-> beat_3

=== beat_3_hint ===
~ idle_hint_shown = true
(Hint stub) Switch to Eli — Kinetic Rush completes Maya's sequence faster by bending his timeline.

-> beat_3

=== beat_3_done ===
The window is cleared.

-> mode_switch(-> beat_4)

// —— Beat 4: Dead panel (Vibrion / Vibrational Manipulation) ——
=== beat_4 ===
# beat:4
A dead panel — tied to the world's electrical components. One lever is stuck; Maya cannot read this pattern.

{ beat4_clear:
    -> beat_4_done
}

{ active == "vibrion":
    + [Use Vibrational Manipulation — couple to the panel and partner the stuck lever decision] -> beat_4_vibrion_clear
}
{ active == "eli" && beat4_clear == false:
    + [Help shoulder the stuck lever while Vibrion works the panel] -> beat_4_eli_partner_stub
}
{ active != "vibrion" && active != "eli":
    + [Try to energize the panel alone] -> beat_4_wrong_mode
}
{ active == "eli":
    + [Switch to Vibrion for the energy gate] -> mode_switch(-> beat_4)
}

+ [Switch active character] -> mode_switch(-> beat_4)

=== beat_4_vibrion_clear ===
~ beat4_clear = true
Vibrational Manipulation meets the panel's hum. Where Eli's rush is needed at the lever, you call it — this beat clears on Vibrion's lens.

-> beat_4_done

=== beat_4_eli_partner_stub ===
Eli can assist, but the energy gate does not open without Vibrion active on the panel.

-> beat_4

=== beat_4_wrong_mode ===
The panel stays dead. Vibrion must be active for this energy beat.

-> beat_4

=== beat_4_done ===
The panel lives. Beyond it: the coordination gate — four clock faces disagree, each timeline keeping its own tempo.

-> mode_switch(-> beat_5)

// —— Beat 5: Coordination gate (all four; must fail solo) ——
=== beat_5 ===
# beat:5
Four clock faces hang over the gate, out of sync. Friction from different timelines — sync the clocks; do not invent drama.

The seal listens only to a cross-lens sequence: Anne ticks timing → Maya locks against that tick → Eli hits the sync window → Vibrion couples power from the world grid.

{ beat5_clear:
    -> beat_6
}

{ beat5_step == 0 && active == "anne":
    + [Foresight — mark the timing tick for clock sync] -> beat_5_anne
}
{ beat5_step == 0 && active != "anne":
    + [Try to mark timing without Foresight] -> beat_5_wrong_order
}

{ beat5_step == 1 && active == "maya":
    + [Pattern Sense — lock the sequence against the marked tick] -> beat_5_maya
}
{ beat5_step == 1 && active != "maya":
    + [Try to lock sequence out of order] -> beat_5_wrong_order
}

{ beat5_step == 2 && active == "eli":
    + [Kinetic Rush — hit the sync window] -> beat_5_eli
}
{ beat5_step == 2 && active != "eli":
    + [Try to hit the window without Rush] -> beat_5_wrong_order
}

{ beat5_step == 3 && active == "vibrion":
    + [Vibrational Manipulation — power the seal] -> beat_5_vibrion
}
{ beat5_step == 3 && active != "vibrion":
    + [Try to power the seal without coupling to the world grid] -> beat_5_wrong_order
}

// Solo-mode failure: attempting the full gate without crossing all four lenses
{ beat5_step < 3:
    + [Force the seal closed from one lens alone] -> beat_5_solo_fail
}

+ [Switch active character] -> mode_switch(-> beat_5)
+ {idle_hint_shown == false} [Pause — hint stub] -> beat_5_hint

=== beat_5_anne ===
~ beat5_step = 1
Anne's Foresight marks the first timing tick. Three clocks still drift — switch to Maya and lock the sequence to that tick.

-> mode_switch(-> beat_5)

=== beat_5_maya ===
~ beat5_step = 2
Maya's marks pin the lever sequence to Anne's tick. The sync window opens — Eli must hit it before the clocks slip again.

-> mode_switch(-> beat_5)

=== beat_5_eli ===
~ beat5_step = 3
Kinetic Rush closes the sync window on Maya's locked beat. Vibrion must couple to the world grid and power the seal.

-> mode_switch(-> beat_5)

=== beat_5_vibrion ===
~ beat5_step = 4
~ beat5_clear = true
Vibrational Manipulation meets the seal. The four clocks align — timeline friction eases into sync, not surrender.

-> beat_6

=== beat_5_wrong_order ===
The clocks stutter: this step needs a different lens and order. Sync in sequence — Anne (tick) → Maya (lock) → Eli (window) → Vibrion (seal).

-> beat_5

=== beat_5_solo_fail ===
One lens cannot bully four disagreeing clocks into agreement. Switch through every mode in order until each timeline has spoken.

-> beat_5

=== beat_5_hint ===
~ idle_hint_shown = true
(Hint stub) Desynced clocks, not a brawl — sync in order: Anne (timing tick) → Maya (sequence lock) → Eli (sync window) → Vibrion (seal power). Switch active character between steps.

-> beat_5

// —— Beat 6: Resonance tease / exit ——
=== beat_6 ===
# beat:6
Maya helps you see the pattern forming in the chamber — with Vibrion's leadership holding the frame.

Entropy is not solved. The episode ends on resonance, not victory over the shadow.

-> END

// —— Mode switch (one active character at a time) ——
=== mode_switch(-> return_knot) ===
# ui:mode_switch
Active character: {active}

+ {active != "anne"} [Anne — Foresight]
    ~ active = "anne"
    -> return_knot
+ {active != "maya"} [Maya — Pattern Sense]
    ~ active = "maya"
    -> return_knot
+ {active != "eli"} [Eli — Kinetic Rush]
    ~ active = "eli"
    -> return_knot
+ {active != "vibrion"} [Vibrion — Vibrational Manipulation]
    ~ active = "vibrion"
    -> return_knot
+ [Keep current: {active}] -> return_knot
