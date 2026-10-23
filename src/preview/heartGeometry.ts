import { BufferGeometry, Float32BufferAttribute } from 'three';
/** Original inflated heart surface; no reference-site model or texture is copied. */
export function createHeartGeometry(segments = 96, rings = 18) {
    const vertices: number[] = [];
    const indices: number[] = [];
    const perimeter: number[] = [];
    for (const side of [1, -1]) {
        const center = vertices.length / 3;
        vertices.push(0, 0, side * 0.5);
        let previous: number[] = [];
        for (let ring = 1; ring <= rings; ring++) {
            const radius = ring / rings;
            const current: number[] = [];
            for (let segment = 0; segment < segments; segment++) {
                if (side === -1 && ring === rings) {
                    current.push(perimeter[segment]);
                    continue;
                }
                const angle = segment / segments * Math.PI * 2;
                current.push(vertices.length / 3);
                vertices.push(radius * Math.pow(Math.sin(angle), 3), radius * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 16, side * 0.5 * Math.pow(1 - radius * radius, 0.52));
            }
            for (let segment = 0; segment < segments; segment++) {
                const next = (segment + 1) % segments;
                const triangles = ring === 1
                    ? [center, current[next], current[segment]]
                    : [previous[segment], previous[next], current[next], previous[segment], current[next], current[segment]];
                for (let index = 0; index < triangles.length; index += 3) {
                    indices.push(triangles[index], triangles[index + (side === 1 ? 1 : 2)], triangles[index + (side === 1 ? 2 : 1)]);
                }
            }
            if (side === 1 && ring === rings)
                perimeter.push(...current);
            previous = current;
        }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
}
