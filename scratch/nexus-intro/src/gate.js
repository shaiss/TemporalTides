import * as THREE from 'three';
import { ROOM } from './palette.js';
import { LAYOUT } from './layout.js';
import { glowMaterial, structureMaterial } from './materials.js';
import { mulberry32 } from './textures.js';

/**
 * Coordination gate (TimeNexus.md · Archways and Portals): crystalline arch with carvings in an
 * unknown script; an inactive portal reads as a mirror of alternative timelines, an active one as a
 * shimmering membrane. Activity is driven only by Ink state (beat5_step / beat5_clear) via setState.
 */
function archShape(halfW, straight, close = true) {
  const s = new THREE.Shape();
  s.moveTo(-halfW, 0);
  s.lineTo(-halfW, straight);
  s.absarc(0, straight, halfW, Math.PI, 0, true);
  s.lineTo(halfW, 0);
  if (close) s.lineTo(-halfW, 0);
  return s;
}

function archCurve(halfW, straight, z) {
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(new THREE.Vector3(-halfW, 0, z), new THREE.Vector3(-halfW, straight, z)));
  const arc = new THREE.EllipseCurve(0, straight, halfW, halfW, Math.PI, 0, true);
  const pts = arc.getPoints(48).map((p) => new THREE.Vector3(p.x, p.y, z));
  path.add(new THREE.CatmullRomCurve3(pts));
  path.add(new THREE.LineCurve3(new THREE.Vector3(halfW, straight, z), new THREE.Vector3(halfW, 0, z)));
  return path;
}

function membraneMaterial(bounds) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uWarn: { value: 0 },
      uPulse: { value: 0 },
      uMin: { value: new THREE.Vector2(bounds.minX, bounds.minY) },
      uSize: { value: new THREE.Vector2(bounds.w, bounds.h) },
      uDeep: { value: new THREE.Color(0x0a1240) },
      uPrimary: { value: new THREE.Color(ROOM.primary) },
      uWhite: { value: new THREE.Color(ROOM.temporalWhite) },
      uWarnColor: { value: new THREE.Color(ROOM.warning) },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uMin;
      uniform vec2 uSize;
      varying vec2 vUv;
      void main() {
        vUv = (position.xy - uMin) / uSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uActive;
      uniform float uWarn;
      uniform float uPulse;
      uniform vec3 uDeep;
      uniform vec3 uPrimary;
      uniform vec3 uWhite;
      uniform vec3 uWarnColor;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
        return v;
      }
      void main() {
        vec2 p = vUv - vec2(0.5, 0.45);
        p.x *= 0.9;
        float r = length(p);
        float ang = atan(p.y, p.x);
        float t = uTime;
        float speed = 0.12 + uActive * 0.9;
        // Mirror of alternative timelines: drifting vertical reflections.
        float mirror = fbm(vec2(vUv.x * 4.0 + t * 0.02, vUv.y * 1.4 - t * 0.03));
        float sheen = smoothstep(0.55, 0.95, fbm(vec2(vUv.x * 9.0 - t * 0.05, vUv.y * 0.6)));
        // Membrane swirl.
        float swirl = fbm(vec2(ang * 1.7 + t * 0.05 + r * 2.0, r * 6.0 - t * speed));
        float rings = 0.5 + 0.5 * sin(r * 42.0 - t * (1.0 + uActive * 5.0));
        vec3 col = uDeep * (0.5 + mirror * 0.9);
        col += uWhite * sheen * 0.18 * (1.0 - uActive);
        col += uPrimary * swirl * (0.45 + uActive * 1.1);
        col += uWhite * pow(rings, 10.0) * (0.05 + uActive * 0.32) * smoothstep(0.6, 0.0, r);
        col += uWhite * smoothstep(0.22, 0.0, r) * (uActive * 0.6 + uPulse * 1.4);
        col = mix(col, uWarnColor * (0.6 + swirl), clamp(uWarn, 0.0, 1.0) * 0.65);
        float edge = smoothstep(0.0, 0.03, vUv.y);
        gl_FragColor = vec4(col, (0.86 + uActive * 0.12) * edge);
        #include <colorspace_fragment>
      }
    `,
  });
}

export class NexusGate {
  constructor(scene) {
    const g = LAYOUT.gate;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, g.z);
    this.active = 0;
    this.activeTarget = 0;
    this.warn = 0;
    this.pulse = 0;
    this.hover = 0;
    this.hoverTarget = 0;

    // Arch body: outer arch minus opening, extruded with a bevel.
    const outer = archShape(g.outerHalfW, g.straight);
    outer.holes.push(archShape(g.innerHalfW, g.straight));
    const archGeo = new THREE.ExtrudeGeometry(outer, {
      depth: g.depth,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 3,
      curveSegments: 64,
    });
    archGeo.translate(0, 0, -g.depth / 2);
    this.archMat = new THREE.MeshPhysicalMaterial({
      color: 0x34407a,
      roughness: 0.16,
      metalness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 0.7,
      iridescenceIOR: 1.3,
      emissive: ROOM.primary,
      emissiveIntensity: 0.12,
      envMapIntensity: 1.3,
    });
    this.arch = new THREE.Mesh(archGeo, this.archMat);
    this.arch.castShadow = true;
    this.arch.receiveShadow = true;
    this.group.add(this.arch);

    // Plinth steps.
    const stepMat = structureMaterial(0x1d2546, { metalness: 0.6 });
    [
      [g.outerHalfW * 2 + 1.2, 0.16, 2.0, 0.08],
      [g.outerHalfW * 2 + 0.4, 0.14, 1.4, 0.23],
    ].forEach(([w, h, d, y]) => {
      const step = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stepMat);
      step.position.set(0, y, 0.25);
      step.receiveShadow = true;
      this.group.add(step);
    });

    // Glowing rims on the opening + outer edge.
    this.rimMat = glowMaterial(ROOM.primary, 4.5);
    const innerRim = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve(g.innerHalfW, g.straight, g.depth / 2 + 0.06), 160, 0.045, 8),
      this.rimMat,
    );
    this.outerRimMat = glowMaterial(ROOM.secondary, 2.2);
    const outerRim = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve(g.outerHalfW - 0.06, g.straight, g.depth / 2 + 0.06), 160, 0.025, 6),
      this.outerRimMat,
    );
    this.group.add(innerRim, outerRim);

    // Carvings in an unknown script: glowing dashes along the arch face.
    const rand = mulberry32(99);
    const carveCount = 46;
    const carveGeo = new THREE.BoxGeometry(1, 0.035, 0.02);
    this.carveMat = glowMaterial(ROOM.accent, 1.8);
    const carvings = new THREE.InstancedMesh(carveGeo, this.carveMat, carveCount);
    const mid = (g.innerHalfW + g.outerHalfW) / 2;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const curve = archCurve(mid, g.straight, g.depth / 2 + 0.085);
    for (let i = 0; i < carveCount; i++) {
      const u = 0.03 + (i / carveCount) * 0.94;
      const p = curve.getPointAt(u);
      const tan = curve.getTangentAt(u);
      const ang = Math.atan2(tan.y, tan.x) + (rand() < 0.3 ? Math.PI / 2 : 0);
      q.setFromAxisAngle(zAxis, ang);
      const len = 0.08 + rand() * 0.26;
      m.compose(p, q, new THREE.Vector3(len, 1, 1));
      carvings.setMatrixAt(i, m);
    }
    this.group.add(carvings);

    // Membrane filling the opening.
    const membraneShape = archShape(g.innerHalfW - 0.02, g.straight);
    const memGeo = new THREE.ShapeGeometry(membraneShape, 64);
    this.membraneMat = membraneMaterial({
      minX: -g.innerHalfW,
      minY: 0,
      w: g.innerHalfW * 2,
      h: g.straight + g.innerHalfW,
    });
    this.membrane = new THREE.Mesh(memGeo, this.membraneMat);
    this.membrane.position.z = 0.02;
    this.group.add(this.membrane);

    // Lintel beam that carries the clock row when the clocks are not in hero position.
    const l = LAYOUT.lintel;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(l.halfW * 2, 0.26, 0.55), structureMaterial(0x2a3463, { metalness: 0.65 }));
    lintel.position.set(0, l.y, 0);
    lintel.castShadow = true;
    const lintelGlow = new THREE.Mesh(new THREE.BoxGeometry(l.halfW * 2 - 0.2, 0.035, 0.03), glowMaterial(ROOM.primary, 3.2));
    lintelGlow.position.set(0, l.y - 0.14, 0.29);
    this.group.add(lintel, lintelGlow);

    // Portal light — the gate lights the floor in front of it.
    this.light = new THREE.PointLight(ROOM.primary, 10, 15, 1.6);
    this.light.position.set(0, 2.4, 0.9);
    this.group.add(this.light);

    scene.add(this.group);
    this.targets = [this.arch, this.membrane];
  }

  /** active: 0 mirror … 1 open membrane. */
  setState({ beat5Step = 0, beat5Clear = false, onBeat5 = false, ended = false }) {
    if (beat5Clear || ended) this.activeTarget = 1;
    else if (onBeat5) this.activeTarget = 0.08 + beat5Step * 0.1;
    else this.activeTarget = 0;
  }

  setHover(on) {
    this.hoverTarget = on ? 1 : 0;
  }

  flashWarning() {
    this.warn = 1;
  }

  flashPulse(amount = 1) {
    this.pulse = Math.max(this.pulse, amount);
  }

  update(t, dt) {
    const k = 1 - Math.exp(-2.2 * dt);
    this.active += (this.activeTarget - this.active) * k;
    this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-10 * dt));
    this.warn = Math.max(0, this.warn - dt * 1.8);
    this.pulse = Math.max(0, this.pulse - dt * 1.2);
    const u = this.membraneMat.uniforms;
    u.uTime.value = t;
    u.uActive.value = this.active;
    u.uWarn.value = this.warn * (0.6 + 0.4 * Math.sin(t * 40));
    u.uPulse.value = this.pulse;
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.4);
    this.rimMat.color
      .copy(this.rimMat.userData.baseColor)
      .lerp(new THREE.Color(ROOM.warning), this.warn * 0.8)
      .multiplyScalar(3.0 + this.active * 1.6 + breathe * 0.6 + this.hover * 2.5 + this.pulse * 3);
    this.archMat.emissiveIntensity = 0.1 + this.active * 0.25 + this.hover * 0.2;
    this.light.intensity = 7 + this.active * 12 + this.pulse * 22 + breathe * 2;
  }
}
