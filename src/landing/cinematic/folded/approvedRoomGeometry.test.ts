import { describe, expect, it } from 'vitest';
import { ROOM_REFERENCE, roomUV, roomVertex, roomWorldVertex, roomSourcePoint } from './approvedRoomGeometry';

describe('approved room projection', () => {
  it('maps source-registered world hits back to the same object at different depths',()=>{
    for(const [x,y] of [[0,0],[1672,941],[190,470],[470,690],[1535,610]])for(const depth of [-3,0,2]){
      const source=roomSourcePoint(roomWorldVertex(x,y,depth));expect(source[0]).toBeCloseTo(x,8);expect(source[1]).toBeCloseTo(y,8);
    }
  });
  it('preserves source framing at different actual depths', () => {
    const height = 2 * ROOM_REFERENCE.distance * Math.tan(ROOM_REFERENCE.fov * Math.PI / 360);
    for (const [x,y] of [[0,0],[1672,941],[420,330],[1170,380]]) for (const depth of [-3,0,2,4]) {
      const [worldX,worldY,z] = roomVertex(x,y,depth);
      const scale = ROOM_REFERENCE.distance / (ROOM_REFERENCE.distance-z);
      expect(worldX*scale/(height*1672/941)+.5).toBeCloseTo(x/1672,10);
      expect(.5-worldY*scale/height).toBeCloseTo(y/941,10);
      expect(roomUV(x,y)).toEqual([x/1672,1-y/941]);
    }
  });
});
