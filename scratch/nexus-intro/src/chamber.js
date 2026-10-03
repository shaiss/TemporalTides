import * as THREE from 'three';

const PRIMARY = 0x646cff;
const SECONDARY = 0x747bff;
const ACCENT = 0x9aa8ff;

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

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080a12, 0.028);

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    this.baseCameraPos = new THREE.Vector3(0.3, 3.8, 10.8);
    this.beat5CameraPos = new THREE.Vector3(0, 2.9, 7.4);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(0, 1.4, -2);

    this.overlayAnne = new THREE.Group();
    this.overlayMaya = new THREE.Group();
    this.overlayEli = new THREE.Group();
    this.overlayVibrion = new THREE.Group();
    this.clocks = [];
    this.modeLights = {};

    this._buildLights();
    this._buildRoom();
    this._buildProps();
    this._buildOverlays();
    this._buildClocks();
    this._buildGateFocus();

    this.scene.add(
      this.overlayAnne,
      this.overlayMaya,
      this.overlayEli,
      this.overlayVibrion,
    );

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

  _buildLights() {
    this.scene.add(new THREE.HemisphereLight(SECONDARY, 0x060810, 0.45));

    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(5, 10, 8);
    this.scene.add(key);

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

  _buildRoom() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 16),
      this._mat(0x121620),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const wallMat = this._mat(0x0e121c);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(22, 7), wallMat);
    back.position.set(0, 3.5, -8);
    this.scene.add(back);

    const left = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
    left.position.set(-11, 3.5, 0);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
    right.position.set(11, 3.5, 0);
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);

    this.gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 4.8, 0.35),
      this._mat(0x1a2030, PRIMARY, 0.08),
    );
    this.gateFrame.position.set(0, 2.4, -7.1);
    this.scene.add(this.gateFrame);
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
    this.scene.add(corridor);

    this.trapMeshes = [];
    for (let i = 0; i < 3; i++) {
      const trap = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.25, 1),
        this._mat(0x252a3d),
      );
      trap.position.set(-4.2 + (i - 1) * 1.1, 0.18, 2.8 - i * 1.4);
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
      this.scene.add(lever);
      this.leverMeshes.push(lever);
    }

    this.panelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2, 0.22),
      this._mat(0x1a1f2e),
    );
    this.panelMesh.position.set(5.2, 1.5, -0.5);
    this.scene.add(this.panelMesh);
  }

  _buildOverlays() {
    const trapGlow = this._mat(0xaaccff, 0x88bbff, 1.4);
    for (let i = 0; i < 3; i++) {
      const base = new THREE.Vector3(-4.2 + (i - 1) * 1.1, 0.35, 2.8 - i * 1.4);

      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.05), trapGlow);
      slab.position.copy(base);
      this.overlayAnne.add(slab);

      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.2, 0.12),
        this._mat(0x646cff, PRIMARY, 1.2, { transparent: true, opacity: 0.75 }),
      );
      pillar.position.set(base.x, 1.2, base.z);
      this.overlayAnne.add(pillar);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.05, 10, 32),
        trapGlow,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(base.x, 0.55, base.z);
      this.overlayAnne.add(ring);

      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 1.4),
        this._mat(ACCENT, ACCENT, 1),
      );
      tick.position.set(base.x - 0.6, 0.5, base.z);
      this.overlayAnne.add(tick);
    }

    const markMat = this._mat(0x747bff, SECONDARY, 1.3);
    const leverXs = [2.8, 3.55, 4.3, 5.05];
    for (let i = 0; i < 4; i++) {
      const x = leverXs[i];
      const mark = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), markMat);
      mark.position.set(x, 1.35, 1.95);
      this.overlayMaya.add(mark);

      const num = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.04),
        this._mat(0xffffff, 0xffffff, 0.8),
      );
      num.position.set(x, 1.65, 1.92);
      this.overlayMaya.add(num);

      if (i < 3) {
        const link = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.06, 0.06),
          markMat,
        );
        link.position.set(x + 0.38, 1.1, 1.88);
        this.overlayMaya.add(link);
      }
    }

    this.eliStreaks = [];
    const rushMat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.55,
    });
    for (let s = 0; s < 4; s++) {
      const streak = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.35), rushMat.clone());
      streak.position.set(3.5 + s * 0.15, 0.75 + s * 0.12, 1.9);
      this.overlayEli.add(streak);
      this.eliStreaks.push(streak);
    }
    this.eliWindow = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.08, 2.2),
      this._mat(SECONDARY, SECONDARY, 0.9, { transparent: true, opacity: 0.35 }),
    );
    this.eliWindow.position.set(3.9, 1.05, 1.85);
    this.overlayEli.add(this.eliWindow);

    const gridMat = new THREE.LineBasicMaterial({ color: PRIMARY, transparent: true, opacity: 0.85 });
    const grid = new THREE.Group();
    for (let i = -5; i <= 5; i++) {
      const h = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 0.22, -1.1, 0),
        new THREE.Vector3(i * 0.22, 1.1, 0),
      ]);
      const v = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.75, i * 0.22, 0),
        new THREE.Vector3(0.75, i * 0.22, 0),
      ]);
      grid.add(new THREE.Line(h, gridMat));
      grid.add(new THREE.Line(v, gridMat));
    }
    grid.position.copy(this.panelMesh.position);
    grid.position.x += 0.02;
    this.overlayVibrion.add(grid);

    const hum = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.1, 0.06),
      this._mat(0x646cff, PRIMARY, 1.1),
    );
    hum.position.copy(this.panelMesh.position);
    hum.position.z += 0.14;
    this.overlayVibrion.add(hum);

    for (let i = -3; i <= 3; i++) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 4),
        this._mat(PRIMARY, PRIMARY, 0.9, { transparent: true, opacity: 0.4 }),
      );
      beam.position.set(this.panelMesh.position.x, 0.15, this.panelMesh.position.z + i * 0.9);
      this.overlayVibrion.add(beam);
    }
  }

  _buildClocks() {
    this.clockGroup = new THREE.Group();
    this.clockGroup.position.set(0, 3.8, -6.5);
    const positions = [-2.2, -0.75, 0.75, 2.2];
    positions.forEach((x, i) => {
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.14, 28),
        this._mat(0x222838, PRIMARY, 0.35),
      );
      face.rotation.x = Math.PI / 2;
      face.position.set(x, 0, 0);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.64, 0.04, 8, 32),
        this._mat(SECONDARY, SECONDARY, 0.8),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 0.02, 0);

      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.5, 0.05),
        this._mat(0x747bff, ACCENT, 1.2),
      );
      hand.position.set(x, 0.1, 0);
      hand.geometry.translate(0, 0.25, 0);

      this.clockGroup.add(face, rim, hand);
      this.clocks.push({ hand, rim, baseSpeed: 0.85 + i * 0.4, phase: i * 1.9 });
    });
    this.scene.add(this.clockGroup);
  }

  syncFromInk(state) {
    this.activeMode = state.active;
    this.targetBeat = state.currentBeat;
    this.beat5Step = state.beat5Step;
    this.beat5Clear = state.beat5Clear;
    this._updateOverlayVisibility();
  }

  _updateOverlayVisibility() {
    const sets = {
      anne: this.overlayAnne,
      maya: this.overlayMaya,
      eli: this.overlayEli,
      vibrion: this.overlayVibrion,
    };
    Object.entries(sets).forEach(([id, group]) => {
      const on = id === this.activeMode;
      group.visible = on;
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m.emissiveIntensity !== undefined) {
              m.emissiveIntensity = on ? Math.max(m.emissiveIntensity, 0.8) : m.emissiveIntensity;
            }
          });
        }
      });
    });

    Object.entries(this.modeLights).forEach(([id, light]) => {
      light.intensity = id === this.activeMode ? 1.8 : 0;
    });

    this.trapMeshes?.forEach((m) => {
      m.material.emissiveIntensity = this.activeMode === 'anne' ? 0.05 : 0;
      m.material.color.setHex(this.activeMode === 'anne' ? 0x2a3048 : 0x252a3d);
    });
    this.leverMeshes?.forEach((m) => {
      m.material.emissive.setHex(this.activeMode === 'maya' ? SECONDARY : 0x000000);
      m.material.emissiveIntensity = this.activeMode === 'maya' ? 0.25 : 0;
    });
    if (this.panelMesh?.material) {
      const vib = this.activeMode === 'vibrion';
      this.panelMesh.material.emissiveIntensity = vib ? 0.45 : 0.02;
      this.panelMesh.material.emissive.setHex(vib ? PRIMARY : 0x000000);
    }
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
    const targetPos = onBeat5 ? this.beat5CameraPos : this.baseCameraPos;
    this.camera.position.lerp(targetPos, onBeat5 ? 0.035 : 0.02);
    this.camera.lookAt(0, onBeat5 ? 2.6 : 1.3, onBeat5 ? -5.5 : -1.5);

    const syncFactor = this.beat5Clear ? 1 : Math.min(this.beat5Step / 4, 0.9);
    this.clocks.forEach((c, i) => {
      const desync = this.beat5Clear ? 0 : 1 - syncFactor;
      const speed = c.baseSpeed * desync + 0.08;
      const wobble = Math.sin(t * 3 + c.phase) * 0.15 * desync;
      c.hand.rotation.z = t * speed + c.phase * desync + wobble;
      if (this.beat5Clear) {
        c.hand.rotation.z = 0;
      }
      if (c.rim?.material) {
        c.rim.material.emissiveIntensity = onBeat5
          ? 0.5 + (this.beat5Clear ? 0.6 : Math.sin(t * 4 + i) * 0.35)
          : 0.25;
      }
    });

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
    if (this.clockGroup) {
      const s = onBeat5 ? 1.12 : 1;
      this.clockGroup.scale.lerp(new THREE.Vector3(s, s, s), 0.05);
    }

    if (this.eliStreaks) {
      this.eliStreaks.forEach((streak, i) => {
        streak.position.x = 3.2 + i * 0.2 + Math.sin(t * 10 + i) * 0.35;
        streak.material.opacity = 0.35 + Math.abs(Math.sin(t * 7 + i)) * 0.45;
      });
    }
    if (this.eliWindow && this.activeMode === 'eli') {
      const squeeze = 0.85 + Math.sin(t * 5) * 0.08;
      this.eliWindow.scale.x = squeeze;
    }

    this.overlayAnne.children.forEach((child, i) => {
      if (child.isMesh && child.geometry?.type === 'TorusGeometry') {
        child.rotation.z = t * 0.8 + i;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', () => this._onResize());
    this.renderer.dispose();
  }
}
