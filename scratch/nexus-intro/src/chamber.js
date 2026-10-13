import * as THREE from 'three';
import { buildRoom, configureRoomRenderer } from './room.js';
import { NexusGate } from './gate.js';
import { NexusProps } from './props.js';
import { NexusClocks } from './clocks.js';
import { LensSystem } from './lenses.js';
import { TemporalMotes } from './particles.js';
import { CameraBeat } from './cameraBeat.js';
import { ViewportFraming } from './framing.js';
import { PointerPicker } from './interact.js';
import { PostFX, detectQuality } from './post.js';
import { BEAT_FOCUS, LAYOUT } from './layout.js';
import { CHARACTER, ROOM } from './palette.js';

const GATE_POINT = new THREE.Vector3(...LAYOUT.gate.center);
const _v = new THREE.Vector3();
// Frame-time cap. Default 0.1 s keeps animation stable through hitches; `?dtcap=1` lets very slow
// software-GL captures (SwiftShader ~1 fps) advance in real time so screenshots show settled states.
const DT_CAP = (() => {
  const v = Number(new URLSearchParams(window.location.search).get('dtcap'));
  return v > 0 && v <= 2 ? v : 0.1;
})();

/**
 * Time Nexus chamber — Three.js presentation for the Ink episode.
 * Ink stays the rules brain: syncFromInk() is the only state input. Props are tap targets that
 * main.js resolves to choices already on the rail; the chamber never advances the story itself.
 */
export class NexusChamber {
  constructor(canvas, { onPropTap, onHoverChange, onClockTick } = {}) {
    this.canvas = canvas;
    this.onPropTap = onPropTap;
    this.onHoverChange = onHoverChange;
    this.onClockTick = onClockTick;
    this.clock = new THREE.Clock();
    this.state = { active: 'vibrion', currentBeat: null, beat5Step: 0, beat5Clear: false };
    this.synced = false;
    this.bound = new Set();
    this.pointerHover = null;
    this.linkedHover = null;
    this.hovered = null;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    configureRoomRenderer(this.renderer);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    this.cameraBeat = new CameraBeat(this.camera);
    this.framing = new ViewportFraming(this.camera);

    const quality = detectQuality();
    this.post = new PostFX(this.renderer, this.scene, this.camera, quality);

    this.room = buildRoom(this.scene, this.renderer);
    this.gate = new NexusGate(this.scene);
    this.gate.targets.forEach((m) => {
      m.userData.propId = 'gate';
    });
    this.props = new NexusProps(this.scene);
    this.clocks = new NexusClocks(this.scene);
    this.clocks.onTick = (i, info) => this.onClockTick?.(i, info);
    this.lenses = new LensSystem(this.scene);
    this.motes = new TemporalMotes(this.scene, this.post.settings.motes);
    this.targets = [...this.props.targets, ...this.clocks.targets, ...this.gate.targets];

    this.post.onTierChange = (tier, s) => {
      this.room.setShadowMapSize(s.shadowMap);
      this.motes.build(s.motes);
    };
    this.room.setShadowMapSize(this.post.settings.shadowMap);

    // Lens tint + activation flash lights.
    // Hemisphere = diffuse-only tint, so the active lens colors the room without a floor hotspot.
    this.modeLight = new THREE.HemisphereLight(CHARACTER.vibrion.main, 0x05060c, 0);
    this.flashLight = new THREE.PointLight(0xffffff, 0, 18, 1.4);
    this.flashLight.position.set(0, 2.5, 2);
    this.scene.add(this.modeLight, this.flashLight);
    this.flash = 0;

    this.picker = new PointerPicker(canvas, this.camera, () => this.targets, {
      onHover: (id) => {
        this.pointerHover = id;
        this._refreshHover();
      },
      onTap: (id) => {
        if (this.bound.has(id)) this.onPropTap?.(id);
      },
    });

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._onResize);
      this._resizeObserver.observe(canvas);
    }
    this._onResize();
    this.renderer.setAnimationLoop(() => this._frame());
  }

  // —— Ink → chamber ——
  syncFromInk(state) {
    const prevActive = this.state.active;
    this.state = { ...state, currentBeat: state.currentBeat == null ? null : String(state.currentBeat) };
    const beat = this.state.currentBeat;
    const onBeat5 = beat === '5';
    this.props.sync(state);
    this.clocks.sync({ onBeat5, beat5Step: state.beat5Step, beat5Clear: state.beat5Clear });
    this.gate.setState({ beat5Step: state.beat5Step, beat5Clear: state.beat5Clear, onBeat5, ended: beat === '6' });
    this.cameraBeat.syncFromInk({ beat5Step: state.beat5Step, beat5Clear: state.beat5Clear, inBeatFive: onBeat5 });
    this.lenses.setActive(state.active);
    if (this.synced && prevActive !== state.active) this._activationFlash(state.active);
    this.synced = true;
  }

  /** Prop ids that currently resolve to an Ink choice on the rail. */
  setBindings(ids) {
    this.bound = new Set(ids);
    this.props.setBound(ids);
    this.clocks.setBound(ids);
    this._refreshHover(true);
  }

  /** Rail button hover/focus → highlight its prop (two-way link with the chamber). */
  setLinkedHover(id) {
    this.linkedHover = id;
    this._refreshHover();
  }

  _refreshHover(announce = false) {
    const pointer = this.pointerHover && this.bound.has(this.pointerHover) ? this.pointerHover : null;
    const id = pointer ?? (this.linkedHover && this.bound.has(this.linkedHover) ? this.linkedHover : null);
    this.canvas.style.cursor = pointer ? 'pointer' : '';
    if (id === this.hovered) {
      if (announce) this.onHoverChange?.(pointer);
      return;
    }
    this.hovered = id;
    this.props.setHover(id);
    this.clocks.setHover(id);
    this.gate.setHover(id === 'gate');
    this.onHoverChange?.(pointer);
  }

  // —— Feedback events (from main.js outcome detection) ——
  feedback({ type, prop, charId }) {
    const color = CHARACTER[charId]?.flash ?? ROOM.temporalWhite;
    if (type === 'clear') {
      if (prop?.startsWith('clock')) this._clockPulse(Number(prop.slice(5)), color);
      else if (prop) this.props.pulse(prop, color);
      this.post.flash(0.45);
      this._flashLight(color, 26);
    } else if (type === 'fail') {
      if (prop?.startsWith('clock') || prop === 'gate') {
        this.clocks.fail();
        this.gate.flashWarning();
      } else if (prop) this.props.fail(prop);
      this._flashLight(ROOM.warning, 14);
    } else if (type === 'sync') {
      this.gate.flashPulse(1);
      this.post.flash(1.1);
      this._flashLight(ROOM.temporalWhite, 60);
      this.props.burst(new THREE.Vector3(0, 0, LAYOUT.gate.z + 1.2), ROOM.temporalWhite, { from: 0.5, to: 8, dur: 1.8, y: 0.34 });
    } else if (type === 'beat') {
      this.post.flash(0.2);
    }
  }

  _clockPulse(i, color) {
    const p = this.clocks.clockWorldPosition(i, new THREE.Vector3());
    this.props.burst(new THREE.Vector3(p.x, 0, LAYOUT.gate.z + 1.0), color, { from: 0.3, to: 2.6, dur: 0.9, y: 0.34 });
  }

  _flashLight(hex, intensity) {
    this.flashLight.color.set(hex);
    const f = this._subjectPoint(_v);
    this.flashLight.position.set(f.x, f.y + 3.2, f.z + 1.6);
    this.flash = Math.max(this.flash, intensity * (this.reducedMotion ? 0.5 : 1));
  }

  _activationFlash(charId) {
    const c = CHARACTER[charId];
    if (!c) return;
    const focus = this._subjectPoint();
    this.props.burst(new THREE.Vector3(focus.x, 0, focus.z), c.flash, { from: 0.4, to: 5.5, dur: 1.1, y: 0.03, intensity: 3.5 });
    this._flashLight(c.flash, 22);
    this.post.flash(0.35);
  }

  /** World point of the current beat's subject (portrait crop focus + Anne's brackets). */
  _subjectPoint(target = new THREE.Vector3()) {
    const beat = this.state.currentBeat;
    if (beat === '5' && !this.state.beat5Clear) return target.copy(this.clocks.group.position);
    // Follow the prop that is tappable right now (e.g. beat 0 "Continue" → corridor) so the
    // portrait crop never hides the thing the rail says you can act on.
    if (this.bound.size === 1) {
      const [only] = this.bound;
      if (only !== 'gate' && !only.startsWith('clock')) {
        const f = this.props.focusPoint(only);
        if (f) return target.copy(f);
      }
    }
    const f = BEAT_FOCUS[beat] ?? BEAT_FOCUS[0];
    return target.set(f[0], f[1], f[2]);
  }

  _bracketPoint() {
    const beat = this.state.currentBeat;
    if (beat === '1') return this.props.focusPoint('corridor');
    if (beat === '2' || beat === '3') return this.props.focusPoint('levers');
    if (beat === '4') return this.props.focusPoint('panel');
    if (beat === '5' && !this.state.beat5Clear) return this.clocks.clockWorldPosition(Math.min(this.state.beat5Step, 3), _v);
    return null;
  }

  /** Client-space point for a prop (used by the debug harness to tap props). */
  propScreenPoint(id) {
    let p;
    if (id === 'gate') p = GATE_POINT.clone();
    else if (id === 'clocks') p = this.clocks.clockWorldPosition(Math.min(this.state.beat5Step ?? 0, 3), new THREE.Vector3());
    else if (id.startsWith('clock')) p = this.clocks.clockWorldPosition(Number(id.slice(5)), new THREE.Vector3());
    else p = this.props.focusPoint(id)?.clone();
    if (!p) return null;
    if (id === 'levers') p.y = 0.45;
    if (id === 'corridor') p.set(LAYOUT.traps[1][0], 0.26, LAYOUT.traps[1][1]);
    p.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + (p.x * 0.5 + 0.5) * rect.width, y: rect.top + (-p.y * 0.5 + 0.5) * rect.height };
  }

  _onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.post.setSize(w, h);
    this.clocks.setAspect(w / h);
    this.framing.update(w, h, 0, this._subjectPoint(), { snap: true });
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), DT_CAP);
    const t = this.clock.elapsedTime;
    const s = this.state;
    const beat = s.currentBeat;
    const onBeat5 = beat === '5';

    this.cameraBeat.update(dt);
    this.gate.update(t, dt);
    this.props.update(t, dt);
    this.clocks.update(t, dt);
    this.motes.update(t, dt, { active: s.active, onBeat5, beat5Clear: s.beat5Clear });

    const sync = s.beat5Clear ? 1 : onBeat5 ? (s.beat5Step / 4) * 0.5 : 0;
    this.room.update(t, dt, { sync });

    const clockPositions = this.clocks.clocks.map((c) => c.root.getWorldPosition(new THREE.Vector3()));
    this.lenses.update({
      t,
      dt,
      camera: this.camera,
      beat,
      focus: this._bracketPoint(),
      beat1Clear: s.beat1Clear,
      beat4Clear: s.beat4Clear,
      beat5Step: s.beat5Step,
      clocks: clockPositions,
      clockScale: this.clocks.group.scale.x,
    });

    const modeColor = CHARACTER[s.active]?.main ?? ROOM.primary;
    this.modeLight.color.lerp(new THREE.Color(modeColor), 1 - Math.exp(-4 * dt));
    this.modeLight.intensity += (0.55 - this.modeLight.intensity) * (1 - Math.exp(-3 * dt));
    this.flash = Math.max(0, this.flash - dt * this.flash * 3.2 - dt * 2);
    this.flashLight.intensity = this.flash;

    this.framing.update(this.canvas.clientWidth, this.canvas.clientHeight, dt, this._subjectPoint(), {
      subjectFrac: onBeat5 && !s.beat5Clear ? 0.36 : 0.4,
    });

    this.post.render(dt);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this._resizeObserver?.disconnect();
    this.renderer.setAnimationLoop(null);
    this.post.dispose();
    this.renderer.dispose();
  }
}
