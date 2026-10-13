import * as THREE from 'three';

/**
 * Procedural canvas textures — no image asset pipeline. Every texture is generated once and cached.
 */
const cache = new Map();

/** Deterministic RNG so the chamber looks identical on every load. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { srgb = true, repeat = null, anisotropy = 4 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

function cached(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

/** Abstract carving strokes ("unknown script" on Nexus arches) — never letters. */
function drawGlyph(ctx, x, y, s, rand) {
  ctx.beginPath();
  const strokes = 2 + Math.floor(rand() * 3);
  for (let k = 0; k < strokes; k++) {
    const kind = rand();
    if (kind < 0.35) {
      ctx.moveTo(x + (rand() - 0.5) * s, y - s * 0.5);
      ctx.lineTo(x + (rand() - 0.5) * s, y + s * 0.5);
    } else if (kind < 0.7) {
      ctx.moveTo(x - s * 0.5, y + (rand() - 0.5) * s);
      ctx.lineTo(x + s * 0.5, y + (rand() - 0.5) * s);
    } else {
      ctx.moveTo(x + s * 0.32, y);
      ctx.arc(x, y, s * 0.32, 0, Math.PI * (1 + rand()));
    }
  }
  ctx.stroke();
}

/**
 * Clock dial: dark enamel face with luminous minute ticks, hour bars and roman quarter numerals.
 * Returns { map, emissiveMap } — emissive carries the luminous markings so they read under bloom.
 */
export function dialTextures() {
  return cached('dial', () => {
    const size = 1024;
    const c = size / 2;
    const base = makeCanvas(size);
    const glow = makeCanvas(size);
    const b = base.getContext('2d');
    const g = glow.getContext('2d');

    const face = b.createRadialGradient(c, c * 0.85, size * 0.05, c, c, size * 0.5);
    face.addColorStop(0, '#2a3566');
    face.addColorStop(0.7, '#161d3d');
    face.addColorStop(1, '#0b1026');
    b.fillStyle = face;
    b.fillRect(0, 0, size, size);
    g.fillStyle = '#000';
    g.fillRect(0, 0, size, size);

    // Guilloché rings on the base face.
    b.strokeStyle = 'rgba(160, 175, 255, 0.07)';
    b.lineWidth = 2;
    for (let r = 40; r < size * 0.36; r += 14) {
      b.beginPath();
      b.arc(c, c, r, 0, Math.PI * 2);
      b.stroke();
    }

    const ink = (ctx, color) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    };

    [b, g].forEach((ctx, pass) => {
      ink(ctx, pass === 0 ? '#c9d2f5' : '#eef1ff');
      // Chapter ring.
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c, c, size * 0.455, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c, c, size * 0.395, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const hour = i % 5 === 0;
        const quarter = i % 15 === 0;
        const r0 = size * (quarter ? 0.36 : hour ? 0.375 : 0.41);
        const r1 = size * 0.45;
        ctx.lineWidth = quarter ? 18 : hour ? 11 : 4;
        ctx.beginPath();
        ctx.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
        ctx.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
        ctx.stroke();
      }
      ctx.font = `600 ${Math.round(size * 0.085)}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numerals = ['XII', 'III', 'VI', 'IX'];
      numerals.forEach((n, i) => {
        const a = (i / 4) * Math.PI * 2;
        const r = size * 0.27;
        ctx.fillText(n, c + Math.sin(a) * r, c - Math.cos(a) * r);
      });
    });

    // Inner carving band (faint on base only).
    const rand = mulberry32(42);
    b.strokeStyle = 'rgba(180, 190, 255, 0.28)';
    b.lineWidth = 3;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + 0.13;
      drawGlyph(b, c + Math.sin(a) * size * 0.165, c - Math.cos(a) * size * 0.165, size * 0.03, rand);
    }

    return { map: toTexture(base, { anisotropy: 8 }), emissiveMap: toTexture(glow, { anisotropy: 8 }) };
  });
}

/** Floor inlay: concentric rings + 12 radial spokes (portal chambers radiate like clock positions). */
export function floorInlayTexture() {
  return cached('floor', () => {
    const size = 2048;
    const c = size / 2;
    const cv = makeCanvas(size);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    const rand = mulberry32(7);

    const ring = (r, w, alpha) => {
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    ring(size * 0.49, 6, 0.55);
    ring(size * 0.47, 2, 0.35);
    ring(size * 0.33, 4, 0.45);
    ring(size * 0.315, 1.5, 0.3);
    ring(size * 0.16, 3, 0.4);
    ring(size * 0.05, 3, 0.55);

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.32)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(a) * size * 0.05, c - Math.cos(a) * size * 0.05);
      ctx.lineTo(c + Math.sin(a) * size * 0.47, c - Math.cos(a) * size * 0.47);
      ctx.stroke();
      // Portal node at each clock position.
      const nx = c + Math.sin(a) * size * 0.4;
      const ny = c - Math.cos(a) * size * 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(nx, ny, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Minute ticks around the outer band.
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r0 = size * (i % 10 === 0 ? 0.445 : 0.455);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = i % 10 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
      ctx.lineTo(c + Math.sin(a) * size * 0.468, c - Math.cos(a) * size * 0.468);
      ctx.stroke();
    }
    // Carving band between rings.
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      drawGlyph(ctx, c + Math.sin(a) * size * 0.24, c - Math.cos(a) * size * 0.24, 26, rand);
    }
    return toTexture(cv, { anisotropy: 8 });
  });
}

/** Rotunda wall seams: vertical light channels + horizontal courses. */
export function wallSeamTexture() {
  return cached('wall', () => {
    const w = 512;
    const h = 512;
    const cv = makeCanvas(w, h);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.46, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.54, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let y = 0; y < h; y += 128) ctx.fillRect(0, y, w, 3);
    return toTexture(cv, { repeat: [14, 1] });
  });
}

/** Hazard plate: chevron grill (emissive). */
export function hazardTexture() {
  return cached('hazard', () => {
    const s = 256;
    const cv = makeCanvas(s);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 10;
    for (let i = -2; i < 6; i++) {
      const y = i * 52;
      ctx.beginPath();
      ctx.moveTo(20, y + 60);
      ctx.lineTo(s / 2, y + 20);
      ctx.lineTo(s - 20, y + 60);
      ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, s - 16, s - 16);
    return toTexture(cv);
  });
}

/** Electrical panel face: grid of indicator cells (emissive). */
export function panelCellsTexture() {
  return cached('panel', () => {
    const w = 256;
    const h = 384;
    const cv = makeCanvas(w, h);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const cols = 4;
    const rows = 7;
    const pad = 18;
    const cw = (w - pad * 2) / cols;
    const ch = (h - pad * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = pad + col * cw + 6;
        const y = pad + r * ch + 6;
        ctx.fillStyle = `rgba(255,255,255,${0.55 + ((r * 3 + col) % 4) * 0.12})`;
        ctx.beginPath();
        ctx.roundRect(x, y, cw - 12, ch - 12, 6);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    return toTexture(cv);
  });
}

/** Soft round sprite for motes / glows. */
export function softDotTexture() {
  return cached('dot', () => {
    const s = 128;
    const cv = makeCanvas(s);
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return toTexture(cv, { srgb: false });
  });
}

/** Horizontal speed streak (alpha ramps head → tail) for Eli's Kinetic Rush. */
export function streakTexture() {
  return cached('streak', () => {
    const w = 512;
    const h = 64;
    const cv = makeCanvas(w, h);
    const ctx = cv.getContext('2d');
    const gx = ctx.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, 'rgba(255,255,255,0)');
    gx.addColorStop(0.75, 'rgba(255,255,255,0.55)');
    gx.addColorStop(0.97, 'rgba(255,255,255,1)');
    gx.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gx;
    ctx.fillRect(0, h * 0.3, w, h * 0.4);
    const gy = ctx.createLinearGradient(0, 0, 0, h);
    gy.addColorStop(0, 'rgba(0,0,0,1)');
    gy.addColorStop(0.5, 'rgba(0,0,0,0)');
    gy.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gy;
    ctx.fillRect(0, 0, w, h);
    return toTexture(cv, { srgb: false });
  });
}

/** Dashed energy band for conduits (scrolls along the tube U axis). */
export function energyDashTexture() {
  return cached('dash', () => {
    const w = 256;
    const h = 16;
    const cv = makeCanvas(w, h);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.8, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return toTexture(cv, { repeat: [6, 1] });
  });
}
