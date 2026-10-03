import * as THREE from 'three';

/** Shared palette for mode overlays (matches site accents). */
export const LENS_PRIMARY = 0x646cff;
export const LENS_SECONDARY = 0x747bff;
export const LENS_ACCENT = 0x9aa8ff;
export const ANNE_COLD = 0x88bbff;
export const ANNE_RIM = 0xaaccff;

const TRAP_BASES = [
  new THREE.Vector3(-4.2 + -1 * 1.1, 0.35, 2.8 - 0 * 1.4),
  new THREE.Vector3(-4.2 + 0 * 1.1, 0.35, 2.8 - 1 * 1.4),
  new THREE.Vector3(-4.2 + 1 * 1.1, 0.35, 2.8 - 2 * 1.4),
];

const LEVER_XS = [2.8, 3.55, 4.3, 5.05];
const PANEL_POS = new THREE.Vector3(5.2, 1.5, -0.5);
const CORRIDOR_CENTER = new THREE.Vector3(-4.2, 0.5, 0.5);

export function createOverlayMaterialFactory() {
  return function overlayMat(color, emissive = 0x000000, emissiveIntensity = 0, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness: opts.metalness ?? 0.45,
      roughness: opts.roughness ?? 0.48,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
    });
  };
}

/**
 * Builds per-mode overlay groups anchored to existing chamber props.
 * Only one group should be visible at a time (see applyActiveLens).
 */
export function buildLensOverlays(mat) {
  const overlayAnne = new THREE.Group();
  const overlayMaya = new THREE.Group();
  const overlayEli = new THREE.Group();
  const overlayVibrion = new THREE.Group();

  const anneRims = [];
  const eliStreaks = [];

  const coldTrap = mat(ANNE_RIM, ANNE_COLD, 1.35);
  const coldEdge = mat(LENS_PRIMARY, ANNE_COLD, 1.1, { metalness: 0.7, roughness: 0.25 });

  TRAP_BASES.forEach((base, i) => {
    const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.95, 4), coldTrap);
    wedge.position.set(base.x, 0.55, base.z);
    wedge.rotation.y = (i * Math.PI) / 2;
    overlayAnne.add(wedge);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, 1.12), coldEdge);
    frame.position.set(base.x, 0.22, base.z);
    overlayAnne.add(frame);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 8, 4),
      mat(0x646cff, ANNE_COLD, 1.5, { metalness: 0.85, roughness: 0.2 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(base.x, 0.72, base.z);
    overlayAnne.add(rim);
    anneRims.push(rim);

    const spike = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), coldEdge);
    spike.position.set(base.x, 0.95, base.z);
    overlayAnne.add(spike);

    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 1.25),
      mat(LENS_ACCENT, LENS_ACCENT, 1.2),
    );
    tick.position.set(base.x - 0.65, 0.48, base.z);
    overlayAnne.add(tick);
  });

  const markMat = mat(LENS_SECONDARY, LENS_SECONDARY, 1.25);
  const echoMat = mat(LENS_PRIMARY, LENS_SECONDARY, 0.95, { transparent: true, opacity: 0.88 });

  function addMayaMark(x, y, z, scale = 1) {
    const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 * scale, 0), markMat);
    mark.position.set(x, y, z);
    overlayMaya.add(mark);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22 * scale, 0.035, 6, 16),
      echoMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y - 0.12, z);
    overlayMaya.add(ring);
  }

  LEVER_XS.forEach((x, i) => {
    addMayaMark(x, 1.38, 1.95);
    if (i < 3) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.05), markMat);
      link.position.set(x + 0.36, 1.05, 1.88);
      overlayMaya.add(link);
    }
  });

  TRAP_BASES.forEach((base, i) => {
    addMayaMark(base.x, 0.55, base.z, 0.85);
    if (i < 2) {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 0.04), echoMat);
      bridge.position.set((base.x + TRAP_BASES[i + 1].x) / 2, 0.42, base.z);
      overlayMaya.add(bridge);
    }
  });

  addMayaMark(PANEL_POS.x, PANEL_POS.y + 0.35, PANEL_POS.z, 0.75);
  addMayaMark(CORRIDOR_CENTER.x, 0.35, CORRIDOR_CENTER.z + 2.2, 0.7);
  addMayaMark(CORRIDOR_CENTER.x, 0.35, CORRIDOR_CENTER.z - 1.8, 0.7);

  const rushMat = new THREE.MeshBasicMaterial({
    color: LENS_ACCENT,
    transparent: true,
    opacity: 0.6,
  });

  LEVER_XS.forEach((x, i) => {
    for (let s = 0; s < 3; s++) {
      const streak = new THREE.Mesh(new THREE.BoxGeometry(1.4 + s * 0.35, 0.08, 0.28), rushMat.clone());
      streak.position.set(x + 0.9 + s * 0.25, 0.72 + i * 0.05, 1.92);
      streak.rotation.y = -0.15;
      overlayEli.add(streak);
      eliStreaks.push({ mesh: streak, leverX: x, index: i, slot: s });
    }
  });

  TRAP_BASES.forEach((base) => {
    const streak = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.22), rushMat.clone());
    streak.position.set(base.x + 0.75, 0.4, base.z);
    overlayEli.add(streak);
    eliStreaks.push({ mesh: streak, leverX: base.x, index: 0, slot: 0, trap: true });
  });

  const eliWindow = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.06, 2.1),
    mat(LENS_SECONDARY, LENS_SECONDARY, 0.85, { transparent: true, opacity: 0.32 }),
  );
  eliWindow.position.set(3.9, 1.02, 1.85);
  overlayEli.add(eliWindow);

  const gridMat = new THREE.LineBasicMaterial({
    color: LENS_PRIMARY,
    transparent: true,
    opacity: 0.72,
  });
  const roomGrid = new THREE.Group();
  const gridY = 0.045;
  const spanX = 9;
  const spanZ = 6.5;
  const step = 0.55;
  for (let x = -spanX; x <= spanX; x += step) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, gridY, -spanZ),
      new THREE.Vector3(x, gridY, spanZ),
    ]);
    roomGrid.add(new THREE.Line(geo, gridMat));
  }
  for (let z = -spanZ; z <= spanZ; z += step) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-spanX, gridY, z),
      new THREE.Vector3(spanX, gridY, z),
    ]);
    roomGrid.add(new THREE.Line(geo, gridMat));
  }
  roomGrid.position.set(0.5, 0, -1.5);
  overlayVibrion.add(roomGrid);

  const panelGrid = new THREE.Group();
  for (let i = -4; i <= 4; i++) {
    const h = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i * 0.2, -0.95, 0),
      new THREE.Vector3(i * 0.2, 0.95, 0),
    ]);
    const v = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.65, i * 0.2, 0),
      new THREE.Vector3(0.65, i * 0.2, 0),
    ]);
    panelGrid.add(new THREE.Line(h, gridMat.clone()));
    panelGrid.add(new THREE.Line(v, gridMat.clone()));
  }
  panelGrid.position.copy(PANEL_POS);
  panelGrid.position.x += 0.02;
  overlayVibrion.add(panelGrid);

  for (let i = -3; i <= 3; i++) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.035, 3.8),
      mat(LENS_PRIMARY, LENS_PRIMARY, 0.85, { transparent: true, opacity: 0.38 }),
    );
    beam.position.set(PANEL_POS.x, 0.12, PANEL_POS.z + i * 0.85);
    overlayVibrion.add(beam);
  }

  return {
    groups: {
      anne: overlayAnne,
      maya: overlayMaya,
      eli: overlayEli,
      vibrion: overlayVibrion,
    },
    anim: {
      anneRims,
      eliStreaks,
      eliWindow,
      roomGrid,
    },
  };
}

export function applyActiveLens(groups, activeMode) {
  Object.entries(groups).forEach(([id, group]) => {
    group.visible = id === activeMode;
  });
}

export function tickLensAnimation(anim, activeMode, t) {
  if (activeMode === 'anne' && anim.anneRims) {
    anim.anneRims.forEach((rim, i) => {
      rim.rotation.z = t * 0.65 + i * 0.4;
    });
  }

  if (anim.eliStreaks) {
    anim.eliStreaks.forEach((entry, i) => {
      const { mesh, leverX, trap } = entry;
      if (activeMode !== 'eli') return;
      const drift = Math.sin(t * 9 + i) * 0.42;
      mesh.position.x = (trap ? leverX : leverX) + 0.55 + drift + (entry.slot ?? 0) * 0.3;
      mesh.material.opacity = 0.28 + Math.abs(Math.sin(t * 6.5 + i)) * 0.5;
    });
  }

  if (anim.eliWindow && activeMode === 'eli') {
    anim.eliWindow.scale.x = 0.82 + Math.sin(t * 4.5) * 0.1;
  }

  if (anim.roomGrid && activeMode === 'vibrion') {
    anim.roomGrid.position.y = Math.sin(t * 1.2) * 0.015;
  }
}
