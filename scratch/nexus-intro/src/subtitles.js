/** Reading time for one line: about three words a second, with a floor so short lines can land. */
export function lineDuration(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.min(8000, Math.max(2600, 1400 + words * 340));
}

/**
 * One spoken line at a time, shown as a subtitle at the speaker's portrait. New looks replace
 * whatever is queued; a tap on the subtitle skips to the next line. The last line stays on screen
 * (dimmed) until something new is said.
 */
export class Subtitles {
  constructor(el, { names = {}, onLine } = {}) {
    this.el = el;
    this.whoEl = el.querySelector('[data-who]');
    this.textEl = el.querySelector('[data-line]');
    this.names = names;
    this.onLine = onLine;
    this.queue = [];
    this.current = null;
    this.timer = 0;
    this.waiters = [];
    el.addEventListener('click', () => this.skip());
  }

  /** Show lines in order. Resolves when they have all been shown (or were replaced). */
  say(lines, { replace = true } = {}) {
    if (replace) {
      this.queue = [];
      this._release();
    }
    this.queue.push(...lines);
    const done = new Promise((resolve) => this.waiters.push(resolve));
    if (replace || !this.current) this._next();
    return done;
  }

  skip() {
    if (this.current) this._next();
  }

  clear() {
    clearTimeout(this.timer);
    this.queue = [];
    this.current = null;
    this.el.hidden = true;
    this.el.removeAttribute('data-speaker');
    this._release();
    this.onLine?.(null);
  }

  get busy() {
    return Boolean(this.current);
  }

  _release() {
    const waiters = this.waiters;
    this.waiters = [];
    waiters.forEach((resolve) => resolve());
  }

  _next() {
    clearTimeout(this.timer);
    const line = this.queue.shift();
    if (!line) {
      this.current = null;
      this.el.classList.add('idle');
      this._release();
      this.onLine?.(null);
      return;
    }
    this.current = line;
    this.el.hidden = false;
    this.el.classList.remove('idle');
    this.el.dataset.speaker = line.speaker ?? '';
    this.whoEl.textContent = this.names[line.speaker] ?? '';
    this.textEl.textContent = line.text;
    this.el.classList.remove('enter');
    void this.el.offsetWidth; // restart the entry animation
    this.el.classList.add('enter');
    this.onLine?.(line);
    this.timer = setTimeout(() => this._next(), lineDuration(line.text));
  }
}
