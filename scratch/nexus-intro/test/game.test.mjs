// Headless checks for the open room, run against the compiled story.json through the same
// InkController + NexusGame the browser uses. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { InkController, CHARACTER_IDS } from '../src/inkStory.js';
import { NexusGame, STATIONS } from '../src/game.js';

const storyPath = fileURLToPath(new URL('../story.json', import.meta.url));
const storyJson = JSON.parse(readFileSync(storyPath, 'utf8').replace(/^\uFEFF/, ''));
const inkSource = readFileSync(fileURLToPath(new URL('../nexus-intro.ink', import.meta.url)), 'utf8');

function boot() {
  const game = new NexusGame(new InkController(storyJson));
  game.arrive();
  return game;
}

/** Who can act at a station right now, by trying every lens without acting. */
function actors(game) {
  const start = game.lens;
  const can = CHARACTER_IDS.filter((id) => {
    game.ink.set('lens', id);
    return game.canAct();
  });
  game.ink.set('lens', start);
  return can;
}

function solveCorridor(game) {
  game.enter('corridor');
  game.setLens('anne');
  assert.ok(game.act().done);
  game.back();
}

function solveLevers(game) {
  game.enter('levers');
  game.setLens('maya');
  assert.equal(game.act().done, false);
  game.setLens('eli');
  assert.ok(game.act().done);
  game.back();
}

function solvePanel(game) {
  game.enter('panel');
  game.setLens('vibrion');
  assert.equal(game.act().done, false);
  game.setLens('eli');
  assert.ok(game.act().done);
  game.back();
}

const SOLVERS = { corridor: solveCorridor, levers: solveLevers, panel: solvePanel };
const SEAL_PLAN = ['anne', 'maya', 'eli', 'vibrion'];

function playGate(game, plan) {
  if (game.at !== 'gate') assert.ok(game.enter('gate'), 'gate should be enterable');
  plan.forEach((id, i) => game.place(i, id));
  return game.playPlan();
}

function permutations(xs) {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

test('the player starts in the room and every place is open', () => {
  const game = boot();
  const v = game.view();
  assert.equal(v.at, 'room');
  assert.deepEqual(v.enterable, { corridor: true, levers: true, panel: true, gate: true });
  assert.equal(v.canAct, false);
});

test('the corridor only answers to Anne', () => {
  const game = boot();
  game.enter('corridor');
  assert.deepEqual(actors(game), ['anne']);
});

test('levers: only Maya can mark, then only Eli can finish', () => {
  const game = boot();
  game.enter('levers');
  assert.deepEqual(actors(game), ['maya']);
  game.setLens('maya');
  game.act();
  assert.deepEqual(actors(game), ['eli']);
});

test('panel: only Vibrion can couple, then only Eli can shove the lever', () => {
  const game = boot();
  game.enter('panel');
  assert.deepEqual(actors(game), ['vibrion']);
  game.setLens('vibrion');
  game.act();
  assert.deepEqual(actors(game), ['eli']);
});

test('nobody acts at the gate directly; the plan is the only way through', () => {
  const game = boot();
  game.enter('gate');
  assert.deepEqual(actors(game), []);
});

test('backing out keeps progress, and a finished place cannot be re-entered', () => {
  const game = boot();
  game.enter('levers');
  game.setLens('maya');
  game.act();
  assert.ok(game.back());
  game.enter('panel');
  game.back();
  game.enter('levers');
  assert.equal(game.view().flags.leversMarked, true);
  game.setLens('eli');
  game.act();
  game.back();
  assert.equal(game.canEnter('levers'), false);
  assert.equal(game.enter('levers'), null);
});

test('one character in every slot breaks with the solo line', () => {
  CHARACTER_IDS.forEach((id) => {
    const game = boot();
    const r = playGate(game, [id, id, id, id]);
    assert.equal(r.result, 'break');
    assert.equal(r.solo, true);
    assert.equal(r.lines[0].id, 'gate-solo');
  });
});

test('of all 256 plans, only Anne → Maya → Eli → Vibrion seals, and only with the panel finished', () => {
  const all = [];
  const walk = (p) => (p.length === 4 ? all.push(p) : CHARACTER_IDS.forEach((id) => walk([...p, id])));
  walk([]);
  assert.equal(all.length, 256);
  [false, true].forEach((panelDone) => {
    all.forEach((plan) => {
      const game = boot();
      if (panelDone) solvePanel(game);
      const r = playGate(game, plan);
      const isSeal = plan.join() === SEAL_PLAN.join();
      assert.equal(r.result === 'sealed', isSeal && panelDone, `plan ${plan} panel=${panelDone} -> ${r.result}`);
      if (r.result !== 'sealed') {
        assert.equal(r.lines.length, 1, `plan ${plan} should end on exactly one line`);
        const breaker = r.solo ? 'vibrion' : r.steps[r.steps.length - 1].who;
        assert.equal(r.lines[0].speaker, breaker, `plan ${plan}: the character who can't do their part says why`);
      }
    });
  });
});

test('the right plan before the panel is finished stops at Vibrion on a feed line', () => {
  const dead = boot();
  let r = playGate(dead, SEAL_PLAN);
  assert.equal(r.steps.length, 4);
  assert.equal(r.lines[0].id, 'gate-vibrion-dead');

  const jammed = boot();
  jammed.enter('panel');
  jammed.setLens('vibrion');
  jammed.act();
  jammed.back();
  r = playGate(jammed, SEAL_PLAN);
  assert.equal(r.lines[0].id, 'gate-vibrion-jammed');
});

test('every order of the three solo places reaches the ending', () => {
  permutations(['corridor', 'levers', 'panel']).forEach((order) => {
    const game = boot();
    order.forEach((s) => SOLVERS[s](game));
    const r = playGate(game, SEAL_PLAN);
    assert.equal(r.result, 'sealed', `order ${order}`);
    const end = game.resonance();
    assert.deepEqual(end.map((l) => l.id), ['res-maya', 'res-vibrion']);
    assert.equal(game.view().ended, true);
  });
});

test('the gate can be tried first, failed, left, and come back to', () => {
  const game = boot();
  assert.equal(playGate(game, SEAL_PLAN).result, 'break');
  game.back();
  solvePanel(game);
  assert.equal(playGate(game, SEAL_PLAN).result, 'sealed');
});

test('a look line is always spoken by the character whose eyes you are using', () => {
  const game = boot();
  const seen = new Set();
  const lookAll = () => {
    CHARACTER_IDS.forEach((id) => {
      game.ink.set('lens', id);
      const lines = game.ink.run('look');
      assert.equal(lines.length, 1, `${game.at}/${id} should say exactly one line`);
      assert.equal(lines[0].speaker, id);
      seen.add(lines[0].id);
    });
  };
  STATIONS.forEach((s) => {
    game.ink.set('at', s);
    lookAll();
  });
  game.ink.set('at', 'levers');
  game.ink.set('levers_marked', true);
  lookAll();
  game.ink.set('at', 'panel');
  game.ink.set('panel_live', true);
  lookAll();
  game.ink.set('at', 'gate');
  lookAll();
  game.ink.set('panel_clear', true);
  lookAll();
  // corridor 4 + levers 6 + panel 7 + gate 6 (dead feed, jammed feed, live feed for Vibrion).
  assert.equal(seen.size, 23, `expected the full look set, saw ${seen.size}`);
});

test('line rules: speaker and id on every line, short, no designer vocabulary', () => {
  const spoken = inkSource
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => !l.startsWith('//') && /#say:/.test(l))
    .map((l) => l.replace(/^- "[a-z]+":\s*/, ''));
  assert.ok(spoken.length >= 38, `found ${spoken.length} spoken lines`);
  const ids = new Map();
  spoken.forEach((l) => {
    const text = l.split('#')[0].trim();
    const speaker = l.match(/#say:([a-z]+)/)?.[1];
    const id = l.match(/#id:([a-z0-9-]+)/)?.[1];
    assert.ok(CHARACTER_IDS.includes(speaker), `speaker on: ${l}`);
    assert.ok(id, `id on: ${l}`);
    if (ids.has(id)) assert.equal(ids.get(id), text, `line ${id} has two different texts`);
    ids.set(id, text);
    const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    assert.ok(words <= 26, `${id} has ${words} words`);
    assert.doesNotMatch(text, /\b(puzzle|station|step|beat \d|level|hint|tap|click|press)\b/i, `${id} uses designer vocabulary`);
  });
});
