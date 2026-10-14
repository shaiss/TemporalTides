/**
 * Map chamber props onto choices that Ink is offering right now. A prop tap can only ever pick an
 * existing rail choice — never a hidden one — so Ink remains the only rules brain.
 *
 * Returns Map<propId, choiceIndex>.
 */
export function resolveBindings(state) {
  const map = new Map();
  if (!state || state.modeSwitchUi || state.ended) return map;
  const actions = state.choices.map((c, i) => ({ ...c, i })).filter((c) => c.kind === 'action');
  const first = actions[0];
  if (!first) return map;
  switch (String(state.currentBeat)) {
    case '0':
      map.set(/Step into/i.test(first.text) ? 'gate' : 'corridor', first.i);
      break;
    case '1':
      map.set('corridor', first.i);
      break;
    case '2':
    case '3':
      map.set('levers', first.i);
      break;
    case '4':
      map.set('panel', first.i);
      break;
    case '5':
      map.set(`clock${Math.min(state.beat5Step, 3)}`, first.i);
      break;
    default:
      break;
  }
  return map;
}

/** Which prop a beat's action is "about" (for feedback when the choice came from the rail). */
export function beatProp(state) {
  switch (String(state?.currentBeat)) {
    case '0':
      return 'gate';
    case '1':
      return 'corridor';
    case '2':
    case '3':
      return 'levers';
    case '4':
      return 'panel';
    case '5':
      return `clock${Math.min(state.beat5Step ?? 0, 3)}`;
    default:
      return null;
  }
}

function choiceSignature(state) {
  return state.choices.map((c) => c.text).join('|');
}

/**
 * Compare Ink state before / after a choice and describe what happened, so presentation can react.
 * Pure function of the two states + the chosen choice kind — it never feeds back into Ink.
 */
export function detectOutcome(prev, next, chosen) {
  const events = [];
  if (!prev || !chosen) return events;
  const progressed =
    (!prev.beat1Clear && next.beat1Clear) ||
    (!prev.beat2Clear && next.beat2Clear) ||
    (!prev.beat3Clear && next.beat3Clear) ||
    (!prev.beat4Clear && next.beat4Clear) ||
    next.beat5Step > prev.beat5Step;

  if (chosen.kind === 'action' || chosen.kind === 'solo') {
    if (progressed) {
      events.push({ type: 'clear', prop: beatProp(prev), charId: prev.active });
    } else if (
      chosen.kind === 'solo' ||
      (String(next.currentBeat) === String(prev.currentBeat) && choiceSignature(next) === choiceSignature(prev))
    ) {
      events.push({ type: 'fail', prop: chosen.kind === 'solo' ? 'gate' : beatProp(prev), charId: prev.active });
    }
  }
  if (!prev.beat5Clear && next.beat5Clear) events.push({ type: 'sync', charId: next.active });
  if (prev.active !== next.active) events.push({ type: 'mode', charId: next.active });
  if (String(prev.currentBeat) !== String(next.currentBeat)) events.push({ type: 'beat', beat: next.currentBeat });
  return events;
}
