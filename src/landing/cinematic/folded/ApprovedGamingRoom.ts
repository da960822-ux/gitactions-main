import * as T from 'three';
import { roomUV, roomVertex } from './approvedRoomGeometry';

type Point = [number,number];
export function createApprovedGamingRoom(scene:T.Scene,keep:<A extends {dispose:()=>void}>(a:A)=>A) {
  const root=new T.Group();root.name='APPROVED_COUPLE_GAMING_ROOM';root.position.set(-11,7.6,-64);scene.add(root);
  const art=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide}));
  const environment=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide}));
  const loader=new T.TextureLoader();
  const maskReady=loader.loadAsync('/images/approved-couple-room/foreground-semantic-mask.png').then(keep);
  const ready=Promise.all([maskReady,...[['approved-couple-gaming-room.png',art],['environment-clean-plate.png',environment]].map(async([path,material])=>{
    const texture=keep(await loader.loadAsync('/images/approved-couple-room/'+path));texture.colorSpace=T.SRGBColorSpace;
    (material as T.MeshBasicMaterial).map=texture;(material as T.MeshBasicMaterial).needsUpdate=true;
  })]);
  const foregroundReady:Promise<void>[]=[];
  function surface(name:string,points:Point[],depth:number|((x:number,y:number)=>number),material=art) {
    const geometry=keep(new T.BufferGeometry()),vertices:number[]=[],uvs:number[]=[];
    const contour=points.map(([x,y])=>new T.Vector2(x,y));
    for(const [x,y] of points){vertices.push(...roomVertex(x,y,typeof depth==='number'?depth:depth(x,y)));uvs.push(...roomUV(x,y));}
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geometry.setIndex(T.ShapeUtils.triangulateShape(contour,[]).flat());geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.userData.approvedSource=material===art;root.add(mesh);return mesh;
  }
  // Back wall keeps the complete approved frame. Foreground surfaces have real depth.
  // Approved RGB stays on depth-separated surfaces; these are illustrated people, not full 3D character models.
  const wallGeometry=keep(new T.PlaneGeometry(1672,941,48,32));
  const wallPositions=wallGeometry.getAttribute('position'),wallUV=wallGeometry.getAttribute('uv');
  for(let i=0;i<wallPositions.count;i++){
    const u=wallUV.getX(i),y=(1-wallUV.getY(i))*941;
    const sides=2*Math.pow(Math.abs(u-.5)*2,4),floorDepth=4*T.MathUtils.smoothstep(y,620,941);
    wallPositions.setXYZ(i,...roomVertex(u*1672,y,-4+sides*(1-floorDepth/4)+floorDepth));
  }
  wallPositions.needsUpdate=true;wallGeometry.computeVertexNormals();
  const walls=new T.Mesh(wallGeometry,environment);walls.name='CONTINUOUS_ROOM_WALLS_AND_FLOOR';root.add(walls);
  function foreground(name:string,category:number,depth:number|((x:number,y:number)=>number)) {
    const material=keep(art.clone());material.transparent=true;
    const maskUniform={value:null as T.Texture|null};
    material.onBeforeCompile=shader=>{
      shader.uniforms.semanticMask=maskUniform;shader.uniforms.maskCategory={value:category};
      shader.fragmentShader='uniform sampler2D semanticMask;uniform float maskCategory;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float coverage=0.;
        for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
          vec3 mask=texture2D(semanticMask,vMapUv+vec2(float(i)/1672.,float(j)/941.)).rgb;
          float red=step(.6,mask.r)*(1.-step(.4,mask.g))*(1.-step(.4,mask.b));
          float green=step(.6,mask.g)*(1.-step(.4,mask.r))*(1.-step(.4,mask.b));
          float blue=step(.6,mask.b)*(1.-step(.4,mask.r))*(1.-step(.4,mask.g));
          float yellow=step(.6,mask.r)*step(.6,mask.g)*(1.-step(.4,mask.b));
          coverage=max(coverage,maskCategory<.5?red:maskCategory<1.5?green:maskCategory<2.5?blue:yellow);
        }
        if(coverage<.5)discard;
      `);
    };
    material.customProgramCacheKey=()=>`approved-mask-${category}`;
    const geometry=keep(new T.PlaneGeometry(1672,941,32,24));
    const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(let i=0;i<position.count;i++){const x=uv.getX(i)*1672,y=(1-uv.getY(i))*941;position.setXYZ(i,...roomVertex(x,y,typeof depth==='number'?depth:depth(x,y)));}
    position.needsUpdate=true;geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,material);mesh.name=name;root.add(mesh);
    foregroundReady.push(Promise.all([ready,maskReady]).then(([,mask])=>{maskUniform.value=mask;material.map=art.map;material.needsUpdate=true;}));
    return mesh;
  }
  foreground('APPROVED_CHARACTERS_AND_CHAIRS',0,2);
  foreground('COMPUTER_AND_LAPTOP',1,3.2);
  foreground('DESKS_AND_ORIGINAL_FOREGROUND',2,(_x,y)=>1+Math.max(0,(y-580)/361)*3);
  foreground('LISYEON_APPROVED_ROOM_PLUSH',3,3.8);
  surface('ORIGINAL_BACKGROUND_COUPLE_PHOTO',[[1490,65],[1672,65],[1672,295],[1490,295]],-2.99);
  const floorMaterial=keep(new T.MeshStandardMaterial({color:'#452c31',roughness:.48,metalness:.08}));
  const floor=new T.Mesh(keep(new T.BoxGeometry(44,.2,30)),floorMaterial);floor.name='ROOM_CONTINUOUS_FLOOR';floor.position.set(0,-10.8,2);floor.receiveShadow=true;root.add(floor);
  const wallMaterial=keep(new T.MeshStandardMaterial({color:'#3b2530',roughness:.8}));
  for(const x of [-24,24]){const wall=new T.Mesh(keep(new T.BoxGeometry(.2,23,20)),wallMaterial);wall.position.set(x,0,5);root.add(wall);}
  const divider=new T.Mesh(keep(new T.BoxGeometry(.12,24,.5)),keep(new T.MeshStandardMaterial({color:'#713d51',roughness:.48,metalness:.25})));divider.name='TWO_ROOMS_SHARED_SEAM';divider.position.set(0,0,.1);root.add(divider);
  const left=new T.PointLight('#ffc087',30,30,2);left.position.set(-13,6,5);root.add(left);
  const right=new T.PointLight('#ec8ba1',16,30,2);right.position.set(13,4,4);root.add(right);
  // Split the same projected room surfaces at the existing central seam. The two
  // halves become hinged walls, opening a real passage without swapping scenes.
  const wings=[new T.Group(),new T.Group()];
  wings.forEach((wing,i)=>{wing.name=i?'ROOM_RIGHT_HINGE':'ROOM_LEFT_HINGE';wing.position.x=roomVertex(i?1672:0,470.5,0)[0];root.add(wing);});
  for(const object of [...root.children]){
    if(!(object instanceof T.Mesh)||!object.geometry.getAttribute('uv'))continue;
    const original=object.geometry as T.BufferGeometry,uv=original.getAttribute('uv'),index=original.getIndex();
    if(!index)continue;
    for(let side=0;side<2;side++){
      const indices:number[]=[];
      for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),u=(uv.getX(a)+uv.getX(b)+uv.getX(c))/3;if((u<.5?0:1)===side)indices.push(a,b,c);}
      if(!indices.length)continue;
      const geometry=keep(original.clone());geometry.setIndex(indices);geometry.translate(-wings[side].position.x,0,0);geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,object.material);mesh.name=object.name+(side?'_RIGHT':'_LEFT');wings[side].add(mesh);
    }
    root.remove(object);
  }
  function updateExit(progress:number){const q=T.MathUtils.smoothstep(progress,0,1);wings[0].rotation.y=-q*Math.PI*.48;wings[1].rotation.y=q*Math.PI*.48;divider.position.y=-q*26;}
  return {root,floor,updateExit,anchor:new T.Vector3(-11,-3.1,-64),ready:Promise.all([ready,...foregroundReady])};
}
