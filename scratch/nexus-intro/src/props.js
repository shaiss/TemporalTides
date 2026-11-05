import * as THREE from 'three';
import { ROOM } from './palette.js';
import { LAYOUT } from './layout.js';
import { glowMaterial, structureMaterial } from './materials.js';
import { energyDashTexture, hazardTexture, panelCellsTexture } from './textures.js';
import { applyShadows } from './room.js';

const tmpColor = new THREE.Color();
const WARN = new THREE.Color(ROOM.warning);
const SPARK_HOT = new THREE.Color(0xffe2a0);

/**
 * Room props: hazard corridor, echo lever console, dead electrical panel with conduits to the gate.
 * Props are display + tap targets only — every state change comes from Ink flags via sync(); taps go
 * back to main.js, which asks the game (and so Ink) what they mean.
 */
export class NexusProps {
  constructor(scene) {
    this.scene = scene;
    this.state = { corridorClear: false, leversMarked: false, leversClear: false, panelLive: false, panelClear: false, gateStep: 0, gateClear: false };
    this.props = {};
    this.targets = [];
    this.bound = new Set();
    this.hovered = null;
    this.bursts = [];

    this._buildCorridor();
    this._buildLevers();
    this._buildPanel();
    this._buildBurstPool();
  }

  _register(id, { center, strips = [], ringRadius = 1.5, ringScaleZ = 1, ringY = 0.03, meshes = [] }) {
    const ringMat = glowMaterial(ROOM.temporalWhite, 1.5, { transparent: true, opacity: 0, additive: true, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(ringRadius * 0.94, ringRadius, 96), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(1, ringScaleZ, 1);
    ring.userData.baseY = ringScaleZ;
    ring.position.set(center.x, ringY, center.z);
    ring.renderOrder = 2;
    this.scene.add(ring);
    meshes.forEach((m) => {
      m.userData.propId = id;
      this.targets.push(m);
    });
    this.props[id] = {
      id,
      center,
      strips,
      ring,
      ringMat,
      hover: 0,
      pulse: 0,
      pulseColor: new THREE.Color(ROOM.temporalWhite),
      fail: 0,
      bound: 0,
    };
  }

  // —— Hazard corridor ——
  _buildCorridor() {
    const c = LAYOUT.corridor;
    const group = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(c.w, 0.2, c.len), structureMaterial(0x252f55, { metalness: 0.5, roughness: 0.3 }));
    deck.position.set(c.x, 0.1, c.z);
    group.add(deck);

    const stripMat = glowMaterial(ROOM.primary, 2.6);
    [-1, 1].forEach((side) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, c.len - 0.1), stripMat);
      strip.position.set(c.x + side * (c.w / 2 - 0.06), 0.215, c.z);
      group.add(strip);
      // Rail + posts on both sides.
      const postMat = structureMaterial(0x39447a, { metalness: 0.8, roughness: 0.25 });
      const posts = 5;
      for (let i = 0; i < posts; i++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), postMat);
        post.position.set(c.x + side * (c.w / 2 + 0.08), 0.5, c.z - c.len / 2 + 0.3 + (i * (c.len - 0.6)) / (posts - 1));
        group.add(post);
      }
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, c.len - 0.5, 8), glowMaterial(ROOM.secondary, 1.6));
      rail.rotation.x = Math.PI / 2;
      rail.position.set(c.x + side * (c.w / 2 + 0.08), 0.82, c.z);
      group.add(rail);
    });

    // Hazard plates (Nexus emergency red-gold while the corridor is unsafe).
    const hazard = hazardTexture();
    this.plates = LAYOUT.traps.map(([x, z]) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.06, 1.14), structureMaterial(0x161c36, { metalness: 0.8 }));
      frame.position.set(x, 0.22, z);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1420,
        roughness: 0.4,
        metalness: 0.6,
        emissive: ROOM.warning,
        emissiveMap: hazard,
        emissiveIntensity: 1.2,
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 1.0), mat);
      plate.position.set(x, 0.24, z);
      group.add(frame, plate);
      return { plate, mat, frame };
    });

    // Clean line through (revealed once Anne crosses).
    const pts = [
      [-3.35, 3.55],
      [-3.5, 2.6],
      [-4.25, 1.95],
      [-5.2, 1.2],
      [-5.0, 0.3],
      [-4.35, -0.25],
      [-4.2, -1.3],
      [-4.2, -2.7],
    ].map(([x, z]) => new THREE.Vector3(x, 0.235, z));
    const pathGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.035, 6);
    this.pathMat = glowMaterial(ROOM.temporalWhite, 2.4, { transparent: true, opacity: 1 });
    this.safePath = new THREE.Mesh(pathGeo, this.pathMat);
    this.safePathCount = pathGeo.index.count;
    this.safePathReveal = 0;
    pathGeo.setDrawRange(0, 0);
    group.add(this.safePath);

    applyShadows(group);
    this.safePath.castShadow = false;
    this.scene.add(group);
    this._register('corridor', {
      center: new THREE.Vector3(c.x, 0.5, 1.2),
      strips: [stripMat],
      ringRadius: 1.95,
      ringScaleZ: 1.75,
      ringY: 0.22,
      meshes: [deck, ...this.plates.map((p) => p.plate)],
    });
  }

  // —— Echo lever console ——
  _buildLevers() {
    const L = LAYOUT.levers;
    const cx = (L.xs[0] + L.xs[L.xs.length - 1]) / 2;
    const width = L.xs[L.xs.length - 1] - L.xs[0] + 1.0;
    const group = new THREE.Group();
    const bodyMat = structureMaterial(0x26305a, { metalness: 0.6, roughness: 0.3 });

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 0.95), bodyMat);
    plinth.position.set(cx, 0.25, L.z);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, 0.62, 0.1), bodyMat);
    back.position.set(cx, 0.81, L.z - 0.43);
    group.add(plinth, back);

    const stripMat = glowMaterial(ROOM.primary, 2.6);
    const frontStrip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.035, 0.03), stripMat);
    frontStrip.position.set(cx, 0.44, L.z + 0.49);
    group.add(frontStrip);

    // The closing "window" slot on the back panel (Eli's speed check).
    this.windowMat = glowMaterial(ROOM.accent, 1.2);
    this.windowSlot = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.09, 0.02), this.windowMat);
    this.windowSlot.position.set(cx, 0.86, L.z - 0.37);
    group.add(this.windowSlot);

    const housingMat = structureMaterial(0x1a2140, { metalness: 0.75 });
    const shaftMat = structureMaterial(0xaab3d6, { metalness: 0.95, roughness: 0.18, clearcoat: 0.2 });
    this.levers = L.xs.map((x, i) => {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.6), housingMat);
      housing.position.set(x, 0.56, L.z);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.46), glowMaterial(ROOM.primary, 1.4));
      slot.position.set(x, 0.625, L.z);
      const pivot = new THREE.Group();
      pivot.position.set(x, L.pivotY, L.z);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.92, 12), shaftMat);
      shaft.position.y = 0.46;
      const knobMat = glowMaterial(ROOM.accent, 1.6);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), structureMaterial(0x2b3566, { metalness: 0.4, roughness: 0.25 }));
      knob.position.y = 0.96;
      const knobRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 8, 32), knobMat);
      knobRing.rotation.x = Math.PI / 2;
      knobRing.position.y = 0.92;
      pivot.add(shaft, knob, knobRing);
      group.add(housing, slot, pivot);
      return { pivot, knob, knobMat, angle: 0, twitch: 0, x };
    });
    this.leverScramble = [0.46, -0.32, 0.52, -0.44, 0.38];
    // Pulling one lever sounds a different one: the echo plays in the wrong order.
    this.echoOrder = [1, 3, 0, 4, 2];

    // Maya's marks stay on the console once she has read them, so every lens can use them.
    const order = L.order;
    const markMat = glowMaterial(0x00e5ff, 2.2, { transparent: true, opacity: 0 });
    this.markMat = markMat;
    this.leverMarks = L.xs.map((x, i) => {
      const rank = order.indexOf(i);
      const mark = new THREE.Group();
      for (let p = 0; p <= rank; p++) {
        const pip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), markMat);
        pip.position.set((p - rank / 2) * 0.085, 0, 0);
        mark.add(pip);
      }
      mark.position.set(x, 1.0, L.z - 0.37);
      group.add(mark);
      return mark;
    });
    this.echoTimer = 0;
    this.echoIndex = 0;

    applyShadows(group);
    this.scene.add(group);
    this._register('levers', {
      center: new THREE.Vector3(cx, 0.9, L.z),
      strips: [stripMat],
      ringRadius: width / 2 + 0.45,
      ringScaleZ: 0.5,
      meshes: [plinth, back, ...this.levers.flatMap((l) => [l.knob, ...l.pivot.children])],
    });
  }

  // —— Dead panel + conduits to the gate ——
  _buildPanel() {
    const P = LAYOUT.panel;
    const group = new THREE.Group();
    group.position.set(P.x, 0, P.z);
    group.rotation.y = P.rotY;
    group.updateMatrixWorld(true);
    const bodyMat = structureMaterial(0x222b52, { metalness: 0.65, roughness: 0.3 });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(P.w + 0.3, 0.2, 0.75), bodyMat);
    plinth.position.y = 0.1;
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(P.w, P.h, 0.45), bodyMat);
    cabinet.position.y = 0.2 + P.h / 2;
    this.panelFaceMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f1f,
      roughness: 0.35,
      metalness: 0.4,
      emissive: ROOM.warning,
      emissiveMap: panelCellsTexture(),
      emissiveIntensity: 0.08,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(P.w - 0.3, P.h - 0.36), this.panelFaceMat);
    face.position.set(0, 0.2 + P.h / 2, 0.231);
    const frameMat = glowMaterial(0x0080ff, 0.25);
    const fw = P.w - 0.22;
    const fh = P.h - 0.28;
    [
      [fw, 0.035, 0, fh / 2],
      [fw, 0.035, 0, -fh / 2],
      [0.035, fh, fw / 2, 0],
      [0.035, fh, -fw / 2, 0],
    ].forEach(([w, h, x, y]) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), frameMat);
      bar.position.set(x, 0.2 + P.h / 2 + y, 0.235);
      group.add(bar);
    });
    // Insulator caps on top (tied to the world's electrical components).
    const capMat = structureMaterial(0x9aa4c9, { metalness: 0.9, roughness: 0.2 });
    [-0.5, 0, 0.5].forEach((x) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.26, 12), capMat);
      cap.position.set(x, 0.2 + P.h + 0.13, 0);
      group.add(cap);
    });

    // Stuck lever on the panel's side.
    const lp = new THREE.Group();
    lp.position.set(-P.w / 2 - 0.12, 1.15, 0.05);
    const lhub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16), capMat);
    lhub.rotation.z = Math.PI / 2;
    const lshaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.7, 10), capMat);
    lshaft.position.y = 0.35;
    const lknob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), structureMaterial(0x2b3566, { metalness: 0.4 }));
    lknob.position.y = 0.72;
    lp.add(lhub, lshaft, lknob);
    this.stuckLever = lp;
    // Halo on the knob: what Eli's lens lights once the panel is live.
    this.stuckHaloMat = glowMaterial(0xff7a1a, 2.6, { transparent: true, opacity: 0, additive: true, side: THREE.DoubleSide });
    this.stuckHalo = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 40), this.stuckHaloMat);
    this.stuckHalo.position.y = 0.72;
    this.stuckHalo.rotation.y = Math.PI / 2;
    lp.add(this.stuckHalo);

    group.add(plinth, cabinet, face, lp);
    applyShadows(group);
    this.scene.add(group);
    this.panelFrameMat = frameMat;
    this.panelGroup = group;

    this.panelLight = new THREE.PointLight(0x0080ff, 0, 7, 1.6);
    this.panelLight.position.copy(group.localToWorld(new THREE.Vector3(0, 1.4, 1.2)));
    this.scene.add(this.panelLight);

    // Conduits along the floor from panel to the gate's right jamb.
    const dash = energyDashTexture();
    this.conduits = [0, 0.28].map((off) => {
      const pts = [
        [P.x - 0.3 - off, -0.1 + P.z - 0.3],
        [4.5 - off, -3.2],
        [3.3 - off, -5.4],
        [2.75 - off * 0.5, -6.55],
      ].map(([x, z]) => new THREE.Vector3(x, 0.075, z));
      const curve = new THREE.CatmullRomCurve3(pts);
      const sheath = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.075, 8), structureMaterial(0x1e2647, { metalness: 0.7 }));
      sheath.receiveShadow = true;
      const tex = dash.clone();
      tex.needsUpdate = true;
      tex.repeat.set(10, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        map: tex,
        color: new THREE.Color(0x0080ff).multiplyScalar(4),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.082, 8), coreMat);
      this.scene.add(sheath, core);
      return { coreMat, tex };
    });

    this._register('panel', {
      center: group.localToWorld(new THREE.Vector3(0, 1.3, 0.3)),
      strips: [frameMat],
      ringRadius: 1.35,
      ringScaleZ: 0.7,
      meshes: [cabinet, face, plinth, lshaft, lknob],
    });
    this.props.panel.ring.position.copy(group.localToWorld(new THREE.Vector3(0, 0.03, 0.55)));
  }

  _buildBurstPool() {
    for (let i = 0; i < 6; i++) {
      const mat = glowMaterial(ROOM.temporalWhite, 3, { transparent: true, opacity: 0, additive: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      mesh.renderOrder = 3;
      this.scene.add(mesh);
      this.bursts.push({ mesh, mat, t: 1, dur: 1, from: 0.2, to: 3 });
    }
  }

  /** Expanding floor ring (activation flash / clear pulse). */
  burst(position, hex, { from = 0.3, to = 3.2, dur = 0.9, y = null, intensity = 3 } = {}) {
    const b = this.bursts.find((x) => x.t >= 1) ?? this.bursts[0];
    b.mesh.position.set(position.x, y ?? 0.05, position.z);
    b.mat.color.set(hex).multiplyScalar(intensity);
    b.t = 0;
    b.dur = dur;
    b.from = from;
    b.to = to;
    b.mesh.visible = true;
  }

  /** The corridor's spark rhythm (shared with the first gate clock and the lenses). */
  setSparks(schedule) {
    this.sparks = schedule;
  }

  sync(state) {
    Object.assign(this.state, {
      corridorClear: !!state.corridorClear,
      leversMarked: !!state.leversMarked,
      leversClear: !!state.leversClear,
      panelLive: !!state.panelLive,
      panelClear: !!state.panelClear,
      gateStep: state.gateStep ?? 0,
      gateClear: !!state.gateClear,
    });
  }

  setBound(ids) {
    this.bound = new Set(ids);
  }

  setHover(id) {
    this.hovered = id;
  }

  pulse(id, hex) {
    const p = this.props[id];
    if (!p) return;
    p.pulse = 1;
    p.pulseColor.set(hex);
    this.burst(p.ring.position, hex, { from: 0.4, to: 3.4, dur: 1.0, y: p.ring.position.y + 0.01 });
  }

  fail(id) {
    const p = this.props[id];
    if (!p) return;
    p.fail = 1;
    this.burst(p.ring.position, ROOM.warning, { from: 2.6, to: 0.5, dur: 0.55, y: p.ring.position.y + 0.01, intensity: 2.6 });
  }

  focusPoint(id) {
    return this.props[id]?.center ?? null;
  }

  update(t, dt) {
    const s = this.state;
    const k = (rate) => 1 - Math.exp(-rate * dt);

    // Per-prop affordance, hover, pulse, fail.
    Object.values(this.props).forEach((p) => {
      const bound = this.bound.has(p.id) ? 1 : 0;
      p.bound += (bound - p.bound) * k(4);
      p.hover += ((this.hovered === p.id ? 1 : 0) - p.hover) * k(12);
      p.pulse = Math.max(0, p.pulse - dt * 1.3);
      p.fail = Math.max(0, p.fail - dt * 1.6);
      const breathe = 0.5 + 0.5 * Math.sin(t * 2.6);
      p.ringMat.opacity = p.bound * (0.14 + breathe * 0.2 + p.hover * 0.55);
      const sc = 1 + p.hover * 0.04 + breathe * 0.015 * p.bound;
      p.ring.scale.x = sc;
      p.ring.scale.y = sc * p.ring.userData.baseY;
      const flicker = p.fail > 0 ? (Math.sin(t * 42) > 0 ? 1 : 0.2) * p.fail : 0;
      p.strips.forEach((m) => {
        tmpColor.copy(m.userData.baseColor).lerp(p.pulseColor, Math.min(1, p.pulse * 1.2)).lerp(WARN, flicker);
        m.color.copy(tmpColor).multiplyScalar(m.userData.baseIntensity * (1 + p.hover * 0.9 + p.pulse * 2.2 + flicker * 1.5));
      });
    });

    // Corridor: plates spark on the corridor's rhythm (SparkSchedule). Red-gold hazard until
    // Foresight clears a line through; after that they still spark, cool and dim, so the rhythm
    // stays readable for anyone comparing it with the first gate clock.
    this.plates.forEach((pl, i) => {
      const since = this.sparks ? this.sparks.sinceLast(i) : Infinity;
      const spark = Number.isFinite(since) ? Math.exp(-since * 9) : 0;
      if (s.corridorClear) {
        pl.base = (pl.base ?? 0.85) + (0.32 - (pl.base ?? 0.85)) * k(3);
        pl.mat.emissive.set(0x9fb4ff);
        pl.mat.emissiveIntensity = pl.base + spark * 1.3;
      } else {
        const fail = this.props.corridor.fail;
        pl.base = 0.85;
        // A spark runs hot toward white-gold so it reads on the far plates too (and without bloom).
        pl.mat.emissive.set(ROOM.warning).lerp(SPARK_HOT, Math.min(1, spark * 1.2));
        pl.mat.emissiveIntensity = pl.base + spark * 6.5 + fail * 2.5 * (Math.sin(t * 40) > 0 ? 1 : 0);
      }
    });
    this.safePathReveal += ((s.corridorClear ? 1 : 0) - this.safePathReveal) * k(1.6);
    const count = Math.floor((this.safePathCount * this.safePathReveal) / 3) * 3;
    this.safePath.geometry.setDrawRange(0, count);
    this.safePath.visible = count > 0;

    // Levers: scrambled + echo twitch → marked by Maya → thrown by Eli.
    this.markMat.opacity += ((s.leversMarked ? 1 : 0) - this.markMat.opacity) * k(3);
    this.leverMarks.forEach((m) => {
      m.visible = this.markMat.opacity > 0.01;
    });
    this.echoTimer += dt;
    if (!s.leversMarked && this.echoTimer > 0.55) {
      this.echoTimer = 0;
      const idx = this.echoOrder[this.echoIndex % this.echoOrder.length];
      this.levers[idx].twitch = 1;
      this.echoIndex++;
    }
    const failL = this.props.levers.fail;
    this.levers.forEach((l, i) => {
      let target = this.leverScramble[i];
      if (s.leversClear) target = -0.62;
      else if (s.leversMarked) target = 0.34;
      l.twitch = Math.max(0, l.twitch - dt * 3.2);
      const jitter = failL * Math.sin(t * 50 + i) * 0.12;
      l.angle += (target - l.angle) * k(s.leversMarked ? 5 : 8);
      l.pivot.rotation.z = l.angle + l.twitch * 0.12 * (i % 2 ? 1 : -1) + jitter;
      const lit = s.leversClear ? 1.7 : s.leversMarked ? 1.5 : 1.2 + l.twitch * 1.8;
      l.knobMat.color.set(s.leversMarked ? ROOM.temporalWhite : ROOM.accent).multiplyScalar(lit);
    });
    const winTarget = s.leversClear ? 1.7 : 0.6 + (Math.sin(t * 9) > 0.6 ? 1.2 : 0);
    this.windowMat.color.set(s.leversClear ? ROOM.secondary : ROOM.accent).multiplyScalar(winTarget);
    this.windowSlot.scale.x = s.leversClear ? 1 : 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2.2));

    // Panel: dead → live (Vibrion) → lever thrown (Eli); conduits carry power toward the gate.
    const live = s.panelLive;
    const failP = this.props.panel.fail;
    if (live) {
      this.panelFaceMat.emissive.set(0x2a8cff);
      const chase = 0.85 + 0.35 * Math.sin(t * 6);
      this.panelFaceMat.emissiveIntensity += (1.5 * chase - this.panelFaceMat.emissiveIntensity) * k(4);
    } else {
      this.panelFaceMat.emissive.set(ROOM.warning);
      const dead = Math.sin(t * 17) > 0.93 ? 0.5 : 0.06;
      this.panelFaceMat.emissiveIntensity = dead + failP * (Math.sin(t * 40) > 0 ? 1.2 : 0);
    }
    const frameTarget = live ? 3.4 : 0.25;
    const fm = this.panelFrameMat;
    fm.userData.baseIntensity += (frameTarget - fm.userData.baseIntensity) * k(3);
    this.panelLight.intensity += ((live ? 9 : 0) - this.panelLight.intensity) * k(3);
    const stuckTarget = s.panelClear ? -0.75 : 0.55 + Math.sin(t * 3.1) * 0.03 + failP * Math.sin(t * 45) * 0.1;
    this.stuckLever.rotation.x += (stuckTarget - this.stuckLever.rotation.x) * k(6);
    const haloOn = live && !s.panelClear && this.bound.has('panel') ? 1 : 0;
    this.stuckHaloMat.opacity += (haloOn * (0.55 + 0.4 * Math.sin(t * 5.2)) - this.stuckHaloMat.opacity) * k(6);
    this.stuckHalo.scale.setScalar(1 + haloOn * 0.12 * Math.sin(t * 5.2));

    // The feed only reaches the gate once the jammed lever is thrown.
    const sealPower = s.gateClear ? 1 : s.gateStep >= 4 ? 0.8 : 0;
    this.conduits.forEach((cd, i) => {
      const target = s.panelClear ? 0.75 + sealPower * 0.25 : live ? 0.12 : 0;
      cd.coreMat.opacity += (target - cd.coreMat.opacity) * k(2.5);
      cd.tex.offset.x -= dt * (0.6 + sealPower * 1.6) * (i ? 1.1 : 1);
    });

    // Bursts.
    this.bursts.forEach((b) => {
      if (b.t >= 1) {
        b.mesh.visible = false;
        return;
      }
      b.t = Math.min(1, b.t + dt / b.dur);
      const e = 1 - Math.pow(1 - b.t, 3);
      const r = b.from + (b.to - b.from) * e;
      b.mesh.scale.set(r, r, r);
      b.mat.opacity = (1 - b.t) * 0.9;
    });
  }
}
