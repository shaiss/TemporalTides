import { CHARACTER_IDS } from './inkStory.js';

/** The four places in the open room, in the order they sit around the chamber. */
export const STATIONS = ['corridor', 'levers', 'panel', 'gate'];
export const SLOT_COUNT = 4;

/**
 * Open-room game flow over the Ink story. No DOM and no Three.js, so Node tests drive exactly the
 * flow the browser uses. Ink decides who can act, what each character says, and how a gate plan
 * plays out; this class only moves the player between the room and its stations and holds the plan.
 */
export class NexusGame {
  constructor(ink) {
    this.ink = ink;
    this.plan = Array(SLOT_COUNT).fill(null);
  }

  get lens() {
    return String(this.ink.get('lens'));
  }

  get at() {
    return String(this.ink.get('at'));
  }

  get inStation() {
    return STATIONS.includes(this.at);
  }

  get ended() {
    return this.at === 'end';
  }

  flags() {
    const g = (n) => Boolean(this.ink.get(n));
    return {
      corridorClear: g('corridor_clear'),
      leversMarked: g('levers_marked'),
      leversClear: g('levers_clear'),
      panelLive: g('panel_live'),
      panelClear: g('panel_clear'),
      gateClear: g('gate_clear'),
    };
  }

  canEnter(station) {
    return this.at === 'room' && STATIONS.includes(station) && Boolean(this.ink.call('can_enter', station));
  }

  canAct() {
    return this.inStation && Boolean(this.ink.call('can_act'));
  }

  planReady() {
    return this.plan.every(Boolean);
  }

  /** True once a place is finished (nothing left to look at or do there). */
  placeClear(place = this.at) {
    const f = this.flags();
    return { corridor: f.corridorClear, levers: f.leversClear, panel: f.panelClear, gate: f.gateClear }[place] ?? false;
  }

  view() {
    return {
      lens: this.lens,
      at: this.at,
      ended: this.ended,
      flags: this.flags(),
      enterable: Object.fromEntries(STATIONS.map((s) => [s, this.canEnter(s)])),
      canAct: this.canAct(),
      plan: [...this.plan],
      planReady: this.planReady(),
    };
  }

  /** Opening lines. */
  arrive() {
    return this.ink.run('arrive');
  }

  /** Switch the active character. Inside an unfinished place, they say what they see there. */
  setLens(id) {
    if (!CHARACTER_IDS.includes(id) || id === this.lens || this.ended) return null;
    this.ink.set('lens', id);
    return this.inStation && !this.placeClear() ? this.ink.run('look') : [];
  }

  /** Walk up to a station; the active character says what they see. */
  enter(station) {
    if (!this.canEnter(station)) return null;
    this.ink.set('at', station);
    return this.ink.run('look');
  }

  back() {
    if (!this.inStation) return false;
    this.ink.set('at', 'room');
    return true;
  }

  /** Act on the lit thing. `done` means the station is finished and the player can head back. */
  act() {
    if (!this.canAct()) return null;
    const lines = this.ink.run('act');
    return { lines, done: lines.some((l) => l.fx.includes('done')) };
  }

  place(slot, id) {
    if (slot < 0 || slot >= SLOT_COUNT || !CHARACTER_IDS.includes(id)) return false;
    this.plan[slot] = id;
    return true;
  }

  clearSlot(slot) {
    if (slot < 0 || slot >= SLOT_COUNT) return false;
    this.plan[slot] = null;
    return true;
  }

  /**
   * Play the gate plan slot by slot. Returns every slot that was reached, with the result Ink gave
   * (ok | break | sealed) and anything said there. The plan stays in place so it can be adjusted.
   */
  playPlan() {
    if (this.at !== 'gate' || !this.planReady() || this.flags().gateClear) return null;
    this.plan.forEach((id, i) => this.ink.set(`plan${i + 1}`, id));
    const opening = this.ink.run('gate_begin');
    if (this.ink.get('gate_result') === 'break') {
      return { steps: [], lines: opening, result: 'break', solo: true };
    }
    const steps = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const lines = this.ink.run('gate_step');
      const result = String(this.ink.get('gate_result'));
      steps.push({ slot: i, who: this.plan[i], result, lines });
      if (result !== 'ok') break;
    }
    const last = steps[steps.length - 1];
    return { steps, lines: steps.flatMap((s) => s.lines), result: last.result, solo: false };
  }

  /** Closing lines once the seal holds. */
  resonance() {
    if (!this.flags().gateClear) return null;
    return this.ink.run('resonance');
  }

  restart() {
    this.ink.reset();
    this.plan = Array(SLOT_COUNT).fill(null);
  }
}
