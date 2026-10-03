import * as THREE from 'three';
import {
  applyRoomShadows,
  buildRoomShell,
  configureRoomRenderer,
  installRoomBaseLighting,
} from './room.js';
import { NexusBeat5Clocks } from './clocks.js';
import { CameraBeat } from './cameraBeat.js';
import {
  LENS_PRIMARY,
  LENS_SECONDARY,
  LENS_ACCENT,
  buildLensOverlays,
  applyActiveLens,
  tickLensAnimation,
  createOverlayMaterialFactory,
} from './lenses.js';

const PRIMARY = LENS_PRIMARY;
const SECONDARY = LENS_SECONDARY;
const ACCENT = LENS_ACCENT;

export class NexusChamber {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.targetBeat = null;
    this.beat5Step = 0;
    this.beat5Clear = false;
    this.activeMode = 'vibrion';

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080a12, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    configureRoomRenderer(this.renderer);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080a12, 0.028);

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    this.cameraBeat = new CameraBeat(this.camera);
    this.camera.position.set(0.3, 3.8, 10.8);
    this.camera.lookAt(0, 1.4, -2);

    this.modeLights = {};

    installRoomBaseLighting(this.scene);
    this._buildSceneLights();
    const { gateFrame } = buildRoomShell(this.scene);
    this.gateFrame = gateFrame;
    this._buildProps();
    this._buildLensLayer();
    this._buildGateFocus();
    this.beat5Clocks = new NexusBeat5Clocks(this.scene, this._mat.bind(this));

    this._onResize();
    window.addEventListener('resize', () => this._onResize());
    this._animate();
  }

  _mat(color, emissive = 0x000000, emissiveIntensity = 0, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness: opts.metalness ?? 0.4,
      roughness: opts.roughness ?? 0.55,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    });
  }

  _buildSceneLights() {
    this.gateLight = new THREE.SpotLight(PRIMARY, 0, 18, Math.PI / 5, 0.4);
    this.gateLight.position.set(0, 5.5, 2);
    this.gateLight.target.position.set(0, 2.5, -6);
    this.scene.add(this.gateLight);
    this.scene.add(this.gateLight.target);

    const modes = {
      anne: { color: 0x88bbff, pos: [-5, 2.5, 3] },
      maya: { color: SECONDARY, pos: [4, 2, 3] },
      eli: { color: ACCENT, pos: [2, 1.5, 5] },
      vibrion: { color: PRIMARY, pos: [6, 2, -1] },
    };
    Object.entries(modes).forEach(([id, cfg]) => {
      const light = new THREE.PointLight(cfg.color, 0, 22);
      light.position.set(...cfg.pos);
      this.scene.add(light);
      this.modeLights[id] = light;
    });
  }

  _buildGateFocus() {
    this.gateRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.08, 12, 48),
      this._mat(PRIMARY, PRIMARY, 0.6),
    );
    this.gateRing.position.set(0, 2.5, -6.85);
    this.scene.add(this.gateRing);

    this.gatePortal = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 3.2),
      new THREE.MeshBasicMaterial({
        color: PRIMARY,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
      }),
    );
    this.gatePortal.position.set(0, 2.5, -6.75);
    this.scene.add(this.gatePortal);
  }

  _buildProps() {
    const corridor = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.12, 6),
      this._mat(0x1a2030),
    );
    corridor.position.set(-4.2, 0.06, 0.5);
    applyRoomShadows(corridor);
    this.scene.add(corridor);

    this.trapMeshes = [];
    for (let i = 0; i < 3; i++) {
      const trap = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.25, 1),
        this._mat(0x252a3d),
      );
      trap.position.set(-4.2 + (i - 1) * 1.1, 0.18, 2.8 - i * 1.4);
      applyRoomShadows(trap);
      this.scene.add(trap);
      this.trapMeshes.push(trap);
    }

    this.leverMeshes = [];
    for (let i = 0; i < 4; i++) {
      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8),
        this._mat(0x2a3045),
      );
      lever.position.set(2.8 + i * 0.75, 0.7, 1.8);
      lever.rotation.z = (i % 2 === 0 ? 0.3 : -0.25);
      applyRoomShadows(lever);
      this.scene.add(lever);
      this.leverMeshes.push(lever);
    }

    this.panelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2, 0.22),
      this._mat(0x1a1f2e),
    );
    this.panelMesh.position.set(5.2, 1.5, -0.5);
    applyRoomShadows(this.panelMesh);
    this.scene.add(this.panelMesh);
  }

  _buildLensLayer() {
    const overlayMat = createOverlayMaterialFactory();
    const { groups, anim } = buildLensOverlays(overlayMat);
    this.lensGroups = groups;
    this.lensAnim = anim;
    Object.values(groups).forEach((g) => this.scene.add(g));
    applyActiveLens(groups, this.activeMode);
  }

  syncFromInk(state) {
    this.activeMode = state.active;
    this.targetBeat = state.currentBeat;
    this.beat5Step = state.beat5Step;
    this.beat5Clear = state.beat5Clear;

    const inBeatFive = this.targetBeat === 5 || this.targetBeat === '5';
    this.beat5Clocks?.sync({
      targetBeat: state.currentBeat,
      beat5Step: state.beat5Step,
      beat5Clear: state.beat5Clear,
    });
    this.cameraBeat.syncFromInk({
      beat5Step: this.beat5Step,
      beat5Clear: this.beat5Clear,
      inBeatFive,
    });
    this._updateOverlayVisibility();
  }

  _updateOverlayVisibility() {
    applyActiveLens(this.lensGroups, this.activeMode);
    Object.entries(this.modeLights).forEach(([id, light]) => {
      light.intensity = id === this.activeMode ? 0.55 : 0;
    });
  }

  _onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const t = this.clock.getElapsedTime();

    const onBeat5 = this.targetBeat === '5' || this.targetBeat === 5;
    this.cameraBeat.update();
    this.beat5Clocks?.update(t);

    const syncFactor = this.beat5Clear ? 1 : Math.min(this.beat5Step / 4, 0.9);

    if (this.gateLight) {
      const pulse = this.beat5Clear ? 2.4 : 0.9 + Math.sin(t * 2.5) * 0.35;
      this.gateLight.intensity = onBeat5 ? pulse : 0;
    }
    if (this.gateRing) {
      const scale = onBeat5 ? 1 + Math.sin(t * 2) * 0.04 : 1;
      this.gateRing.scale.set(scale, scale, scale);
      this.gateRing.material.emissiveIntensity = onBeat5 ? 0.7 + syncFactor * 0.5 : 0.15;
    }
    if (this.gatePortal) {
      this.gatePortal.material.opacity = onBeat5 ? 0.15 + syncFactor * 0.2 : 0.06;
    }

    tickLensAnimation(this.lensAnim, this.activeMode, t);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', () => this._onResize());
    this.renderer.dispose();
  }
}
