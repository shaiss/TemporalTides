/**
 * Chamber layout — one source of truth for props, lenses, framing focus and tap targets.
 * World units ≈ meters. Locked wide camera sits at (0.3, 3.8, 10.8) looking at (0, 1.4, -2).
 */
export const LAYOUT = {
  roomRadius: 9.8,
  gate: {
    z: -7.0,
    innerHalfW: 2.2,
    outerHalfW: 3.05,
    straight: 2.55, // height of the straight jambs before the arch springs
    depth: 0.7,
    center: [0, 2.45, -6.6],
  },
  lintel: { y: 6.15, z: -7.0, halfW: 3.6 },
  corridor: { x: -4.2, z: 0.45, w: 3.0, len: 6.6 },
  traps: [
    [-5.15, 2.6],
    [-4.2, 1.2],
    [-3.25, -0.2],
  ],
  levers: { xs: [2.85, 3.6, 4.35, 5.1], z: 1.8, pivotY: 0.66 },
  panel: { x: 5.65, z: -1.0, rotY: -0.5, w: 1.7, h: 2.3 },
  clocks: {
    off: { position: [0, 6.72, -7.0], scale: 0.5 },
    heroRow: { position: [0, 3.05, -5.55], scale: 1.0, spacing: 1.95 },
    heroGrid: { position: [0, 3.05, -5.55], scale: 0.95, spacing: 1.85 },
  },
};

/** World point the portrait crop centers on for each beat (subject of the beat). */
export const BEAT_FOCUS = {
  0: [0, 2.6, -6.4],
  1: [-4.2, 0.5, 1.2],
  2: [3.95, 0.9, 1.8],
  3: [3.95, 0.9, 1.8],
  4: [5.0, 1.3, 0.2],
  5: [0, 3.05, -5.55],
  6: [0, 2.8, -6.4],
};
