// Planted details: the corridor's spark rhythm and the lines that make claims about it.
// A line that states a timing or an order must be true on screen; these tests hold the Ink text,
// the shared layout and the schedule to each other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SparkSchedule } from '../src/sparks.js';
import { LAYOUT } from '../src/layout.js';

const inkSource = readFileSync(fileURLToPath(new URL('../nexus-intro.ink', import.meta.url)), 'utf8');
const lineById = (id) => {
  const line = inkSource.split('\n').find((l) => !l.trim().startsWith('//') && new RegExp(`#id:${id}(\\s|$)`).test(l));
  assert.ok(line, `no Ink line with #id:${id}`);
  return line;
};
const numbers = (text) => (text.replace(/#.*$/, '').match(/\d+\.\d+/g) ?? []).map(Number);

function run(schedule, seconds, step = 0.01) {
  const sparks = [];
  for (let t = 0; t < seconds; t += step) sparks.push(...schedule.update(step));
  return sparks;
}

test('sparks walk the plates left → far right → center with the corridor gaps', () => {
  const s = new SparkSchedule(LAYOUT.sparks);
  const sparks = run(s, 40);
  assert.ok(sparks.length >= 12, `expected at least 12 sparks in 40 s, got ${sparks.length}`);
  sparks.forEach((sp, i) => assert.equal(sp.plate, LAYOUT.sparks.plates[i % 3]));
  for (let i = 1; i < sparks.length; i++) {
    const gap = sparks[i].t - sparks[i - 1].t;
    assert.ok(Math.abs(gap - LAYOUT.sparks.gaps[(i - 1) % 4]) < 1e-9, `gap ${i}: ${gap}`);
  }
});

test('the full pattern only repeats every 12 sparks (Maya: "No repeating sequence yet")', () => {
  const s = new SparkSchedule(LAYOUT.sparks);
  assert.equal(s.period, 12);
  const sparks = run(s, 80);
  const key = (i) => `${sparks[i].plate}:${(sparks[i + 1].t - sparks[i].t).toFixed(2)}`;
  // No shorter shift reproduces the (plate, next gap) sequence.
  for (let shift = 1; shift < 12; shift++) {
    const same = [...Array(12).keys()].every((i) => key(i) === key(i + shift));
    assert.equal(same, false, `pattern repeats after ${shift}`);
  }
  assert.ok([...Array(12).keys()].every((i) => key(i) === key(i + 12)));
});

test('foresee makes a timing call true without breaking the order', () => {
  const s = new SparkSchedule(LAYOUT.sparks);
  run(s, 7.3);
  s.foresee(4.0, 0);
  assert.ok(Math.abs(s.untilNext() - 4.0) < 1e-9);
  const next = run(s, 4.05);
  assert.equal(next.length, 1);
  assert.equal(next[0].plate, 0);
  // "...then far right, then center."
  const after = run(s, 12);
  assert.deepEqual(after.slice(0, 2).map((sp) => sp.plate), [2, 1]);
  // Gate: "Next tick in about three seconds."
  s.foresee(3.0);
  assert.ok(Math.abs(s.untilNext() - 3.0) < 1e-9);
});

test('Anne\'s corridor call names the plates as the camera sees them', () => {
  const line = lineById('corr-anne');
  assert.match(line, /Left plate sparks in four seconds, then far right, then center/);
  assert.match(line, /#fx:foresee/);
  const [first, second, third] = LAYOUT.sparks.plates.map((i) => LAYOUT.traps[i]);
  // Seen from the room and the corridor pose, +x is right and -z is far.
  assert.ok(first[0] < third[0] && first[0] < second[0], 'first spark is the leftmost plate');
  assert.ok(second[0] > third[0] && second[1] < first[1], 'second spark is the far-right plate');
  assert.ok(third[0] > first[0] && third[0] < second[0], 'third spark is the center plate');
});

test('Maya reads the same intervals in the corridor and on the first clock', () => {
  assert.deepEqual(numbers(lineById('corr-maya')), LAYOUT.sparks.gaps);
  assert.deepEqual(numbers(lineById('gate-maya')), LAYOUT.sparks.gaps);
  assert.match(lineById('gate-maya'), /first clock/);
  assert.match(lineById('gate-anne'), /first clock runs on the corridor's rhythm/);
  assert.match(lineById('gate-anne'), /#fx:foresee/);
});

test('gate lines keep their clock numbers', () => {
  assert.match(lineById('gate-anne'), /first clock/);
  assert.match(lineById('gate-maya'), /second/);
  assert.match(lineById('gate-eli'), /third clock/);
  assert.match(lineById('gate-eli'), /lever window/);
});

test('the crystal outlier is planted on arrival and named only by what it did', () => {
  assert.match(lineById('arrive-2'), /#fx:chime/);
  const maya = lineById('res-maya');
  assert.match(maya, /Except one, by the rim/);
  assert.match(maya, /#fx:chime-sync/);
  assert.match(maya, /#fx:outlier/);
  const vibrion = lineById('res-vibrion');
  assert.match(vibrion, /brushed the edge/);
  // The cause stays unsaid: nobody names who or what grew it.
  assert.doesNotMatch(vibrion.replace(/#.*$/, ''), /entropy|doctor|dr\.|planted|grew|put it/i);
  const { spots, outlier } = LAYOUT.crystals;
  const [x, z] = spots[outlier];
  assert.ok(Math.hypot(x, z) > LAYOUT.roomRadius - 1.2, 'the outlier sits by the rim');
});
