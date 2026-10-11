import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createHeartGeometry} from './heartGeometry';
import {createHeroMaterials} from './heroMaterials';
import {createGameObject,normalizeSculpture,studioMaterials} from './studioObjects';
import {gameCatalog} from '../games/catalog';

type Props={mode:'hearts'|'games';selected?:string;paused:boolean;impulse?:number;onSelect?:(id:string)=>void;onUnavailable?:()=>void};
const heartLayout=[[1.2,.25,1.1,1.82,-.25],[3.55,-1.55,.2,1.2,.3],[3.45,2.18,-1.8,1.12,.35],[-.1,2.3,-1,.68,-.5],[5.1,.55,-1,.7,.1],[.15,-2.4,-1.8,.67,.3]];
const heroLayout=[[-3.15,.65,.55,.65,-.25],[3.5,1.45,-1.1,.5,.16],[3.15,-1.7,.65,.62,.28]];
export default function StudioScene(props:Props){
 const host=useRef<HTMLDivElement>(null),controls=useRef(props),redraw=useRef<()=>void>(()=>{}),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[mounted,setMounted]=useState(props.mode==='hearts');
 controls.current=props;
 useEffect(()=>{if(mounted)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setMounted(true);observer.disconnect();}},{rootMargin:'250px'});observer.observe(host.current!);return()=>observer.disconnect();},[mounted]);
 useEffect(()=>{redraw.current();},[props.paused,props.selected,props.impulse]);
 useEffect(()=>{
  if(!mounted)return;
  const node=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFailed(true);controls.current.onUnavailable?.();return;}
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,50),materials=studioMaterials();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const environmentScene=new T.Scene();environmentScene.background=new T.Color('#121016');
  // Wide emissive panels create the broad softbox reflections used throughout the family.
  for(const [x,y,z,w,h] of [[-5,4,5,4,7],[5,1,2,2,6],[0,6,-2,7,2],[0,-3,4,5,1]]){
   const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:'#fff2e8',side:T.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);
  }
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(environmentScene,.06);scene.environment=environment.texture;pmrem.dispose();
  const key=new T.DirectionalLight('#ffe5d1',3);key.position.set(-4,6,8);scene.add(key);const rim=new T.DirectionalLight('#c6caff',1.7);rim.position.set(5,2,-3);scene.add(rim);scene.add(new T.HemisphereLight('#d5cbd6','#110d13',.55));
  const heroMaterials=createHeroMaterials();
  const objects:T.Group[]=[];
  if(props.mode==='hearts')heartLayout.forEach((_,i)=>{const g=new T.Group();g.add(new T.Mesh(createHeartGeometry(),i===1||i===3?materials.gold:materials.chrome));scene.add(g);objects.push(g);});
  else gameCatalog.forEach(game=>{const g=normalizeSculpture(createGameObject(game.id,materials,()=>redraw.current()));g.userData.game=game.id;g.traverse(o=>{if(o instanceof T.Mesh){const originals=Array.isArray(o.material)?o.material:[o.material];const copies=originals.map(original=>{const material=original.clone() as T.MeshStandardMaterial;material.userData.baseColor=material.color.clone();material.userData.baseEnvironment=material.envMapIntensity;return material;});o.material=Array.isArray(o.material)?copies:copies[0];}});scene.add(g);objects.push(g);});
  const canvas=renderer.domElement;node.appendChild(canvas);canvas.setAttribute('aria-hidden','true');
  let portraitMask:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>|undefined,portraitBox:{x:number;y:number;width:number;height:number}|undefined;
  if(props.mode==='hearts'){
   const map=new T.TextureLoader().load('/images/yeonseok-lisbeth-cutout.webp',()=>{map.userData.pending=false;redraw.current();},undefined,()=>{map.userData.pending=false;});map.userData.pending=true;
   portraitMask=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map,alphaTest:.12,colorWrite:false,depthWrite:true}));portraitMask.renderOrder=-1;portraitMask.position.z=.6;scene.add(portraitMask);
  }
  let ribbon:T.Mesh<T.TubeGeometry,T.MeshStandardMaterial>|undefined;
  if(props.mode==='hearts'){
   const curve=new T.CatmullRomCurve3([new T.Vector3(-4.6,-.1,1.6),new T.Vector3(-3.5,1.45,.5),new T.Vector3(-2.5,1.8,-1.4),new T.Vector3(0,.8,-2.8),new T.Vector3(3.2,-.4,-1),new T.Vector3(4.1,-1.25,.8)]);
   const material=materials.gold.clone();material.color.set('#936b59');material.roughness=.4;material.envMapIntensity=1.2;
   ribbon=new T.Mesh(new T.TubeGeometry(curve,128,.026,8,false),material);scene.add(ribbon);
  }
  let width=0,height=0,viewWidth=0,viewHeight=0,viewLeft=0,viewTop=0,nodeLeft=0,nodeTop=0,mobile=false,time=0,curveTime=0,last=0,visible=true,disposed=false,contextLost=false,loaded=false,impulse=props.impulse??0,energy=0,hovered=-1;
  const pointer=new T.Vector2(),hoverPoint=new T.Vector2(),ray=new T.Raycaster(),finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  const repulsions=heroLayout.map(()=>new T.Vector2()),repulseTargets=heroLayout.map(()=>new T.Vector2());
  const inputNode=props.mode==='hearts'?node.closest<HTMLElement>('.rd-hero')!:canvas;
  const resize=()=>{const box=node.getBoundingClientRect();width=box.width;height=box.height;nodeLeft=box.left+scrollX;nodeTop=box.top+scrollY;mobile=width<700;const cropped=props.mode==='hearts'&&!mobile;viewWidth=cropped?Math.min(width,height*1.44):width;viewHeight=cropped?height*.64:height;viewLeft=(width-viewWidth)/2;viewTop=cropped?height*.22:0;
   renderer.setPixelRatio(cropped?Math.min(devicePixelRatio,1.25):Math.min(devicePixelRatio,1.5));renderer.setSize(viewWidth,viewHeight);canvas.style.position=cropped?'absolute':'';canvas.style.left=`${viewLeft}px`;canvas.style.top=`${viewTop}px`;camera.aspect=width/height;camera.position.set(0,0,props.mode==='hearts'?(mobile?10.5:11.8):(mobile?10.2:9.6));camera.fov=props.mode==='hearts'&&mobile?43:38;
   if(portraitMask){const rect=node.closest('.rd-hero')?.querySelector('.rd-couple')?.getBoundingClientRect();portraitMask.visible=Boolean(rect?.width);if(rect)portraitBox={x:rect.left-box.left,y:rect.top-box.top,width:rect.width,height:rect.height};}
   // Render the existing desktop composition through a smaller window; the full-stage projection is unchanged.
   if(cropped)camera.setViewOffset(width,height,viewLeft,viewTop,viewWidth,viewHeight);else camera.clearViewOffset();camera.updateProjectionMatrix();if(visible&&!document.hidden)render(true);};
  const render=(snap=false,dt=1/60)=>{
   if(!width||!height||disposed||contextLost)return;const active=!controls.current.paused&&!document.hidden;
   if(portraitMask&&portraitBox){const motion=JSON.parse(inputNode.dataset.sceneMotion||'{}'),scale=motion.scale??1,shift=motion.portrait??[0,0],planeHeight=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*(camera.position.z-.6),planeWidth=planeHeight*width/height;portraitMask.position.x=((portraitBox.x+portraitBox.width/2+shift[0])/width-.5)*planeWidth;portraitMask.position.y=(.5-(portraitBox.y+portraitBox.height/2+shift[1])/height)*planeHeight;portraitMask.scale.set(portraitBox.width*scale/width*planeWidth,portraitBox.height*scale/height*planeHeight,1);}
   if(ribbon){if(controls.current.paused)curveTime=1.5;const reveal=1-Math.pow(1-Math.min(1,Math.max(0,curveTime-.35)/1.1),3);ribbon.visible=!mobile;ribbon.geometry.setDrawRange(0,Math.floor(ribbon.geometry.index!.count*reveal/3)*3);const factor=snap||!active?1:1-Math.exp(-dt*6);ribbon.position.lerp(new T.Vector3(active?pointer.x*.21:0,active?pointer.y*.14:0,0),factor);ribbon.rotation.y+=( (active?pointer.x*.025:0)-ribbon.rotation.y)*factor;canvas.dataset.curveReveal=String(reveal);canvas.dataset.renderWindow=JSON.stringify({width,height,viewWidth,viewHeight,viewLeft,viewTop,pixelRatio:renderer.getPixelRatio()});}
   objects.forEach((g,i)=>{
    let x=0,y=0,z=0,size=1,rx=.13,ry=-.2,rz=0;
    if(props.mode==='hearts'){
     g.visible=mobile||i<heroLayout.length;if(!g.visible)return;const base=mobile?heartLayout[i]:heroLayout[i];[x,y,z,size,rz]=base;const heart=g.children[0] as T.Mesh;heart.material=mobile?(i===1||i===3?materials.gold:materials.chrome):heroMaterials[i];if(mobile){x=(x-2.15)*.65;y*=.9;size*=1.05;}else{const entry=controls.current.paused?1:1-Math.pow(1-Math.min(1,time/.9),3);ry-=(1-entry)*.18;y-=(1-entry)*.14;size*=.95+.05*entry;}
     if(active){if(mobile){y+=Math.sin(time*.6+i)*.13;ry+=Math.sin(time*.35+i)*.19;}else{rx+=Math.sin(time*[.23,.37,.19][i]+i)*.065;ry+=Math.sin(time*[.37,.23,.29][i]+i)*.14;rz+=Math.sin(time*[.29,.17,.41][i]+i)*.025;y+=Math.sin(time*[.31,.19,.43][i]+i)*.025;}}
     if(!mobile){const unit=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*(camera.position.z-z)/height;repulsions[i].lerp(controls.current.paused?new T.Vector2():repulseTargets[i],snap||!active?1:1-Math.exp(-dt*8));x+=(pointer.x*[8,2,10][i]*(i%2?1:-1)+repulsions[i].x)*unit;y+=(pointer.y*[5,1,6][i]+repulsions[i].y)*unit;}else{x+=pointer.x*.13*(i%2?1:-1);y+=pointer.y*.1;}size*=1+energy*.025;
    }else{
     const chosen=gameCatalog[i].id===controls.current.selected;
     const angle=i/8*Math.PI*2;
     x=chosen?0:Math.cos(angle)*(mobile?3.35:5.8);y=chosen?0:Math.sin(angle)*3.8;z=chosen?1.3:-3.2;
     size=chosen?(mobile?1.9:2.1):.45;rx=chosen?.15:.12;ry=chosen?-.2:Math.sin(angle)*.35;rz=chosen?-.1:Math.cos(angle)*.15;
     g.traverse(o=>{if(o instanceof T.Mesh){const all=Array.isArray(o.material)?o.material:[o.material];all.forEach(material=>{const m=material as T.MeshStandardMaterial;m.color.copy(m.userData.baseColor).multiplyScalar(chosen?1:.42);m.envMapIntensity=m.userData.baseEnvironment*(chosen?1:.45);});}});
     if(active){y+=Math.sin(time*.7+i)*.055;ry+=Math.sin(time*.45+i)*.065;}
    }
    const lerp=snap||controls.current.paused?1:1-Math.exp(-dt*8);
    g.position.lerp(new T.Vector3(x,y,z),lerp);g.scale.lerp(new T.Vector3(size,size,size),lerp);
    g.rotation.x+= (rx-g.rotation.x)*lerp;g.rotation.y+=(ry-g.rotation.y)*lerp;g.rotation.z+=(rz-g.rotation.z)*lerp;
   });
   renderer.render(scene,camera);let assetsReady=true;scene.traverse(o=>{if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){const image=(m as T.MeshStandardMaterial).map?.image;if((m as T.MeshStandardMaterial).map?.userData.pending||(image instanceof HTMLImageElement&&!image.complete))assetsReady=false;}}});if(assetsReady&&!loaded){loaded=true;setReady(true);}canvas.dataset.ready=String(assetsReady);
   if(props.mode==='hearts'){canvas.dataset.hovered=String(hovered);canvas.dataset.hoverPoint=JSON.stringify([hoverPoint.x,hoverPoint.y]);canvas.dataset.repulsions=JSON.stringify(repulsions.map(p=>[p.x,p.y]));canvas.dataset.fixedKeyLight=JSON.stringify(key.position.toArray());canvas.dataset.portraitMask=String(Boolean(portraitMask?.visible));canvas.dataset.heartCenters=JSON.stringify(objects.filter(g=>g.visible).map(g=>{const p=g.position.clone().project(camera);return{x:viewLeft+(p.x+1)*viewWidth/2,y:viewTop+(1-p.y)*viewHeight/2};}));canvas.dataset.heartTransforms=JSON.stringify(objects.filter(g=>g.visible).map(g=>({x:g.position.x,y:g.position.y,z:g.position.z,rx:g.rotation.x,ry:g.rotation.y,scale:g.scale.x})));}if(props.mode==='games'){const chosen=objects.find(g=>g.userData.game===controls.current.selected)!;const box=new T.Box3().setFromObject(chosen),pixels=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);pixels.push([(p.x+1)*width/2,(1-p.y)*height/2]);}canvas.dataset.selectedBounds=JSON.stringify({left:Math.min(...pixels.map(p=>p[0])),right:Math.max(...pixels.map(p=>p[1])),top:Math.min(...pixels.map(p=>p[1])),bottom:Math.max(...pixels.map(p=>p[1])),width,height});}canvas.dataset.motion=active&&visible?'running':'paused';
  };
  const frame=(now:number)=>{const dt=last?Math.min((now-last)/1000,.25):0;last=now;if(!visible||document.hidden)return;
   if(!controls.current.paused){time+=dt;if(ribbon&&node.dataset.ready==='true')curveTime+=dt;energy*=Math.exp(-dt*2);render(false,dt);}
  };
  const syncLoop=()=>{const running=visible&&!document.hidden&&!controls.current.paused&&!disposed&&!contextLost;renderer.setAnimationLoop(running?frame:null);canvas.dataset.renderLoop=running?'running':'stopped';canvas.dataset.motion=running?'running':'paused';if(!running)last=0;};
  const sync=()=>{if(impulse!==(controls.current.impulse??0)){impulse=controls.current.impulse??0;energy=.85;}if(visible&&!document.hidden)render(controls.current.paused);syncLoop();};redraw.current=sync;
  const move=(event:PointerEvent)=>{if(props.mode==='hearts')pointer.set((event.clientX+scrollX-nodeLeft)/width*2-1,-(event.clientY+scrollY-nodeTop)/height*2+1);else{const box=canvas.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);}if(props.mode==='hearts'&&!mobile&&finePointer.matches&&!controls.current.paused){const local=new T.Vector2((event.clientX+scrollX-nodeLeft-viewLeft)/viewWidth*2-1,-(event.clientY+scrollY-nodeTop-viewTop)/viewHeight*2+1);ray.setFromCamera(local,camera);const hit=ray.intersectObjects(objects.filter(g=>g.visible),true)[0];hovered=hit?objects.findIndex(g=>g===hit.object.parent):-1;repulseTargets.forEach(target=>target.set(0,0));if(hit){const point=hit.object.worldToLocal(hit.point.clone());hoverPoint.set(T.MathUtils.clamp(point.x,-1,1),T.MathUtils.clamp(point.y,-1,1));const direction=repulseTargets[hovered].set(-hoverPoint.x,-hoverPoint.y);if(direction.length()<.01)direction.set(-1,0);direction.normalize().multiplyScalar(14);}}if(!controls.current.paused&&props.mode==='games')render();};
  const click=(event:PointerEvent)=>{if(controls.current.paused)return;move(event);if(props.mode==='hearts'){energy=.6;return;}ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(objects,true)[0];if(hit){let obj:T.Object3D=hit.object;while(obj.parent&& !obj.userData.game)obj=obj.parent;if(obj.userData.game)controls.current.onSelect?.(obj.userData.game);}};
  const leave=()=>{pointer.set(0,0);hovered=-1;repulseTargets.forEach(target=>target.set(0,0));};
  const lost=(event:Event)=>{event.preventDefault();contextLost=true;syncLoop();setReady(false);setFailed(true);controls.current.onUnavailable?.();};
  const observer=new ResizeObserver(resize);observer.observe(node);const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!document.hidden)render(true);syncLoop();});intersection.observe(node);
  document.addEventListener('visibilitychange',syncLoop);
  inputNode.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',click);inputNode.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost);
  resize();syncLoop();
  return()=>{disposed=true;redraw.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',syncLoop);inputNode.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',click);inputNode.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);canvas.remove();
   const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geometries.forEach(g=>g.dispose());mats.forEach(m=>{const map=(m as T.MeshStandardMaterial).map;map?.dispose();m.dispose();});heroMaterials.forEach(material=>{if(!mats.has(material))material.dispose();});environment.dispose();environmentScene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();renderer.forceContextLoss();};
 },[props.mode,mounted]);
 return <div ref={host} className={`rd-studio rd-studio-${props.mode}`} data-ready={ready||failed}>{failed&&props.mode==='games'?<img className="rd-gallery-fallback" src={`/images/landing-preview/games/${props.selected||'domino'}.png`} alt="" aria-hidden="true"/>:!ready&&<span className="rd-render-fallback" role="status">PREPARING YOUR GIFT</span>}</div>;
}
