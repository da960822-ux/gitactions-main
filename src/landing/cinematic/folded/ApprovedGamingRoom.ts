import * as T from 'three';
import { roomBackgroundDepth, roomUV, roomVertex } from './approvedRoomGeometry';

type Point = [number,number];
export function createApprovedGamingRoom(scene:T.Scene,keep:<A extends {dispose:()=>void}>(a:A)=>A) {
  const root=new T.Group();root.name='APPROVED_COUPLE_GAMING_ROOM';root.position.set(-11,7.6,-64);scene.add(root);
  const art=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide}));
  const environment=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide,depthWrite:false}));
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
    if(geometry.getAttribute('normal').getZ(0)<0){const index=geometry.getIndex()!;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}geometry.computeVertexNormals();}
    const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.userData.approvedSource=material===art;mesh.userData.projectedRoomSurface=true;root.add(mesh);return mesh;
  }
  // Back wall keeps the complete approved frame. Foreground surfaces have real depth.
  // Approved RGB stays on depth-separated surfaces; these are illustrated people, not full 3D character models.
  const wallGeometry=keep(new T.PlaneGeometry(1672,941,48,32));
  const wallPositions=wallGeometry.getAttribute('position'),wallUV=wallGeometry.getAttribute('uv');
  for(let i=0;i<wallPositions.count;i++){
    const u=wallUV.getX(i),y=(1-wallUV.getY(i))*941;
    wallPositions.setXYZ(i,...roomVertex(u*1672,y,roomBackgroundDepth(u,y)));
  }
  wallPositions.needsUpdate=true;wallGeometry.computeVertexNormals();
  const walls=new T.Mesh(wallGeometry,environment);walls.name='CONTINUOUS_ROOM_WALLS_AND_FLOOR';walls.userData.projectedRoomSurface=true;walls.renderOrder=-10;root.add(walls);
  const labelUniform={value:null as T.Texture|null};
  const pendingMap=keep(new T.DataTexture(new Uint8Array([255,255,255,255]),1,1,T.RGBAFormat));pendingMap.needsUpdate=true;
  const propNames=['PHOTO_AND_PENS','KEYBOARD_AND_MAT','YEONSEOK_MOUSE','BLACK_MUG','PINK_MUG','PENCIL_HOLDER','LEFT_BOOKS','RIGHT_BOOKS','FRONT_BOOKS'];
  const propBottoms=Array(propNames.length).fill(0) as number[];
  const propBounds=propNames.map(()=>[1672,941,0,0]);
  // Connected blue regions follow the source's closed object outlines instead of
  // bending a cup, photograph or keyboard through the desktop's depth field.
  const labelsReady=maskReady.then(mask=>{
    const canvas=document.createElement('canvas');canvas.width=1672;canvas.height=941;
    const context=canvas.getContext('2d')!;context.drawImage(mask.image,0,0,1672,941);
    const pixels=context.getImageData(0,0,1672,941).data,count=1672*941,classes=new Uint8Array(count),labels=new Int32Array(count);
    for(let i=0;i<count;i++){const r=pixels[i*4],g=pixels[i*4+1],b=pixels[i*4+2];classes[i]=r>150&&g<100&&b<100?1:g>150&&r<100&&b<100?2:r>150&&g>150&&b<100?3:b>150&&r<100&&g<100?4:0;}
    const queue=new Int32Array(count);let component=0;
    for(let start=0;start<count;start++){
      if(classes[start]!==4||labels[start])continue;
      component++;let read=0,write=1,left=1672,right=0,top=941,bottom=0;queue[0]=start;labels[start]=component;
      while(read<write){const pixel=queue[read++],x=pixel%1672,y=Math.floor(pixel/1672);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
        for(const next of [x>0?pixel-1:-1,x<1671?pixel+1:-1,y>0?pixel-1672:-1,y<940?pixel+1672:-1])if(next>=0&&classes[next]===4&&!labels[next]){labels[next]=component;queue[write++]=next;}
      }
      let prop=-1;
      if(left<10&&top<620&&right<230)prop=0;
      else if(left>190&&left<220&&top>620&&top<645&&bottom<810)prop=1;
      else if(left>260&&left<280&&top>615&&top<635&&right<350)prop=2;
      else if(left>580&&left<605&&top>720&&top<740&&right<715)prop=3;
      else if((left>910&&left<935&&top>645&&top<665&&bottom<800)||(left>1005&&left<1025&&top>670&&top<690&&bottom<760))prop=4;
      else if(left>840&&left<855&&top>735&&top<755&&bottom>930)prop=5;
      else if(left>690&&left<730&&right>810&&top>730&&bottom>810)prop=6;
      else if(left>=1340&&top>=775&&right<1650)prop=7;
      else if(left>=930&&left<975&&top>=790&&top<825&&bottom>900)prop=8;
      if(prop>=0){propBottoms[prop]=Math.max(propBottoms[prop],bottom);const bounds=propBounds[prop];bounds[0]=Math.min(bounds[0],left);bounds[1]=Math.min(bounds[1],top);bounds[2]=Math.max(bounds[2],right);bounds[3]=Math.max(bounds[3],bottom);for(let i=0;i<write;i++)classes[queue[i]]=5+prop;}
    }
    if(propBottoms.some(bottom=>!bottom))throw new Error('Approved room source outlines do not match all rigid prop groups.');
    // Close only thin black internal ink seams with matching opposite regions;
    // exterior gaps and boundaries between different source objects stay open.
    const outlined=classes.slice();
    for(let y=2;y<939;y++)for(let x=2;x<1670;x++){const i=y*1672+x;if(classes[i])continue;
      let nearest=9,label=0;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const candidate=classes[i+dy*1672+dx],distance=dx*dx+dy*dy;if(candidate>=5&&distance<nearest){nearest=distance;label=candidate;}}
      if(label)outlined[i]=label;
    }
    const closed=outlined.slice();
    for(let y=3;y<938;y++)for(let x=3;x<1669;x++){const i=y*1672+x;if(outlined[i])continue;
      for(let d=1;d<=3;d++){const h=outlined[i-d],v=outlined[i-d*1672];if(h&&h===outlined[i+d]){closed[i]=h;break;}if(v&&v===outlined[i+d*1672]){closed[i]=v;break;}}
    }
    const data=new Uint8Array(count*4);for(let i=0;i<count;i++){data[i*4]=closed[i];data[i*4+3]=255;}
    const texture=keep(new T.DataTexture(data,1672,941,T.RGBAFormat));texture.flipY=true;texture.colorSpace=T.NoColorSpace;texture.magFilter=texture.minFilter=T.NearestFilter;texture.needsUpdate=true;labelUniform.value=texture;
  });
  function maskedMaterial(label:number){
    const material=keep(art.clone());material.transparent=true;material.map=art.map??pendingMap;
    material.onBeforeCompile=shader=>{
      shader.uniforms.sourceLabels=labelUniform;shader.uniforms.sourceLabel={value:label};
      shader.fragmentShader='uniform sampler2D sourceLabels;uniform float sourceLabel;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float coverage=0.;
        for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
          float label=floor(texture2D(sourceLabels,vMapUv+vec2(float(i)/1672.,float(j)/941.)).r*255.+.5);
          coverage+=1.-step(.5,abs(label-sourceLabel));
        }
        diffuseColor.a*=smoothstep(.08,.58,coverage/9.);
        if(diffuseColor.a<.02)discard;
      `);
    };
    material.customProgramCacheKey=()=>`approved-rigid-source-${label}`;
    foregroundReady.push(Promise.all([ready,labelsReady]).then(()=>{material.map=art.map;material.needsUpdate=true;}));return material;
  }
  function foreground(name:string,label:number,depth:number){
    const geometry=keep(new T.PlaneGeometry(1672,941,2,2)),positions=geometry.getAttribute('position'),uvs=geometry.getAttribute('uv');
    for(let i=0;i<positions.count;i++)positions.setXYZ(i,...roomVertex(uvs.getX(i)*1672,(1-uvs.getY(i))*941,depth));
    geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,maskedMaterial(label));mesh.name=name;mesh.userData.projectedRoomSurface=true;mesh.userData.approvedSource=true;root.add(mesh);return mesh;
  }
  foreground('APPROVED_CHARACTERS_AND_CHAIRS',1,2);
  foreground('COMPUTER_AND_LAPTOP',2,3.2);
  foreground('LISYEON_APPROVED_ROOM_PLUSH',3,3.8);
  const deskDepth=(y:number)=>{const rayY=roomVertex(836,y,0)[1];return T.MathUtils.clamp(24*(1-(-5.8)/Math.min(-.1,rayY)),-16,14);};
  const deskGeometry=keep(new T.PlaneGeometry(1672,941,64,48));
  const deskPositions=deskGeometry.getAttribute('position'),deskUV=deskGeometry.getAttribute('uv');
  for(let i=0;i<deskPositions.count;i++){const x=deskUV.getX(i)*1672,y=(1-deskUV.getY(i))*941;deskPositions.setXYZ(i,...roomVertex(x,y,1+Math.max(0,(y-580)/361)*3));}
  deskGeometry.computeVertexNormals();
  const desktop=new T.Mesh(deskGeometry,maskedMaterial(4));desktop.name='DESKS_AND_ORIGINAL_FOREGROUND';desktop.userData.projectedRoomSurface=true;root.add(desktop);
  // The already available clean plate supplies wood hidden behind lifted props.
  for(const [side,points]of [[0,[[0,635],[826,674],[826,941],[0,941]]],[1,[[846,674],[1672,635],[1672,941],[846,941]]]] as const){
    const underlay=surface('DESK_WOOD_UNDERLAY_'+side,points.map(([x,y])=>[x,y] as Point),0,environment);underlay.userData.deskUnderlay=true;
  }
  for(let i=0;i<propNames.length;i++){const prop=foreground('RIGID_'+propNames[i],5+i,3);prop.userData.deskProp=i;}
  surface('ORIGINAL_BACKGROUND_COUPLE_PHOTO',[[1490,65],[1672,65],[1672,295],[1490,295]],-2.99);
  const screenMaterial=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.FrontSide}));
  const screenReady=loader.loadAsync('/images/approved-couple-room/screen-yeonseok-ko.png').then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;screenMaterial.map=texture;screenMaterial.needsUpdate=true;});
  const screen=surface('ACTUAL_KOREAN_DAVINCI_DISPLAY',[[60,330],[207,318],[246,628],[116,604],[80,339]],3.27,screenMaterial);
  const uv=screen.geometry.getAttribute('uv');
  // Source monitor is strongly foreshortened; preserve its visible original bezel.
  [[0,1],[1,1],[1,0],[0,0],[.11,.97]].forEach(([u,v],i)=>uv.setXY(i,u,v));uv.needsUpdate=true;
  const insideMaterial=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.BackSide}));
  const insideReady=loader.loadAsync('/images/approved-couple-room/screen-lisbeth-es.png').then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;insideMaterial.map=texture;insideMaterial.needsUpdate=true;});
  const inside=surface('ACTUAL_SPANISH_LAPTOP_INNER_DISPLAY',[[1180,534],[1487,508],[1430,715],[1125,719]],3.18,insideMaterial);
  [[0,1],[1,1],[1,0],[0,0]].forEach(([u,v],i)=>inside.geometry.getAttribute('uv').setXY(i,u,v));
  const floorMaterial=keep(new T.MeshStandardMaterial({color:'#452c31',roughness:.48,metalness:.08}));
  const floor=new T.Mesh(keep(new T.BoxGeometry(44,.2,30)),floorMaterial);floor.name='ROOM_CONTINUOUS_FLOOR';floor.position.set(0,-10.8,2);floor.receiveShadow=true;root.add(floor);
  const wallMaterial=keep(new T.MeshStandardMaterial({color:'#3b2530',roughness:.8}));
  const rearWall=new T.Mesh(keep(new T.BoxGeometry(76,50,.25)),wallMaterial);rearWall.name='PHYSICAL_ROOM_REAR_CLOSURE';rearWall.position.set(0,4,-20);root.add(rearWall);
  for(const x of [-24,24]){const wall=new T.Mesh(keep(new T.BoxGeometry(.2,23,20)),wallMaterial);wall.position.set(x,0,5);root.add(wall);}
  const divider=new T.Mesh(keep(new T.BoxGeometry(.12,24,.5)),keep(new T.MeshStandardMaterial({color:'#713d51',roughness:.48,metalness:.25})));divider.name='TWO_ROOMS_SHARED_SEAM';divider.position.set(0,0,.1);root.add(divider);
  const left=new T.PointLight('#ffc087',30,30,2);left.position.set(-13,6,5);root.add(left);
  const right=new T.PointLight('#ec8ba1',16,30,2);right.position.set(13,4,4);root.add(right);
  // Split the same projected room surfaces at the existing central seam. The two
  // halves become hinged walls, opening a real passage without swapping scenes.
  const deskParts:{mesh:T.Mesh;hingeX:number;prop?:number;underlay?:boolean}[]=[];
  const wings=[new T.Group(),new T.Group()];
  wings.forEach((wing,i)=>{wing.name=i?'ROOM_RIGHT_HINGE':'ROOM_LEFT_HINGE';wing.position.x=roomVertex(i?1672:0,470.5,0)[0];root.add(wing);});
  for(const object of [...root.children]){
    if(!(object instanceof T.Mesh)||!object.userData.projectedRoomSurface)continue;
    const original=object.geometry as T.BufferGeometry,positions=original.getAttribute('position'),index=original.getIndex();
    if(!index)continue;
    for(let side=0;side<2;side++){
      const indices:number[]=[];
      for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),x=(positions.getX(a)+positions.getX(b)+positions.getX(c))/3;if((x<0?0:1)===side)indices.push(a,b,c);}
      if(!indices.length)continue;
      const geometry=keep(original.clone());geometry.setIndex(indices);geometry.translate(-wings[side].position.x,0,0);geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,object.material);mesh.renderOrder=object.renderOrder;mesh.name=object.name+(side?'_RIGHT':'_LEFT');wings[side].add(mesh);if(object.name==='DESKS_AND_ORIGINAL_FOREGROUND'||object.userData.deskProp!==undefined||object.userData.deskUnderlay)deskParts.push({mesh,hingeX:wings[side].position.x,prop:object.userData.deskProp,underlay:object.userData.deskUnderlay});
    }
    root.remove(object);
  }
  // Thin physical timber continues the desktops; no source crop is stretched.
  const deskExtensions=new T.Group();deskExtensions.name='APPROVED_DESK_CONTINUATION';root.add(deskExtensions);
  const woodMaterial=keep(new T.MeshStandardMaterial({color:'#3c2115',roughness:.9,metalness:0,toneMapped:false}));
  woodMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vDeskPlane;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDeskPlane=position.xz;');
    shader.fragmentShader='varying vec2 vDeskPlane;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float grain=1.+.012*sin(vDeskPlane.y*31.+sin(vDeskPlane.x*.4)*.7)+.005*sin(vDeskPlane.y*117.);
      diffuseColor.rgb*=grain;
    `);
  };
  woodMaterial.customProgramCacheKey=()=> 'approved-desk-native-timber';
  const extensionEdgeMaterial=keep(new T.MeshStandardMaterial({color:'#382721',roughness:.85,metalness:0}));
  for(const side of [-1,1]){
    const geometry=keep(new T.PlaneGeometry(25,20));geometry.rotateX(-Math.PI/2);geometry.translate(side*12.53,0,14.7);
    const top=new T.Mesh(geometry,woodMaterial);top.receiveShadow=true;deskExtensions.add(top);
    const edge=new T.Mesh(keep(new T.BoxGeometry(25,.12,.12)),extensionEdgeMaterial);edge.position.set(side*12.53,-.06,24.7);edge.receiveShadow=true;deskExtensions.add(edge);
  }
  let lastDesk=-1,requestedDesk=0;
  function updateDesk(progress:number){
    requestedDesk=progress;const q=T.MathUtils.smoothstep(progress,0,1);if(Math.abs(q-lastDesk)<.00001)return;lastDesk=q;
    deskExtensions.visible=q>0;deskExtensions.position.y=T.MathUtils.lerp(-10.6,-5.81,q);deskExtensions.scale.z=T.MathUtils.lerp(.01,1,q);
    for(const{mesh,hingeX,prop,underlay}of deskParts){
      if(prop!==undefined&&propBottoms[prop]&&!mesh.userData.rigidSourceCrop){
        const [left,top,right,bottom]=propBounds[prop],side=(left+right)/2<836?-1:1;
        if(side*hingeX<0){mesh.visible=false;continue;}
        const geometry=keep(new T.PlaneGeometry(1,1)),uv=geometry.getAttribute('uv');
        for(let i=0;i<uv.count;i++)uv.setXY(i,T.MathUtils.lerp(Math.max(0,left-3),Math.min(1672,right+3),uv.getX(i))/1672,1-T.MathUtils.lerp(Math.max(0,top-3),Math.min(941,bottom+3),1-uv.getY(i))/941);
        mesh.geometry=geometry;mesh.userData.rigidSourceCrop=true;
      }
      const geometry=mesh.geometry as T.BufferGeometry,position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
      const bottom=prop===undefined?0:propBottoms[prop]||800;
      for(let i=0;i<position.count;i++){
        const x=uv.getX(i)*1672,y=(1-uv.getY(i))*941;
        const initial=prop===undefined?1+Math.max(0,(y-580)/361)*3:1+Math.max(0,(bottom-580)/361)*3;
        const depth=T.MathUtils.lerp(initial,deskDepth(prop===undefined?y:bottom),q)-(underlay?.025:0);
        const v=roomVertex(x,y,depth);position.setXYZ(i,v[0]-hingeX,v[1],v[2]);
      }
      position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    }
  }
  updateDesk(0);
  function updateExit(progress:number){const q=T.MathUtils.smoothstep(progress,0,1);wings[0].rotation.y=-q*Math.PI*.48;wings[1].rotation.y=q*Math.PI*.48;divider.position.y=-q*26;}
  return {root,floor,updateExit,updateDesk,anchor:new T.Vector3(-11,-3.1,-64),ready:Promise.all([ready,screenReady,insideReady,...foregroundReady]).then(()=>{lastDesk=-1;updateDesk(requestedDesk);})};
}
