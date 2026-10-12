import { expect, it } from 'vitest';
import { createHeartGeometry } from './heartGeometry';
it('creates a closed, finite inflated surface suitable for shared heart meshes', () => {
    const geometry = createHeartGeometry();
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const edges = new Map<string, number>();
    const indices = Array.from(geometry.index!.array);
    for (const value of [...positions.array, ...normals.array])
        expect(Number.isFinite(value)).toBe(true);
    for (let triangle = 0; triangle < indices.length; triangle += 3) {
        for (let edge = 0; edge < 3; edge++) {
            const pair = [indices[triangle + edge], indices[triangle + (edge + 1) % 3]].sort((a, b) => a - b).join(':');
            edges.set(pair, (edges.get(pair) ?? 0) + 1);
        }
    }
    expect(new Set(edges.values())).toEqual(new Set([2]));
    expect(normals.getZ(0)).toBeGreaterThan(0.9);
    expect(geometry.boundingSphere!.radius).toBeGreaterThan(1);
    expect(geometry.boundingSphere!.radius).toBeLessThan(1.4);
    geometry.dispose();
});

it('keeps the hero balloon normals smooth at the front-to-back seam', () => {
    const segments = 48, rings = 12;
    const geometry = createHeartGeometry(segments, rings);
    const normals = geometry.getAttribute('normal');
    for (let index = 0; index < normals.count; index++) {
        const length = Math.hypot(normals.getX(index), normals.getY(index), normals.getZ(index));
        expect(length).toBeCloseTo(1, 4);
    }
    const perimeterStart = 1 + (rings - 1) * segments;
    for (let segment = 0; segment < segments; segment += 12) {
        expect(Math.abs(normals.getZ(perimeterStart + segment))).toBeLessThan(0.001);
    }
    geometry.dispose();
});
