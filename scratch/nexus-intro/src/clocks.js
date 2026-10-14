import * as THREE from 'three';
import { CHARACTER, ROOM, STEP_ORDER } from './palette.js';
import { LAYOUT } from './layout.js';
import { glowMaterial, structureMaterial } from './materials.js';
import { dialTextures } from './textures.js';

const TAU = Math.PI * 2;
const REF_RATE = 1.15; // simulated minutes per real second on the shared reference
const DESYNC_RATES = [1.0, -0.72, 2.55, 0.38]; // beat 5: each timeline keeps its own tempo
const DRIFT_RATES = [1.0, 1.035, 0.97, 1.02]; // elsewhere: slightly out of sync
const OFFSETS = [-95, 140, -40, 255];

function backOut(x) {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function wrap720(d) {
  return ((((d + 360) % 720) + 720) % 720) - 360;
}

/**
 * Coordination-gate clocks. Dials face the camera (XY plane), with luminous markings and
 * jumping minute hands so each clock's tempo is visible (and audible via onTick).
 * Clock i belongs to beat-5 step i (Anne → Maya → Eli → Vibrion) and wears that lens color once
 * it is the current step or locked. All state comes from Ink via sync().
 */
export class NexusClocks {
  constructor(scene) {
    this.group = new THREE.Group();
    this.onBeat5 = false;
    this.beat5Step = 0;
    this.beat5Clear = false;
    this.layout = 'row';
    this.hovered = null;
    this.bound = new Set();
    this.failT = 0;
    this.syncFlash = 0;
    this.onTick = null;
    this.ref = 10 * 60 + 8;
    this.refTarget = null;
    this.targets = [];

    const { map, emissiveMap } = dialTextures();
    const faceMat = new THREE.MeshStandardMaterial({
      map,
      emissive: 0xffffff,
      emissiveMap,
      emissiveIntensity: 1.1,
      roughness: 0.35,
      metalness: 0.2,
    });
    const backMat = structureMaterial(0x1a2142, { metalness: 0.7 });
    const bezelMat = structureMaterial(ROOM.silver, { metalness: 0.95, roughness: 0.18, clearcoat: 0.4 });

    this.clocks = STEP_ORDER.map((charId, i) => {
      const root = new THREE.Group();
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.9, 0.14, 64), backMat);
      back.rotation.x = Math.PI / 2;
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.075, 18, 96), bezelMat);
      bezel.position.z = 0.075;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 96), faceMat);
      face.position.z = 0.072;

      const handMat = glowMaterial(ROOM.temporalWhite, 1.5);
      const hourGeo = new THREE.BoxGeometry(0.085, 0.44, 0.02);
      hourGeo.translate(0, 0.16, 0);
      const minuteGeo = new THREE.BoxGeometry(0.052, 0.66, 0.02);
      minuteGeo.translate(0, 0.27, 0);
      const hour = new THREE.Mesh(hourGeo, handMat);
      hour.position.z = 0.1;
      const minute = new THREE.Mesh(minuteGeo, handMat);
      minute.position.z = 0.115;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20), bezelMat);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = 0.13;

      const stepHex = CHARACTER[charId].flash;
      const ringMat = glowMaterial(stepHex, 3.2, { transparent: true, opacity: 0, additive: true });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.032, 10, 120), ringMat);
      ring.position.z = 0.05;
      const haloMat = glowMaterial(stepHex, 1.6, { transparent: true, opacity: 0, additive: true });
      const halo = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.2, 96), haloMat);
      halo.position.z = 0.0;

      root.add(back, bezel, face, hour, minute, cap, ring, halo);
      [back, bezel, face].forEach((m) => {
        m.userData.propId = `clock${i}`;
        this.targets.push(m);
      });
      this.group.add(root);
      return {
        i,
        charId,
        stepHex,
        root,
        hour,
        minute,
        handMat,
        ringMat,
        haloMat,
        time: this.ref + OFFSETS[i],
        lockBlend: 0,
        hover: 0,
        tickFlash: 0,
        lastWhole: Math.floor(this.ref + OFFSETS[i]),
        local: new THREE.Vector3(),
      };
    });

    const off = LAYOUT.clocks.off;
    this.group.position.set(...off.position);
    this.group.scale.setScalar(off.scale);
    this._layoutLocals(true);
    scene.add(this.group);
  }

  sync({ onBeat5, beat5Step, beat5Clear }) {
    const becameClear = beat5Clear && !this.beat5Clear;
    this.onBeat5 = onBeat5;
    this.beat5Step = beat5Step;
    this.beat5Clear = beat5Clear;
    if (becameClear) {
      this.refTarget = Math.ceil((this.ref + 30) / 720) * 720; // all hands meet at XII
      this.syncFlash = 1;
    }
  }

  /** Portrait viewports stack the hero clocks 2×2 so all four stay inside the crop. */
  setAspect(aspect) {
    this.layout = aspect < 0.9 ? 'grid' : 'row';
  }

  setHover(id) {
    this.hovered = id;
  }

  setBound(ids) {
    this.bound = new Set(ids);
  }

  fail() {
    this.failT = 1;
  }

  get hero() {
    return this.onBeat5 && !this.beat5Clear;
  }

  clockWorldPosition(i, target = new THREE.Vector3()) {
    return this.clocks[i].root.getWorldPosition(target);
  }

  _layoutLocals(snap = false, k = 1) {
    const useGrid = this.hero && this.layout === 'grid';
    const spacing = useGrid ? LAYOUT.clocks.heroGrid.spacing : LAYOUT.clocks.heroRow.spacing;
    this.clocks.forEach((c, i) => {
      const target = useGrid
        ? new THREE.Vector3(((i % 2) - 0.5) * spacing, (i < 2 ? 0.5 : -0.5) * spacing, 0)
        : new THREE.Vector3((i - 1.5) * spacing, 0, 0);
      if (snap) c.local.copy(target);
      else c.local.lerp(target, k);
      c.root.position.copy(c.local);
    });
  }

  update(t, dt) {
    const k = (rate) => 1 - Math.exp(-rate * dt);

    // Group placement: lintel row ↔ hero position in front of the membrane.
    const cfg = this.hero
      ? this.layout === 'grid'
        ? LAYOUT.clocks.heroGrid
        : LAYOUT.clocks.heroRow
      : LAYOUT.clocks.off;
    const pos = new THREE.Vector3(...cfg.position);
    this.group.position.lerp(pos, k(2.4));
    const s = this.group.scale.x + (cfg.scale - this.group.scale.x) * k(2.4);
    this.group.scale.setScalar(s);
    this._layoutLocals(false, k(3));

    // Shared reference time (eases to XII on sync).
    if (this.refTarget != null) {
      this.ref += (this.refTarget - this.ref) * k(2.2);
      if (Math.abs(this.refTarget - this.ref) < 0.02) {
        this.ref = this.refTarget;
        this.refTarget = null;
      }
    } else {
      this.ref += dt * REF_RATE;
    }

    this.failT = Math.max(0, this.failT - dt * 1.5);
    this.syncFlash = Math.max(0, this.syncFlash - dt * 0.8);

    this.clocks.forEach((c) => {
      const locked = this.beat5Clear || (this.onBeat5 && c.i < this.beat5Step);
      const current = this.onBeat5 && !this.beat5Clear && c.i === this.beat5Step;
      c.lockBlend += ((locked ? 1 : 0) - c.lockBlend) * k(3.2);

      const rate = this.onBeat5 && !this.beat5Clear ? DESYNC_RATES[c.i] : DRIFT_RATES[c.i];
      c.time += dt * REF_RATE * rate;
      if (c.lockBlend > 0.001) {
        // Converge onto the shared reference along the shortest path around the dial.
        const delta = wrap720(this.ref - c.time);
        c.time += delta * Math.min(1, c.lockBlend * k(6) * 3);
        if (c.lockBlend > 0.98) c.time = this.ref;
      }
      if (this.failT > 0 && !locked) c.time += Math.sin(t * 60 + c.i * 3) * this.failT * 0.6;

      const whole = Math.floor(c.time);
      if (whole !== c.lastWhole) {
        c.lastWhole = whole;
        c.tickFlash = 1;
        this.onTick?.(c.i, { locked, current, onBeat5: this.onBeat5, ref: !locked ? 0 : 1 });
      }
      c.tickFlash = Math.max(0, c.tickFlash - dt * 5);

      // Jumping minute hand with a small overshoot on each tick.
      const frac = c.time - whole;
      const jump = frac < 0.16 ? backOut(frac / 0.16) : 1;
      c.minute.rotation.z = -((whole - 1 + jump) / 60) * TAU;
      c.hour.rotation.z = -(c.time / 720) * TAU;

      // Step ring / halo.
      c.hover += ((this.hovered === `clock${c.i}` ? 1 : 0) - c.hover) * k(12);
      const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
      let ringOpacity = 0;
      let halo = 0;
      if (this.onBeat5 || this.beat5Clear) {
        if (locked) ringOpacity = 0.85 + c.tickFlash * 0.15;
        else if (current) {
          ringOpacity = 0.35 + pulse * 0.55;
          halo = 0.12 + pulse * 0.2 + c.hover * 0.35;
        } else ringOpacity = 0.1;
      }
      const flick = this.failT > 0 && !locked ? (Math.sin(t * 38) > 0 ? 1 : 0) * this.failT : 0;
      const ringColor = new THREE.Color(c.stepHex).lerp(new THREE.Color(ROOM.warning), flick);
      ringColor.lerp(new THREE.Color(ROOM.temporalWhite), this.syncFlash * 0.7);
      c.ringMat.color.copy(ringColor).multiplyScalar(3.2 + c.hover * 2 + this.syncFlash * 4);
      c.ringMat.opacity = Math.min(1, ringOpacity + flick * 0.6 + this.syncFlash * 0.5);
      c.haloMat.opacity = halo + this.syncFlash * 0.4;
      c.handMat.color.set(ROOM.temporalWhite).multiplyScalar(1.4 + c.tickFlash * 0.6 + c.lockBlend * 0.6 + this.syncFlash * 2);

      const sc = 1 + c.hover * 0.05 + (current ? pulse * 0.015 : 0);
      c.root.scale.setScalar(sc);
      c.root.rotation.z = flick ? Math.sin(t * 55 + c.i) * 0.04 : 0;
    });
  }
}
