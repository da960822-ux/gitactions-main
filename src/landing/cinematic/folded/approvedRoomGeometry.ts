import {MathUtils} from 'three';

export const ROOM_REFERENCE = { width: 1672, height: 941, distance: 24, fov: 48 } as const;
export const ROOM_WORLD = { x:-6, y:.5, z:-10, tilt:0, scale:.4, floor:-4.15, desk:-3.05 } as const;

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

export function roomWorldVertex(x:number,y:number,z:number):[number,number,number]{
  const point=roomVertex(x,y,z),c=Math.cos(ROOM_WORLD.tilt),s=Math.sin(ROOM_WORLD.tilt);
  return [point[0]*ROOM_WORLD.scale+ROOM_WORLD.x,(c*point[1]-s*point[2])*ROOM_WORLD.scale+ROOM_WORLD.y,(s*point[1]+c*point[2])*ROOM_WORLD.scale+ROOM_WORLD.z];
}

export function roomDepthAtWorldHeight(y:number,height:number){
  const rayY=roomVertex(ROOM_REFERENCE.width/2,y,0)[1],c=Math.cos(ROOM_WORLD.tilt),s=Math.sin(ROOM_WORLD.tilt);
  return (height-ROOM_WORLD.y-c*rayY)/(-s-c*rayY/ROOM_REFERENCE.distance);
}
