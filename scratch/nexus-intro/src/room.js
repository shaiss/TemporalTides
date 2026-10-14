import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM } from './palette.js';
import { LAYOUT } from './layout.js';
import { crystalMaterial, glowMaterial, structureMaterial } from './materials.js';
import { floorInlayTexture, mulberry32, wallSeamTexture } from './textures.js';

/**
 * Time Nexus chamber shell (TimeNexus.md · Architecture): seamless curved rotunda wall, polished
 * crystal floor with a clock-position inlay, crystalline ribs, crystal clusters, aurora "sky of
 * compressed timelines". Light comes from the crystal itself — emissive + bloom, few fixtures.
 */
export function configureRoomRenderer(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

export function applyShadows(obj, { cast = true, receive = true } = {}) {
  obj.traverse?.((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

const THETA_START = Math.PI / 3;
const THETA_LEN = (Math.PI * 4) / 3;

function crystalShardGeometry(radius, height) {
  const prism = new THREE.CylinderGeometry(radius, radius * 1.08, height, 6, 1);
  const tip = new THREE.ConeGeometry(radius, radius * 2.2, 6, 1);
  tip.translate(0, height / 2 + radius * 1.1, 0);
  const g = mergeGeometries([prism.toNonIndexed(), tip.toNonIndexed()]);
  g.translate(0, height / 2, 0);
  g.computeVertexNormals();
  return g;
}

function buildCrystalCluster(rand, size = 1) {
  const group = new THREE.Group();
  const mat = crystalMaterial({ emissiveIntensity: 0.5 + rand() * 0.25 });
  const count = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < count; i++) {
    const r = (0.12 + rand() * 0.2) * size;
    const h = (0.6 + rand() * 2.0) * size * (i === 0 ? 1.5 : 1);
    const shard = new THREE.Mesh(crystalShardGeometry(r, h), mat);
    const a = rand() * Math.PI * 2;
    const d = i === 0 ? 0 : (0.15 + rand() * 0.45) * size;
    shard.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    shard.rotation.set((rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.5);
    shard.castShadow = false;
    shard.receiveShadow = false;
    group.add(shard);
  }
  return group;
}

/**
 * The cluster that does not sing. Same footprint and height as its neighbours, but grown rather
 * than cut: smooth, tapered, slightly bent, opaque and dark. It never takes part in a chime.
 * Nothing about it glows or pulses; it is only slightly wrong.
 */
function buildOutlierCluster(size = 1) {
  const rand = mulberry32(4242);
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x150c26,
    roughness: 0.3,
    metalness: 0.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    emissive: 0x2a0f45,
    emissiveIntensity: 0.14,
    envMapIntensity: 0.5,
  });
  for (let i = 0; i < 5; i++) {
    const r = (0.17 + rand() * 0.15) * size;
    const h = (0.9 + rand() * 1.6) * size * (i === 0 ? 1.45 : 1);
    const pts = [];
    const steps = 18;
    for (let j = 0; j <= steps; j++) {
      const u = j / steps;
      const rr = r * Math.pow(1 - u, 0.45) * (1 + 0.07 * Math.sin(u * 9 + i));
      pts.push(new THREE.Vector2(Math.max(0.002, rr), u * h));
    }
    const geo = new THREE.LatheGeometry(pts, 16);
    const pos = geo.attributes.position;
    const bend = (rand() - 0.5) * 0.5 * size;
    for (let v = 0; v < pos.count; v++) {
      const u = pos.getY(v) / h;
      pos.setX(v, pos.getX(v) + bend * u * u);
    }
    geo.computeVertexNormals();
    const shard = new THREE.Mesh(geo, mat);
    const a = rand() * Math.PI * 2;
    const d = i === 0 ? 0 : (0.15 + rand() * 0.4) * size;
    shard.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    shard.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI, (rand() - 0.5) * 0.35);
    group.add(shard);
  }
  return group;
}
function auroraMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uA: { value: new THREE.Color(ROOM.primary) },
      uB: { value: new THREE.Color(0x00a0a0) },
      uC: { value: new THREE.Color(0x8a5cff) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      varying vec2 vUv;
      void main() {
        float x = vUv.x * 18.0;
        float w1 = sin(x + uTime * 0.18 + sin(vUv.x * 7.0 + uTime * 0.11) * 1.6);
        float w2 = sin(x * 1.7 - uTime * 0.13 + 1.3);
        float curtain = smoothstep(0.15, 1.0, w1 * 0.6 + w2 * 0.4 + 0.35);
        float band = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float streak = pow(abs(sin(vUv.x * 160.0 + w1 * 3.0)), 18.0) * 0.6;
        vec3 col = mix(uA, uB, w2 * 0.5 + 0.5);
        col = mix(col, uC, smoothstep(0.6, 1.0, vUv.y));
        float a = band * (curtain * 0.55 + streak * curtain) * uIntensity;
        gl_FragColor = vec4(col * a * 1.4, a);
      }
    `,
  });
}

export function buildRoom(scene, renderer) {
  const R = LAYOUT.roomRadius;
  const rand = mulberry32(1337);

  scene.background = new THREE.Color(ROOM.void);
  scene.fog = new THREE.FogExp2(ROOM.fog, 0.02);

  // Image-based reflections for crystal / metal (generic studio env, kept dim).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;
  pmrem.dispose();

  // —— Lights ——
  const hemi = new THREE.HemisphereLight(0xa3b0ff, 0x0b0e1c, 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf0f3ff, 1.55);
  key.position.set(4.5, 12, 8.5);
  key.target.position.set(0, 0, -2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -11;
  key.shadow.camera.right = 11;
  key.shadow.camera.top = 11;
  key.shadow.camera.bottom = -11;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);

  const rim = new THREE.SpotLight(0x7f8cff, 220, 30, Math.PI / 5, 0.6, 1.6);
  rim.position.set(-7, 9, -8);
  rim.target.position.set(1, 0, 1);
  scene.add(rim, rim.target);

  const warm = new THREE.PointLight(0xffc27a, 2.2, 6, 1.8); // warmth in inhabited areas
  warm.position.set(-4.6, 2.2, -0.4);
  scene.add(warm);

  // —— Floor: polished crystal + emissive inlay ——
  const inlay = floorInlayTexture();
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: ROOM.floor,
    roughness: 0.42,
    metalness: 0.1,
    clearcoat: 0.55,
    clearcoatRoughness: 0.32,
    emissive: ROOM.primary,
    emissiveMap: inlay,
    emissiveIntensity: 0.55,
    envMapIntensity: 0.16,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 128), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Raised rim where floor meets wall.
  const curb = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.1, 0.12, 8, 160),
    structureMaterial(ROOM.frame, { metalness: 0.7 }),
  );
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = 0.06;
  scene.add(curb);

  // —— Seamless curved wall ——
  const seams = wallSeamTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    color: ROOM.wall,
    roughness: 0.55,
    metalness: 0.25,
    emissive: ROOM.secondary,
    emissiveMap: seams,
    emissiveIntensity: 0.35,
    side: THREE.BackSide,
    envMapIntensity: 0.6,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 11, 96, 1, true, THETA_START, THETA_LEN), wallMat);
  wall.position.y = 5.5;
  wall.receiveShadow = true;
  scene.add(wall);

  // Aurora band: "sky of compressed timelines".
  const aurora = auroraMaterial();
  const auroraMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(R - 0.25, R - 0.25, 4.2, 96, 1, true, THETA_START, THETA_LEN),
    aurora,
  );
  auroraMesh.position.y = 8.0;
  scene.add(auroraMesh);

  // —— Crystalline ribs at the 12 clock positions (front arc left open for the camera) ——
  const ribMat = structureMaterial(0x252f57, { metalness: 0.65, roughness: 0.28 });
  const ribGlow = glowMaterial(ROOM.primary, 1.05);
  for (let k = 0; k < 12; k++) {
    const theta = (k / 12) * Math.PI * 2;
    if (theta < THETA_START - 0.01 || theta > THETA_START + THETA_LEN + 0.01) continue;
    if (Math.abs(theta - Math.PI) < 0.01) continue; // keep the gate silhouette clean
    const rib = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 11, 0.5), ribMat);
    body.position.y = 5.5;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 10.4, 0.04), ribGlow);
    strip.position.set(0, 5.6, -0.27);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), ribMat);
    foot.position.y = 0.25;
    rib.add(body, strip, foot);
    rib.position.set(Math.sin(theta) * (R - 0.25), 0, Math.cos(theta) * (R - 0.25));
    rib.rotation.y = theta;
    applyShadows(rib, { cast: false, receive: true });
    scene.add(rib);
  }

  // —— Crystal clusters (set dressing; never occlude props) ——
  const clusters = [];
  const C = LAYOUT.crystals;
  C.spots.forEach(([x, z, s], i) => {
    // Every regular cluster comes from the same seeded stream, so the outlier does not reshuffle
    // its neighbours: its regular twin is built (and dropped) to keep the stream in step.
    const regular = buildCrystalCluster(rand, s);
    const outlier = i === C.outlier;
    const c = outlier ? buildOutlierCluster(s) : regular;
    if (outlier) regular.traverse((o) => o.geometry?.dispose());
    c.position.set(x, 0, z);
    c.rotation.y = rand() * Math.PI;
    scene.add(c);
    const mat = outlier ? null : regular.children[0].material;
    clusters.push({ group: c, mat, base: mat?.emissiveIntensity ?? 0, outlier, x, z, flashAt: -1, amp: 0 });
  });

  // —— Chimes (TimeNexus.md · Singing Crystals) ——
  // Out of phase, the crystals chime raggedly round the rim. Once the gate is in phase they chime
  // as one. The outlier never chimes.
  const chime = { t: 0, next: 40, rand: mulberry32(77), onChime: null };
  const singers = clusters.filter((c) => !c.outlier).sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
  function ring(inPhase) {
    const t = chime.t;
    const events = singers.map((cl, n) => {
      const delay = inPhase ? 0 : n * 0.16 + chime.rand() * 0.32;
      cl.flashAt = t + delay;
      cl.amp = inPhase ? 1.6 : 0.8;
      return { delay, pan: THREE.MathUtils.clamp(cl.x / 9, -1, 1), index: n };
    });
    chime.next = t + 13 + chime.rand() * 8;
    chime.onChime?.(events, { inPhase });
    return events;
  }

  return {
    floorMat,
    wallMat,
    keyLight: key,
    crystals: clusters,
    outlier: clusters.find((c) => c.outlier)?.group ?? null,
    /** Ring the crystals now; `inPhase` = the single in-tune chime at the seal. */
    chime(inPhase = false) {
      return ring(inPhase);
    },
    set onChime(fn) {
      chime.onChime = fn;
    },
    setShadowMapSize(n) {
      key.shadow.mapSize.set(n, n);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    },
    update(t, dt, ctx = {}) {
      aurora.uniforms.uTime.value = t;
      const surge = ctx.sync ?? 0;
      aurora.uniforms.uIntensity.value = 0.75 + surge * 0.9;
      floorMat.emissiveIntensity = 0.5 + Math.sin(t * 0.9) * 0.06 + surge * 0.4;
      wallMat.emissiveIntensity = 0.32 + surge * 0.35;

      chime.t = t;
      if (ctx.ambientChimes !== false && t >= chime.next) ring(false);
      // After the seal the singing clusters breathe together; the outlier keeps still.
      const unison = ctx.sealed ? 0.22 + 0.18 * Math.sin(t * 1.6) : 0;
      singers.forEach((cl) => {
        const since = t - cl.flashAt;
        const flash = cl.flashAt >= 0 && since >= 0 ? cl.amp * Math.exp(-since * 2.6) : 0;
        cl.mat.emissiveIntensity = cl.base * (1 + unison) + flash;
      });
    },
  };
}
