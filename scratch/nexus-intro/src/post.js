import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Quality tiers. `?quality=low|medium|high` pins a tier (and disables auto-downgrade).
 * Otherwise touch / small screens start at medium; any tier steps down once if frames stay slow.
 */
export const TIERS = {
  high: { dpr: 2, bloom: true, bloomScale: 0.5, shadows: true, shadowMap: 2048, motes: 520 },
  medium: { dpr: 1.5, bloom: true, bloomScale: 0.5, shadows: true, shadowMap: 1024, motes: 320 },
  low: { dpr: 1, bloom: false, bloomScale: 0.5, shadows: false, shadowMap: 512, motes: 140 },
};
const ORDER = ['high', 'medium', 'low'];

export function detectQuality() {
  const pinned = new URLSearchParams(window.location.search).get('quality');
  if (pinned && TIERS[pinned]) return { tier: pinned, pinned: true };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  return { tier: coarse || small ? 'medium' : 'high', pinned: false };
}

export class PostFX {
  constructor(renderer, scene, camera, { tier, pinned }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.tier = tier;
    this.pinned = pinned;
    this.onTierChange = null;

    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: renderer.capabilities.isWebGL2 ? 4 : 0,
    });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.38, 0.86);
    this.output = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.output);

    this.baseBloom = 0.6;
    this.bloomBoost = 0;
    this._slowTime = 0;
    this._elapsed = 0;
    this._ema = 1 / 60;
    this._size = { w: 1, h: 1 };
    this.applyTier();
  }

  get settings() {
    return TIERS[this.tier];
  }

  applyTier() {
    const s = this.settings;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.dpr));
    this.bloom.enabled = s.bloom;
    this.renderer.shadowMap.enabled = s.shadows;
    this.setSize(this._size.w, this._size.h);
    this.onTierChange?.(this.tier, s);
  }

  setSize(w, h) {
    this._size = { w, h };
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    const pr = this.renderer.getPixelRatio();
    this.bloom.resolution.set(
      Math.max(1, Math.round(w * pr * this.settings.bloomScale)),
      Math.max(1, Math.round(h * pr * this.settings.bloomScale)),
    );
  }

  /** Short additive bloom spikes for clears / sync (decays on its own). */
  flash(amount = 0.6) {
    this.bloomBoost = Math.max(this.bloomBoost, amount);
  }

  render(dt) {
    this.bloomBoost = Math.max(0, this.bloomBoost - dt * 1.6);
    this.bloom.strength = this.baseBloom + this.bloomBoost;
    this.composer.render(dt);
    this._watchPerformance(dt);
  }

  _watchPerformance(dt) {
    if (this.pinned) return;
    this._elapsed += dt;
    this._ema = this._ema * 0.95 + Math.min(dt, 0.25) * 0.05;
    if (this._elapsed < 3) return;
    if (this._ema > 1 / 32) this._slowTime += dt;
    else this._slowTime = Math.max(0, this._slowTime - dt * 0.5);
    if (this._slowTime > 2.5) {
      const next = ORDER[ORDER.indexOf(this.tier) + 1];
      this._slowTime = 0;
      this._elapsed = 0;
      if (next) {
        this.tier = next;
        this.applyTier();
      }
    }
  }

  dispose() {
    this.composer.dispose();
  }
}
