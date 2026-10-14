import * as THREE from 'three';
import { buildRoom, configureRoomRenderer } from './room.js';
import { NexusGate } from './gate.js';
import { NexusProps } from './props.js';
import { NexusClocks } from './clocks.js';
import { LensSystem } from './lenses.js';
import { TemporalMotes } from './particles.js';
import { StationCamera } from './stationCamera.js';
import { ViewportFraming } from './framing.js';
import { PointerPicker } from './interact.js';
import { PostFX, detectQuality } from './post.js';
import { PLACE_FOCUS, LAYOUT } from './layout.js';
import { CHARACTER, ROOM } from './palette.js';

const GATE_POINT = new THREE.Vector3(...LAYOUT.gate.center);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
// Frame-time cap. Default 0.1 s keeps animation stable through hitches; `?dtcap=1` lets very slow
// software-GL captures (SwiftShader ~1 fps) advance in real time so screenshots show settled states.
const DT_CAP = (() => {
  const v = Number(new URLSearchParams(window.location.search).get('dtcap'));
  return v > 0 && v <= 2 ? v : 0.1;
})();

/** The clocks and the arch are one place: the gate. */
const placeOf = (id) => (id && id.startsWith('clock') ? 'gate' : id);

/**
 * Time Nexus chamber — Three.js presentation for the open room.
 * The game (and so Ink) stays the rules brain: sync() is the only state input. Props are tap
 * targets that main.js hands back to the game; the chamber never changes game state itself.
 */
export class NexusChamber {
  constructor(canvas, { onPropTap, onHoverChange, onClockTick } = {}) {
    this.canvas = canvas;
    this.onPropTap = onPropTap;
    this.onHoverChange = onHoverChange;
    this.onClockTick = onClockTick;
    this.clock = new THREE.Clock();
    this.view = {
      lens: 'vibrion',
      at: 'room',
      flags: {},
      gateStep: 0,
      playing: false,
    };
    this.synced = false;
    this.bound = new Set();
    this.pointerHover = null;
    this.hovered = null;
    this.roomPan = 0.5;
    this.dragUntil = 0;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    configureRoomRenderer(this.renderer);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    this.stationCamera = new StationCamera(this.camera);
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
        this.pointerHover = placeOf(id);
        this._refreshHover();
      },
      onTap: (id) => {
        const place = placeOf(id);
        if (this.bound.has(place)) this.onPropTap?.(place);
      },
      onDrag: (dx) => this._dragPan(dx),
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

  // —— Game → chamber ——
  /** view = NexusGame.view() plus presentation-only gate playback ({ gateStep, playing }). */
  sync(view, { gateStep = 0, playing = false } = {}) {
    const prevLens = this.view.lens;
    const f = view.flags;
    this.view = { ...view, gateStep, playing };
    const atGate = view.at === 'gate';
    this.props.sync({ ...f, gateStep });
    this.clocks.sync({ atGate, gateStep, sealed: f.gateClear, playing });
    this.gate.setState({ gateStep, sealed: f.gateClear, atGate, ended: view.at === 'end' });
    this.stationCamera.setPlace(view.at);
    this.lenses.setActive(view.lens);
    if (this.synced && prevLens !== view.lens) this._activationFlash(view.lens);
    this.synced = true;
  }

  /** Places that answer a tap right now (room: places you can walk to; inside: the thing to act on). */
  setBindings(ids) {
    this.bound = new Set(ids);
    this.props.setBound(ids);
    this.clocks.setBound(ids.includes('gate') ? ['clock0', 'clock1', 'clock2', 'clock3'] : []);
    this._refreshHover(true);
  }

  /** Narrow screens: look around the open room by dragging sideways. */
  _dragPan(dx) {
    if (this.view.at !== 'room') return;
    const range = this.framing.panRange(this.canvas.clientWidth, this.canvas.clientHeight);
    if (!range) return;
    this.roomPan = THREE.MathUtils.clamp(this.roomPan - dx / range, 0, 1);
    this.dragUntil = performance.now() + 120;
  }

  /** Pan the room crop toward a place (used by the edge arrows on narrow screens). */
  panToward(direction) {
    if (this.view.at !== 'room') return;
    this.roomPan = THREE.MathUtils.clamp(this.roomPan + direction * 0.5, 0, 1);
  }

  get canPan() {
    return this.view.at === 'room' && this.framing.cropping;
  }

  _refreshHover(announce = false) {
    const id = this.pointerHover && this.bound.has(this.pointerHover) ? this.pointerHover : null;
    this.canvas.style.cursor = id ? 'pointer' : '';
    if (id === this.hovered) {
      if (announce) this.onHoverChange?.(id);
      return;
    }
    this.hovered = id;
    this.props.setHover(id);
    this.clocks.setHover(id === 'gate' ? 'clock1' : null);
    this.gate.setHover(id === 'gate');
    this.onHoverChange?.(id);
  }

  // —— Feedback events (from main.js) ——
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
    } else if (type === 'move') {
      this.post.flash(0.15);
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

  /** World point of what the player is looking at (portrait crop focus + flash placement). */
  _subjectPoint(target = new THREE.Vector3()) {
    const { at, flags = {} } = this.view;
    if (at === 'gate') return target.copy(this.clocks.group.position);
    const f = this.props.focusPoint(at);
    if (f && at === 'panel' && flags.panelLive && !flags.panelClear) {
      // Once the panel is live the jammed lever is the subject: keep it in a narrow crop too.
      return target.copy(f).lerp(this.props.stuckLever.getWorldPosition(_w), 0.55);
    }
    if (f) return target.copy(f);
    const p = PLACE_FOCUS[at] ?? PLACE_FOCUS.room;
    return target.set(p[0], p[1], p[2]);
  }

  /** Anne's timing brackets: on the thing she is looking at; the first clock at the gate. */
  _bracketPoint() {
    const { at } = this.view;
    if (at === 'gate') return this.clocks.clockWorldPosition(0, _v);
    return this.props.focusPoint(at);
  }

  /** Client-space point for a prop (used by the capture harness to tap props). */
  propScreenPoint(id) {
    let p;
    if (id === 'gate') p = GATE_POINT.clone();
    else if (id.startsWith('clock')) p = this.clocks.clockWorldPosition(Number(id.slice(5)), new THREE.Vector3());
    else p = this.props.focusPoint(id)?.clone();
    if (!p) return null;
    if (id === 'levers') p.y = 0.45;
    if (id === 'corridor') p.set(LAYOUT.traps[1][0], 0.26, LAYOUT.traps[1][1]);
    p.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + (p.x * 0.5 + 0.5) * rect.width, y: rect.top + (-p.y * 0.5 + 0.5) * rect.height };
  }

  /** Point the room crop at a place (capture harness / keyboard entry on narrow screens). */
  panToPlace(id) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const range = this.framing.panRange(w, h);
    if (!range) return;
    const p = id === 'gate' ? GATE_POINT.clone() : this.props.focusPoint(id)?.clone();
    if (!p) return;
    const cam = this.camera.clone();
    cam.aspect = 16 / 9;
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
    p.project(cam);
    const fullWidth = range + w;
    const px = (p.x * 0.5 + 0.5) * fullWidth;
    this.roomPan = THREE.MathUtils.clamp((px - w / 2) / range, 0, 1);
  }

  get cameraSettled() {
    return this.stationCamera.settled;
  }

  _onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.post.setSize(w, h);
    this.clocks.setAspect(w / h);
    this.stationCamera.setAspect(w / h);
    this._frame(true);
  }

  _frame(resizeOnly = false) {
    const frameDt = resizeOnly ? 0 : this.clock.getDelta();
    const dt = Math.min(frameDt, DT_CAP);
    const v = this.view;
    const f = v.flags || {};
    const atGate = v.at === 'gate';

    if (!resizeOnly) {
      const t = this.clock.elapsedTime;
      this.stationCamera.update(dt);
      this.gate.update(t, dt);
      this.props.update(t, dt);
      this.clocks.update(t, dt);
      this.motes.update(t, dt, { active: v.lens, atGate, sealed: f.gateClear });

      const sync = f.gateClear ? 1 : atGate ? (v.gateStep / 4) * 0.5 : 0;
      this.room.update(t, dt, { sync });

      const clockPositions = this.clocks.clocks.map((c) => c.root.getWorldPosition(new THREE.Vector3()));
      this.lenses.update({
        t,
        dt,
        camera: this.camera,
        at: v.at,
        flags: f,
        gateStep: v.gateStep,
        focus: this._bracketPoint(),
        clocks: clockPositions,
        clockScale: this.clocks.group.scale.x,
      });

      const modeColor = CHARACTER[v.lens]?.main ?? ROOM.primary;
      this.modeLight.color.lerp(new THREE.Color(modeColor), 1 - Math.exp(-4 * dt));
      this.modeLight.intensity += (0.55 - this.modeLight.intensity) * (1 - Math.exp(-3 * dt));
      this.flash = Math.max(0, this.flash - dt * this.flash * 3.2 - dt * 2);
      this.flashLight.intensity = this.flash;
    }

    const inRoom = v.at === 'room';
    this.framing.update(this.canvas.clientWidth, this.canvas.clientHeight, dt, this._subjectPoint(), {
      subjectFrac: atGate ? 0.3 : 0.36,
      panX: inRoom ? this.roomPan : null,
      snap: resizeOnly || (inRoom && performance.now() < this.dragUntil),
    });

    if (!resizeOnly) this.post.render(dt, frameDt);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this._resizeObserver?.disconnect();
    this.renderer.setAnimationLoop(null);
    this.post.dispose();
    this.renderer.dispose();
  }
}
