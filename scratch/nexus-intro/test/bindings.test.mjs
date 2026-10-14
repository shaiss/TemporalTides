// Headless checks for prop → choice bindings and outcome feedback, run against the real compiled
// story.json via the same InkController the browser uses. Run: npm test (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Story } from 'inkjs';
import { InkController } from '../src/inkStory.js';
import { detectOutcome, resolveBindings } from '../src/bindings.js';

const storyPath = fileURLToPath(new URL('../story.json', import.meta.url));
const storyJson = JSON.parse(readFileSync(storyPath, 'utf8').replace(/^\uFEFF/, ''));

function boot() {
  const ink = new InkController();
  ink.story = new Story(storyJson);
  ink.continueStory();
  const events = [];
  const driver = {
    ink,
    events,
    get state() {
      return ink.getState();
    },
    /** Pick a rail choice by text. */
    pick(re) {
      const s = ink.getState();
      const i = s.choices.findIndex((c) => re.test(c.text));
      assert.ok(i >= 0, `no choice ${re} in ${JSON.stringify(s.choices.map((c) => c.text))}`);
      return driver._choose(s, i);
    },
    /** Tap a chamber prop: only works if the prop is bound to a choice currently on the rail. */
    tap(propId) {
      const s = ink.getState();
      const bindings = resolveBindings(s);
      assert.ok(bindings.has(propId), `prop ${propId} not bound; bindings=${JSON.stringify(Object.fromEntries(bindings))}`);
      return driver._choose(s, bindings.get(propId));
    },
    _choose(s, i) {
      const chosen = s.choices[i];
      ink.choose(i);
      const out = detectOutcome(s, ink.getState(), chosen);
      events.push(...out);
      return out;
    },
  };
  return driver;
}

const types = (evs) => evs.map((e) => `${e.type}${e.prop ? ':' + e.prop : ''}`);

test('golden path: every beat action is reachable by tapping its prop', () => {
  const d = boot();
  assert.deepEqual(Object.fromEntries(resolveBindings(d.state)), { gate: 0 });
  d.tap('gate');
  d.pick(/^Switch active character before moving on/);
  assert.equal(resolveBindings(d.state).size, 0, 'no prop bindings while the mode switch is open');
  assert.deepEqual(types(d.pick(/^Anne — /)), ['mode', 'beat']);

  assert.deepEqual(types(d.tap('corridor')), ['clear:corridor']);
  d.pick(/^Maya — /);
  assert.deepEqual(types(d.tap('levers')), ['clear:levers']);
  d.pick(/^Eli — /);
  assert.deepEqual(types(d.tap('levers')), ['clear:levers']);
  d.pick(/^Vibrion — /);
  assert.deepEqual(types(d.tap('panel')), ['clear:panel']);
  d.pick(/^Anne — /);
  assert.equal(d.state.currentBeat, '5');

  const order = ['anne', 'maya', 'eli', 'vibrion'];
  order.forEach((who, step) => {
    if (step > 0) d.pick(new RegExp(`^${who[0].toUpperCase()}${who.slice(1)} — `));
    assert.equal(d.state.beat5Step, step);
    const out = d.tap(`clock${step}`);
    assert.ok(types(out).includes(`clear:clock${step}`), `step ${step} (${who}) clears: ${types(out)}`);
    if (step === 3) assert.ok(types(out).includes('sync'), 'final step seals the gate');
  });
  assert.equal(d.state.beat5Clear, true);
  assert.equal(d.state.currentBeat, '6');
});

test('action bindings only ever point at action choices on the rail', () => {
  const d = boot();
  const seen = new Set();
  const check = () => {
    const s = d.state;
    for (const [prop, i] of resolveBindings(s)) {
      assert.equal(s.choices[i]?.kind, 'action', `${prop} → ${s.choices[i]?.text}`);
      seen.add(prop);
    }
  };
  const script = [/Step into/, /Switch active/, /^Anne/, /Use Foresight/, /^Maya/, /Use Pattern/, /^Eli/, /Use Kinetic/, /^Vibrion/, /Use Vibrational/, /^Anne/];
  check();
  script.forEach((re) => {
    d.pick(re);
    check();
  });
  assert.deepEqual([...seen].sort(), ['clock0', 'corridor', 'gate', 'levers', 'panel']);
});

test('wrong lens on the corridor: tap fails, Ink state does not advance', () => {
  const d = boot();
  d.tap('gate');
  d.pick(/^Continue as Vibrion/);
  const before = d.state;
  assert.deepEqual(types(d.tap('corridor')), ['fail:corridor']);
  assert.equal(d.state.beat1Clear, false);
  assert.equal(d.state.currentBeat, before.currentBeat);
});

function toBeatFive() {
  const d = boot();
  [/Step into/, /Switch active/, /^Anne/, /Use Foresight/, /^Maya/, /Use Pattern/, /^Eli/, /Use Kinetic/, /^Vibrion/, /Use Vibrational/, /^Anne/].forEach((re) => d.pick(re));
  return d;
}

test('beat 5 solo seal is refused and reads as a gate failure', () => {
  const d = toBeatFive();
  assert.deepEqual(types(d.pick(/Force the seal closed/)), ['fail:gate']);
  assert.equal(d.state.beat5Clear, false);
  assert.equal(d.state.beat5Step, 0);
});

test('beat 5 out-of-order lock fails on the current clock', () => {
  const d = toBeatFive();
  d.tap('clock0');
  d.pick(/^Keep current/);
  assert.equal(d.state.beat5Step, 1);
  assert.deepEqual(types(d.tap('clock1')), ['fail:clock1']);
  assert.equal(d.state.beat5Step, 1);
  d.pick(/^Switch active/);
  d.pick(/^Eli — /);
  assert.deepEqual(types(d.tap('clock1')), ['fail:clock1']);
  assert.equal(d.state.beat5Step, 1);
});
