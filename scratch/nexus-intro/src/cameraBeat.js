import * as THREE from 'three';

/** Locked wide chamber camera. */
export const WIDE = {
  position: new THREE.Vector3(0.3, 3.8, 10.8),
  lookAt: new THREE.Vector3(0, 1.4, -2),
};

/** The one allowed camera move: beat-5 push onto the clock wall. */
export const PUSH = {
  position: new THREE.Vector3(0, 2.95, 7.2),
  lookAt: new THREE.Vector3(0, 2.75, -5.6),
};

const RATE_IN = 2.1; // 1/s — push settles in ~1.5 s
const RATE_OUT = 1.4; // 1/s — release back to wide in ~2 s

const _look = new THREE.Vector3();

/**
 * Beat-5-only camera push. Chamber passes Ink-synced beat5_step / beat5_clear plus
 * whether the story beat tag is still 5. Damping is time-based (frame-rate independent).
 */
export class CameraBeat {
  constructor(camera) {
    this.camera = camera;
    this.beat5Step = 0;
    this.beat5Clear = false;
    this.inBeatFive = false;
    this.look = WIDE.lookAt.clone();
    camera.position.copy(WIDE.position);
    camera.lookAt(this.look);
  }

  syncFromInk({ beat5Step, beat5Clear, inBeatFive }) {
    this.beat5Step = beat5Step;
    this.beat5Clear = beat5Clear;
    this.inBeatFive = inBeatFive;
  }

  /** Push while on beat 5; wide chamber before and after. */
  wantsBeatFivePush() {
    return this.inBeatFive && !this.beat5Clear;
  }

  /** 0 = wide, 1 = fully pushed — lets framing / clocks follow the camera smoothly. */
  get pushAmount() {
    const total = WIDE.position.distanceTo(PUSH.position);
    const remaining = this.camera.position.distanceTo(PUSH.position);
    return THREE.MathUtils.clamp(1 - remaining / total, 0, 1);
  }

  update(dt) {
    const push = this.wantsBeatFivePush();
    const k = 1 - Math.exp(-(push ? RATE_IN : RATE_OUT) * dt);
    this.camera.position.lerp(push ? PUSH.position : WIDE.position, k);

    const stepT = Math.min(this.beat5Step / 4, 1);
    if (push) {
      _look.set(
        0,
        THREE.MathUtils.lerp(WIDE.lookAt.y, PUSH.lookAt.y, 0.75 + stepT * 0.25),
        THREE.MathUtils.lerp(WIDE.lookAt.z, PUSH.lookAt.z, 0.7 + stepT * 0.3),
      );
    } else {
      _look.copy(WIDE.lookAt);
    }
    this.look.lerp(_look, k);
    this.camera.lookAt(this.look);
  }
}
