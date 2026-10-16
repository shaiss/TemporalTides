/**
 * Procedural chamber audio (WebAudio, no sample assets). TimeNexus.md · Auditory: constant subtle
 * harmonic drone, portal activation as a deep chime, unusual clarity with slight echo.
 * Starts only after a user gesture; preference persists in localStorage ('nexus-sound').
 */
const PITCH = { anne: 659.25, maya: 783.99, eli: 987.77, vibrion: 587.33 };
const PREF_KEY = 'nexus-sound';

function impulse(ctx, seconds = 2.6, decay = 3.2) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export class NexusAudio {
  constructor() {
    this.ctx = null;
    let pref = null;
    try {
      pref = window.localStorage.getItem(PREF_KEY);
    } catch {
      /* storage blocked */
    }
    this.enabled = pref !== 'off';
    this.lastTick = 0;
    this.listeners = new Set();
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  _emit() {
    this.listeners.forEach((fn) => fn(this.enabled));
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && this.enabled) this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse(ctx);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.32;
    this.reverb.connect(this.wet).connect(this.master);
    this._startDrone();
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (this.enabled) this.ctx.resume();
    });
  }

  setEnabled(on) {
    this.enabled = on;
    try {
      window.localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, now, 0.08);
      if (on && this.ctx.state === 'suspended') this.ctx.resume();
    }
    this._emit();
  }

  get live() {
    return !!this.ctx && this.enabled && this.ctx.state === 'running';
  }

  _out(gainValue, pan = 0, wet = true) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = gainValue;
    let node = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      node = p;
    }
    node.connect(this.master);
    if (wet) node.connect(this.reverb);
    return g;
  }

  _startDrone() {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.0;
    bus.gain.setTargetAtTime(0.05, ctx.currentTime, 2.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.Q.value = 0.7;
    bus.connect(lp).connect(this.master);
    lp.connect(this.reverb);
    [
      [110, 'sine', 0.5],
      [110.6, 'triangle', 0.25],
      [164.81, 'sine', 0.28],
      [220.4, 'sine', 0.16],
      [329.2, 'sine', 0.05],
    ].forEach(([f, type, gain]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(bus);
      o.start();
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    this.droneBus = bus;
    this.droneFilter = lp;
  }

  /** Brighten the drone as the clocks come into sync (0..1). */
  setTension(x) {
    if (!this.ctx) return;
    this.droneFilter.frequency.setTargetAtTime(700 + x * 900, this.ctx.currentTime, 0.6);
  }

  _bell(freq, { when = 0, gain = 0.16, decay = 1.8, pan = 0 } = {}) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + when;
    const out = this._out(1, pan);
    [
      [1, 1],
      [2.76, 0.32],
      [5.4, 0.12],
      [0.5, 0.18],
    ].forEach(([ratio, amp]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain * amp, t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * (ratio > 2 ? 0.45 : 1));
      o.connect(g).connect(out);
      o.start(t0);
      o.stop(t0 + decay + 0.1);
    });
  }

  _noise(seconds) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  switchLens(charId) {
    if (!this.live) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const src = this._noise(0.45);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(260, t0);
    bp.frequency.exponentialRampToValueAtTime(3200, t0 + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
    src.connect(bp).connect(g).connect(this._out(1, 0));
    src.start(t0);
    this._bell(PITCH[charId] ?? 600, { when: 0.12, gain: 0.07, decay: 1.2 });
  }

  clear(charId) {
    if (!this.live) return;
    const f = PITCH[charId] ?? 600;
    this._bell(f, { gain: 0.16 });
    this._bell(f * 1.5, { when: 0.09, gain: 0.1 });
    this._bell(f * 2, { when: 0.18, gain: 0.08, decay: 2.4 });
  }

  fail() {
    if (!this.live) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t0);
    lp.frequency.exponentialRampToValueAtTime(180, t0 + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    lp.connect(g).connect(this._out(1, 0, false));
    [98, 103.8].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.7, t0 + 0.4);
      o.connect(lp);
      o.start(t0);
      o.stop(t0 + 0.5);
    });
  }

  /** Clock tick — each desynced clock ticks at its own tempo; locked clocks share one pitch. */
  tick(i, { locked = false, current = false } = {}) {
    if (!this.live) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (now - this.lastTick < 0.035) return;
    this.lastTick = now;
    const src = this._noise(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = locked ? 2600 : 1700 + i * 520;
    bp.Q.value = 6;
    const g = ctx.createGain();
    const level = locked ? 0.09 : current ? 0.11 : 0.05;
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(bp).connect(g).connect(this._out(1, (i - 1.5) * 0.4));
    src.start(now);
  }

  /**
   * Corridor spark: a crackle over the first clock's click. The first gate clock keeps the
   * corridor's rhythm, so this is also its tick. `level` = how close the corridor is (0..1).
   */
  spark(level = 1) {
    if (!this.live || level <= 0) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [0, 0.018].forEach((off, n) => {
      const t0 = now + off;
      const src = this._noise(0.05);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2400 + n * 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09 * level, t0 + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      src.connect(hp).connect(g).connect(this._out(1, -0.4));
      src.start(t0);
    });
    const click = this._noise(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08 * level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    click.connect(bp).connect(g).connect(this._out(1, -0.4));
    click.start(now);
  }

  /**
   * Crystal chime (TimeNexus.md · Singing Crystals). Out of phase: a ragged, slightly detuned
   * ripple round the rim. In phase: one chord, in tune. The outlier never sounds.
   */
  chime(events, { inPhase = false } = {}) {
    if (!this.live) return;
    const scale = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51];
    events.forEach((e, n) => {
      const detune = inPhase ? 1 : Math.pow(2, (((n % 3) - 1) * 0.35) / 12);
      this._bell(scale[n % scale.length] * detune, {
        when: e.delay,
        gain: inPhase ? 0.045 : 0.022,
        decay: inPhase ? 3.4 : 1.6,
        pan: e.pan * 0.8,
      });
    });
  }

  /** Gate seal: all clocks agree — chord + deep portal chime. */
  sync() {
    if (!this.live) return;
    [293.66, 369.99, 440, 587.33, 659.25].forEach((f, k) => this._bell(f, { when: k * 0.07, gain: 0.11, decay: 3.2, pan: (k - 2) * 0.25 }));
    this._bell(73.42, { when: 0.05, gain: 0.3, decay: 4.5 });
  }

  /** Walking up to a place, or back into the room. */
  move() {
    if (!this.live) return;
    this._bell(146.83, { gain: 0.12, decay: 2.6 });
  }

  hover() {
    if (!this.live) return;
    this._bell(1318.5, { gain: 0.02, decay: 0.35 });
  }
}
