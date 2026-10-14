import { InkController, MODES } from './inkStory.js';
import { NexusChamber } from './chamber.js';
import { NexusAudio } from './audio.js';
import { detectOutcome, resolveBindings } from './bindings.js';

const storyEl = document.getElementById('story');
const narrativeEl = document.getElementById('narrative-line');
const choicesEl = document.getElementById('choices');
const hudBeatEl = document.getElementById('hud-beat');
const chipsEl = document.getElementById('mode-chips');
const appEl = document.getElementById('app');
const canvas = document.getElementById('chamber-canvas');
const soundBtn = document.getElementById('sound-toggle');

const ink = new InkController();
const audio = new NexusAudio();
let bindings = new Map();
let prevState = null;
let pendingChoice = null;
let lastHoverProp = null;

const chamber = new NexusChamber(canvas, {
  onPropTap: (propId) => {
    const index = bindings.get(propId);
    if (index != null) choose(index, 'prop');
  },
  onHoverChange: (propId) => {
    choicesEl.querySelectorAll('button').forEach((b) => b.classList.toggle('linked', !!propId && b.dataset.prop === propId));
    if (propId && propId !== lastHoverProp) audio.hover();
    lastHoverProp = propId;
  },
  onClockTick: (i, info) => {
    if (prevState?.currentBeat === '5') audio.tick(i, info);
  },
});

function choose(index, source = 'rail') {
  const state = ink.getState();
  const choice = state.choices[index];
  if (!choice) return;
  pendingChoice = { ...choice, index, source };
  ink.choose(index);
}

function renderChips(activeId) {
  chipsEl.innerHTML = '';
  MODES.forEach((m) => {
    const span = document.createElement('span');
    span.className = 'chip' + (m.id === activeId ? ' active' : '');
    span.dataset.mode = m.id;
    span.setAttribute('aria-disabled', 'true');
    span.title = 'Display only — switch lens via Ink choices';
    span.innerHTML = `${m.label}<span class="ability">${m.ability}</span>`;
    chipsEl.appendChild(span);
  });
}

function retrigger(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // restart CSS animation
  el.classList.add(cls);
}

function setNarrative(line) {
  if (narrativeEl.textContent === line) return;
  narrativeEl.textContent = line;
  retrigger(narrativeEl, 'enter');
}

function runFeedback(events) {
  events.forEach((ev) => {
    chamber.feedback(ev);
    if (ev.type === 'clear') {
      audio.clear(ev.charId);
      retrigger(hudBeatEl, 'pop');
    } else if (ev.type === 'fail') {
      audio.fail();
      retrigger(choicesEl, 'shake');
    } else if (ev.type === 'mode') {
      audio.switchLens(ev.charId);
      retrigger(chipsEl, 'swap');
    } else if (ev.type === 'sync') {
      audio.sync();
    } else if (ev.type === 'beat') {
      audio.beat();
      retrigger(hudBeatEl, 'pop');
    }
  });
}

function renderUi(state) {
  const events = detectOutcome(prevState, state, pendingChoice);
  pendingChoice = null;
  prevState = state;

  storyEl.textContent = state.storyText;
  setNarrative(state.narrativeLine || state.hudCue);
  hudBeatEl.textContent = state.currentBeat != null ? `Beat ${state.currentBeat}` : 'Beat —';
  appEl.dataset.mode = state.active;
  appEl.dataset.beat = state.currentBeat ?? '';
  appEl.classList.toggle('beat-five', String(state.currentBeat) === '5');
  appEl.classList.toggle('ended', state.ended);
  renderChips(state.active);

  chamber.syncFromInk(state);
  bindings = resolveBindings(state);
  audio.setTension?.(state.beat5Clear ? 1 : String(state.currentBeat) === '5' ? state.beat5Step / 4 : 0);

  const propForChoice = new Map([...bindings.entries()].map(([prop, i]) => [i, prop]));
  choicesEl.innerHTML = '';
  state.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = choice.text;
    btn.dataset.kind = choice.kind;
    btn.style.setProperty('--i', String(i));
    if (choice.isMode) btn.classList.add('mode-choice');
    const prop = propForChoice.get(i);
    if (prop) {
      btn.dataset.prop = prop;
      btn.classList.add('has-prop');
      const enter = () => chamber.setLinkedHover(prop);
      const leave = () => chamber.setLinkedHover(null);
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('focus', enter);
      btn.addEventListener('mouseleave', leave);
      btn.addEventListener('blur', leave);
    }
    btn.addEventListener('click', () => {
      chamber.setLinkedHover(null);
      choose(i, 'rail');
    });
    choicesEl.appendChild(btn);
  });

  // After the rail exists so a prop already under the pointer re-links to its new button.
  chamber.setBindings([...bindings.keys()]);
  runFeedback(events);
}

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

ink.subscribe(renderUi);

ink.load().catch((err) => {
  narrativeEl.textContent = err.message;
});

// Debug / harness hook (dev server or ?debug): read-only helpers + prop screen points.
if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug')) {
  window.__nexusDebug = {
    chamber,
    state: () => ink.getState(),
    bindings: () => Object.fromEntries(bindings),
    propScreenPoint: (id) => chamber.propScreenPoint(id),
    quality: () => chamber.post.tier,
  };
}
