import * as THREE from 'three';

const TAP_SLOP_PX = 12;
const TAP_MAX_MS = 650;

/**
 * Raycasts pointer input against chamber props. Emits prop ids only — main.js decides whether the
 * prop maps to an Ink choice that is currently on the rail (props never bypass Ink).
 */
export class PointerPicker {
  constructor(canvas, camera, getTargets, { onHover, onTap }) {
    this.canvas = canvas;
    this.camera = camera;
    this.getTargets = getTargets;
    this.onHover = onHover;
    this.onTap = onTap;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.down = null;
    this.hoverId = null;
    this.hoverClearTimer = 0;

    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this._setHover(this.pick(e.clientX, e.clientY));
    });
    canvas.addEventListener('pointerleave', () => this._setHover(null));
    canvas.addEventListener('pointercancel', () => {
      this.down = null;
      this._setHover(null);
    });
    canvas.addEventListener('pointerdown', (e) => {
      // Primary button only: right/middle clicks must not act on Ink choices. Touch and pen report 0.
      if (e.button !== 0) {
        this.down = null;
        return;
      }
      this.down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      if (e.pointerType !== 'mouse') {
        this._cancelHoverClear();
        this._setHover(this.pick(e.clientX, e.clientY));
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      const d = this.down;
      this.down = null;
      if (e.pointerType !== 'mouse') {
        this._cancelHoverClear();
        this.hoverClearTimer = setTimeout(() => {
          this.hoverClearTimer = 0;
          this._setHover(null);
        }, 220);
      }
      if (!d || e.button !== 0 || e.pointerId !== d.id) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (moved > TAP_SLOP_PX || performance.now() - d.t > TAP_MAX_MS) return;
      const id = this.pick(e.clientX, e.clientY);
      if (id) this.onTap?.(id, e);
    });
  }

  _cancelHoverClear() {
    if (this.hoverClearTimer) clearTimeout(this.hoverClearTimer);
    this.hoverClearTimer = 0;
  }

  _setHover(id) {
    if (id === this.hoverId) return;
    this.hoverId = id;
    this.onHover?.(id);
  }

  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.getTargets(), false);
    for (const h of hits) {
      const id = h.object.userData.propId;
      if (id) return id;
    }
    return null;
  }
}
