import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {createBirdEncounterField,type BirdEncounterFieldInput} from './birdEncounterField';

const input:BirdEncounterFieldInput={width:1920,height:1080,time:0,bounds:{left:790,top:398,width:1050,height:620},bills:{left:{x:1203,y:623},right:{x:1241,y:606}},pointer:null,encounter:1,active:true,hover:false,press:false,reducedMotion:false,keyboard:false};
function fixture(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1920/1080,.1,200);camera.position.set(-6,2,8);camera.lookAt(-5,1,-10);camera.updateMatrixWorld(true);camera.setViewOffset(1920,1080,57,-31,1920,1080);camera.updateProjectionMatrix();
 const field=createBirdEncounterField();scene.add(field.root);
 const meshes=field.root.children.filter(child=>child instanceof T.Mesh) as T.Mesh<T.TubeGeometry,T.ShaderMaterial>[];
 const core=(path:number)=>meshes[path*2+1];
 const css=(path:number,section:number)=>{const a=core(path).geometry.getAttribute('aCenter'),at=section*9;const p=new T.Vector3(a.getX(at),a.getY(at),a.getZ(at)).applyMatrix4(field.root.matrixWorld).project(camera);return{x:(p.x+1)*input.width/2,y:(1-p.y)*input.height/2};};
 const advance=(changes:Partial<BirdEncounterFieldInput>,start=0,duration=3)=>{for(let t=start;t<=start+duration+.0001;t+=1/60)field.update(camera,{...input,...changes,time:t});};
 return{scene,camera,field,meshes,core,css,advance,uniforms:core(0).material.uniforms};
}

describe('bird encounter depth current',()=>{
 it('registers both live bill anchors through the final camera and preserves all path connections',()=>{
  const {field,camera,css}=fixture();field.update(camera,input);
  expect(css(0,0).x).toBeCloseTo(input.bills.left.x,3);expect(css(0,0).y).toBeCloseTo(input.bills.left.y,3);
  expect(css(1,0).x).toBeCloseTo(input.bills.right.x,3);expect(css(1,0).y).toBeCloseTo(input.bills.right.y,3);
  for(let side=0;side<2;side++){expect(css(side,64).x).toBeCloseTo(css(side+2,64).x,3);expect(css(side,64).y).toBeCloseTo(css(side+2,64).y,3);}
  expect(css(2,64).x).toBeCloseTo(css(3,64).x,3);expect(css(2,64).y).toBeCloseTo(css(3,64).y,3);
  field.update(camera,{...input,time:.1,bills:{left:{x:1221,y:636},right:{x:1241,y:425}}});expect(css(0,0).x).toBeCloseTo(1221,3);expect(css(0,0).y).toBeCloseTo(636,3);expect(css(1,0).y).toBeCloseTo(425,3);field.dispose();
 });
 it('keeps both feeds in the empty bill gap below the heart, with no interior arch',()=>{
  const {field,camera,css,advance}=fixture();advance({hover:true,pointer:{x:900,y:800}},0,.8);
  const tip=css(2,64);
  for(let side=0;side<2;side++)for(let i=0;i<=64;i++){const p=css(side,i);expect(p.x).toBeGreaterThanOrEqual(input.bills.left.x-.01);expect(p.x).toBeLessThanOrEqual(input.bills.right.x+.01);expect(p.y).toBeGreaterThanOrEqual(tip.y-.01);}
  field.update(camera,{...input,time:1,active:false});expect(field.root.visible).toBe(false);field.dispose();
 });
 it('deforms actual persistent tube positions on pointer motion while keeping bills and lower meeting point fixed',()=>{
  const {field,camera,core,css,advance}=fixture();field.update(camera,{...input,hover:true});
  const geometry=core(2).geometry,positions=geometry.getAttribute('position'),rest=Array.from(positions.array),upper=css(2,20),tip=css(2,64);
  advance({hover:true,pointer:{x:1600,y:250}},0,.8);
  expect(core(2).geometry).toBe(geometry);expect(geometry.getAttribute('position')).toBe(positions);expect(Array.from(positions.array)).not.toEqual(rest);
  const bent=css(2,20);expect(Math.hypot(bent.x-upper.x,bent.y-upper.y)).toBeGreaterThan(20);expect(Math.abs(bent.x-upper.x)).toBeLessThanOrEqual(36.1);
  expect(css(0,0).x).toBeCloseTo(input.bills.left.x,3);expect(css(2,64).x).toBeCloseTo(tip.x,3);expect(css(2,64).y).toBeCloseTo(tip.y,3);field.dispose();
 });
 it('has round tube cross-sections, alternating physical depth, and depth-tested core/particles',()=>{
  const {field,camera,core,meshes}=fixture();field.update(camera,input);
  const geometry=core(2).geometry,centers=geometry.getAttribute('aCenter'),normals=geometry.getAttribute('normal');
  expect(geometry).toBeInstanceOf(T.TubeGeometry);expect(Math.abs(centers.getZ(16*9)-centers.getZ(48*9))).toBeGreaterThan(.8);
  for(let i=0;i<normals.count;i+=17){expect(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))).toBeCloseTo(1,5);expect(Number.isFinite(centers.getZ(i))).toBe(true);}
  for(let i=0;i<4;i++){expect(core(i).material.depthWrite).toBe(true);expect(core(i).material.depthTest).toBe(true);expect(meshes[i*2].material.depthWrite).toBe(false);expect(meshes[i*2].geometry).toBe(core(i).geometry);}
  const vertices=geometry.getAttribute('position'),indices=geometry.index!;
  for(let face=0;face<indices.count;face+=153){
   const ia=indices.getX(face),ib=indices.getX(face+1),ic=indices.getX(face+2),a=new T.Vector3().fromBufferAttribute(vertices,ia),b=new T.Vector3().fromBufferAttribute(vertices,ib),c=new T.Vector3().fromBufferAttribute(vertices,ic);
   const facing=b.sub(a).cross(c.sub(a)).dot(new T.Vector3().fromBufferAttribute(normals,ia));expect(facing).toBeGreaterThan(0);
  }
  expect((field.root.children[8] as T.Points<T.BufferGeometry,T.ShaderMaterial>).material.depthTest).toBe(true);field.dispose();
 });
 it('gives the pearl body a broad near section, a thin far section and a depth-separated notch crossing',()=>{
  const {field,camera,core,css}=fixture();field.update(camera,input);
  const geometry=core(2).geometry,positions=geometry.getAttribute('position'),centers=geometry.getAttribute('aCenter'),offsets=geometry.getAttribute('aOffset'),normals=geometry.getAttribute('normal');
  const radiusAt=(section:number)=>{const center=css(2,section);let radius=0;for(let j=0;j<9;j++){const p=new T.Vector3().fromBufferAttribute(positions,section*9+j).applyMatrix4(field.root.matrixWorld).project(camera);radius=Math.max(radius,Math.hypot((p.x+1)*input.width/2-center.x,(1-p.y)*input.height/2-center.y));}return radius;};
  expect(radiusAt(16)).toBeGreaterThan(4.7);expect(radiusAt(48)).toBeLessThan(3.4);expect(radiusAt(16)).toBeGreaterThan(radiusAt(48)*2);
  const middle=6*9+1,offset=new T.Vector3().fromBufferAttribute(offsets,middle),normal=new T.Vector3().fromBufferAttribute(normals,middle);expect(offset.clone().normalize().dot(normal)).toBeLessThan(.96);
  const centerX=css(2,0).x;expect(css(2,6).x).toBeGreaterThan(centerX);expect(css(2,12).x).toBeLessThan(centerX);expect(css(3,6).x).toBeLessThan(centerX);
  const otherCenters=core(3).geometry.getAttribute('aCenter');expect(Math.abs(centers.getZ(6*9)-otherCenters.getZ(6*9))).toBeGreaterThan(.6);
  expect(core(2).material.blending).toBe(T.NormalBlending);expect(core(0).material.uniforms.uWidth.value).toBeLessThan(core(2).material.uniforms.uWidth.value);field.dispose();
 });
 it('retargets gather/release from the current charge and bounds repeated release energy',()=>{
  const {field,camera,uniforms,advance}=fixture();advance({hover:true,press:true},0,.2);const held=uniforms.uCharge.value;expect(held).toBeGreaterThan(.5);expect(held).toBeLessThan(1);
  field.update(camera,{...input,time:.22,hover:true});const released=uniforms.uCharge.value;expect(released).toBeGreaterThan(0);expect(released).toBeLessThan(held);expect(uniforms.uImpulse.value).toBeGreaterThan(.3);
  field.update(camera,{...input,time:.24,hover:true,press:true});expect(uniforms.uCharge.value).toBeGreaterThan(released);
  for(let i=1;i<10;i++)field.update(camera,{...input,time:.24+i*.02,hover:true,press:i%2===0});expect(uniforms.uImpulse.value).toBeLessThanOrEqual(1);field.dispose();
 });
 it('settles held input into a static field and leaves all particles on the same four paths',()=>{
  const {field,uniforms,advance,camera}=fixture();advance({hover:true},0,4);expect(field.state.needsFrame).toBe(false);expect(uniforms.uEnergy.value).toBe(0);
  const particles=field.root.children[8] as T.Points,positions=particles.geometry.getAttribute('position'),rest=Array.from(positions.array),flow=uniforms.uFlow.value;
  field.update(camera,{...input,time:20,hover:true});expect(field.state.needsFrame).toBe(false);expect(uniforms.uFlow.value).toBe(flow);expect(Array.from(positions.array)).toEqual(rest);expect(positions.count).toBe(48);field.dispose();
 });
 it.each([{reducedMotion:true},{keyboard:true}])('keeps static current feedback without flow or deformation for %o',preference=>{
  const {field,camera,core,uniforms}=fixture();field.update(camera,{...input,...preference,hover:true,pointer:{x:800,y:400},press:true});const positions=Array.from(core(2).geometry.getAttribute('position').array);
  field.update(camera,{...input,...preference,time:4,hover:true,pointer:{x:1700,y:800}});expect(field.state.needsFrame).toBe(false);expect(uniforms.uEnergy.value).toBe(0);expect(uniforms.uMotion.value).toBe(0);expect(uniforms.uCharge.value).toBe(0);expect(Array.from(core(2).geometry.getAttribute('position').array)).toEqual(positions);field.dispose();
 });
 it('cancels a hidden press without a delayed release or catch-up wake on resume',()=>{
  const {field,camera,uniforms,advance}=fixture();advance({hover:true,press:true},0,.2);field.cancelInteraction();field.update(camera,{...input,time:1,active:false});expect(field.state.needsFrame).toBe(false);
  field.update(camera,{...input,time:30});expect(uniforms.uImpulse.value).toBe(0);expect(uniforms.uEnergy.value).toBe(0);field.dispose();
 });
 it('disposes shared geometry/materials exactly once and removes its own group',()=>{
  const {scene,field}=fixture(),resources=new Set<T.BufferGeometry|T.Material>();field.root.traverse(node=>{if(node instanceof T.Mesh||node instanceof T.Points){resources.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])resources.add(material);}});const spies=[...resources].map(resource=>vi.spyOn(resource,'dispose'));
  field.dispose();field.dispose();expect(scene.children).toHaveLength(0);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});
