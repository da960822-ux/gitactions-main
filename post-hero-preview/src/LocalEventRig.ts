import * as THREE from 'three';

export const localEventIds = ['L01','L02','L03','L04','L05','L06','L07','L08','L09','L10','L11','L12','L13','L14','L15','L16'] as const;
export type LocalEventId = typeof localEventIds[number];
export type DrawingPoint = { x:number; y:number };
export const approvedPawns = [
  { id:'robot', file:'lisyeon', ko:'핑크토끼', es:'Conejito rosa' },
  { id:'sali-suli', file:'sali-suli', ko:'살리 · 술리', es:'Sali · Suli' },
  { id:'astronaut', file:'astronaut-rose-heart', ko:'로즈하트 우주인', es:'Astronauta con rosa' },
  { id:'fox', file:'maltipoo', ko:'말티푸', es:'Maltipoo' },
  { id:'cat', file:'ragdoll', ko:'랙돌', es:'Ragdoll' },
  { id:'penguin', file:'panda', ko:'판다', es:'Panda' },
  { id:'dragon', file:'chinchilla', ko:'친칠라', es:'Chinchilla' },
] as const;
export const pawnSource = (index:number) => `/images/marble/premium/pawns/${approvedPawns[index]?.file ?? approvedPawns[0].file}.webp`;
export const jokerSources = ['/images/davinci/joker-couple-waterfront.webp','/images/davinci/joker-couple-indoor.webp'] as const;
export const nobleSources = ['/images/splendor/nobles/doctor-noble-portrait.webp','/images/splendor/nobles/hanbok-noble-frontal.webp'] as const;
export type BalancePose = { position:number; velocity:number; settled:boolean };
export function stepBalance(pose:BalancePose, tilt:number, dt:number):BalancePose {
  if(pose.settled)return pose;
  const seconds=Math.max(0,Math.min(.05,dt));
  let velocity=(pose.velocity+Math.sin(THREE.MathUtils.degToRad(Math.max(-8,Math.min(8,tilt))))*seconds*2.6)*Math.exp(-seconds*2.4);
  let position=pose.position+velocity*seconds;
  if(Math.abs(position)>.85){position=Math.sign(position)*.85;velocity*=-.22;}
  if(Math.abs(tilt)<.6&&Math.abs(position)<.065&&Math.abs(velocity)<.09)return {position:0,velocity:0,settled:true};
  return {position,velocity,settled:false};
}
export type LocalEventState = {
  active:LocalEventId|null; effectsEnabled:boolean; motionSerial:number; language:'ko'|'es';
  dominoTiles:ReadonlyArray<readonly[number,number]>; dominoFallen:boolean; drawerOpen:boolean;
  tilt:number; ball:BalancePose; pocketOpen:boolean; sideView:boolean; pawn:number; lightAngle:number;
  prism:0|1|2; strokes:DrawingPoint[][]; drawingFlipped:boolean; rhythmSignal:number|null; rhythmSolved:boolean;
  railStep:number; jokerOpen:[boolean,boolean]; jokerView:'both'|0|1;
  noble:number; nobleOpen:boolean; waxPressed:boolean; stamp:'YL'|'heart'; bookPage:number;
  patchTurns:number[]; windRaised:boolean; decorKind:'pawn'|'gem'|'clip'; decorPawn:number; decorSlot:number; phraseFlipped:boolean;
};
export function createLocalEventState(language:'ko'|'es'='ko'):LocalEventState {
  return {active:null,effectsEnabled:true,motionSerial:0,language,dominoTiles:[[0,1]],dominoFallen:false,drawerOpen:false,
    tilt:0,ball:{position:-.55,velocity:0,settled:false},pocketOpen:false,sideView:false,pawn:0,lightAngle:0,prism:0,strokes:[],drawingFlipped:false,
    rhythmSignal:null,rhythmSolved:false,railStep:0,jokerOpen:[false,false],jokerView:'both',noble:0,nobleOpen:false,waxPressed:false,stamp:'YL',bookPage:0,
    patchTurns:[0,0,0],windRaised:false,decorKind:'gem',decorPawn:0,decorSlot:1,phraseFlipped:false};
}
const smooth=(value:number)=>{const v=THREE.MathUtils.clamp(value,0,1);return v*v*(3-2*v);};

/** Child props only. The host owns placement, camera, envelope and the one render loop. */
export function createLocalEventRig(parent:THREE.Group,onInvalidate:()=>void=()=>{}) {
  const root=new THREE.Group();root.name='local-sixteen-props';parent.add(root);
  const groups=Object.fromEntries(localEventIds.map(id=>{const group=new THREE.Group();group.name=id;root.add(group);return [id,group];})) as Record<LocalEventId,THREE.Group>;
  const paper=new THREE.MeshStandardMaterial({color:0xf4e8d2,roughness:.88,side:THREE.DoubleSide});
  const cream=new THREE.MeshStandardMaterial({color:0xd6bea1,roughness:.9,side:THREE.DoubleSide});
  const gold=new THREE.MeshStandardMaterial({color:0xc8957c,metalness:.64,roughness:.38});
  const wine=new THREE.MeshStandardMaterial({color:0x7b293d,roughness:.55,side:THREE.DoubleSide});
  const ink=new THREE.MeshStandardMaterial({color:0x32222b,roughness:.9});
  const textures=new Set<THREE.Texture>();let disposed=false;
  function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,host:THREE.Object3D,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;host.add(m);return m;}
  function box(w:number,h:number,d:number,material:THREE.Material,host:THREE.Object3D,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),material,host,x,y,z);}
  function group(host:THREE.Object3D,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);host.add(g);return g;}
  const loaded=new Map<string,THREE.Texture>();
  function texture(src:string){let result=loaded.get(src);if(!result){result=new THREE.TextureLoader().load(src,()=>{if(disposed)result?.dispose();else onInvalidate();});result.colorSpace=THREE.SRGBColorSpace;loaded.set(src,result);textures.add(result);}return result;}
  function image(src:string,host:THREE.Object3D,maxW:number,maxH:number,x=0,y=0,z=0){
    const map=texture(src);const object=mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.03,side:THREE.DoubleSide,toneMapped:false}),host,x,y,z);
    object.castShadow=false;object.userData.fit={map,maxW,maxH};return object;
  }
  function pawn(host:THREE.Object3D,height=.9,x=0,y=0,z=0){const g=group(host,x,y,z);box(.45,.04,.3,gold,g,0,.02,0);const images=approvedPawns.map((_,i)=>image(pawnSource(i),g,.95,height,0,height/2+.045,0));return {root:g,images};}
  function choose(fig:ReturnType<typeof pawn>,index:number){fig.images.forEach((m,i)=>m.visible=i===index);}
  function tinyRoom(host:THREE.Object3D,scale=1){const room=group(host);room.scale.setScalar(scale);box(.74,.045,.46,paper,room,0,.3,0);for(const x of [-.28,.28])box(.035,.28,.035,gold,room,x,.14,0);for(const x of [-.62,.62]){box(.24,.035,.25,cream,room,x,.17,0);box(.24,.32,.025,wine,room,x,.31,-.12);box(.025,.17,.025,gold,room,x,.085,0);}return room;}
  const pipPoints=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]];
  function domino(host:THREE.Object3D,a:number,b:number){box(.3,.6,.075,paper,host,0,.3,0);box(.25,.008,.012,gold,host,0,.3,.044);[a,b].forEach((p,half)=>pipPoints[p].forEach(([x,y])=>{const dot=mesh(new THREE.CircleGeometry(.022,10),ink,host,x*.07,.15+half*.3+y*.07,.043);dot.castShadow=false;}));}
  const chain=Array.from({length:4},(_,i)=>{const h=group(groups.L01,-.9+i*.48,0,Math.sin(i*.42)*.28);h.rotation.y=.15-i*.12;return h;});
  let chainSignature='';
  const drawerCase=group(groups.L01,1.03,0,.1);box(.6,.23,.56,wine,drawerCase,0,.12,0);const drawer=group(drawerCase);box(.53,.025,.49,cream,drawer,0,.025,0);box(.53,.2,.035,gold,drawer,0,.11,.26);const latch=box(.07,.18,.03,gold,drawerCase,-.31,.25,.27);mesh(new THREE.OctahedronGeometry(.11),gold,drawer,0,.12,0);
  const trayRoot=group(groups.L02,0,.5,0);box(.08,.5,.08,gold,groups.L02,0,.25,0);box(2,.055,.9,gold,trayRoot);box(1.8,.025,.72,cream,trayRoot,0,.04,0);const groove=mesh(new THREE.TorusGeometry(.12,.015,8,24),wine,trayRoot,0,.063,0);groove.rotation.x=-Math.PI/2;const ball=mesh(new THREE.SphereGeometry(.1,20,12),wine,trayRoot,0,.16,0);const windowDoor=group(groups.L02,-.54,.06,.5);box(1.08,.035,.65,wine,windowDoor,.54,0,-.325);const underRoom=tinyRoom(groups.L02,.6);underRoom.position.set(0,.02,.13);
  const pocket=groups.L03;box(2.2,.04,1.5,gold,pocket);const wallBack=group(pocket,0,.04,-.75);box(2.2,1.15,.025,paper,wallBack,0,.575,0);const walls=[-1,1].map(side=>{const h=group(pocket,side*1.1,.04,0);box(.025,1.15,1.5,cream,h,0,.575,0);return h;});const pocketRoom=tinyRoom(pocket);const roomPawn=pawn(pocket,.65,0,.345,-.06);
  const shadowStage=groups.L04;box(2.6,1.55,.035,paper,shadowStage,0,.78,-.5);box(2.6,.03,1.2,cream,shadowStage,0,0,0);const shadowPawn=pawn(shadowStage,.85,0,0,.23);const shadows=approvedPawns.map((_,i)=>{const map=texture(pawnSource(i));const m=mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,color:0x36222a,transparent:true,opacity:.48,alphaTest:.02,side:THREE.DoubleSide,depthWrite:false}),shadowStage,0,.8,-.474);m.castShadow=false;m.userData.fit={map,maxW:1.8,maxH:1.4};return m;});const lamp=group(shadowStage,-1,0,.7);box(.2,.04,.2,gold,lamp);box(.035,.7,.035,gold,lamp,0,.35,0);mesh(new THREE.ConeGeometry(.16,.22,16),gold,lamp,0,.68,0);
  const lens=groups.L05;const gem=mesh(new THREE.OctahedronGeometry(.25),new THREE.MeshPhysicalMaterial({color:0xb94c68,roughness:.16,metalness:.12,clearcoat:1}),lens,0,.47,.27);const ring=mesh(new THREE.TorusGeometry(.65,.045,10,48),gold,lens,0,.68,.1);box(.08,.5,.08,gold,lens,0,.25,0);const fragments=[-1,1].map(side=>{const g=group(lens,side*.28,.68,-.05);box(.26,.65,.04,paper,g);for(const y of [-.18,.18])mesh(new THREE.CircleGeometry(.04,12),wine,g,0,y,.025);return g;});
  const drawing=groups.L06;const drawingPivot=group(drawing,0,.05,0);box(1.8,1.15,.035,paper,drawingPivot,0,.575,0);const drawingCanvas=document.createElement('canvas');drawingCanvas.width=600;drawingCanvas.height=360;const drawingTexture=new THREE.CanvasTexture(drawingCanvas);drawingTexture.colorSpace=THREE.SRGBColorSpace;textures.add(drawingTexture);const drawn=mesh(new THREE.PlaneGeometry(1.65,.99),new THREE.MeshBasicMaterial({map:drawingTexture,transparent:true,side:THREE.DoubleSide,toneMapped:false}),drawingPivot,0,.575,.025);drawn.castShadow=false;const pencil=box(.07,.07,1.4,gold,drawing,1,.07,0);pencil.rotation.y=.3;let strokesRef:DrawingPoint[][]|undefined;
  const rhythm=groups.L07;const bars=Array.from({length:3},(_,i)=>{const h=group(rhythm,-.58+i*.58,.06,0);box(.3,.8,.12,i===1?gold:cream,h,0,.4,0);return h;});for(const x of [-.9,.9])box(.1,.25,.9,wine,rhythm,x,.125,-.3);
  const rail=groups.L08;const curve=new THREE.EllipseCurve(0,0,1.13,.66,0,Math.PI*2,false,0);const railCurve=new THREE.CatmullRomCurve3(curve.getPoints(72).map(p=>new THREE.Vector3(p.x,.055,p.y)),true);mesh(new THREE.TubeGeometry(railCurve,72,.025,8,true),gold,rail);const rider=pawn(rail,.9);box(1.1,.22,.04,wine,rail,0,.11,.53);
  const photoGroups=jokerSources.map((src,i)=>{const g=group(groups.L09,(i?1:-1)*.7,0,0);box(1.25,1.5,.035,i?paper:ink,g,0,.75,0);image(src,g,1.15,1.34,0,.75,.027);const shutters=[-1,1].map(side=>box(.625,1.5,.045,i?cream:wine,g,side*.3125,.75,.07));return {root:g,shutters};});
  const popup=groups.L10;box(1.8,.035,1.45,cream,popup);const popupHinge=group(popup,0,.04,-.25);box(1.35,1.45,.028,paper,popupHinge,0,.725,0);const nobleImages=nobleSources.map(src=>image(src,popupHinge,1.25,1.32,0,.725,.025));const supports=[-1,1].map(side=>{const h=group(popup,side*.6,.04,-.25);box(.025,.64,.6,gold,h,0,.32,.3);return h;});
  const sample=groups.L11;const wax=mesh(new THREE.CylinderGeometry(.52,.55,.12,48),wine,sample,0,.07,0);const stampHandle=group(sample,0,.7,0);box(.64,.08,.64,gold,stampHandle);mesh(new THREE.CylinderGeometry(.09,.07,.4,20),wine,stampHandle,0,.22,0);const stampTextCanvas=document.createElement('canvas');stampTextCanvas.width=256;stampTextCanvas.height=256;const stampTexture=new THREE.CanvasTexture(stampTextCanvas);textures.add(stampTexture);const waxMark=mesh(new THREE.PlaneGeometry(.62,.62),new THREE.MeshBasicMaterial({map:stampTexture,transparent:true,toneMapped:false}),sample,0,.135,0);waxMark.rotation.x=-Math.PI/2;let stampKind='';
  const book=groups.L12;box(2.4,.06,1.5,wine,book,0,.03,0);box(2.3,.06,1.4,paper,book,0,.09,0);box(.035,.08,1.45,gold,book,0,.13,0);const bookPawns=[pawn(book,.65,-.65,.14,-.2),pawn(book,.65,.65,.14,-.2)];const bookTile=group(book,-.3,.15,.38);domino(bookTile,4,4);bookTile.scale.setScalar(.48);bookTile.rotation.x=-Math.PI/2;const bookCards=Array.from({length:3},(_,i)=>{const c=box(.38,.015,.55,i%2?cream:paper,book,.2+i*.16,.16+i*.018,.3);return c;});const pageLeaf=box(1.12,.012,1.35,paper,book,-.56,.15,0);
  const patches=groups.L13;const patchGroups=Array.from({length:3},(_,i)=>{const h=group(patches,-.9+i*.6,.12,0);box(.58,.03,.7,paper,h,.29,0,0);box(.3,.008,.035,gold,h,.29,.024,0);box(.035,.008,.3,gold,h,.43,.024,.13);return h;});for(const x of [-.95,1])box(.08,.24,.7,wine,patches,x,0,0);
  const wind=groups.L14;const windPanels=Array.from({length:15},(_,i)=>box(.13,.014,.5,i%2?cream:paper,wind,-.91+i*.13,.08,0));box(1.75,.02,.32,gold,wind,0,.035,0);const fan=group(wind,-1.25,.15,.1);for(let i=0;i<5;i++){const blade=box(.4,.025,.12,paper,fan);blade.rotation.y=i*Math.PI/5;}
  const decor=groups.L15;const decorDrawer=group(decor,-.85,0,0);box(.5,.25,.6,wine,decorDrawer,0,.125,0);const decorSlide=box(.45,.04,.56,cream,decorDrawer,0,.06,.2);const slots=[-1,0,1].map(x=>{const ring=mesh(new THREE.TorusGeometry(.24,.015,8,32),gold,decor,x*.8,.02,.55);ring.rotation.x=-Math.PI/2;return ring;});const decorObjects=group(decor);const decorPawn=pawn(decorObjects,.85);const decorGem=mesh(new THREE.OctahedronGeometry(.25),gold,decorObjects,0,.25,0);const clipCurve=new THREE.CatmullRomCurve3([[-.1,.01,-.25],[-.18,.01,.2],[0,.01,.3],[.15,.01,.15],[.15,.01,-.25],[.02,.01,-.32],[-.04,.01,.08]].map(p=>new THREE.Vector3(...p)));const decorClip=mesh(new THREE.TubeGeometry(clipCurve,36,.022,8,false),gold,decorObjects);
  const phrase=groups.L16;const phraseCard=group(phrase,0,.62,0);box(1.9,1.05,.035,paper,phraseCard);box(.25,.3,.04,gold,phraseCard,1.06,0,0);const phraseLabels=['같이 놀자','Vamos a jugar'].map((text,i)=>{const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#402935';ctx.font='52px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,128);}const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;textures.add(map);const plane=mesh(new THREE.PlaneGeometry(1.68,.56),new THREE.MeshBasicMaterial({map,transparent:true,toneMapped:false,side:THREE.FrontSide}),phraseCard,0,0,i?-.025:.025);plane.rotation.y=i?Math.PI:0;plane.castShadow=false;return plane;});
  let lastSerial=-1,start=0,lastActive:LocalEventId|null=null;
  return {root,
    update(state:LocalEventState,now:number,reducedMotion:boolean){
      if(disposed)return false;
      if(lastSerial!==state.motionSerial||lastActive!==state.active){start=now;lastSerial=state.motionSerial;lastActive=state.active;}
      const staticPose=reducedMotion||!state.effectsEnabled;
      const phase=staticPose?1:THREE.MathUtils.clamp((now-start)/850,0,1),q=smooth(phase);
      root.visible=state.active!==null;
      localEventIds.forEach(id=>groups[id].visible=id===state.active);
      root.traverse(object=>{if(object instanceof THREE.Mesh&&object.userData.fit){const {map,maxW,maxH}=object.userData.fit;const source=map.image;if(source?.width&&source?.height){const ratio=source.width/source.height;const w=Math.min(maxW,maxH*ratio);object.scale.set(w,w/ratio,1);}}});
      if(chainSignature!==JSON.stringify(state.dominoTiles)){chainSignature=JSON.stringify(state.dominoTiles);chain.forEach((h,i)=>{while(h.children.length){const child=h.children.pop() as THREE.Mesh;child.geometry?.dispose();child.removeFromParent();}if(state.dominoTiles[i])domino(h,...state.dominoTiles[i]);});}
      chain.forEach((h,i)=>{h.visible=i<state.dominoTiles.length;h.rotation.x=state.dominoFallen?-smooth((phase-i*.14)/.44)*Math.PI/2:0;});
      const drawerQ=state.drawerOpen?1:state.dominoFallen?smooth((phase-.72)/.28):0;drawer.position.z=drawerQ*.42;latch.rotation.z=drawerQ*1.1;
      trayRoot.rotation.z=-THREE.MathUtils.degToRad(state.tilt);ball.position.x=state.ball.position;windowDoor.rotation.x=state.ball.settled?-1.2:0;underRoom.visible=state.ball.settled;
      const open=state.pocketOpen?(staticPose?1:q):0;wallBack.rotation.x=-(1-open)*Math.PI/2;walls[0].rotation.z=(1-open)*Math.PI/2;walls[1].rotation.z=-(1-open)*Math.PI/2;pocketRoom.scale.setScalar(.15+open*.85);roomPawn.root.visible=open>.9;choose(roomPawn,state.pawn);pocket.rotation.y=state.sideView?-.6:0;
      choose(shadowPawn,state.pawn);shadows.forEach((m,i)=>{m.visible=i===state.pawn;m.position.x=-state.lightAngle*.55;m.scale.x*=1+Math.abs(state.lightAngle)*.3;});lamp.position.x=-state.lightAngle*.9;lamp.rotation.z=-state.lightAngle*.2;
      gem.rotation.set(.2,state.prism*Math.PI/3,.3);fragments.forEach((f,i)=>{f.position.x=(i?1:-1)*(state.prism===1?.13:.38);f.rotation.z=state.prism===1?0:(i?1:-1)*.45;});ring.rotation.y=(state.prism-1)*.17;
      if(strokesRef!==state.strokes){strokesRef=state.strokes;const ctx=drawingCanvas.getContext('2d');if(ctx){ctx.clearRect(0,0,600,360);ctx.strokeStyle='#7b293d';ctx.lineWidth=6;ctx.lineCap='round';ctx.lineJoin='round';state.strokes.forEach(stroke=>{ctx.beginPath();stroke.forEach((p,i)=>i?ctx.lineTo(p.x*6,p.y*6):ctx.moveTo(p.x*6,p.y*6));ctx.stroke();});drawingTexture.needsUpdate=true;}}
      drawingPivot.rotation.x=state.drawingFlipped?0:-Math.PI/2;
      bars.forEach((h,i)=>{h.rotation.x=state.rhythmSolved?-Math.PI/2:0;h.position.set(-.58+i*.58,state.rhythmSolved?.32:.06,0);(h.children[0] as THREE.Mesh).scale.y=state.rhythmSignal===i?1.14:1;});
      const orbit=state.railStep===8?phase*Math.PI*2:state.railStep*Math.PI/4;choose(rider,state.pawn);rider.root.position.set(Math.sin(orbit)*1.13,0,Math.cos(orbit)*.66);rider.root.scale.setScalar(1);rider.root.rotation.y=0;
      photoGroups.forEach((photo,i)=>{photo.root.visible=state.jokerView==='both'||state.jokerView===i;photo.root.position.x=state.jokerView==='both'?(i?1:-1)*.7:0;photo.shutters.forEach((shutter,j)=>shutter.position.x=(j?1:-1)*(.3125+(state.jokerOpen[i]?.7:0)));});
      popupHinge.rotation.x=state.nobleOpen?0:-Math.PI/2;supports.forEach(h=>h.scale.y=state.nobleOpen?1:.025);nobleImages.forEach((m,i)=>m.visible=i===state.noble);popup.rotation.y=state.sideView?-.65:0;
      const press=state.waxPressed?1:staticPose?0:Math.max(0,1-phase*2);wax.scale.set(1+press*.13,1-press*.48,1+press*.13);stampHandle.position.y=.7-press*.48;waxMark.position.y=.135-press*.05;
      if(stampKind!==state.stamp){stampKind=state.stamp;const ctx=stampTextCanvas.getContext('2d');if(ctx){ctx.clearRect(0,0,256,256);ctx.fillStyle='#d7a18f';ctx.font='bold 100px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(state.stamp==='YL'?'YL':'♡',128,128);stampTexture.needsUpdate=true;}}
      bookPawns.forEach((fig,i)=>{choose(fig,i===0?state.pawn:1);fig.root.position.x=(i?1:-1)*(.65-state.bookPage*.09);fig.root.rotation.y=(i?1:-1)*state.bookPage*.08;});bookTile.visible=state.bookPage>=1;bookTile.position.x=-.5+state.bookPage*.1;bookCards.forEach((card,i)=>{card.visible=state.bookPage>=2;card.rotation.y=state.bookPage===3?(i-1)*.3:0;card.position.x=.05+i*(state.bookPage===3?.34:.12);});pageLeaf.rotation.z=-state.bookPage*.045;
      const bridgeDone=state.patchTurns.every((v,i)=>v===[1,2,0][i]);patchGroups.forEach((h,i)=>{h.rotation.y=bridgeDone?0:state.patchTurns[i]*Math.PI/2;h.rotation.z=bridgeDone?0:(i%2?-.5:.5);});
      const gust=state.windRaised?(staticPose?.5:Math.sin(phase*Math.PI)*.65):0;windPanels.forEach((m,i)=>{const t=i/14;m.position.y=.08+Math.sin(t*Math.PI)*gust;m.rotation.z=Math.atan(Math.cos(t*Math.PI)*gust*Math.PI/1.82);});fan.rotation.y=state.windRaised?phase*Math.PI:0;
      decorSlide.position.z=.2+(state.drawerOpen?.32:0);decorObjects.position.set((state.decorSlot-1)*.8,0,.55);choose(decorPawn,state.decorPawn);decorPawn.root.visible=state.decorKind==='pawn';decorGem.visible=state.decorKind==='gem';decorClip.visible=state.decorKind==='clip';slots.forEach((m,i)=>(m.material as THREE.MeshStandardMaterial).emissive.set(i===state.decorSlot?0x25120b:0));
      const spanish=(state.language==='es')!==state.phraseFlipped;phraseCard.rotation.y=spanish?Math.PI:0;phraseLabels.forEach(m=>m.visible=true);
      const animated=state.active==='L01'&&state.dominoFallen||state.active==='L03'&&state.pocketOpen||state.active==='L08'&&state.railStep===8||state.active==='L11'&&!state.waxPressed||state.active==='L14'&&state.windRaised;
      return !staticPose&&Boolean(animated)&&phase<1;
    },
    dispose(){disposed=true;root.removeFromParent();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  };
}
