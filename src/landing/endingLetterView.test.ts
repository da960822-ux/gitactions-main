import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {endingLetterView} from './endingLetterView';

describe('ending keeps the original letter inside its artifact window',()=>{
 for(const [width,height] of [[1920,1080],[1440,900]])for(const opening of [0,1])for(const sectionTop of [0,120])it(`${width}×${height}, opening ${opening}, section top ${sectionTop}`,()=>{
  const pose=endingLetterView(width,height,opening,sectionTop),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.1,400);
  camera.position.fromArray(pose.eye);camera.lookAt(new THREE.Vector3().fromArray(pose.target));camera.updateMatrixWorld(true);
  const length=opening?2.6:1.35;
  const corners=[-1.04,1.04].flatMap(x=>[0,length].map(y=>new THREE.Vector3(7.2+x,0,-1.2-y).project(camera)));
  for(const point of corners){const x=(point.x+1)/2,y=(1-point.y)/2;expect(x).toBeGreaterThan(.45);expect(x).toBeLessThan(.95);expect(y).toBeGreaterThan(.12+sectionTop/height);expect(y).toBeLessThan(.77+sectionTop/height);expect(point.z).toBeLessThan(1);}
 });
 it('has no history-dependent camera state',()=>{
  const first=endingLetterView(1440,900,1);endingLetterView(1920,1080,0);expect(endingLetterView(1440,900,1)).toEqual(first);
 });
});
