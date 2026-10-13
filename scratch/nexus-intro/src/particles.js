import * as THREE from 'three';
import { CHARACTER, ROOM } from './palette.js';
import { LAYOUT } from './layout.js';
import { mulberry32, softDotTexture } from './textures.js';

/**
 * Drifting temporal motes. Speed follows the active lens (TemporalVisuals.md: accelerated perception
 * = faster particle movement) and beat-5 desync adds jitter that calms once the clocks sync.
 */
export class TemporalMotes {
  constructor(scene, count = 400) {
    this.scene = scene;
    this.speed = 1;
    this.speedTarget = 1;
    this.jitter = 0;
    this.build(count);
  }

  build(count) {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
    }
    const rand = mulberry32(77);
    const pos = new Float32Array(count * 3);
    this.seeds = new Float32Array(count * 3);
    const R = LAYOUT.roomRadius - 1.2;
    for (let i = 0; i < count; i++) {
      // Keep motes behind the beat-5 push camera (z ≈ 7) so none smear into near-lens fog.
      let x;
      let z;
      do {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * R;
        x = Math.sin(a) * r;
        z = Math.cos(a) * r - 0.5;
      } while (z > 3.2);
      pos[i * 3] = x;
      pos[i * 3 + 1] = 0.2 + rand() * 7.5;
      pos[i * 3 + 2] = z;
      this.seeds[i * 3] = 0.06 + rand() * 0.14; // rise speed
      this.seeds[i * 3 + 1] = rand() * Math.PI * 2; // swirl phase
      this.seeds[i * 3 + 2] = 0.5 + rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      size: 0.075,
      map: softDotTexture(),
      color: new THREE.Color(ROOM.temporalWhite).multiplyScalar(1.6),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.count = count;
  }

  update(t, dt, { active, onBeat5, beat5Clear }) {
    this.speedTarget = active === 'eli' ? 3.2 : onBeat5 && !beat5Clear ? 1.4 : 1;
    this.speed += (this.speedTarget - this.speed) * (1 - Math.exp(-3 * dt));
    this.jitter += ((onBeat5 && !beat5Clear ? 1 : 0) - this.jitter) * (1 - Math.exp(-2 * dt));
    const tint = new THREE.Color(ROOM.temporalWhite).lerp(new THREE.Color(CHARACTER.eli.hot), active === 'eli' ? 0.45 : 0);
    this.material.color.copy(tint).multiplyScalar(1.6);

    const p = this.points.geometry.attributes.position.array;
    const s = this.seeds;
    const v = this.speed;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      p[j + 1] += s[j] * v * dt;
      const ph = s[j + 1] + t * 0.25 * s[j + 2];
      p[j] += Math.cos(ph) * 0.05 * v * dt + (this.jitter ? Math.sin(t * 31 + i) * 0.004 * this.jitter : 0);
      p[j + 2] += Math.sin(ph) * 0.05 * v * dt;
      if (p[j + 1] > 8) p[j + 1] = 0.15;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
