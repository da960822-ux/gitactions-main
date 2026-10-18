import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {Box3,Mesh,Object3D,Raycaster,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {applyRigidPose,heroHingePose,portraitStagePose} from './stageMotion';

describe('continuous Hero surface and portrait support',()=>{
 it('preserves wall skin thickness throughout the hinge opening',()=>{
  const object=new Object3D(),a=new Vector3(1,2,-7),b=new Vector3(1,2,-7.22);
  for(let i=0;i<=100;i++){
   applyRigidPose(object,heroHingePose(i/100));
   expect(object.matrix.determinant()).toBeCloseTo(1,12);
   expect(a.clone().applyMatrix4(object.matrix).distanceTo(b.clone().applyMatrix4(object.matrix))).toBeCloseTo(.22,12);
  }
 });
 it('keeps the portrait and solid stage at the same contact height while receding',()=>{
  const object=new Object3D();
  for(let i=0;i<=100;i++){
   applyRigidPose(object,portraitStagePose(i/100));
   expect(new Vector3(1.85,-3.42,.05).applyMatrix4(object.matrix).y).toBeCloseTo(-3.42,12);
   expect(new Vector3(1.85,-2.92,.05).applyMatrix4(object.matrix).y).toBeCloseTo(-2.92,12);
  }
  const end=new Vector3(1.85,0,.05).applyMatrix4(object.matrix);expect(end.x).toBeCloseTo(3.75,12);expect(end.z).toBeCloseTo(-4.35,12);
 });
 it('exports the finished hinge and all three rooted support pieces with matching ownership',async()=>{
  const bytes=fs.readFileSync(new URL('../../../../public/models/folded-chamber-r8-space-v4/chamber.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const hinges:Object3D[]=[],stage:Object3D[]=[];
  gltf.scene.traverse(o=>{if(o.userData.hingeRig)hinges.push(o);if(o.userData.portraitStage)stage.push(o);});
  expect(hinges.length).toBeGreaterThanOrEqual(2);expect(stage).toHaveLength(3);
  for(const o of hinges){expect(o.userData.hingePivot).toEqual([18,0,-7]);expect(o.userData.hingeYDegrees).toBe(-75);}
  for(const o of stage){const motion=JSON.parse(o.userData.stageMotion);expect(motion.pivot).toEqual(portraitStagePose(0).pivot);expect(motion.delta).toEqual(portraitStagePose(1).delta);expect(motion.angleYDegrees).toBe(-6);}
 });
 it('has actual floor beneath the moving stage footprint, including the front apron',async()=>{
  const bytes=fs.readFileSync(new URL('../../../../public/models/folded-chamber-r8-space-v4/chamber.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');gltf.scene.updateMatrixWorld(true);
  const body=gltf.scene.getObjectByName('Portrait_Stage_Rooted_Body');expect(body).toBeDefined();
  const bounds=new Box3().setFromObject(body!),floor:Mesh[]=[];
  gltf.scene.traverse(o=>{if(!(o instanceof Mesh))return;let p:Object3D|null=o;while(p&&!['Shared_Unfolding_Canopy','Deep_Burgundy_Continuous_Return'].includes(p.name))p=p.parent;if(p)floor.push(o);});
  expect(floor.length).toBeGreaterThan(1);const rig=new Object3D(),ray=new Raycaster();ray.far=20;
  for(const p of[0,.15,.3,.43,.6,1]){
   applyRigidPose(rig,portraitStagePose(p));
   for(const x of[bounds.min.x+.2,(bounds.min.x+bounds.max.x)/2,bounds.max.x-.2])for(const z of[bounds.min.z+.2,(bounds.min.z+bounds.max.z)/2,bounds.max.z-.2]){
    const foot=new Vector3(x,bounds.min.y,z).applyMatrix4(rig.matrix);ray.set(new Vector3(foot.x,-2,foot.z),new Vector3(0,-1,0));const hit=ray.intersectObjects(floor,false)[0];
    expect(hit,`missing floor p=${p} x=${foot.x} z=${foot.z}`).toBeDefined();expect(foot.y).toBeLessThanOrEqual(hit.point.y+.02);expect(bounds.max.y).toBeGreaterThan(hit.point.y);
   }
  }
 });
});
