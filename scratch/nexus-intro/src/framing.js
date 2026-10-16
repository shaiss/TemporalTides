import * as THREE from 'three';

/** Wide reference framing for the locked chamber camera (crop, not a second layout). */
export const REFERENCE_ASPECT = 16 / 9;
const NARROW_WIDTH_PX = 720;
const RATE = 3.0; // 1/s crop pan damping

const _v = new THREE.Vector3();

/**
 * Portrait / narrow viewports: crop the same camera via setViewOffset. The crop window pans across
 * the 16:9 reference frame to keep the current subject (corridor, levers, panel, clocks) in view, and
 * lens-shifts vertically so the subject sits above the controls at the bottom of the screen. In the
 * open room the player can pan the crop themselves (`panX`, 0 = left edge … 1 = right edge).
 * Camera position / orientation never change here — only which part of the frame is shown.
 */
export class ViewportFraming {
  constructor(camera) {
    this.camera = camera;
    this.offX = null;
    this.offY = 0;
    this.cropping = false;
  }

  update(width, height, dt, focusWorld, { subjectFrac = 0.4, snap = false, panX = null } = {}) {
    const cam = this.camera;
    if (!width || !height) return;
    const aspect = width / height;
    const needsCrop = (height > width || width <= NARROW_WIDTH_PX) && aspect < REFERENCE_ASPECT;
    this.cropping = needsCrop;

    if (!needsCrop) {
      cam.aspect = aspect;
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      this.offX = null;
      this.offY = 0;
      return;
    }

    const fullHeight = height;
    const fullWidth = Math.round(fullHeight * REFERENCE_ASPECT);
    let wantX = (fullWidth - width) * 0.5;
    let wantY = 0;

    if (focusWorld) {
      // Where does the subject land in the full reference frame?
      cam.aspect = REFERENCE_ASPECT;
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      _v.copy(focusWorld).project(cam);
      const px = (_v.x * 0.5 + 0.5) * fullWidth;
      const py = (-_v.y * 0.5 + 0.5) * fullHeight;
      wantX = panX == null ? THREE.MathUtils.clamp(px - width / 2, 0, fullWidth - width) : panX * (fullWidth - width);
      wantY = THREE.MathUtils.clamp(py - subjectFrac * height, -0.22 * height, 0.22 * height);
    }

    if (this.offX == null || snap) {
      this.offX = wantX;
      this.offY = wantY;
    } else {
      const k = 1 - Math.exp(-RATE * dt);
      this.offX += (wantX - this.offX) * k;
      this.offY += (wantY - this.offY) * k;
    }
    cam.setViewOffset(fullWidth, fullHeight, Math.round(this.offX), Math.round(this.offY), width, height);
    cam.updateProjectionMatrix();
  }

  /** Reference-frame pixels the crop can travel (0 when not cropping). */
  panRange(width, height) {
    return this.cropping ? Math.max(0, Math.round(height * REFERENCE_ASPECT) - width) : 0;
  }
}
