// Nexus intro — open room (FOIL: docs/design/intro-episode-nexus-interaction-foil.md,
// lines: docs/design/intro-episode-nexus-lines-foil.md). Placeholder scratch prose, not WorldBible canon.
//
// The UI never shows a choice list. It sets `lens` and `at`, then runs knots by path:
//   arrive          — opening lines
//   look            — the active character's one line about what they see where they are
//   act             — the active character acts on the lit thing (only offered when can_act())
//   gate_begin      — start playing the four-slot plan (plan1..plan4)
//   gate_step       — play the next slot; sets gate_result to ok | break | sealed
//   resonance       — closing lines
// Every spoken line carries #say:<character> and #id:<line id>; #fx tags drive presentation only.

VAR lens = "vibrion"
VAR at = "room"

VAR corridor_clear = false
VAR levers_marked = false
VAR levers_clear = false
VAR panel_live = false
VAR panel_clear = false
VAR gate_clear = false

VAR plan1 = ""
VAR plan2 = ""
VAR plan3 = ""
VAR plan4 = ""
VAR gate_i = 0
VAR gate_result = ""
VAR g_tick = false
VAR g_lock = false
VAR g_window = false

-> DONE

// ——————————————————————————————— Rules the UI asks about ———————————————————————————————

=== function can_enter(place) ===
{ place:
- "corridor": ~ return not corridor_clear
- "levers": ~ return not levers_clear
- "panel": ~ return not panel_clear
- "gate": ~ return not gate_clear
}
~ return false

=== function can_act() ===
{ at:
- "corridor": ~ return lens == "anne" && not corridor_clear
- "levers":
    { lens == "maya":
        ~ return not levers_marked
    }
    ~ return lens == "eli" && levers_marked && not levers_clear
- "panel":
    { lens == "vibrion":
        ~ return not panel_live
    }
    ~ return lens == "eli" && panel_live && not panel_clear
}
~ return false

=== function plan_at(i) ===
{ i:
- 1: ~ return plan1
- 2: ~ return plan2
- 3: ~ return plan3
- 4: ~ return plan4
}
~ return ""

// ——————————————————————————————— Arrival ———————————————————————————————

=== arrive ===
Same room, four ways of seeing it. Let's find out what each of you picks up before anyone commits. #say:vibrion #id:arrive-1
Something brushed the edge of the chamber. Faint signature, out of phase with everything else. Gone now. #say:vibrion #id:arrive-2 #fx:entropy #fx:chime
-> DONE

// ——————————————————————————————— Look ———————————————————————————————

=== look ===
{ at:
- "corridor": -> look_corridor
- "levers": -> look_levers
- "panel": -> look_panel
- "gate": -> look_gate
}
-> DONE

= look_corridor
{ lens:
- "anne": Okay, so. Left plate sparks in four seconds, then far right, then center. If we move on the gaps, we're through. #say:anne #id:corr-anne #fx:foresee
- "maya": Intervals: 2.1, 5.8, 0.9, 3.3 seconds. No repeating sequence yet. I would need much longer to observe one. #say:maya #id:corr-maya
- "eli": Wait, wait — where does it spark next? No idea. Three seconds to cross, but not blind. #say:eli #id:corr-eli
- "vibrion": That's not current, it's temporal discharge. Nothing I can couple to. I catch a flash of the next spark, maybe — not enough to cross on. #say:vibrion #id:corr-vibrion
}
-> DONE

= look_levers
{ lens:
- "maya":
    { levers_marked:
        The sequence is correct. The window closes in under four seconds. I cannot move through five levers that fast. #say:maya #id:lev-maya-blocked
    - else:
        Pulling one lever sounds a different one. The strain marks give the order: third, first, fifth, second, fourth. #say:maya #id:lev-maya
    }
- "anne": Five levers is a hundred and twenty possible orders. I can see what follows each pull, not which order holds. Too many branches. #say:anne #id:lev-anne
- "eli":
    { levers_marked:
        Got it — the marks are right there. Window's closing, but I'm faster than it. Going! #say:eli #id:lev-eli
    - else:
        These echo! Pull one, another one answers. So cool. Which order, though? I'd just be fast and wrong. #say:eli #id:lev-eli-early
    }
- "vibrion": Purely mechanical. I could shake them loose, but that won't tell me the order. This isn't a frequency problem. #say:vibrion #id:lev-vibrion
}
-> DONE

= look_panel
{ lens:
- "vibrion":
    { panel_live:
        It's live. That lever is jammed — mechanical, not electrical. It needs one fast, hard shove while I hold the current. #say:vibrion #id:pan-vibrion-blocked
    - else:
        This panel's out of phase with the grid under the floor. I can couple it from here. #say:vibrion #id:pan-vibrion
    }
- "maya":
    { panel_live:
        It is running now, in a steady cycle. The lever is jammed against it. That needs force, not observation. #say:maya #id:pan-maya-live
    - else:
        Nothing here is running. There is no sequence to observe. #say:maya #id:pan-maya
    }
- "anne": Okay, so — nothing here is about to happen. No hazard, no countdown. What if it's not a trap at all, just dead? #say:anne #id:pan-anne
- "eli":
    { panel_live:
        It's humming now! Okay, lever — one hard shove, right now. #say:eli #id:pan-eli
    - else:
        Dead panel, stuck lever. I could shove that all day and nothing moves — nothing's even humming. Boring! #say:eli #id:pan-eli-early
    }
}
-> DONE

= look_gate
{ lens:
- "anne": Okay, so — the first clock runs on the corridor's rhythm. Next tick in about three seconds, eighty percent sure. I can mark it. #say:anne #id:gate-anne #fx:foresee
- "maya": The first clock keeps the corridor's intervals: 2.1, 5.8, 0.9, 3.3. I can lock the second to it, but I cannot predict its next tick. #say:maya #id:gate-maya
- "eli": Hey — that's the lever window! Same slot, third clock. But it won't sit still. I'd just be fast and wrong again. #say:eli #id:gate-eli
- "vibrion":
    {
    - panel_clear:
        If I couple now, I'm powering four clocks out of phase. Get them agreeing first, then the seal is mine. #say:vibrion #id:gate-vibrion
    - panel_live:
        The panel's live, but that jammed lever is still cutting the feed. The seal gets nothing until it moves. #say:vibrion #id:gate-vibrion-jammed
    - else:
        The seal needs more than I'm carrying. Its grid feed runs through that dead panel by the levers. #say:vibrion #id:gate-vibrion-dead
    }
}
-> DONE

// ——————————————————————————————— Act ———————————————————————————————

=== act ===
{ not can_act():
    -> DONE
}
{ at:
- "corridor":
    ~ corridor_clear = true
    Through. I saw three ways that could go wrong. None of them happened. #say:anne #id:corr-anne-done #fx:clear #fx:done
- "levers":
    { lens == "maya":
        ~ levers_marked = true
        The sequence is correct. The window closes in under four seconds. I cannot move through five levers that fast. #say:maya #id:lev-maya-blocked #fx:clear
    - else:
        ~ levers_clear = true
        Done! Five for five. Did anyone see that? #say:eli #id:lev-eli-done #fx:clear #fx:done
    }
- "panel":
    { lens == "vibrion":
        ~ panel_live = true
        It's live. That lever is jammed — mechanical, not electrical. It needs one fast, hard shove while I hold the current. #say:vibrion #id:pan-vibrion-blocked #fx:clear
    - else:
        ~ panel_clear = true
        Free! That felt great. #say:eli #id:pan-eli-done #fx:clear #fx:done
    }
}
-> DONE

// ——————————————————————————————— Coordination gate ———————————————————————————————
// A plan plays slot by slot. Each character either does their part or says why they can't,
// and the plan stops there. Order is never named: it falls out of what each part needs.

=== gate_begin ===
~ gate_i = 0
~ gate_result = ""
~ g_tick = false
~ g_lock = false
~ g_window = false
{ plan1 != "" && plan1 == plan2 && plan2 == plan3 && plan3 == plan4:
    ~ gate_result = "break"
    One of us can't bring four timelines into phase. It takes all four. #say:vibrion #id:gate-solo #fx:fail #fx:solo
}
-> DONE

=== gate_step ===
~ gate_i = gate_i + 1
~ temp who = plan_at(gate_i)
{ who:
- "anne": -> anne_part
- "maya": -> maya_part
- "eli": -> eli_part
- "vibrion": -> vibrion_part
}
~ gate_result = "break"
-> DONE

= anne_part
{ g_tick:
    ~ gate_result = "break"
    I already marked that tick. What if we're waiting on the wrong clock? Marking it twice won't change what comes next. #say:anne #id:gate-break-anne #fx:fail
    -> DONE
}
~ g_tick = true
~ gate_result = "ok"
-> DONE

= maya_part
{
- not g_tick:
    ~ gate_result = "break"
    Lock to what? There is no reference beat yet. #say:maya #id:gate-break-maya #fx:fail
- g_lock:
    ~ gate_result = "break"
    The sequence is already locked. Locking it again changes nothing. Something else has to happen next. #say:maya #id:gate-break-maya-again #fx:fail
- else:
    ~ g_lock = true
    ~ gate_result = "ok"
}
-> DONE

= eli_part
{
- not g_lock:
    ~ gate_result = "break"
    It won't hold still! I can't catch a window that keeps moving. #say:eli #id:gate-break-eli #fx:fail
- g_window:
    ~ gate_result = "break"
    Already hit it! The window's open — I can't hit it twice. Who's next? #say:eli #id:gate-break-eli-again #fx:fail
- else:
    ~ g_window = true
    ~ gate_result = "ok"
}
-> DONE

= vibrion_part
{
- not g_window:
    ~ gate_result = "break"
    Still out of phase. I'm not forcing power through that. #say:vibrion #id:gate-break-vibrion #fx:fail
- panel_live && not panel_clear:
    ~ gate_result = "break"
    The panel's live, but that jammed lever is still cutting the feed. The seal gets nothing until it moves. #say:vibrion #id:gate-vibrion-jammed #fx:fail
- not panel_clear:
    ~ gate_result = "break"
    The seal needs more than I'm carrying. Its grid feed runs through that dead panel by the levers. #say:vibrion #id:gate-vibrion-dead #fx:fail
- else:
    ~ gate_clear = true
    ~ gate_result = "sealed"
    They're in phase. Coupling now. #say:vibrion #id:gate-seal #fx:sync
}
-> DONE

// ——————————————————————————————— Resonance ———————————————————————————————

=== resonance ===
~ at = "end"
The four clocks share one sequence now. I can see it running through every crystal in the chamber. Except one, by the rim. #say:maya #id:res-maya #fx:chime-sync #fx:outlier
Good work, all of you. That crystal isn't ours. It's what brushed the edge when we came in. We're not finished — but we're in phase. #say:vibrion #id:res-vibrion #fx:entropy
-> END
