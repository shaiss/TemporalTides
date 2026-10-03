import * as THREE from 'three';

const WIDE = {
  position: new THREE.Vector3(0.3, 3.8, 10.8),
  lookAt: new THREE.Vector3(0, 1.4, -2),
  lerpIn: 0.02,
  lerpOut: 0.02,
};

const PUSH = {
  position: new THREE.Vector3(0, 2.9, 7.4),
  lookAt: new THREE.Vector3(0, 2.6, -5.5),
  lerpIn: 0.035,
  lerpOut: 0.02,
};

const _lookScratch = new THREE.Vector3();

/**
 * Beat-5-only camera push onto the clock wall. Chamber passes Ink-synced
 * beat5_step / beat5_clear plus whether the story beat tag is still 5.
 */
export class CameraBeat {
  constructor(camera) {
    this.camera = camera;
    this.beat5Step = 0;
    this.beat5Clear = false;
    this.inBeatFive = false;
  }

  syncFromInk({ beat5Step, beat5Clear, inBeatFive }) {
    this.beat5Step = beat5Step;
    this.beat5Clear = beat5Clear;
    this.inBeatFive = inBeatFive;
  }

  /** Push while on beat 5; wide chamber before and after. */
  _wantsPush() {
    if (!this.inBeatFive) return false;
    if (this.beat5Clear) return false;
    return true;
  }

  update() {
    const push = this._wantsPush();
    const targetPos = push ? PUSH.position : WIDE.position;
    const lerp = push ? PUSH.lerpIn : WIDE.lerpOut;
    this.camera.position.lerp(targetPos, lerp);

    const stepT = Math.min(this.beat5Step / 4, 1);
    const lookY = push
      ? THREE.MathUtils.lerp(WIDE.lookAt.y, PUSH.lookAt.y, 0.65 + stepT * 0.35)
      : WIDE.lookAt.y;
    const lookZ = push
      ? THREE.MathUtils.lerp(WIDE.lookAt.z, PUSH.lookAt.z, 0.55 + stepT * 0.45)
      : WIDE.lookAt.z;
    _lookScratch.set(WIDE.lookAt.x, lookY, lookZ);
    this.camera.lookAt(_lookScratch);
  }
}
