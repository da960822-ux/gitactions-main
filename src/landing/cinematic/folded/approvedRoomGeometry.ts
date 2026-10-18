import {MathUtils} from 'three';

export const ROOM_REFERENCE = { width: 1672, height: 941, distance: 24, fov: 48 } as const;

export function roomBackgroundDepth(u:number,y:number){
  const sides=8*Math.pow(Math.abs(u-.5)*2,4),floorDepth=10*MathUtils.smoothstep(y,620,941);
  return -10+sides*(1-floorDepth/10)+floorDepth;
}

// Project the unchanged illustration onto independently placed room surfaces.
export function roomVertex(x: number, y: number, z: number): [number, number, number] {
  const height = 2 * ROOM_REFERENCE.distance * Math.tan(ROOM_REFERENCE.fov * Math.PI / 360);
  const scale = (ROOM_REFERENCE.distance - z) / ROOM_REFERENCE.distance;
  return [(x / ROOM_REFERENCE.width - .5) * height * ROOM_REFERENCE.width / ROOM_REFERENCE.height * scale,
    (.5 - y / ROOM_REFERENCE.height) * height * scale, z];
}

export function roomUV(x: number, y: number): [number, number] {
  return [x / ROOM_REFERENCE.width, 1 - y / ROOM_REFERENCE.height];
}
