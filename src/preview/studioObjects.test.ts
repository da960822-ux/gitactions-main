import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {normalizeSculpture} from './studioObjects';

describe('rotation-safe sculpture bounds',()=>{
 it('centers an offset, rotated long sculpture and contains its vertices at any display rotation',()=>{
  const art=new T.Group();art.rotation.y=.7;const pen=new T.Mesh(new T.BoxGeometry(.12,6,.3));pen.position.set(2,-1,.5);art.add(pen);
  const normalized=normalizeSculpture(art);
  for(const angle of [-Math.PI,-.8,0,.7,Math.PI]){
   normalized.rotation.set(.15,angle,-.1);normalized.scale.setScalar(1);normalized.updateMatrixWorld(true);
   const vertices=pen.geometry.getAttribute('position');
   for(let i=0;i<vertices.count;i++)expect(new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(pen.matrixWorld).length()).toBeLessThanOrEqual(1.000001);
  }
 });
});
