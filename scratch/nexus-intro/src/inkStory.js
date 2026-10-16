import { Story } from 'inkjs';

export const CHARACTERS = [
  { id: 'anne', name: 'Anne', ability: 'Foresight' },
  { id: 'maya', name: 'Maya', ability: 'Pattern Sense' },
  { id: 'eli', name: 'Eli', ability: 'Kinetic Rush' },
  { id: 'vibrion', name: 'Vibrion', ability: 'Vibrational Manipulation' },
];

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);

/** Parse `#say:anne #id:corr-anne #fx:clear` style tags into a line record. */
export function parseLine(text, tags = []) {
  const line = { text: text.trim(), speaker: null, id: null, fx: [] };
  tags.forEach((raw) => {
    const tag = raw.trim();
    const i = tag.indexOf(':');
    const key = i < 0 ? tag : tag.slice(0, i);
    const value = i < 0 ? '' : tag.slice(i + 1);
    if (key === 'say') line.speaker = value;
    else if (key === 'id') line.id = value;
    else if (key === 'fx') line.fx.push(value);
  });
  return line;
}

/**
 * Thin wrapper over an inkjs Story. The story has no choice menus: callers set variables, run a
 * knot by path, and get back the spoken lines it produced. Ink owns every rule and every flag.
 */
export class InkController {
  constructor(content) {
    this.story = new Story(content);
  }

  static async fetchStory(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Missing story.json — run npm run compile');
    return new InkController(await res.json());
  }

  get(name) {
    return this.story.variablesState[name];
  }

  set(name, value) {
    this.story.variablesState[name] = value;
  }

  call(fn, ...args) {
    return this.story.EvaluateFunction(fn, args);
  }

  /** Run a knot (or knot.stitch) to its end and return the lines it spoke. */
  run(path) {
    this.story.ChoosePathString(path);
    const lines = [];
    while (this.story.canContinue) {
      const text = this.story.Continue();
      if (text.trim()) lines.push(parseLine(text, this.story.currentTags));
    }
    return lines;
  }

  reset() {
    this.story.ResetState();
  }
}
