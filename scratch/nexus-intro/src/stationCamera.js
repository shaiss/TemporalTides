import * as THREE from 'three';

const BASE_FOV = 48;
const pose = (p, l, fov = BASE_FOV) => ({ position: new THREE.Vector3(...p), lookAt: new THREE.Vector3(...l), fov });

/** Wide chamber view: the open room, every place in sight. */
export const WIDE = pose([0.3, 3.8, 10.8], [0, 1.4, -2]);

/**
 * One pose per place. Walking up to something is a camera move, not a menu: the room stays the
 * same room, the camera just steps in close enough to read it.
 */
export const POSES = {
  room: WIDE,
  corridor: pose([-1.3, 3.3, 6.7], [-4.4, 0.45, 0.7]),
  levers: pose([3.35, 2.55, 6.5], [4.15, 0.95, 1.6]),
  panel: pose([3.0, 2.65, 3.5], [5.55, 1.35, -1.0]),
  gate: pose([0, 2.95, 7.2], [0, 2.75, -5.6]),
  end: WIDE,
};

/**
 * Tall screens crop the 16:9 frame to a narrow slice, which is too tight to read a whole place
 * (five levers, three plates). These step back and up with a wider lens so the place fits the
 * screen's width. All stay inside the rotunda wall (radius 9.8).
 */
export const PORTRAIT_POSES = {
  corridor: pose([-3.2, 7.2, 7.4], [-4.3, 0.4, 0.9], 60),
  levers: pose([3.3, 6.2, 8.0], [4.15, 0.9, 1.7], 60),
  panel: pose([2.67, 4.2, 4.2], [5.4, 1.3, -0.9], 60),
};

const RATE = 2.1; // 1/s — a move settles in about 1.5 s

/** Damped, frame-rate-independent moves between place poses. */
export class StationCamera {
  constructor(camera) {
    this.camera = camera;
    this.place = 'room';
    this.look = WIDE.lookAt.clone();
    camera.position.copy(WIDE.position);
    camera.lookAt(this.look);
  }

  setPlace(place) {
    this.place = POSES[place] ? place : 'room';
  }

  /** Width / height of the canvas; below 0.9 the portrait poses apply. */
  setAspect(aspect) {
    this.portrait = aspect < 0.9;
  }

  get pose() {
    return (this.portrait && PORTRAIT_POSES[this.place]) || POSES[this.place];
  }

  /** True once the camera is close to its pose (used by capture tooling). */
  get settled() {
    return this.camera.position.distanceTo(this.pose.position) < 0.05 && Math.abs(this.camera.fov - this.pose.fov) < 0.3;
  }

  update(dt, { snap = false } = {}) {
    const { position, lookAt, fov } = this.pose;
    const k = snap ? 1 : 1 - Math.exp(-RATE * dt);
    this.camera.position.lerp(position, k);
    this.look.lerp(lookAt, k);
    this.camera.lookAt(this.look);
    // Projection is rebuilt every frame by ViewportFraming.
    this.camera.fov += (fov - this.camera.fov) * k;
  }
}
