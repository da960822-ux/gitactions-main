import * as T from 'three';
import {clamp} from './spaceMotion';

/** Six paper panels: a three-column fold followed by a horizontal fold. */
export function createPaperGeometry() {
  const geometry = new T.PlaneGeometry(1, 1, 60, 48);
  geometry.userData.original = new Float32Array(geometry.attributes.position.array);
  return geometry;
}
export function updatePaper(geometry: T.BufferGeometry, amount: number, width: number, height: number) {
  const original = geometry.userData.original as Float32Array, positions = geometry.attributes.position as T.BufferAttribute;
  const angle = Math.PI * (1 - clamp(amount));
  for (let i = 0; i < positions.count; i++) {
    const flatX = original[i*3] * width, flatY = original[i*3+1] * height;
    let x = flatX, y = flatY, z = 0;
    if (Math.abs(x) > width / 6) {
      const hinge = Math.sign(x) * width / 6, distance = x - hinge;
      x = hinge + distance * Math.cos(angle);
      z = -Math.abs(distance) * Math.sin(angle) + .006 * (1-amount);
    }
    if (y < 0) {z += -y * Math.sin(angle); y *= Math.cos(angle);}
    z += Math.sin(flatX / width * Math.PI) * Math.sin(flatY / height * Math.PI) * .16 * (1-amount);
    positions.setXYZ(i, x, y, z);
  }
  positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
}
