import * as T from 'three';

// A physical destination behind the folded corridor, with no repeated Hero photograph.
export function createStoryAtrium(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const root=new T.Group();root.name='STORY_ARRIVAL_TWO_LIGHTS_ATRIUM';scene.add(root);
 const stone=keep(new T.MeshStandardMaterial({color:'#937c79',roughness:.7,metalness:.08})),wine=keep(new T.MeshStandardMaterial({color:'#2d142b',roughness:.5,metalness:.3})),bronze=keep(new T.MeshStandardMaterial({color:'#b87954',roughness:.28,metalness:.85})),floorMaterial=keep(new T.MeshStandardMaterial({color:'#332a34',roughness:.32,metalness:.45}));
 const box=(name:string,size:number[],pos:number[],material:T.Material)=>{const mesh=new T.Mesh(keep(new T.BoxGeometry(...size as[number,number,number])),material);mesh.name=name;mesh.position.fromArray(pos);mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const floor=box('STORY_CONTINUOUS_DARK_STONE_FLOOR',[64,.2,62],[-10,-3.06,-66],floorMaterial);
 // Two deep openings belong to the same destination; they do not pretend to be real city footage.
 const wallShape=new T.Shape();wallShape.moveTo(-32,-13);wallShape.lineTo(32,-13);wallShape.lineTo(32,13);wallShape.lineTo(-32,13);wallShape.closePath();
 for(const x of [-12,12]){const hole=new T.Path();hole.moveTo(x-2.5,-11);hole.lineTo(x-2.5,-3);hole.quadraticCurveTo(x-2.5,0,x,0);hole.quadraticCurveTo(x+2.5,0,x+2.5,-3);hole.lineTo(x+2.5,-11);hole.closePath();wallShape.holes.push(hole);}
 const wallGeometry=keep(new T.ShapeGeometry(wallShape,20)),position=wallGeometry.getAttribute('position');for(let i=0;i<position.count;i++){const x=position.getX(i);position.setZ(i,.009*x*x);}wallGeometry.computeVertexNormals();
 const wall=new T.Mesh(wallGeometry,stone);wall.name='CURVED_STORY_WALL_WITH_REAL_OPENINGS';wall.position.set(-10,8,-76);wall.receiveShadow=true;root.add(wall);
 for(const [i,x] of [-22,2].entries()){
  const warm=i===0,color=warm?'#efb184':'#a3b7e8',z=-76+.009*144;
  box('RECESSED_PORTAL_LEFT_'+i,[.35,11,12],[x-2.65,2.5,z-6],wine);box('RECESSED_PORTAL_RIGHT_'+i,[.35,11,12],[x+2.65,2.5,z-6],wine);box('RECESSED_PORTAL_HEADER_'+i,[5.6,.35,12],[x,8,z-6],bronze);
  const light=new T.RectAreaLight(color,32,4.2,9);light.position.set(x,3,z-9);light.lookAt(x,3,z+20);root.add(light);
  box('LIGHT_AT_END_OF_DEEP_PORTAL_'+i,[4.5,9,.1],[x,3,z-10],keep(new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.8,roughness:.7})));
 }
 for(let i=0;i<15;i++){const x=-37+i*4,z=-76+.009*(x+10)**2;box('ROSE_GOLD_WALL_JOINT_'+i,[.045,24,.08],[x,8,z+.1],bronze);}
 box('DEEP_PLUM_UPPER_CANOPY',[64,.4,34],[-10,20,-62],wine);
 const key=new T.RectAreaLight('#ffd0aa',22,14,14);key.position.set(-21,13,-50);key.lookAt(-10,4,-72);const rim=new T.RectAreaLight('#a7b9eb',16,12,15);rim.position.set(8,10,-58);rim.lookAt(-12,3,-72);root.add(key,rim);
 const curve=new T.CubicBezierCurve3(new T.Vector3(-22,-2.94,-74),new T.Vector3(-22,-2.94,-57),new T.Vector3(2,-2.94,-57),new T.Vector3(2,-2.94,-74));
 const seam=new T.Mesh(keep(new T.TubeGeometry(curve,80,.018,5,false)),keep(new T.MeshStandardMaterial({color:'#d4a381',emissive:'#bc7950',emissiveIntensity:.55,metalness:.5,roughness:.4})));seam.name='TWO_PATHS_SHARE_ONE_FLOOR_SEAM';root.add(seam);
 return{root,floor};
}
