import { InkController, CHARACTERS, CHARACTER_IDS } from './inkStory.js';
import { NexusGame, STATIONS, SLOT_COUNT } from './game.js';
import { NexusChamber } from './chamber.js';
import { NexusAudio } from './audio.js';
import { Subtitles } from './subtitles.js';
import anneImg from './assets/portraits/anne.webp';
import mayaImg from './assets/portraits/maya.webp';
import eliImg from './assets/portraits/eli.webp';
import vibrionImg from './assets/portraits/vibrion.webp';

const PORTRAITS = { anne: anneImg, maya: mayaImg, eli: eliImg, vibrion: vibrionImg };
const NAMES = Object.fromEntries(CHARACTERS.map((c) => [c.id, c.name]));
/** Screen-reader / keyboard names for the places (never drawn on screen). */
const PLACE_NAMES = { corridor: 'Hazard corridor', levers: 'Echo levers', panel: 'Dead panel', gate: 'Coordination gate' };
const STEP_MS = 850;

const appEl = document.getElementById('app');
const canvas = document.getElementById('chamber-canvas');
const teamEl = document.getElementById('team');
const backBtn = document.getElementById('back-btn');
const soundBtn = document.getElementById('sound-toggle');
const plannerEl = document.getElementById('planner');
const slotsEl = document.getElementById('slots');
const syncBtn = document.getElementById('sync-btn');
const endingEl = document.getElementById('ending');
const replayBtn = document.getElementById('replay-btn');
const placesEl = document.getElementById('places');
const panLeft = document.getElementById('pan-left');
const panRight = document.getElementById('pan-right');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// How loud a corridor spark is from each place (the first gate clock ticks with it).
const SPARK_LEVEL = { corridor: 1, gate: 0.8, room: 0.45, levers: 0.2, panel: 0.2, end: 0 };

const audio = new NexusAudio();
let game = null;
let playing = false;
let gateStep = 0;
let slotResults = [];
let lastHover = null;
// Ink settles the whole plan at once; the seal only shows when playback reaches it.
let sealShown = false;

const subtitles = new Subtitles(document.getElementById('subtitle'), {
  names: NAMES,
  onLine: (line) => {
    teamEl.querySelectorAll('.portrait').forEach((b) => b.classList.toggle('speaking', !!line && b.dataset.id === line.speaker));
    const i = line ? CHARACTER_IDS.indexOf(line.speaker) : -1;
    if (i >= 0) appEl.style.setProperty('--speaker-index', String(i));
    if (line?.fx.includes('entropy')) retrigger(appEl, 'entropy-pass');
    // Planted details: lines that make a timing claim make it true; the crystals answer lines.
    if (line?.fx.includes('foresee')) chamber.foresee();
    if (line?.fx.includes('chime')) chamber.chime(false);
    if (line?.fx.includes('chime-sync')) chamber.chime(true);
    if (line?.fx.includes('outlier')) chamber.showOutlier(1800);
  },
});

const chamber = new NexusChamber(canvas, {
  onPropTap: (place) => tapPlace(place),
  onHoverChange: (place) => {
    if (place && place !== lastHover) audio.hover();
    lastHover = place;
  },
  onClockTick: (i, info) => {
    // The first clock's spark-driven ticks are voiced by the spark itself.
    if (game?.at === 'gate' && !info.spark) audio.tick(i, info);
  },
  onSpark: ({ clear }) => audio.spark((SPARK_LEVEL[game?.at] ?? 0) * (clear ? 0.7 : 1)),
  onChime: (events, info) => audio.chime(events, info),
});

function retrigger(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // restart CSS animation
  el.classList.add(cls);
}

// —— Actions ——
function tapPlace(place) {
  if (!game || playing) return;
  if (game.at === 'room') enter(place);
  else if (place === game.at) act();
}

function enter(place) {
  const lines = game.enter(place);
  if (!lines) return;
  slotResults = [];
  audio.move();
  chamber.feedback({ type: 'move' });
  render();
  subtitles.say(lines);
}

function back() {
  if (playing || !game.back()) return;
  audio.move();
  render();
}

function selectLens(id) {
  if (!game || playing) return;
  const lines = game.setLens(id);
  if (lines === null) return;
  audio.switchLens(id);
  render();
  if (lines.length) subtitles.say(lines);
}

function act() {
  const at = game.at;
  const lens = game.lens;
  const result = game.act();
  if (!result) return;
  chamber.feedback({ type: 'clear', prop: at, charId: lens });
  audio.clear(lens);
  render();
  subtitles.say(result.lines).then(() => {
    // A finished place hands the player back to the room once the line has landed.
    if (result.done && game.at === at) {
      game.back();
      audio.move();
      render();
    }
  });
}

function placeInSlot(slot, id) {
  if (playing || game.at !== 'gate') return;
  game.place(slot, id);
  slotResults = [];
  audio.hover();
  render();
}

function clearSlot(slot) {
  if (playing || game.at !== 'gate') return;
  game.clearSlot(slot);
  slotResults = [];
  render();
}

async function playPlan() {
  const run = game.playPlan();
  if (!run) return;
  playing = true;
  gateStep = 0;
  slotResults = Array(SLOT_COUNT).fill(null);
  render();
  await wait(STEP_MS * 0.6);

  if (run.solo) {
    // Four of the same character: the clocks grind against each other.
    slotResults = Array(SLOT_COUNT).fill('break');
    chamber.feedback({ type: 'fail', prop: 'gate' });
    audio.fail();
    render();
    await subtitles.say(run.lines);
  } else {
    for (const step of run.steps) {
      if (step.result === 'break') {
        slotResults[step.slot] = 'break';
        chamber.feedback({ type: 'fail', prop: 'gate' });
        audio.fail();
        render();
        await subtitles.say(step.lines);
        break;
      }
      gateStep = step.slot + 1;
      slotResults[step.slot] = 'ok';
      chamber.feedback({ type: 'clear', prop: `clock${step.slot}`, charId: step.who });
      audio.clear(step.who);
      if (step.result === 'sealed') {
        sealShown = true;
        chamber.feedback({ type: 'sync' });
        audio.sync();
        render();
        await subtitles.say(step.lines);
        break;
      }
      render();
      await wait(STEP_MS);
    }
  }

  if (run.result === 'sealed') {
    await wait(500);
    const closing = game.resonance();
    playing = false;
    render();
    await subtitles.say(closing);
    render();
    return;
  }
  await wait(450);
  gateStep = 0;
  playing = false;
  render();
}

function replay() {
  game.restart();
  sealShown = false;
  playing = false;
  gateStep = 0;
  slotResults = [];
  render();
  subtitles.say(game.arrive());
}

// —— Rendering ——
function boundPlaces(v) {
  if (playing || v.ended) return [];
  if (v.at === 'room') return STATIONS.filter((s) => v.enterable[s]);
  if (v.at === 'gate') return [];
  return v.canAct ? [v.at] : [];
}

function buildTeam() {
  teamEl.innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'portrait';
    btn.dataset.id = c.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', `${c.name}, ${c.ability}`);
    btn.title = `${c.name} · ${c.ability} (${i + 1})`;
    btn.innerHTML = `<img src="${PORTRAITS[c.id]}" alt="" draggable="false" /><span class="name">${c.name}</span>`;
    btn.addEventListener('click', () => {
      if (drag.suppressClick) return;
      selectLens(c.id);
    });
    teamEl.appendChild(btn);
  });
}

function renderSlots(v) {
  slotsEl.innerHTML = '';
  v.plan.forEach((id, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot';
    btn.dataset.slot = String(i);
    if (id) {
      btn.dataset.id = id;
      btn.innerHTML = `<img src="${PORTRAITS[id]}" alt="" draggable="false" />`;
    }
    const r = slotResults[i];
    if (r) btn.dataset.result = r;
    btn.setAttribute('aria-label', `Slot ${i + 1}: ${id ? NAMES[id] : 'empty'}`);
    btn.disabled = playing;
    btn.addEventListener('click', () => {
      if (drag.suppressClick) return;
      if (game.plan[i]) clearSlot(i);
      else placeInSlot(i, game.lens);
    });
    li.appendChild(btn);
    slotsEl.appendChild(li);
  });
}

function renderPlaces(v, bound) {
  placesEl.innerHTML = '';
  const add = (label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn);
    placesEl.appendChild(b);
  };
  if (v.at === 'room') bound.forEach((p) => add(PLACE_NAMES[p], () => enter(p)));
  else if (bound.includes(v.at)) {
    const c = CHARACTERS.find((x) => x.id === v.lens);
    add(`${c.name}: use ${c.ability}`, act);
  }
}

function render() {
  const v = game.view();
  if (v.flags.gateClear && !sealShown) v.flags = { ...v.flags, gateClear: false };
  appEl.dataset.lens = v.lens;
  appEl.dataset.at = v.at;
  appEl.classList.toggle('playing', playing);

  teamEl.querySelectorAll('.portrait').forEach((b) => {
    const on = b.dataset.id === v.lens;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.disabled = v.ended;
  });

  backBtn.hidden = !game.inStation || playing || (v.at === 'gate' && v.flags.gateClear);
  plannerEl.hidden = !(v.at === 'gate' && !v.flags.gateClear);
  if (!plannerEl.hidden) renderSlots(v);
  syncBtn.disabled = !v.planReady || playing;
  endingEl.hidden = !(v.ended && !subtitles.busy);

  const bound = boundPlaces(v);
  chamber.sync(v, { gateStep, playing });
  chamber.setBindings(bound);
  renderPlaces(v, bound);
  renderPan();
  audio.setTension?.(v.flags.gateClear ? 1 : v.at === 'gate' ? gateStep / 4 : 0);
}

function renderPan() {
  const show = Boolean(game) && chamber.canPan && !playing;
  panLeft.hidden = !show;
  panRight.hidden = !show;
}

// —— Drag a portrait (or a filled slot) into a slot ——
const drag = { active: null, suppressClick: false };

function dragSource(target) {
  const portrait = target.closest?.('.portrait');
  if (portrait && teamEl.contains(portrait)) return { id: portrait.dataset.id, from: null };
  const slot = target.closest?.('.slot');
  if (slot && slot.dataset.id) return { id: slot.dataset.id, from: Number(slot.dataset.slot) };
  return null;
}

function slotAt(x, y) {
  return document.elementFromPoint(x, y)?.closest?.('.slot') ?? null;
}

window.addEventListener('pointerdown', (e) => {
  if (!game || game.at !== 'gate' || playing || game.view().flags.gateClear || e.button !== 0) return;
  const src = dragSource(e.target);
  if (!src) return;
  drag.active = { ...src, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, ghost: null, over: null };
});

window.addEventListener('pointermove', (e) => {
  const d = drag.active;
  if (!d || e.pointerId !== d.pointerId) return;
  if (!d.started && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) {
    d.started = true;
    d.ghost = document.createElement('img');
    d.ghost.className = 'drag-ghost';
    d.ghost.src = PORTRAITS[d.id];
    d.ghost.alt = '';
    document.body.appendChild(d.ghost);
    appEl.classList.add('dragging');
  }
  if (!d.started) return;
  e.preventDefault();
  d.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  const over = slotAt(e.clientX, e.clientY);
  if (over !== d.over) {
    d.over?.classList.remove('drop-target');
    over?.classList.add('drop-target');
    d.over = over;
  }
});

function endDrag(e, cancelled = false) {
  const d = drag.active;
  if (!d || e.pointerId !== d.pointerId) return;
  drag.active = null;
  if (!d.started) return;
  d.ghost?.remove();
  d.over?.classList.remove('drop-target');
  appEl.classList.remove('dragging');
  drag.suppressClick = true;
  setTimeout(() => {
    drag.suppressClick = false;
  }, 0);
  if (cancelled) return;
  const target = slotAt(e.clientX, e.clientY);
  if (target) {
    const to = Number(target.dataset.slot);
    if (d.from != null && d.from !== to) {
      // Moving a slot onto another swaps them.
      const other = game.plan[to];
      game.place(to, d.id);
      if (other) game.place(d.from, other);
      else game.clearSlot(d.from);
      slotResults = [];
      render();
    } else if (d.from == null) placeInSlot(to, d.id);
  } else if (d.from != null) clearSlot(d.from); // dragged out of the plan
}
window.addEventListener('pointerup', (e) => endDrag(e));
window.addEventListener('pointercancel', (e) => endDrag(e, true));

// —— Controls ——
backBtn.addEventListener('click', back);
syncBtn.addEventListener('click', playPlan);
replayBtn.addEventListener('click', replay);
panLeft.addEventListener('click', () => chamber.panToward(-1));
panRight.addEventListener('click', () => chamber.panToward(1));
window.addEventListener('resize', renderPan);

window.addEventListener('keydown', (e) => {
  if (!game || e.altKey || e.ctrlKey || e.metaKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= CHARACTER_IDS.length) selectLens(CHARACTER_IDS[n - 1]);
  else if (e.key === 'Escape') back();
});

// —— Sound toggle (audio starts on first gesture; preference persists) ——
function renderSound(on) {
  soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  soundBtn.textContent = on ? 'Sound on' : 'Sound off';
}
renderSound(audio.enabled);
audio.onChange(renderSound);
soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  audio.unlock();
  audio.setEnabled(!audio.enabled);
});
const unlockOnce = () => audio.unlock();
window.addEventListener('pointerdown', unlockOnce, { passive: true });
window.addEventListener('keydown', unlockOnce);

// —— Boot ——
buildTeam();
InkController.fetchStory(`${import.meta.env.BASE_URL}story.json`)
  .then((ink) => {
    game = new NexusGame(ink);
    render();
    subtitles.say(game.arrive());
  })
  .catch((err) => {
    subtitles.say([{ text: err.message, speaker: null, id: 'error', fx: [] }]);
  });

// Debug / harness hook (dev server or ?debug): read-only helpers + prop screen points.
if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug')) {
  window.__nexusDebug = {
    chamber,
    get game() {
      return game;
    },
    view: () => game?.view(),
    line: () => subtitles.current,
    playing: () => playing,
    propScreenPoint: (id) => chamber.propScreenPoint(id),
    panToPlace: (id) => chamber.panToPlace(id),
    settled: () => chamber.cameraSettled,
    quality: () => chamber.post.tier,
    shot: () => chamber.stationCamera.shot,
    sparks: () => ({ k: chamber.sparks.k, untilNext: chamber.sparks.untilNext() }),
  };
}
