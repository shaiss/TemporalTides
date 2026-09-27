import { Story } from 'inkjs';

export const MODES = [
  { id: 'anne', label: 'Anne', ability: 'Foresight' },
  { id: 'maya', label: 'Maya', ability: 'Pattern Sense' },
  { id: 'eli', label: 'Eli', ability: 'Kinetic Rush' },
  { id: 'vibrion', label: 'Vibrion', ability: 'Vibrational Manipulation' },
];

export const BEAT_CUES = {
  0: 'One lens at a time. · Wide chamber, clocks slightly out of sync.',
  1: 'Hazard options only Anne sees · Foresight overlay on the corridor.',
  2: 'She marks the pattern · sequence readable in Maya\'s lens.',
  3: 'Faster than careful hands · Eli\'s window on Maya\'s sequence.',
  4: 'Connected to the world\'s components · Vibrion on the dead panel.',
  5: 'Four clock faces disagree · sync clocks in order — Anne → Maya → Eli → Vibrion.',
  6: 'Resonance, not victory · team pattern under Vibrion\'s frame.',
};

export const MODE_CUES = {
  anne: 'HUD: Foresight — timing / hazard overlay',
  maya: 'HUD: Pattern Sense — strain marks & sequence',
  eli: 'HUD: Kinetic Rush — sync window / rush',
  vibrion: 'HUD: Vibrational Manipulation — world-grid coupling',
};

export class InkController {
  constructor() {
    this.story = null;
    this.storyText = '';
    this.currentBeat = null;
    this.tagMode = null;
    this.modeSwitchUi = false;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  readVar(name, fallback = null) {
    if (!this.story) return fallback;
    try {
      const v = this.story.variablesState[name];
      return v != null ? v : fallback;
    } catch {
      return fallback;
    }
  }

  readActive() {
    const v = this.readVar('active', 'vibrion');
    return String(v);
  }

  applyTags(tags) {
    (tags || []).forEach((raw) => {
      const tag = raw.trim();
      if (tag.startsWith('beat:')) this.currentBeat = tag.slice(5);
      if (tag.startsWith('mode:')) this.tagMode = tag.slice(5);
      if (tag === 'ui:mode_switch') this.modeSwitchUi = true;
    });
  }

  getHudCue() {
    const active = this.readActive();
    let cue = BEAT_CUES[this.currentBeat] || 'Time Nexus chamber — switch lens to see different choices.';
    if (this.modeSwitchUi) {
      cue = `Switch lens · ${MODE_CUES[active] || active}`;
    } else if (this.tagMode && MODE_CUES[this.tagMode]) {
      cue = MODE_CUES[this.tagMode];
    } else if (MODE_CUES[active]) {
      cue = `${cue.split(' · ')[0]} · ${MODE_CUES[active].replace('HUD: ', '')}`;
    }
    return cue;
  }

  getState() {
    const choices = this.story
      ? this.story.currentChoices.map((c) => ({
        text: c.text,
        isMode: /Anne —|Maya —|Eli —|Vibrion —|Switch active|Keep current/i.test(c.text),
      }))
      : [];
    return {
      storyText: this.storyText,
      choices,
      active: this.readActive(),
      currentBeat: this.currentBeat,
      hudCue: this.getHudCue(),
      beat5Step: Number(this.readVar('beat5_step', 0)),
      beat5Clear: Boolean(this.readVar('beat5_clear', false)),
      modeSwitchUi: this.modeSwitchUi,
    };
  }

  continueStory() {
    if (!this.story) return;
    this.modeSwitchUi = false;
    while (this.story.canContinue) {
      this.storyText += this.story.Continue();
      this.applyTags(this.story.currentTags);
    }
    this.notify();
  }

  choose(index) {
    if (!this.story) return;
    this.story.ChooseChoiceIndex(index);
    this.continueStory();
  }

  async load() {
    const storyUrl = new URL('story.json', import.meta.env.BASE_URL).href;
    const res = await fetch(storyUrl);
    if (!res.ok) throw new Error('Missing story.json — run npm run compile');
    const content = await res.json();
    this.story = new Story(content);
    this.continueStory();
  }
}
