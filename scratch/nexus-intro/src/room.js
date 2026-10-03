import * as THREE from 'three';

/** Chamber base palette — keep in sync with CSS `--temporal-primary` / `--temporal-secondary`. */
export const PRIMARY = 0x646cff;
export const SECONDARY = 0x747bff;

const FLOOR_TINT = 0x141a28;
const WALL_TINT = 0x0f141f;
const FRAME_TINT = 0x1a2030;

function surfaceMaterial(color, { emissive = 0x000000, emissiveIntensity = 0, metalness = 0.42, roughness = 0.52 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness,
    roughness,
  });
}

function edgeStripMaterial(intensity = 0.75) {
  return new THREE.MeshStandardMaterial({
    color: PRIMARY,
    emissive: PRIMARY,
    emissiveIntensity: intensity,
    metalness: 0.55,
    roughness: 0.38,
  });
}

function addEdgeStrip(scene, geometry, position, rotation = null) {
  const mesh = new THREE.Mesh(geometry, edgeStripMaterial());
  mesh.position.copy(position);
  if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return mesh;
}

/** Shadow map + tone-friendly defaults for the chamber diorama. */
export function configureRoomRenderer(renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

/**
 * One shadow-casting direction plus soft fill — room shell only; mode/gate accents stay in chamber.
 * @returns {{ keyLight: THREE.DirectionalLight }}
 */
export function installRoomBaseLighting(scene) {
  scene.add(new THREE.HemisphereLight(SECONDARY, 0x05070e, 0.32));

  const key = new THREE.DirectionalLight(0xf0f2ff, 1.08);
  key.position.set(5.5, 11.5, 8.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 36;
  const frustum = 13;
  key.shadow.camera.left = -frustum;
  key.shadow.camera.right = frustum;
  key.shadow.camera.top = frustum;
  key.shadow.camera.bottom = -frustum;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.018;
  scene.add(key);

  const fill = new THREE.DirectionalLight(PRIMARY, 0.14);
  fill.position.set(-5, 4.5, -2);
  scene.add(fill);

  return { keyLight: key };
}

/**
 * Primitive room shell: lit floor, matte walls, emissive perimeter edges, gate frame.
 * @returns {{ gateFrame: THREE.Mesh }}
 */
export function buildRoomShell(scene) {
  const floorMat = surfaceMaterial(FLOOR_TINT, { metalness: 0.28, roughness: 0.38 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = surfaceMaterial(WALL_TINT, { metalness: 0.35, roughness: 0.62 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(22, 7), wallMat);
  back.position.set(0, 3.5, -8);
  back.receiveShadow = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  left.position.set(-11, 3.5, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  scene.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  right.position.set(11, 3.5, 0);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;
  scene.add(right);

  const stripH = 0.06;
  const stripD = 0.04;
  const edgeGeoH = new THREE.BoxGeometry(22, stripH, stripD);
  const edgeGeoV = new THREE.BoxGeometry(stripD, stripH, 16);
  const y = stripH * 0.5;

  addEdgeStrip(scene, edgeGeoH, new THREE.Vector3(0, y, 8));
  addEdgeStrip(scene, edgeGeoH, new THREE.Vector3(0, y, -8));
  addEdgeStrip(scene, edgeGeoV, new THREE.Vector3(-11, y, 0));
  addEdgeStrip(scene, edgeGeoV, new THREE.Vector3(11, y, 0));

  const wallBaseGeo = new THREE.BoxGeometry(22, 0.05, 0.06);
  addEdgeStrip(scene, wallBaseGeo, new THREE.Vector3(0, 0.025, -7.97));
  const sideBaseGeo = new THREE.BoxGeometry(0.06, 0.05, 16);
  addEdgeStrip(scene, sideBaseGeo, new THREE.Vector3(-10.97, 0.025, 0));
  addEdgeStrip(scene, sideBaseGeo, new THREE.Vector3(10.97, 0.025, 0));

  const crownGeo = new THREE.BoxGeometry(22, 0.05, 0.05);
  const crownMat = edgeStripMaterial(0.45);
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.set(0, 6.98, -7.98);
  scene.add(crown);

  const gateFrame = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 4.8, 0.35),
    surfaceMaterial(FRAME_TINT, {
      emissive: PRIMARY,
      emissiveIntensity: 0.12,
      metalness: 0.48,
      roughness: 0.48,
    }),
  );
  gateFrame.position.set(0, 2.4, -7.1);
  gateFrame.castShadow = true;
  gateFrame.receiveShadow = true;
  scene.add(gateFrame);

  const frameEdgeMat = edgeStripMaterial(0.9);
  const frameRing = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.08, 0.12), frameEdgeMat);
  frameRing.position.set(0, 4.72, -6.92);
  scene.add(frameRing);

  return { gateFrame };
}

/** Opt-in shadow flags for chamber props (keeps room module owning shell defaults). */
export function applyRoomShadows(mesh, { cast = true, receive = true } = {}) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
}
