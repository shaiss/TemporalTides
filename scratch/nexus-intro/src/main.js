import { InkController, MODES } from './inkStory.js';
import { NexusChamber } from './chamber.js';

const storyEl = document.getElementById('story');
const narrativeEl = document.getElementById('narrative-line');
const choicesEl = document.getElementById('choices');
const hudBeatEl = document.getElementById('hud-beat');
const chipsEl = document.getElementById('mode-chips');
const appEl = document.getElementById('app');
const canvas = document.getElementById('chamber-canvas');

const chamber = new NexusChamber(canvas);
const ink = new InkController();

function renderChips(activeId) {
  chipsEl.innerHTML = '';
  MODES.forEach((m) => {
    const span = document.createElement('span');
    span.className = 'chip' + (m.id === activeId ? ' active' : '');
    span.setAttribute('aria-disabled', 'true');
    span.title = 'Display only — switch lens via Ink choices';
    span.innerHTML = `${m.label}<span class="ability">${m.ability}</span>`;
    chipsEl.appendChild(span);
  });
}

function renderUi(state) {
  storyEl.textContent = state.storyText;
  const line = state.narrativeLine || state.hudCue;
  narrativeEl.textContent = line;
  hudBeatEl.textContent = state.currentBeat != null ? `Beat ${state.currentBeat}` : 'Beat —';
  appEl.dataset.mode = state.active;
  appEl.dataset.beat = state.currentBeat ?? '';
  if (state.currentBeat === '5' || state.currentBeat === 5) {
    appEl.classList.add('beat-five');
  } else {
    appEl.classList.remove('beat-five');
  }
  renderChips(state.active);
  chamber.syncFromInk(state);

  choicesEl.innerHTML = '';
  state.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = choice.text;
    if (choice.isMode) btn.classList.add('mode-choice');
    btn.addEventListener('click', () => ink.choose(i));
    choicesEl.appendChild(btn);
  });
}

ink.subscribe(renderUi);

ink.load().catch((err) => {
  narrativeEl.textContent = err.message;
});
