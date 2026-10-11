import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createHeartGeometry} from './heartGeometry';
import {createGameObject,normalizeSculpture,studioMaterials} from './studioObjects';
import {gameCatalog} from '../games/catalog';

type Props={mode:'hearts'|'games';selected?:string;paused:boolean;impulse?:number;onSelect?:(id:string)=>void};
const heartLayout=[[1.2,.25,1.1,1.82,-.25],[3.55,-1.55,.2,1.2,.3],[3.45,2.18,-1.8,1.12,.35],[-.1,2.3,-1,.68,-.5],[5.1,.55,-1,.7,.1],[.15,-2.4,-1.8,.67,.3]];
const heroLayout=[[-.65,-1.7,1.1,.83,-.2],[5.35,2.08,-.8,.62,.15],[5.1,-2.4,.3,.54,.25]];
export default function StudioScene(props:Props){
 const host=useRef<HTMLDivElement>(null),controls=useRef(props),redraw=useRef<()=>void>(()=>{}),[ready,setReady]=useState(false),[mounted,setMounted]=useState(props.mode==='hearts');
 controls.current=props;
 useEffect(()=>{if(mounted)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setMounted(true);observer.disconnect();}},{rootMargin:'250px'});observer.observe(host.current!);return()=>observer.disconnect();},[mounted]);
 useEffect(()=>{redraw.current();},[props.paused,props.selected,props.impulse]);
 useEffect(()=>{
  if(!mounted)return;
  const node=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,50),materials=studioMaterials();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const environmentScene=new T.Scene();environmentScene.background=new T.Color('#121016');
  // Wide emissive panels create the broad softbox reflections used throughout the family.
  for(const [x,y,z,w,h] of [[-5,4,5,4,7],[5,1,2,2,6],[0,6,-2,7,2],[0,-3,4,5,1]]){
   const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:'#fff2e8',side:T.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);
  }
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(environmentScene,.06);scene.environment=environment.texture;pmrem.dispose();
  const key=new T.DirectionalLight('#ffe5d1',3);key.position.set(-4,6,8);scene.add(key);const rim=new T.DirectionalLight('#c6caff',1.7);rim.position.set(5,2,-3);scene.add(rim);scene.add(new T.HemisphereLight('#d5cbd6','#110d13',.55));
  const heroChrome=materials.chrome.clone(),heroGold=materials.gold.clone();heroChrome.color.set('#818996');heroChrome.roughness=.18;heroChrome.envMapIntensity=1.5;heroGold.color.set('#ca9483');heroGold.roughness=.23;heroGold.envMapIntensity=1.3;
  const objects:T.Group[]=[];
  if(props.mode==='hearts')heartLayout.forEach((_,i)=>{const g=new T.Group();g.add(new T.Mesh(createHeartGeometry(),i===1||i===3?materials.gold:materials.chrome));scene.add(g);objects.push(g);});
  else gameCatalog.forEach(game=>{const g=normalizeSculpture(createGameObject(game.id,materials,()=>redraw.current()));g.userData.game=game.id;g.traverse(o=>{if(o instanceof T.Mesh){const originals=Array.isArray(o.material)?o.material:[o.material];const copies=originals.map(original=>{const material=original.clone() as T.MeshStandardMaterial;material.userData.baseColor=material.color.clone();material.userData.baseEnvironment=material.envMapIntensity;return material;});o.material=Array.isArray(o.material)?copies:copies[0];}});scene.add(g);objects.push(g);});
  const canvas=renderer.domElement;node.appendChild(canvas);canvas.setAttribute('aria-hidden','true');
  let width=0,height=0,mobile=false,time=0,last=0,visible=true,disposed=false,loaded=false,impulse=props.impulse??0,energy=0,hovered=-1;const cursor=document.createElement('span');cursor.className='rd-scene-cursor';cursor.setAttribute('aria-hidden','true');if(props.mode==='hearts')node.appendChild(cursor);
  const pointer=new T.Vector2(),hoverPoint=new T.Vector2(),ray=new T.Raycaster();
  const resize=()=>{const box=node.getBoundingClientRect();width=box.width;height=box.height;mobile=width<700;renderer.setSize(width,height);camera.aspect=width/height;camera.position.set(0,0,props.mode==='hearts'?(mobile?10.5:11.8):(mobile?10.2:9.6));camera.fov=props.mode==='hearts'&&mobile?43:38;camera.updateProjectionMatrix();render(true);};
  const render=(snap=false,dt=1/60)=>{
   if(!width||!height||disposed)return;const active=!controls.current.paused&&!document.hidden;
   objects.forEach((g,i)=>{
    let x=0,y=0,z=0,size=1,rx=.13,ry=-.2,rz=0;
    if(props.mode==='hearts'){
     g.visible=mobile||i<heroLayout.length;if(!g.visible)return;const base=mobile?heartLayout[i]:heroLayout[i];[x,y,z,size,rz]=base;const heart=g.children[0] as T.Mesh;heart.material=mobile?(i===1||i===3?materials.gold:materials.chrome):(i===1?heroChrome:heroGold);if(mobile){x=(x-2.15)*.65;y*=.9;size*=1.05;}else{const entry=controls.current.paused?1:1-Math.pow(1-Math.min(1,time/.9),3);ry-=(1-entry)*.18;y-=(1-entry)*.14;size*=.95+.05*entry;if(active&&hovered===i){ry+=.28+hoverPoint.x*.38;rx-=hoverPoint.y*.23;z+=.65;size*=1.075;}}
     if(active){y+=Math.sin(time*.6+i)*(mobile?.13:.04);x+=Math.sin(time*.5+i*.8)*(mobile?.08:.035);ry+=Math.sin(time*.35+i)*(mobile?.19:.045);rz+=Math.sin(time*.5+i)*(mobile?.06:.025);}
     x+=pointer.x*.13*(i%2?1:-1);y+=pointer.y*.1;z+=energy*Math.sin(i*1.8);size*=1+energy*.055;
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
   if(props.mode==='hearts'){canvas.dataset.hovered=String(hovered);canvas.dataset.hoverPoint=JSON.stringify([hoverPoint.x,hoverPoint.y]);canvas.dataset.heartCenters=JSON.stringify(objects.filter(g=>g.visible).map(g=>{const p=g.position.clone().project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};}));canvas.dataset.heartTransforms=JSON.stringify(objects.filter(g=>g.visible).map(g=>({x:g.position.x,y:g.position.y,z:g.position.z,rx:g.rotation.x,ry:g.rotation.y,scale:g.scale.x})));}if(props.mode==='games'){const chosen=objects.find(g=>g.userData.game===controls.current.selected)!;const box=new T.Box3().setFromObject(chosen),pixels=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);pixels.push([(p.x+1)*width/2,(1-p.y)*height/2]);}canvas.dataset.selectedBounds=JSON.stringify({left:Math.min(...pixels.map(p=>p[0])),right:Math.max(...pixels.map(p=>p[0])),top:Math.min(...pixels.map(p=>p[1])),bottom:Math.max(...pixels.map(p=>p[1])),width,height});}canvas.dataset.motion=active&&visible?'running':'paused';
  };
  const frame=(now:number)=>{const dt=last?Math.min((now-last)/1000,.25):0;last=now;if(!visible||document.hidden)return;
   if(!controls.current.paused){time+=dt;energy*=Math.exp(-dt*2);render(false,dt);}
  };
  renderer.setAnimationLoop(frame);
  const sync=()=>{if(impulse!==(controls.current.impulse??0)){impulse=controls.current.impulse??0;energy=.85;}render(controls.current.paused);};redraw.current=sync;
  const move=(event:PointerEvent)=>{const box=canvas.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);if(props.mode==='hearts'&&!mobile&&!controls.current.paused){ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(objects.filter(g=>g.visible),true)[0];hovered=hit?objects.findIndex(g=>g===hit.object.parent):-1;if(hit){const point=hit.object.worldToLocal(hit.point.clone());hoverPoint.set(T.MathUtils.clamp(point.x,-1,1),T.MathUtils.clamp(point.y,-1,1));}cursor.style.transform=`translate3d(${event.clientX-box.left-12}px,${event.clientY-box.top-12}px,0)`;cursor.dataset.active=String(hovered!==-1);cursor.style.opacity='1';}if(!controls.current.paused)render();};
  const click=(event:PointerEvent)=>{if(controls.current.paused)return;move(event);if(props.mode==='hearts'){energy=.6;return;}ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(objects,true)[0];if(hit){let obj:T.Object3D=hit.object;while(obj.parent&& !obj.userData.game)obj=obj.parent;if(obj.userData.game)controls.current.onSelect?.(obj.userData.game);}};
  const leave=()=>{pointer.set(0,0);hovered=-1;cursor.style.opacity='0';};
  const lost=(event:Event)=>{event.preventDefault();renderer.setAnimationLoop(null);setReady(false);};
  const observer=new ResizeObserver(resize);observer.observe(node);const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)render(true);});intersection.observe(node);
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',click);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost);
  resize();
  return()=>{disposed=true;redraw.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',click);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);canvas.remove();cursor.remove();
   const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geometries.forEach(g=>g.dispose());mats.forEach(m=>{const map=(m as T.MeshStandardMaterial).map;map?.dispose();m.dispose();});if(!mats.has(heroChrome))heroChrome.dispose();if(!mats.has(heroGold))heroGold.dispose();environment.dispose();environmentScene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();renderer.forceContextLoss();};
 },[props.mode,mounted]);
 return <div ref={host} className={`rd-studio rd-studio-${props.mode}`} data-ready={ready}>{!ready&&<span className="rd-render-fallback" role="status">PREPARING YOUR GIFT</span>}</div>;
}
