import * as THREE from 'three';

const PRIMARY = 0x646cff;
const SECONDARY = 0x747bff;
const ACCENT = 0x9aa8ff;

const CLOCK_X = [-2.85, -0.95, 0.95, 2.85];
/**
 * Beat-5 clock diorama: large readable faces, tick marks, accent only on the active sync step.
 * Driven by Ink vars beat5_step and beat5_clear; visibility emphasis only on beat 5.
 */
export class NexusBeat5Clocks {
  constructor(scene, matFactory) {
    this._mat = matFactory;
    this.targetBeat = null;
    this.beat5Step = 0;
    this.beat5Clear = false;

    this.group = new THREE.Group();
    this.group.position.set(0, 3.65, -6.35);
    scene.add(this.group);

    this.clocks = CLOCK_X.map((x, i) => this._buildClock(x, i));
  }

  _buildClock(x, index) {
    const root = new THREE.Group();
    root.position.set(x, 0, 0);
    this.group.add(root);

    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.16, 64),
      this._mat(0x1a1f2e, 0x000000, 0),
    );
    face.rotation.x = Math.PI / 2;
    root.add(face);

    const dial = new THREE.Mesh(
      new THREE.CircleGeometry(0.92, 64),
      new THREE.MeshStandardMaterial({
        color: 0x141824,
        metalness: 0.25,
        roughness: 0.72,
        emissive: 0x000000,
        emissiveIntensity: 0,
      }),
    );
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.082;
    root.add(dial);

    const ticks = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const major = i % 3 === 0;
      const len = major ? 0.16 : 0.1;
      const thick = major ? 0.05 : 0.032;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(thick, len, 0.025),
        this._mat(major ? 0xc8d0e8 : 0x6a7288, 0x000000, 0),
      );
      const r = 0.8;
      const a = (i / 12) * Math.PI * 2;
      const radial = len * 0.5 + 0.04;
      tick.position.set(Math.sin(a) * (r - radial), 0.09, Math.cos(a) * (r - radial));
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.y = a;
      ticks.add(tick);
    }
    root.add(ticks);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.055, 12, 72),
      this._mat(0x2a3040, 0x000000, 0),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    root.add(rim);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
      this._mat(0x3a4055, SECONDARY, 0.15),
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.y = 0.1;
    root.add(hub);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.72, 0.04),
      this._mat(0x8890a8, 0x000000, 0),
    );
    hand.geometry.translate(0, 0.36, 0);
    hand.position.y = 0.11;
    root.add(hand);

    const stepRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.04, 10, 64),
      this._mat(0x2a3040, PRIMARY, 0, { transparent: true, opacity: 0.85 }),
    );
    stepRing.rotation.x = Math.PI / 2;
    stepRing.position.y = 0.04;
    stepRing.visible = false;
    root.add(stepRing);

    return {
      root,
      face,
      dial,
      rim,
      hand,
      stepRing,
      ticks,
      baseSpeed: 0.9 + index * 0.38,
      phase: index * 1.85,
      index,
    };
  }

  sync({ targetBeat, beat5Step, beat5Clear }) {
    this.targetBeat = targetBeat;
    this.beat5Step = beat5Step;
    this.beat5Clear = beat5Clear;
  }

  _onBeat5() {
    const b = this.targetBeat;
    return b === '5' || b === 5;
  }

  _activeStepIndex() {
    if (this.beat5Clear) return -1;
    return Math.min(Math.max(this.beat5Step, 0), 3);
  }

  update(elapsed) {
    const onBeat5 = this._onBeat5();
    const activeIdx = this._activeStepIndex();
    const syncFactor = this.beat5Clear ? 1 : Math.min(this.beat5Step / 4, 0.9);
    const desync = this.beat5Clear ? 0 : 1 - syncFactor;

    const heroScale = onBeat5 ? 1.28 : 0.52;
    const targetScale = new THREE.Vector3(heroScale, heroScale, heroScale);
    this.group.scale.lerp(targetScale, onBeat5 ? 0.06 : 0.04);
    this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, onBeat5 ? 3.35 : 3.85, 0.05);
    this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, onBeat5 ? -5.95 : -6.55, 0.05);

    this.clocks.forEach((c, i) => {
      const speed = c.baseSpeed * desync + 0.07;
      const wobble = Math.sin(elapsed * 3.2 + c.phase) * 0.18 * desync;
      if (this.beat5Clear) {
        c.hand.rotation.z = 0;
      } else {
        c.hand.rotation.z = elapsed * speed + c.phase * desync + wobble;
      }

      const isActiveStep = onBeat5 && !this.beat5Clear && i === activeIdx;
      const allSynced = onBeat5 && this.beat5Clear;

      c.stepRing.visible = isActiveStep;
      if (isActiveStep) {
        const pulse = 0.85 + Math.sin(elapsed * 5) * 0.2;
        c.stepRing.material.emissive.setHex(PRIMARY);
        c.stepRing.material.emissiveIntensity = pulse;
        c.stepRing.material.color.setHex(SECONDARY);
      }

      const rimEmissive = allSynced
        ? 0.55
        : isActiveStep
          ? 0.45 + Math.sin(elapsed * 4 + i) * 0.15
          : onBeat5
            ? 0.02
            : 0;
      c.rim.material.emissive.setHex(allSynced || isActiveStep ? SECONDARY : 0x000000);
      c.rim.material.emissiveIntensity = rimEmissive;
      c.rim.material.color.setHex(allSynced || isActiveStep ? SECONDARY : 0x2a3040);

      const dialEmissive = allSynced ? 0.12 : isActiveStep ? 0.22 : 0;
      c.dial.material.emissive.setHex(isActiveStep || allSynced ? PRIMARY : 0x000000);
      c.dial.material.emissiveIntensity = dialEmissive;

      c.hand.material.color.setHex(allSynced ? SECONDARY : isActiveStep ? 0x747bff : 0x8890a8);
      c.hand.material.emissive.setHex(isActiveStep || allSynced ? ACCENT : 0x000000);
      c.hand.material.emissiveIntensity = isActiveStep ? 0.9 : allSynced ? 0.5 : 0;

      c.ticks.children.forEach((tick, ti) => {
        const major = ti % 3 === 0;
        if (!onBeat5) {
          tick.material.color.setHex(major ? 0x4a5060 : 0x353945);
          tick.material.emissiveIntensity = 0;
          return;
        }
        if (isActiveStep || allSynced) {
          tick.material.color.setHex(major ? 0xe8ecff : 0xa8b0d0);
          tick.material.emissive.setHex(major ? PRIMARY : 0x000000);
          tick.material.emissiveIntensity = major ? (isActiveStep ? 0.35 : 0.2) : 0;
        } else {
          tick.material.color.setHex(major ? 0x6a7288 : 0x4a5060);
          tick.material.emissiveIntensity = 0;
        }
      });

      c.face.material.emissiveIntensity = isActiveStep ? 0.08 : allSynced ? 0.06 : 0;
      c.face.material.emissive.setHex(isActiveStep || allSynced ? PRIMARY : 0x000000);
    });
  }

  dispose() {
    this.group.removeFromParent();
  }
}
