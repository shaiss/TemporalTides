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
  // The corridor's spark rhythm. Sparks walk the plates left → far right → center (trap indices,
  // as Anne calls them) with the gaps Maya reads: 2.1, 5.8, 0.9, 3.3 s. Three plates against four
  // gaps means the full pattern only repeats every 12 sparks. The first gate clock ticks on it too.
  sparks: { gaps: [2.1, 5.8, 0.9, 3.3], plates: [0, 2, 1], first: 1.6 },
  // Crystal clusters around the rim: [x, z, size]. `outlier` is the one that does not sing.
  crystals: {
    spots: [
      [-4.25, -7.75, 1.25],
      [4.3, -7.8, 1.35],
      [-7.3, -5.4, 1.1],
      [7.5, -5.0, 1.05],
      [-8.4, -1.4, 0.95],
      [8.6, -2.6, 0.9],
      [-8.2, 3.2, 0.7],
      [8.1, 3.6, 0.75],
    ],
    outlier: 2,
  },
  // Five echo levers. `order` is the true sequence Maya reads from the strain marks
  // ("third, first, fifth, second, fourth"), as lever indices.
  levers: { xs: [2.75, 3.45, 4.15, 4.85, 5.55], z: 1.8, pivotY: 0.66, order: [2, 0, 4, 1, 3] },
  panel: { x: 5.65, z: -1.0, rotY: -0.5, w: 1.7, h: 2.3 },
  clocks: {
    off: { position: [0, 6.72, -7.0], scale: 0.5 },
    heroRow: { position: [0, 3.05, -5.55], scale: 1.0, spacing: 1.95 },
    heroGrid: { position: [0, 3.05, -5.55], scale: 0.95, spacing: 1.85 },
  },
};

/** World point the portrait crop centers on at each place (room = gate, the room's centerpiece). */
export const PLACE_FOCUS = {
  room: [0, 2.6, -6.4],
  corridor: [-4.2, 0.5, 1.2],
  levers: [4.15, 0.9, 1.8],
  panel: [5.3, 1.3, -0.6],
  gate: [0, 3.05, -5.55],
  end: [0, 2.8, -6.4],
  outlier: [-7.3, 1.3, -5.4],
};
