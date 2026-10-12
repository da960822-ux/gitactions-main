import * as T from 'three';
import {clamp} from './spaceMotion';

/** A cupped rose petal with a scalloped lip and a narrow attachment point. */
export function createPetalGeometry() {
  const columns = 36, rows = 48, points: number[] = [], indices: number[] = [];
  for (let side = 0; side < 2; side++) for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const u = col / columns * 2 - 1, v = row / rows;
    const width = .03 + Math.sin(Math.PI * v) ** .72 * (.8 + .17 * Math.sin(v * 5));
    points.push(u * width, (v - .5) * 2.6 + .10 * Math.cos(u * 5) * v ** 6,
      .55 * u * u - .48 * Math.sin(v * Math.PI) + .20 * v * v + (side ? -.025 : .025));
  }
  const stride = columns + 1, sheet = stride * (rows + 1);
  for (let side = 0; side < 2; side++) for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = side * sheet + row * stride + col, b = a + 1, c = a + stride, d = c + 1;
    indices.push(...(side ? [a,c,b,b,c,d] : [a,b,c,b,d,c]));
  }
  for (let row = 0; row < rows; row++) for (const col of [0, columns]) {
    const a = row * stride + col, b = a + stride;
    indices.push(a, a + sheet, b, b, a + sheet, b + sheet);
  }
  for (const row of [0, rows]) for (let col = 0; col < columns; col++) {
    const a = row * stride + col, b = a + 1;
    indices.push(a, b, a + sheet, b, b + sheet, a + sheet);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
}

/** A broad folded gift ribbon, never a tube or wire. Same vertices unfold into the next surface. */
export function createRibbonGeometry() {
  const geometry = new T.PlaneGeometry(5.4, 1.0, 96, 12);
  geometry.userData.original = new Float32Array(geometry.attributes.position.array);
  updateRibbon(geometry, 0);
  return geometry;
}
export function updateRibbon(geometry: T.BufferGeometry, amount: number) {
  const original = geometry.userData.original as Float32Array, positions = geometry.attributes.position as T.BufferAttribute;
  for (let i = 0; i < positions.count; i++) {
    const x = original[i*3], y = original[i*3+1], u = x / 2.7;
    const bowX = Math.sin(u * Math.PI) * 1.9;
    const bowY = .45 * Math.sin(u * Math.PI * 2) + y * (.85 + .35 * Math.abs(u));
    const bowZ = (1 - Math.cos(u * Math.PI * 2)) * .48 + y * Math.sin(u * Math.PI) * .5;
    positions.setXYZ(i, T.MathUtils.lerp(bowX, u * 8.5, amount),
      T.MathUtils.lerp(bowY, y * 8, amount), T.MathUtils.lerp(bowZ, -.08 * Math.cos(u * Math.PI), amount));
  }
  positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
}

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
