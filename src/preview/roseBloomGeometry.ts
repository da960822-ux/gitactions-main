import * as T from 'three';

/** Procedural cupped rose bloom assembled from overlapping, thick petal shells. */
export function createRoseBloomGeometry(): T.BufferGeometry {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const across = 20, along = 24, thickness = .03;
  const rings = [
    { count: 5, phase: 0, span: 110, length: 1.72, base: -.46, rise: .4, twist: .2, root: '#8c2d48', edge: '#e68a9b' },
    { count: 5, phase: Math.PI / 5, span: 110, length: 1.18, base: -.22, rise: .46, twist: -.24, root: '#70223c', edge: '#d27388' },
    { count: 3, phase: .2, span: 122, length: .68, base: .02, rise: .47, twist: .32, root: '#531c36', edge: '#bd566f' },
  ];

  for (const ring of rings) {
    const inner = new T.Color(ring.root), outer = new T.Color(ring.edge);
    for (let petal = 0; petal < ring.count; petal++) {
      const angle = ring.phase + petal * Math.PI * 2 / ring.count;
      const front: number[] = [], back: number[] = [];
      const base = positions.length / 3;

      for (let side = 0; side < 2; side++) {
        const offset = side ? -thickness / 2 : thickness / 2;
        for (let row = 0; row <= along; row++) {
          const v = row / along;
          const rolled = T.MathUtils.smoothstep(v, .78, 1);
          for (let col = 0; col <= across; col++) {
            const u = col / across * 2 - 1;
            const radial = .08 + (ring.length - .08) * Math.sin(v * Math.PI / 2) + .07 * Math.cos(u * Math.PI / 2) ** 2 * rolled;
            const petalSpan = ring.span * Math.PI / 180 * (.62 + .38 * T.MathUtils.smoothstep(v, .05, .34));
            const theta = angle + ring.twist * T.MathUtils.smoothstep(v, .08, .92) + u * petalSpan / 2;
            const z = ring.base + ring.rise * T.MathUtils.smoothstep(v, 0, 1) + .13 * u * u * T.MathUtils.smoothstep(v, .14, .72) + .07 * rolled + .045 * Math.abs(u) ** 8 * T.MathUtils.smoothstep(v, .3, .78);
            positions.push(radial * Math.sin(theta), radial * Math.cos(theta), z + offset);
            const color = inner.clone().lerp(outer, .12 + .88 * v);
            if (side) color.multiplyScalar(.78);
            colors.push(color.r, color.g, color.b);
            (side ? back : front).push(base + side * (along + 1) * (across + 1) + row * (across + 1) + col);
          }
        }
      }

      const stride = across + 1, sheet = (along + 1) * stride;
      for (let row = 0; row < along; row++) for (let col = 0; col < across; col++) {
        const a = front[row * stride + col], b = a + 1, c = a + stride, d = c + 1;
        indices.push(a, b, c, b, d, c);
        const ba = back[row * stride + col], bb = ba + 1, bc = ba + stride, bd = bc + 1;
        indices.push(ba, bc, bb, bb, bc, bd);
      }

      const boundary: number[] = [];
      for (let col = 0; col <= across; col++) boundary.push(col);
      for (let row = 1; row <= along; row++) boundary.push(row * stride + across);
      for (let col = across - 1; col >= 0; col--) boundary.push(along * stride + col);
      for (let row = along - 1; row > 0; row--) boundary.push(row * stride);
      for (let edge = 0; edge < boundary.length; edge++) {
        const p = front[boundary[edge]], q = front[boundary[(edge + 1) % boundary.length]];
        const bp = p + sheet, bq = q + sheet;
        indices.push(p, bp, bq, p, bq, q);
      }
    }
  }

  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
