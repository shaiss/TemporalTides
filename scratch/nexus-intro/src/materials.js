import * as THREE from 'three';
import { ROOM } from './palette.js';

/** Unlit glow (bloom picks it up). `intensity` > 1 pushes blues past the bloom threshold. */
export function glowMaterial(hex, intensity = 3, opts = {}) {
  const color = new THREE.Color(hex).multiplyScalar(intensity);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: opts.depthWrite ?? !opts.additive,
    side: opts.side ?? THREE.FrontSide,
    fog: opts.fog ?? true,
  });
  mat.userData.baseColor = new THREE.Color(hex);
  mat.userData.baseIntensity = intensity;
  return mat;
}

/** Re-tint a glow material (keeps intensity model). */
export function setGlow(mat, hex, intensity) {
  if (hex != null) mat.userData.baseColor.set(hex);
  if (intensity != null) mat.userData.baseIntensity = intensity;
  mat.color.copy(mat.userData.baseColor).multiplyScalar(mat.userData.baseIntensity);
}

/** Polished temporal-crystal / metal structural surface. */
export function structureMaterial(color = ROOM.frame, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: opts.roughness ?? 0.32,
    metalness: opts.metalness ?? 0.55,
    clearcoat: opts.clearcoat ?? 0.6,
    clearcoatRoughness: 0.2,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    emissiveMap: opts.emissiveMap ?? null,
    envMapIntensity: opts.envMapIntensity ?? 1,
  });
}

/** Translucent crystal with thin-film iridescence (refracted past / present / future). */
export function crystalMaterial(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? 0x5b6cd6,
    roughness: 0.14,
    metalness: 0.0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 640],
    emissive: opts.emissive ?? ROOM.primary,
    emissiveIntensity: opts.emissiveIntensity ?? 0.35,
    transparent: true,
    opacity: opts.opacity ?? 0.58,
    envMapIntensity: 0.75,
    depthWrite: false,
    flatShading: true,
  });
}

/** Additive translucent overlay used by lenses (supports fades via userData.baseOpacity). */
export function overlayMaterial(hex, opacity = 0.6, intensity = 1.8, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex).multiplyScalar(intensity),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: opts.side ?? THREE.DoubleSide,
    map: opts.map ?? null,
    fog: true,
  });
  mat.userData.baseOpacity = opacity;
  return mat;
}
