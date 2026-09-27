import * as THREE from 'three';

const PRIMARY = 0x646cff;
const SECONDARY = 0x747bff;

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
    this.renderer.setClearColor(0x0c0e1a, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c0e1a, 0.035);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    this.baseCameraPos = new THREE.Vector3(0, 4.2, 11.5);
    this.beat5CameraPos = new THREE.Vector3(0, 3.4, 8.2);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(0, 1.2, 0);

    this.overlayAnne = new THREE.Group();
    this.overlayMaya = new THREE.Group();
    this.overlayEli = new THREE.Group();
    this.overlayVibrion = new THREE.Group();
    this.clocks = [];

    this._buildLights();
    this._buildRoom();
    this._buildProps();
    this._buildOverlays();
    this._buildClocks();

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

  _mat(color, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness: 0.35,
      roughness: 0.65,
    });
  }

  _buildLights() {
    const hemi = new THREE.HemisphereLight(SECONDARY, 0x0a0c14, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(PRIMARY, 1.1);
    key.position.set(4, 8, 6);
    this.scene.add(key);

    const fill = new THREE.PointLight(SECONDARY, 0.6, 24);
    fill.position.set(-3, 3, 2);
    this.scene.add(fill);

    this.gateLight = new THREE.PointLight(PRIMARY, 0.4, 12);
    this.gateLight.position.set(0, 3.5, -4);
    this.scene.add(this.gateLight);
  }

  _buildRoom() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      this._mat(0x141828),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const wallMat = this._mat(0x10141f);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), wallMat);
    back.position.set(0, 3, -7);
    this.scene.add(back);

    const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    left.position.set(-9, 3, 0);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    right.position.set(9, 3, 0);
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      this._mat(0x0e1018),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    this.scene.add(ceiling);

    const gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 0.3),
      this._mat(0x1a2030, PRIMARY, 0.15),
    );
    gateFrame.position.set(0, 2, -6.2);
    this.scene.add(gateFrame);
  }

  _buildProps() {
    const corridor = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.15, 5),
      this._mat(0x1c2233),
    );
    corridor.position.set(-4, 0.08, 1);
    this.scene.add(corridor);

    for (let i = 0; i < 3; i++) {
      const trap = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 0.8),
        this._mat(0x252a3d),
      );
      trap.position.set(-4 + (i - 1) * 0.9, 0.2, 2.5 - i * 1.2);
      this.scene.add(trap);
    }

    for (let i = 0; i < 4; i++) {
      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8),
        this._mat(0x2a3045),
      );
      lever.position.set(2.5 + i * 0.7, 0.6, 2);
      lever.rotation.z = (i % 2 === 0 ? 0.25 : -0.2);
      this.scene.add(lever);
    }

    this.panelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 0.2),
      this._mat(0x1a1f2e),
    );
    this.panelMesh.position.set(5, 1.4, -1);
    this.scene.add(this.panelMesh);
  }

  _buildOverlays() {
    const trapGlow = this._mat(0x646cff, PRIMARY, 0.9);
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.85), trapGlow);
      g.position.set(-4 + (i - 1) * 0.9, 0.35, 2.5 - i * 1.2);
      this.overlayAnne.add(g);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.03, 8, 24),
        trapGlow,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g.position);
      ring.position.y += 0.5;
      this.overlayAnne.add(ring);
    }

    const markMat = this._mat(0x747bff, SECONDARY, 0.85);
    for (let i = 0; i < 4; i++) {
      const mark = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), markMat);
      mark.position.set(2.5 + i * 0.7, 1.15, 2.15);
      this.overlayMaya.add(mark);

      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.04, 0.04),
        markMat,
      );
      line.position.set(2.5 + i * 0.7 + 0.25, 0.95, 2.05);
      this.overlayMaya.add(line);
    }

    const rushMat = new THREE.MeshBasicMaterial({
      color: SECONDARY,
      transparent: true,
      opacity: 0.35,
    });
    const streak = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.6), rushMat);
    streak.position.set(3.2, 0.85, 2);
    this.overlayEli.add(streak);
    this.eliStreak = streak;

    const gridMat = new THREE.LineBasicMaterial({ color: PRIMARY, transparent: true, opacity: 0.7 });
    const grid = new THREE.Group();
    for (let i = -3; i <= 3; i++) {
      const h = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 0.2, -0.9, 0),
        new THREE.Vector3(i * 0.2, 0.9, 0),
      ]);
      const v = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.6, i * 0.2, 0),
        new THREE.Vector3(0.6, i * 0.2, 0),
      ]);
      grid.add(new THREE.Line(h, gridMat));
      grid.add(new THREE.Line(v, gridMat));
    }
    grid.position.copy(this.panelMesh.position);
    grid.position.x += 0.01;
    this.overlayVibrion.add(grid);

    const hum = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.9, 0.05),
      this._mat(0x646cff, PRIMARY, 0.5),
    );
    hum.position.copy(this.panelMesh.position);
    hum.position.z += 0.12;
    this.overlayVibrion.add(hum);
  }

  _buildClocks() {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 4.2, -5.8);
    const positions = [-1.8, -0.6, 0.6, 1.8];
    positions.forEach((x, i) => {
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24),
        this._mat(0x222838, PRIMARY, 0.2),
      );
      face.rotation.x = Math.PI / 2;
      face.position.set(x, 0, 0);

      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.35, 0.04),
        this._mat(0x747bff, SECONDARY, 0.6),
      );
      hand.position.set(x, 0.08, 0);
      hand.geometry.translate(0, 0.17, 0);

      clockGroup.add(face, hand);
      this.clocks.push({ hand, baseSpeed: 0.6 + i * 0.35, phase: i * 1.7 });
    });
    this.scene.add(clockGroup);
    this.clockGroup = clockGroup;
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
      group.children.forEach((c) => {
        if (c.material) {
          c.material.opacity = on ? 1 : 0.15;
          if (c.material.transparent !== undefined) c.material.transparent = !on;
        }
      });
    });

    if (this.panelMesh?.material) {
      const em = this.activeMode === 'vibrion' ? 0.25 : 0.05;
      this.panelMesh.material.emissiveIntensity = em;
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
    this.camera.position.lerp(targetPos, 0.02);
    this.camera.lookAt(0, onBeat5 ? 2.8 : 1.2, onBeat5 ? -4 : 0);

    const syncFactor = this.beat5Clear ? 1 : Math.min(this.beat5Step / 4, 0.85);
    this.clocks.forEach((c, i) => {
      const desync = this.beat5Clear ? 0 : 1 - syncFactor;
      const speed = c.baseSpeed * desync + 0.05;
      c.hand.rotation.y = t * speed + c.phase * desync;
      if (this.beat5Clear) {
        c.hand.rotation.y = 0;
      } else if (syncFactor > 0) {
        c.hand.rotation.y *= 1 - syncFactor * 0.85;
      }
    });

    if (this.gateLight) {
      const pulse = this.beat5Clear ? 1.2 : 0.4 + Math.sin(t * 2) * 0.15;
      this.gateLight.intensity = onBeat5 ? pulse : 0.45;
    }

    if (this.eliStreak) {
      this.eliStreak.position.x = 3.2 + Math.sin(t * 8) * 0.15;
      this.eliStreak.material.opacity = 0.25 + Math.abs(Math.sin(t * 6)) * 0.25;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', () => this._onResize());
    this.renderer.dispose();
  }
}
