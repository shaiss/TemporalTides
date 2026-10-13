import * as THREE from 'three';
import { CHARACTER } from './palette.js';
import { LAYOUT } from './layout.js';
import { overlayMaterial } from './materials.js';
import { mulberry32, softDotTexture, streakTexture } from './textures.js';

/**
 * One overlay set per active character (only one visible at a time; crossfades on switch).
 * Language follows TemporalVisuals.md · Per-Ability Visual Effects and ColorPalettes.md:
 *   Anne    — translucent possible futures over the hazard, red foresight warning, anticipatory brackets.
 *   Maya    — cyan sequential highlights, rhythm, structural clarity (lattice), echo marks across props.
 *   Eli     — orange speed lines / burst, closing window band on the lever row (or the sync window).
 *   Vibrion — blue→white grid that sits in the room, pulse rings, Lichtenberg arcs to the panel.
 */

const UP = new THREE.Vector3(0, 1, 0);

function lineMat(hex, opacity, intensity = 2) {
  const m = new THREE.LineBasicMaterial({
    color: new THREE.Color(hex).multiplyScalar(intensity),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  m.userData.baseOpacity = opacity;
  return m;
}

function dyn(mat) {
  mat.userData.dynamic = true;
  return mat;
}

function verticalFadeTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function panelMatrix() {
  const P = LAYOUT.panel;
  const o = new THREE.Object3D();
  o.position.set(P.x, 0, P.z);
  o.rotation.y = P.rotY;
  o.updateMatrixWorld(true);
  return o;
}

/** Corner brackets (anticipatory highlight) — billboarded each frame. */
function buildBrackets(hex) {
  const g = new THREE.Group();
  const mat = dyn(overlayMaterial(hex, 0.9, 3));
  const arm = 0.32;
  const th = 0.035;
  [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ].forEach(([sx, sy]) => {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(arm, th), mat);
    h.position.set(sx * (1 - arm / 2), sy * 1, 0);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(th, arm), mat);
    v.position.set(sx * 1, sy * (1 - arm / 2), 0);
    g.add(h, v);
  });
  g.userData.mat = mat;
  return g;
}

// ————————————————————————————————— Anne —————————————————————————————————
function buildAnne() {
  const C = CHARACTER.anne;
  const group = new THREE.Group();
  const blades = [];
  LAYOUT.traps.forEach(([x, z], i) => {
    const echoes = [];
    for (let e = 0; e < 3; e++) {
      const geo = new THREE.ConeGeometry(0.44 + e * 0.04, 1.7, 4, 1, false);
      geo.rotateY(Math.PI / 4);
      const fill = dyn(overlayMaterial(C.main, 0.4, 2.2));
      const mesh = new THREE.Mesh(geo, fill);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), dyn(lineMat(C.rim, 0.9, 2.4)));
      mesh.add(edges);
      mesh.position.set(x, 0.3, z);
      group.add(mesh);
      echoes.push({ mesh, fill, edge: edges.material, lag: e * 0.11 });
    }
    // Hazard footprint (future danger zone) on the plate.
    const zone = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 4, 1, Math.PI / 4), dyn(overlayMaterial(C.warn, 0.7, 3)));
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(x, 0.285, z);
    group.add(zone);
    blades.push({ echoes, zone, phase: i / 3 });
  });

  // Metronome timing ticks along the corridor edge.
  const c = LAYOUT.corridor;
  const ticks = [];
  for (let j = 0; j < 12; j++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.06), dyn(overlayMaterial(j % 4 === 0 ? C.warn : C.rim, 0.5, 2.6)));
    tick.position.set(c.x + c.w / 2 + 0.35, 0.05, c.z + c.len / 2 - 0.3 - (j * (c.len - 0.6)) / 11);
    group.add(tick);
    ticks.push(tick);
  }

  // Future path preview (dashed, steel-blue).
  const pts = [
    [-3.35, 3.55],
    [-3.5, 2.6],
    [-4.25, 1.95],
    [-5.2, 1.2],
    [-5.0, 0.3],
    [-4.35, -0.25],
    [-4.2, -1.3],
    [-4.2, -2.7],
  ].map(([x, z]) => new THREE.Vector3(x, 0.26, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  const dashes = [];
  for (let d = 0; d < 26; d++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.16), dyn(overlayMaterial(C.rim, 0.8, 2.2)));
    group.add(seg);
    dashes.push(seg);
  }

  const brackets = buildBrackets(C.flash);
  group.add(brackets);

  const tmp = new THREE.Vector3();
  return {
    id: 'anne',
    group,
    update({ t, fade, camera, focus, beat, beat1Clear }) {
      const cycle = 1.9;
      blades.forEach((b) => {
        b.echoes.forEach((e, k) => {
          const ph = ((t / cycle + b.phase - e.lag) % 1 + 1) % 1;
          // Spike up fast, hold, retract — the "trap timing".
          const up = ph < 0.08 ? ph / 0.08 : ph < 0.32 ? 1 : ph < 0.42 ? 1 - (ph - 0.32) / 0.1 : 0;
          e.mesh.scale.set(1, Math.max(0.02, up), 1);
          e.mesh.position.y = 0.28 + 0.85 * up;
          const danger = up > 0.5 && k === 0 ? 1 : 0;
          const echoFade = (k === 0 ? 1 : 0.45 / k) * (beat1Clear ? 0.3 : 1);
          e.fill.color.set(danger ? C.flash : C.main).multiplyScalar(danger ? 1.7 : 1.4);
          e.fill.opacity = (0.14 + up * 0.34) * echoFade * fade;
          e.edge.opacity = (0.25 + up * 0.75) * echoFade * fade;
        });
        const ph0 = ((t / cycle + b.phase) % 1 + 1) % 1;
        const warn = ph0 > 0.85 || ph0 < 0.36 ? 1 : 0.15;
        b.zone.material.opacity = warn * (beat1Clear ? 0.25 : 0.75) * fade;
      });
      const beatTick = Math.floor((t / cycle) * 12) % 12;
      ticks.forEach((tk, j) => {
        tk.material.opacity = (j === beatTick ? 1 : 0.18) * fade;
      });
      dashes.forEach((seg, d) => {
        const u = ((d / dashes.length + t * 0.08) % 1 + 1) % 1;
        curve.getPointAt(u, seg.position);
        curve.getTangentAt(u, tmp);
        seg.lookAt(tmp.add(seg.position));
        seg.material.opacity = 0.75 * fade * Math.sin(u * Math.PI);
      });
      if (focus && camera && beat !== '0' && beat !== '6') {
        brackets.visible = true;
        brackets.position.copy(focus);
        brackets.quaternion.copy(camera.quaternion);
        const s = (beat === '5' ? 1.25 : 1.6) * (1 + 0.04 * Math.sin(t * 6));
        brackets.scale.setScalar(s);
        brackets.userData.mat.opacity = 0.85 * fade;
      } else {
        brackets.visible = false;
      }
    },
  };
}

// ————————————————————————————————— Maya —————————————————————————————————
const MAYA_SEQUENCE = [1, 3, 0, 2]; // lever indices in the order Pattern Sense marks them

function buildMaya() {
  const C = CHARACTER.maya;
  const L = LAYOUT.levers;
  const group = new THREE.Group();
  const markY = 1.95;
  const marks = L.xs.map((x, i) => {
    const rank = MAYA_SEQUENCE.indexOf(i);
    const mat = dyn(overlayMaterial(C.main, 0.9, 2.6));
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), mat);
    gem.position.set(x, markY, L.z);
    const pips = [];
    for (let p = 0; p <= rank; p++) {
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat);
      pip.position.set(x + (p - rank / 2) * 0.09, markY + 0.25, L.z);
      group.add(pip);
      pips.push(pip);
    }
    const strain = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 24), dyn(overlayMaterial(C.teal, 0.7, 2.2)));
    strain.rotation.x = Math.PI / 2;
    strain.position.set(x, L.pivotY + 0.5, L.z);
    group.add(gem, strain);
    return { gem, mat, rank, strain, x };
  });
  // Structural connections drawn in sequence order.
  const links = [];
  for (let r = 0; r < 3; r++) {
    const a = marks.find((m) => m.rank === r);
    const b = marks.find((m) => m.rank === r + 1);
    const p0 = new THREE.Vector3(a.x, markY, L.z);
    const p2 = new THREE.Vector3(b.x, markY, L.z);
    const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 0.35, 0));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, p1, p2), 32, 0.014, 6), dyn(overlayMaterial(C.main, 0.8, 2.4)));
    group.add(tube);
    links.push({ tube, rank: r });
  }

  // Structural lattice over console + panel ("she sees order").
  const latticeMat = lineMat(C.teal, 0.45, 2.2);
  const cx = (L.xs[0] + L.xs[3]) / 2;
  const width = L.xs[3] - L.xs[0] + 1.0;
  const consoleEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 0.04, 0.54, 0.99)), latticeMat);
  consoleEdges.position.set(cx, 0.25, L.z);
  const P = LAYOUT.panel;
  const pm = panelMatrix();
  const panelEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(P.w + 0.04, P.h + 0.04, 0.49)), latticeMat);
  panelEdges.position.copy(pm.localToWorld(new THREE.Vector3(0, 0.2 + P.h / 2, 0)));
  panelEdges.rotation.y = P.rotY;
  group.add(consoleEdges, panelEdges);

  // Echo marks repeated across other props (plates on the floor, clocks billboarded).
  const echoFloor = LAYOUT.traps.map(([x, z]) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.37, 48), dyn(overlayMaterial(C.main, 0.6, 2.4)));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.29, z);
    group.add(ring);
    return ring;
  });
  const echoClocks = [0, 1, 2, 3].map(() => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.08, 1.12, 64), dyn(overlayMaterial(C.main, 0.6, 2.4)));
    group.add(ring);
    return ring;
  });

  return {
    id: 'maya',
    group,
    update({ t, fade, camera, clocks, clockScale = 1 }) {
      const stepDur = 0.5;
      const phase = (t / stepDur) % 6; // 4 marks + 2 beats rest
      const lit = Math.floor(phase);
      const local = phase - lit;
      marks.forEach((m) => {
        const on = m.rank <= lit && lit < 4;
        const just = m.rank === lit ? 1 - local : 0;
        m.mat.opacity = (on ? 0.95 : 0.22) * fade;
        m.gem.rotation.y = t * 1.4 + m.rank;
        m.gem.scale.setScalar(1 + just * 0.45);
        m.strain.material.opacity = (0.35 + 0.35 * Math.sin(t * 3 + m.rank)) * fade;
      });
      links.forEach((l) => {
        l.tube.material.opacity = (l.rank < lit && lit < 4 ? 0.85 : 0.08) * fade;
      });
      const echoPulse = lit < 4 ? 1 - local : 0.2;
      echoFloor.forEach((r, i) => {
        r.material.opacity = (0.15 + echoPulse * 0.5) * fade * (i === lit % 3 ? 1 : 0.5);
        r.scale.setScalar(1 + (1 - echoPulse) * 0.25);
      });
      echoClocks.forEach((r, i) => {
        if (!clocks?.[i]) {
          r.visible = false;
          return;
        }
        r.visible = true;
        r.position.copy(clocks[i]);
        r.quaternion.copy(camera.quaternion);
        r.scale.setScalar(clockScale * (1 + (i === lit ? (1 - local) * 0.12 : 0)));
        r.material.opacity = (i === lit ? 0.75 : 0.18) * fade;
      });
    },
  };
}

// ————————————————————————————————— Eli —————————————————————————————————
function buildEli() {
  const C = CHARACTER.eli;
  const L = LAYOUT.levers;
  const group = new THREE.Group();
  const tex = streakTexture();
  const rand = mulberry32(5);
  const streaks = [];
  const anchors = [
    ...L.xs.map((x) => new THREE.Vector3(x, 1.55, L.z + 0.05)),
    ...L.xs.map((x) => new THREE.Vector3(x, 0.95, L.z + 0.2)),
    ...LAYOUT.traps.map(([x, z]) => new THREE.Vector3(x + 0.5, 0.45, z)),
  ];
  anchors.forEach((a, i) => {
    for (let k = 0; k < 2; k++) {
      const mat = dyn(overlayMaterial(k ? C.hot : C.main, 0.8, 2.6, { map: tex }));
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.07 + rand() * 0.06), mat);
      group.add(mesh);
      streaks.push({ mesh, mat, anchor: a, speed: 2.4 + rand() * 2.2, phase: rand(), dy: (rand() - 0.5) * 0.25, len: 1.4 + rand() * 1.4 });
    }
  });
  // Ambient room streaks (accelerated perception).
  for (let i = 0; i < 14; i++) {
    const mat = dyn(overlayMaterial(i % 3 ? C.main : C.blur, 0.4, 1.8, { map: tex }));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.035), mat);
    group.add(mesh);
    streaks.push({
      mesh,
      mat,
      anchor: new THREE.Vector3(-6 + rand() * 12, 0.6 + rand() * 4.5, -6 + rand() * 9),
      speed: 5 + rand() * 4,
      phase: rand(),
      dy: 0,
      len: 3 + rand() * 3,
      ambient: true,
    });
  }

  // Closing window band.
  const barMat = dyn(overlayMaterial(C.hot, 1, 3.4));
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), barMat);
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), barMat);
  const bandMat = dyn(overlayMaterial(C.main, 0.22, 1.6));
  const band = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.5), bandMat);
  group.add(barL, barR, band);

  return {
    id: 'eli',
    group,
    update({ t, fade, beat, beat5Step, clocks, clockScale = 1, camera }) {
      streaks.forEach((s) => {
        const u = (t * s.speed * 0.25 + s.phase) % 1;
        const x = s.anchor.x - u * s.len * (s.ambient ? 2.5 : 1);
        s.mesh.position.set(x - 1.1 * s.mesh.scale.x, s.anchor.y + s.dy, s.anchor.z);
        s.mesh.scale.x = 0.6 + u * 0.7;
        s.mat.opacity = Math.sin(u * Math.PI) * (s.ambient ? 0.35 : 0.9) * fade;
      });
      // Window target: lever row, or the current clock during the beat-5 sync window.
      const cycle = 2.4;
      const ph = (t % cycle) / cycle;
      const close = ph * ph;
      let cx = (L.xs[0] + L.xs[3]) / 2;
      let cy = 1.05;
      let cz = L.z + 0.55;
      let halfW = (L.xs[3] - L.xs[0]) / 2 + 0.6;
      let h = 1;
      const onClock = beat === '5' && clocks?.[beat5Step];
      if (onClock) {
        const p = clocks[beat5Step];
        cx = p.x;
        cy = p.y;
        cz = p.z + 0.2;
        halfW = 1.25 * clockScale;
        h = 1.5 * clockScale;
      }
      const w = Math.max(0.04, halfW * (1 - close * 0.92));
      barL.position.set(cx - w, cy, cz);
      barR.position.set(cx + w, cy, cz);
      barL.scale.y = barR.scale.y = h;
      band.position.set(cx, cy, cz - 0.01);
      band.scale.set(w * 2, h, 1);
      if (camera && onClock) {
        barL.quaternion.copy(camera.quaternion);
        barR.quaternion.copy(camera.quaternion);
        band.quaternion.copy(camera.quaternion);
      } else {
        barL.quaternion.identity();
        barR.quaternion.identity();
        band.quaternion.identity();
      }
      const snap = ph > 0.94 ? 1 : 0;
      barMat.opacity = (0.75 + snap * 0.25) * fade;
      barMat.color.set(snap ? C.blur : C.hot).multiplyScalar(3.4 + snap * 2);
      bandMat.opacity = (0.05 + close * 0.15) * fade;
    },
  };
}

// ————————————————————————————————— Vibrion —————————————————————————————————
function gridMaterial() {
  const C = CHARACTER.vibrion;
  const P = LAYOUT.panel;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 0 },
      uColor: { value: new THREE.Color(C.main) },
      uWhite: { value: new THREE.Color(C.shimmer) },
      uSrcA: { value: new THREE.Vector2(P.x, P.z) },
      uSrcB: { value: new THREE.Vector2(0, LAYOUT.gate.z + 0.6) },
      uSrcBOn: { value: 0 },
      uRadius: { value: LAYOUT.roomRadius - 0.35 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFade;
      uniform vec3 uColor;
      uniform vec3 uWhite;
      uniform vec2 uSrcA;
      uniform vec2 uSrcB;
      uniform float uSrcBOn;
      uniform float uRadius;
      varying vec2 vXZ;
      float gridLine(vec2 p, float spacing, float width) {
        vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
        vec2 fw = fwidth(p) * 1.2;
        vec2 l = 1.0 - smoothstep(vec2(width), vec2(width) + fw, g);
        return max(l.x, l.y);
      }
      void main() {
        vec2 p = vXZ;
        // Molecular shimmer (heat waves).
        p += vec2(sin(p.y * 3.0 + uTime * 2.3), cos(p.x * 2.6 + uTime * 1.9)) * 0.018;
        float major = gridLine(p, 1.2, 0.012);
        float minor = gridLine(p, 0.3, 0.004) * 0.35;
        float dA = distance(vXZ, uSrcA);
        float dB = distance(vXZ, uSrcB);
        float waveA = exp(-pow((dA - mod(uTime * 2.6, 13.0)) * 0.9, 2.0));
        float waveB = exp(-pow((dB - mod(uTime * 3.2 + 4.0, 11.0)) * 1.0, 2.0)) * uSrcBOn;
        float nearA = smoothstep(4.5, 0.0, dA);
        float r = length(vXZ);
        float mask = smoothstep(uRadius, uRadius - 1.2, r);
        float lines = (major + minor) * (0.3 + nearA * 0.25 + (waveA + waveB) * 0.6);
        vec3 col = mix(uColor, uWhite, clamp(waveA + waveB, 0.0, 1.0) * 0.55) * lines * 1.35;
        float a = clamp(lines, 0.0, 1.0) * mask * uFade;
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });
}

function lichtenberg(rand, start, dir, depth, out, maxSeg = 9) {
  const pts = [start.clone()];
  let p = start.clone();
  let d = dir.clone().normalize();
  const n = 3 + Math.floor(rand() * maxSeg * 0.7);
  for (let i = 0; i < n; i++) {
    d.applyAxisAngle(UP, (rand() - 0.5) * 1.1).normalize();
    p = p.clone().addScaledVector(d, 0.22 + rand() * 0.3);
    pts.push(p);
    if (depth < 3 && rand() < 0.28) {
      const bd = d.clone().applyAxisAngle(UP, (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.6));
      lichtenberg(rand, p, bd, depth + 1, out, Math.max(3, maxSeg - 3));
    }
  }
  out.push({ pts, depth });
}

function buildVibrion() {
  const C = CHARACTER.vibrion;
  const P = LAYOUT.panel;
  const group = new THREE.Group();
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.roomRadius * 2, LAYOUT.roomRadius * 2), gridMaterial());
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.02;
  grid.renderOrder = 1;
  group.add(grid);

  const rand = mulberry32(2024);
  const branches = [];
  const start = new THREE.Vector3(P.x - 0.55, 0.03, P.z + 0.45);
  for (let b = 0; b < 3; b++) {
    lichtenberg(rand, start, new THREE.Vector3(-0.7 + b * 0.15, 0, -0.25 - b * 0.35), 0, branches);
  }
  // Arcs climbing the panel face.
  const pm = panelMatrix();
  const climb = [];
  for (let k = 0; k < 2; k++) {
    const pts = [];
    let x = (k ? 0.45 : -0.45) + (rand() - 0.5) * 0.1;
    for (let y = 0.25; y < 2.4; y += 0.18) {
      x += (rand() - 0.5) * 0.22;
      pts.push(pm.localToWorld(new THREE.Vector3(x, y, 0.27)));
    }
    climb.push({ pts, depth: 1 });
  }
  const arcs = [...branches, ...climb].map((br) => {
    const mat = dyn(overlayMaterial(br.depth === 0 ? C.shimmer : C.main, 0.9, br.depth === 0 ? 2.0 : 2.2));
    const curve = new THREE.CatmullRomCurve3(br.pts, false, 'catmullrom', 0.1);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, br.pts.length * 4, br.depth === 0 ? 0.018 : 0.011, 5), mat);
    group.add(mesh);
    return { mesh, mat, seed: rand() * 10, depth: br.depth };
  });

  // Coupling beams at the panel and the gate jamb.
  const fadeTex = verticalFadeTexture();
  const beams = [
    pm.localToWorld(new THREE.Vector3(0, 0, 0.1)),
    new THREE.Vector3(2.75, 0, LAYOUT.gate.z + 0.5),
  ].map((pos, i) => {
    const mat = dyn(overlayMaterial(C.main, 0.35, 2.4, { map: fadeTex }));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5 - i * 0.15, 0.6 - i * 0.15, 3.4, 32, 1, true), mat);
    beam.position.set(pos.x, 1.7, pos.z);
    group.add(beam);
    return { beam, mat };
  });

  // Aura at the panel (blue → white with energy).
  const auraMat = new THREE.SpriteMaterial({
    map: softDotTexture(),
    color: new THREE.Color(C.main).multiplyScalar(2),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.6,
  });
  dyn(auraMat);
  const aura = new THREE.Sprite(auraMat);
  aura.position.copy(pm.localToWorld(new THREE.Vector3(0, 1.4, 0.6)));
  aura.scale.setScalar(2.2);
  group.add(aura);

  return {
    id: 'vibrion',
    group,
    update({ t, fade, beat, beat4Clear, beat5Step }) {
      const gu = grid.material.uniforms;
      gu.uTime.value = t;
      gu.uFade.value = fade;
      gu.uSrcBOn.value = beat === '5' || beat === '6' ? 1 : 0;
      const energy = beat4Clear ? 1 : 0.55;
      arcs.forEach((a) => {
        const f = Math.sin(t * 23 + a.seed * 7) * Math.sin(t * 9.7 + a.seed * 3);
        const on = f > -0.2 ? 1 : 0.15;
        a.mat.opacity = on * (a.depth === 0 ? 0.7 : 0.5) * energy * fade;
      });
      beams.forEach((b, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 3.4 + i * 1.7);
        const gateOn = i === 1 ? (beat === '5' && beat5Step >= 3 ? 1 : beat === '6' ? 0.6 : 0.15) : 1;
        b.mat.opacity = 0.2 * pulse * gateOn * fade;
      });
      auraMat.opacity = (0.16 + 0.1 * Math.sin(t * 5.1)) * energy * fade;
      auraMat.color.set(beat4Clear ? C.shimmer : C.main).multiplyScalar(beat4Clear ? 0.9 : 1.6);
    },
  };
}

// ————————————————————————————————— System —————————————————————————————————
export class LensSystem {
  constructor(scene) {
    this.lenses = [buildAnne(), buildMaya(), buildEli(), buildVibrion()];
    this.byId = Object.fromEntries(this.lenses.map((l) => [l.id, l]));
    this.active = 'vibrion';
    this.lenses.forEach((l) => {
      l.fade = l.id === this.active ? 1 : 0;
      l.statics = [];
      l.group.traverse((o) => {
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach((m) => {
          if (!m.userData.dynamic && m.userData.baseOpacity != null) l.statics.push(m);
        });
      });
      scene.add(l.group);
    });
  }

  setActive(id) {
    if (this.byId[id]) this.active = id;
  }

  update(ctx) {
    const { dt } = ctx;
    this.lenses.forEach((l) => {
      const target = l.id === this.active ? 1 : 0;
      const rate = target ? 3.2 : 6;
      l.fade += (target - l.fade) * (1 - Math.exp(-rate * dt));
      if (l.fade < 0.004 && !target) l.fade = 0;
      l.group.visible = l.fade > 0;
      if (!l.group.visible) return;
      l.statics.forEach((m) => {
        m.opacity = m.userData.baseOpacity * l.fade;
      });
      l.update({ ...ctx, fade: l.fade });
    });
  }
}

