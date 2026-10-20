import * as THREE from 'three';

/** Generated botanical cutouts staged in the letter's 3D scene; these are two flat image planes. */
export function createLetterRoses(onAssetReady:()=>void=()=>{}){
 const root=new THREE.Group();root.name='LETTER_EIGHT_ROSES';
 let disposed=false;
 const texture=typeof document==='undefined'?new THREE.Texture():new THREE.TextureLoader().load('/images/landing-preview/letter-roses-atlas.png',()=>{if(!disposed)onAssetReady();});
 texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,alphaTest:.012,side:THREE.DoubleSide,toneMapped:false});
 const geometries:THREE.PlaneGeometry[]=[],clusters:THREE.Mesh[]=[];
 for(const side of [-1,1]){
  const label=side<0?'LEFT':'RIGHT';
  // Each immutable atlas half is 887 × 887: preserve its square proportions.
  const geometry=new THREE.PlaneGeometry(1.2,1.2),uv=geometry.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*.5+(side>0?.5:0));
  geometries.push(geometry);
  const cluster=new THREE.Mesh(geometry,material);cluster.name=`LETTER_ROSE_CLUSTER_${label}`;
  cluster.position.set(side*1.82,1.6,-.28);cluster.visible=false;cluster.userData.medium='generated botanical cutout';
  root.add(cluster);clusters.push(cluster);
 }
 return {root,update(opening:number){
  if(disposed)return;
  const progress=Number.isFinite(opening)?THREE.MathUtils.clamp(opening,0,1):0;
  const q=THREE.MathUtils.smoothstep(progress,.3,.8);
  material.opacity=q;clusters.forEach(cluster=>{cluster.visible=q>0;cluster.position.y=1.6;});
 },dispose(){
  if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(geometry=>geometry.dispose());material.dispose();texture.dispose();
 }};
}
